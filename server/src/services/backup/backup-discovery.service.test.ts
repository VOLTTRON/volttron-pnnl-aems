 
import { BackupDiscoveryService } from "./backup-discovery.service";
import { AppConfigService } from "@/app.config";
import * as fs from "fs";
import * as fsPromises from "fs/promises";
import * as child_process from "child_process";

// ── fs (sync) ──────────────────────────────────────────────────────────────
jest.mock("fs");
const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
const mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;
const mockStatSync = fs.statSync as jest.MockedFunction<typeof fs.statSync>;

// ── fs/promises ────────────────────────────────────────────────────────────
jest.mock("fs/promises");
const mockReaddir = fsPromises.readdir as jest.MockedFunction<typeof fsPromises.readdir>;

// ── child_process ──────────────────────────────────────────────────────────
jest.mock("child_process");
const mockExecFileSync = child_process.execFileSync as jest.MockedFunction<typeof child_process.execFileSync>;

// ── minimal compose YAML (no volumes, no binds) ───────────────────────────
const SIMPLE_COMPOSE = `
services:
  app:
    image: "node:20-alpine"
  db:
    image: "postgis/postgis:16-3.4"
    volumes:
      - db-data:/var/lib/postgresql/data
volumes:
  db-data: {}
`;

const COMPOSE_WITH_BIND = `
services:
  worker:
    image: "alpine"
    volumes:
      - /tmp/data:/data
      - ./secrets:/app/secrets
`;

const COMPOSE_WITH_DOCKER_SOCK = `
services:
  agent:
    image: "portainer/portainer"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
`;

const COMPOSE_WITH_PROFILE = `
services:
  optional:
    image: "alpine"
    profiles:
      - optional
  core:
    image: "nginx"
`;

function makeConfig(workspace: string | null = "/workspace", composeProfiles: string[] = []): AppConfigService {
  return {
    service: {
      backup: workspace ? { workspace, composeProfiles } : null,
    },
  } as unknown as AppConfigService;
}

describe("BackupDiscoveryService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: compose file exists, readdir returns empty, git is available
    mockExistsSync.mockReturnValue(true);
    mockStatSync.mockImplementation(() => ({ isSocket: () => false, isDirectory: () => true }) as ReturnType<typeof fs.statSync>);
    mockReaddir.mockResolvedValue([]);
    mockExecFileSync.mockReturnValue("" as unknown as Buffer);
  });

  describe("discover() — no workspace", () => {
    it("returns empty discovery when BACKUP_WORKSPACE is not set", async () => {
      const service = new BackupDiscoveryService(makeConfig(null));
      const result = await service.discover();
      expect(result).toEqual({ services: [], volumes: [], paths: [], envFiles: [] });
    });
  });

  describe("discover() — compose file missing", () => {
    it("returns empty discovery when docker-compose.yml does not exist", async () => {
      mockExistsSync.mockReturnValue(false);
      const service = new BackupDiscoveryService(makeConfig());
      const result = await service.discover();
      expect(result.services).toHaveLength(0);
      expect(result.volumes).toHaveLength(0);
    });
  });

  describe("discover() — simple compose", () => {
    beforeEach(() => {
      mockReadFileSync.mockReturnValue(SIMPLE_COMPOSE as unknown as Buffer);
    });

    it("discovers services sorted by name", async () => {
      const service = new BackupDiscoveryService(makeConfig());
      const result = await service.discover();
      const names = result.services.map((s) => s.name);
      expect(names).toEqual([...names].sort());
    });

    it("classifies the postgis service as Postgres with pg_dump strategy", async () => {
      const service = new BackupDiscoveryService(makeConfig());
      const result = await service.discover();
      const db = result.services.find((s) => s.name === "db");
      expect(db?.engine).toBe("Postgres");
      expect(db?.backupStrategy).toBe("pg_dump");
    });

    it("leaves the node service with no engine or backup strategy", async () => {
      const service = new BackupDiscoveryService(makeConfig());
      const result = await service.discover();
      const app = result.services.find((s) => s.name === "app");
      expect(app?.engine).toBeNull();
      expect(app?.backupStrategy).toBeNull();
    });

    it("marks the db-data volume as database-dump auto-excluded", async () => {
      const service = new BackupDiscoveryService(makeConfig());
      const result = await service.discover();
      const vol = result.volumes.find((v) => v.name === "db-data");
      expect(vol?.autoExclude).toBe(true);
      expect(vol?.autoExcludeReason).toBe("database-dump");
    });

    it("caches the result within TTL and does not re-parse compose", async () => {
      const service = new BackupDiscoveryService(makeConfig());
      await service.discover();
      await service.discover(); // second call — should hit cache
      expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    });
  });

  describe("discover() — bind mounts", () => {
    beforeEach(() => {
      mockReadFileSync.mockReturnValue(COMPOSE_WITH_BIND as unknown as Buffer);
    });

    it("emits bind paths", async () => {
      const service = new BackupDiscoveryService(makeConfig());
      const result = await service.discover();
      expect(result.paths.length).toBeGreaterThan(0);
    });
  });

  describe("discover() — docker.sock services", () => {
    beforeEach(() => {
      mockReadFileSync.mockReturnValue(COMPOSE_WITH_DOCKER_SOCK as unknown as Buffer);
      // statSync for docker.sock path returns socket
      mockStatSync.mockImplementation((p) => {
        if (typeof p === "string" && p.includes("docker.sock")) {
          return { isSocket: () => true, isDirectory: () => false } as ReturnType<typeof fs.statSync>;
        }
        return { isSocket: () => false, isDirectory: () => true } as ReturnType<typeof fs.statSync>;
      });
    });

    it("marks the agent service as self-reference auto-excluded", async () => {
      const service = new BackupDiscoveryService(makeConfig());
      const result = await service.discover();
      const agent = result.services.find((s) => s.name === "agent");
      expect(agent?.autoExclude).toBe(true);
      expect(agent?.autoExcludeReason).toBe("self-reference");
    });
  });

  describe("discover() — profile-gated services", () => {
    beforeEach(() => {
      mockReadFileSync.mockReturnValue(COMPOSE_WITH_PROFILE as unknown as Buffer);
    });

    it("marks services whose profile is not active as profile-gated", async () => {
      const service = new BackupDiscoveryService(makeConfig("/workspace", []));
      const result = await service.discover();
      const optional = result.services.find((s) => s.name === "optional");
      expect(optional?.autoExclude).toBe(true);
      expect(optional?.autoExcludeReason).toBe("profile-gated");
    });

    it("does NOT exclude the service when its profile is active", async () => {
      const service = new BackupDiscoveryService(makeConfig("/workspace", ["optional"]));
      const result = await service.discover();
      const optional = result.services.find((s) => s.name === "optional");
      expect(optional?.autoExclude).toBe(false);
    });

    it("does not mark services with no profiles as profile-gated", async () => {
      const service = new BackupDiscoveryService(makeConfig());
      const result = await service.discover();
      const core = result.services.find((s) => s.name === "core");
      expect(core?.autoExclude).toBe(false);
    });
  });

  describe("imageFamily extraction", () => {
    const cases: Array<{ image: string; expected: string | null }> = [
      { image: "redis:7-alpine", expected: "redis" },
      { image: "postgis/postgis:16-3.4-alpine", expected: "postgis" },
      { image: "quay.io/keycloak/keycloak:26", expected: "keycloak" },
      { image: "lscr.io/linuxserver/bookstack:2", expected: "bookstack" },
      { image: "${REGISTRY}/${PROJECT}/server:${TAG}", expected: "server" },
      { image: "", expected: null },
    ];

    for (const { image, expected } of cases) {
      it(`returns "${String(expected)}" for image "${image}"`, async () => {
        const compose = `services:\n  svc:\n    image: "${image}"\n`;
        mockReadFileSync.mockReturnValue(compose as unknown as Buffer);
        const service = new BackupDiscoveryService(makeConfig());
        const result = await service.discover();
        expect(result.services[0]?.imageFamily).toBe(expected);
      });
    }
  });

  describe("dbEngine classification", () => {
    const cases: Array<{ image: string; expected: "Postgres" | "MariaDB" | null }> = [
      { image: "postgres:16", expected: "Postgres" },
      { image: "postgis/postgis:16-3.4", expected: "Postgres" },
      { image: "mariadb:11", expected: "MariaDB" },
      { image: "mysql:8", expected: "MariaDB" },
      { image: "redis:7", expected: null },
    ];

    for (const { image, expected } of cases) {
      it(`classifies "${image}" as ${String(expected)}`, async () => {
        const compose = `services:\n  db:\n    image: "${image}"\nvolumes: {}\n`;
        mockReadFileSync.mockReturnValue(compose as unknown as Buffer);
        const service = new BackupDiscoveryService(makeConfig());
        const result = await service.discover();
        expect(result.services[0]?.engine).toBe(expected);
      });
    }
  });

  describe("Dockerfile fallback classification", () => {
    it("classifies service with custom build+Dockerfile that FROMs postgres", async () => {
      const compose = `services:\n  database:\n    build:\n      context: ./database\n      dockerfile: Dockerfile\n`;
      mockReadFileSync
        .mockReturnValueOnce(compose as unknown as Buffer)
        .mockReturnValueOnce("FROM postgres:16-alpine\n" as unknown as Buffer);
      const service = new BackupDiscoveryService(makeConfig());
      const result = await service.discover();
      expect(result.services[0]?.engine).toBe("Postgres");
    });

    it("returns null when Dockerfile does not exist", async () => {
      const compose = `services:\n  app:\n    build: ./app\n`;
      mockReadFileSync.mockReturnValueOnce(compose as unknown as Buffer);
      mockExistsSync.mockReturnValueOnce(true).mockReturnValueOnce(false); // compose exists, Dockerfile does not
      const service = new BackupDiscoveryService(makeConfig());
      const result = await service.discover();
      expect(result.services[0]?.engine).toBeNull();
    });
  });

  describe("scanEnvFiles", () => {
    it("includes .env files found by readdir as scanned entries", async () => {
      mockReadFileSync.mockReturnValue("services: {}\n" as unknown as Buffer);
      mockReaddir.mockResolvedValue([
        { name: ".env", isDirectory: () => false, isFile: () => true } as import("fs").Dirent,
      ]);
      const service = new BackupDiscoveryService(makeConfig());
      const result = await service.discover();
      expect(result.envFiles.some((e) => e.path.endsWith(".env"))).toBe(true);
    });

    it("handles readdir throwing gracefully", async () => {
      mockReadFileSync.mockReturnValue("services: {}\n" as unknown as Buffer);
      mockReaddir.mockRejectedValue(new Error("EACCES"));
      const service = new BackupDiscoveryService(makeConfig());
      await expect(service.discover()).resolves.toBeDefined();
    });
  });

  describe("git detection unavailable", () => {
    it("treats all scanned env files as user-modified when git is unavailable", async () => {
      mockReadFileSync.mockReturnValue("services: {}\n" as unknown as Buffer);
      mockReaddir.mockResolvedValue([
        { name: ".env", isDirectory: () => false, isFile: () => true } as import("fs").Dirent,
      ]);
      mockExecFileSync.mockImplementation(() => {
        throw new Error("git: command not found");
      });
      const service = new BackupDiscoveryService(makeConfig());
      const result = await service.discover();
      const envEntry = result.envFiles.find((e) => e.path.endsWith(".env"));
      // When git fails, autoExclude is false (treated as user-modified)
      expect(envEntry?.autoExclude).toBe(false);
    });
  });
});
