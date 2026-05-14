import { AppConfigService } from "@/app.config";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { execFileSync } from "child_process";
import { existsSync, readFileSync, statSync } from "fs";
import { readdir } from "fs/promises";
import { isAbsolute, join, relative, resolve } from "path";
import { parse as parseYaml } from "yaml";

// Fork-proofness contract: no service, volume, or env-file path is hardcoded
// here. Everything is discovered from the workspace so downstream forks that
// add new compose services or .env files get UI discovery for free.
//
// Scan rule parity: directories skipped here must match backup.sh's find
// exclusions. See docker/backup/backup.sh.
const SCAN_DEPTH = 3;
const SCAN_EXCLUDE_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".yarn",
  ".cache",
  "dist",
  "build",
  "coverage",
  "out",
]);

// Image-substring tokens used for the fast path of DB classification.
// The server is the authoritative source for engine classification —
// services whose image tag doesn't match one of these tokens fall
// through to dbEngineFromBuild() (Dockerfile last-FROM parsing). The
// resolved engine list is shipped down to docker/backup/lib/discover.sh
// via the --include-databases flag so the shell worker doesn't have to
// duplicate the Dockerfile parse.
const DB_IMAGE_TOKENS = ["postgres", "postgis", "mariadb", "mysql"];

export type BackupEngine = "Postgres" | "MariaDB";

/**
 * Logical backup strategy used for a service. These strategies produce
 * transactionally-consistent snapshots via the engine's own machinery
 * (as opposed to tar-ing the live data volume, which races with writes
 * and can yield an unrecoverable data directory). Only services with a
 * known strategy are offered in the UI's services picker.
 */
export type BackupStrategy = "pg_dump" | "mysqldump";

/**
 * Reason a resource is auto-excluded from the backup plan.
 *
 * - "self-reference": the backup sidecar's own mounts, or resources shared
 *   only with orchestration services (things that mount docker.sock);
 *   archiving these is circular.
 * - "cache": volume name carries a cache marker; contents are regenerable
 *   from upstream sources, so backing them up wastes space.
 * - "database-dump": volume is mounted by a DB service whose dump
 *   (pg_dump / mysqldump) is the authoritative backup path. Live-tar of
 *   the volume would race with DB writes and produce an inconsistent,
 *   potentially unrecoverable snapshot.
 * - "repo-content": bind path resolves inside the workspace and is
 *   therefore part of the git-tracked source tree. The repo is the
 *   authoritative copy; restore = `git clone` + volume restore.
 * - "socket": the bind is a unix socket, not file data. Nothing to archive.
 */
export type BackupAutoExcludeReason =
  | "self-reference"
  | "cache"
  | "database-dump"
  | "repo-content"
  | "socket"
  | "profile-gated"
  | "unchanged";

export interface BackupDiscoveredService {
  name: string;
  hasVolume: boolean;
  image: string | null;
  engine: BackupEngine | null;
  imageFamily: string | null;
  backupStrategy: BackupStrategy | null;
  autoExclude: boolean;
  autoExcludeReason: BackupAutoExcludeReason | null;
}

export interface BackupDiscoveredVolume {
  name: string;
  services: string[];
  autoExclude: boolean;
  autoExcludeReason: BackupAutoExcludeReason | null;
}

export interface BackupDiscoveredPath {
  path: string;
  type: "directory" | "file" | "socket";
  services: string[];
  autoExclude: boolean;
  autoExcludeReason: BackupAutoExcludeReason | null;
}

export interface BackupDiscoveredEnvFile {
  path: string;
  exists: boolean;
  source: "scanned" | "compose";
  autoExclude: boolean;
  autoExcludeReason: BackupAutoExcludeReason | null;
}

export interface BackupDiscovery {
  services: BackupDiscoveredService[];
  volumes: BackupDiscoveredVolume[];
  paths: BackupDiscoveredPath[];
  envFiles: BackupDiscoveredEnvFile[];
}

interface ComposeVolumeEntry {
  type?: string;
  source?: string;
}

/**
 * BackupDiscoveryService - enumerates what can be backed up by parsing the
 * workspace's docker-compose.yml and scanning for .env* files on disk.
 *
 * The server reads the compose file statically, which means profile-gated
 * services appear even when their profile isn't active, and top-level
 * `include:` directives are NOT followed. That's acceptable: the UI shows
 * what the operator COULD back up. The worker's discover.sh remains the
 * runtime source of truth for what actually runs (it honors profiles and
 * includes via `docker compose config`).
 */
@Injectable()
export class BackupDiscoveryService {
  private static readonly CACHE_TTL_MS = 30_000;
  private logger = new Logger(BackupDiscoveryService.name);
  private cache?: { at: number; value: BackupDiscovery };

  constructor(@Inject(AppConfigService.Key) private configService: AppConfigService) {}

  async discover(): Promise<BackupDiscovery> {
    const now = Date.now();
    if (this.cache && now - this.cache.at < BackupDiscoveryService.CACHE_TTL_MS) {
      return this.cache.value;
    }
    const workspace = this.workspacePath();
    if (!workspace) {
      this.logger.warn("BACKUP_WORKSPACE is not set; returning empty discovery");
      const empty: BackupDiscovery = { services: [], volumes: [], paths: [], envFiles: [] };
      this.cache = { at: now, value: empty };
      return empty;
    }
    const compose = this.parseCompose(workspace);
    const envFiles = await this.scanEnvFiles(workspace, compose.envFilePaths);
    const value: BackupDiscovery = {
      services: compose.services,
      volumes: compose.volumes,
      paths: compose.paths,
      envFiles,
    };
    this.cache = { at: now, value };
    return value;
  }

  private workspacePath(): string | null {
    const configured = this.configService.service.backup?.workspace?.trim();
    if (configured) return configured;
    return null;
  }

  private parseCompose(workspace: string): {
    services: BackupDiscoveredService[];
    volumes: BackupDiscoveredVolume[];
    paths: BackupDiscoveredPath[];
    envFilePaths: string[];
  } {
    const composePath = join(workspace, "docker", "docker-compose.yml");
    if (!existsSync(composePath)) {
      this.logger.warn(`docker-compose.yml not found at ${composePath}`);
      return { services: [], volumes: [], paths: [], envFilePaths: [] };
    }

    let doc: unknown;
    try {
      doc = parseYaml(readFileSync(composePath, "utf-8"));
    } catch (err) {
      this.logger.warn(`failed to parse ${composePath}: ${(err as Error).message}`);
      return { services: [], volumes: [], paths: [], envFilePaths: [] };
    }

    const root = (doc ?? {}) as Record<string, unknown>;
    const services = (root.services ?? {}) as Record<string, Record<string, unknown>>;
    const topVolumes = new Set(Object.keys((root.volumes ?? {}) as Record<string, unknown>));

    // Bind sources in docker-compose.yml are resolved relative to the
    // compose file's DIRECTORY, not the workspace root. The compose file
    // lives at <workspace>/docker/docker-compose.yml, so relative sources
    // like "./secrets/backup" resolve to <workspace>/docker/secrets/backup
    // and "../" (the repo-root mount) resolves to <workspace>.
    const composeDir = join(workspace, "docker");

    const serviceList: BackupDiscoveredService[] = [];
    const volMap = new Map<string, Set<string>>();
    const bindMap = new Map<string, { type: "directory" | "file" | "socket"; services: Set<string> }>();
    const envFilePaths = new Set<string>();
    const selfRefServices = new Set<string>();
    const dumpStrategyServices = new Set<string>();
    const profileGatedServices = new Set<string>();

    // Compose profiles configured on the host (COMPOSE_PROFILES env var,
    // forwarded into the server container). A service declaring a
    // `profiles:` list only runs when compose is started with at least
    // one of those profiles active; we treat inactive profile-gated
    // services (and any volumes/paths used only by them) as auto-
    // excluded by default because they're presumed dormant.
    const activeProfiles = new Set(this.configService.service.backup?.composeProfiles ?? []);

    for (const [svcName, raw] of Object.entries(services)) {
      const svc = (raw ?? {});
      const image = typeof svc.image === "string" ? svc.image : null;
      // Orchestration services bind-mount /var/run/docker.sock (backup
      // sidecar, proxy, portainer, watchtower, ...). Backing them up is
      // circular - the backup sidecar's own volume holds past archives -
      // so these default to excluded, but stay visible so the user can
      // opt them in.
      const isSelfRef = this.mountsDockerSock(svc);
      if (isSelfRef) selfRefServices.add(svcName);

      // A service with any `profiles:` list only runs when at least one
      // of those profiles is active. If none of the service's profiles
      // intersect with COMPOSE_PROFILES, treat the service as dormant.
      const svcProfiles = Array.isArray(svc.profiles)
        ? (svc.profiles as unknown[]).filter((p): p is string => typeof p === "string")
        : [];
      const isProfileGated =
        svcProfiles.length > 0 && !svcProfiles.some((p) => activeProfiles.has(p));
      if (isProfileGated) profileGatedServices.add(svcName);

      let hasVolume = false;

      const volumes = Array.isArray(svc.volumes) ? svc.volumes : [];
      for (const entry of volumes) {
        let source: string | undefined;
        let vtype: string | undefined;
        if (entry && typeof entry === "object" && !Array.isArray(entry)) {
          const obj = entry as ComposeVolumeEntry;
          source = obj.source;
          vtype = obj.type;
        } else if (typeof entry === "string") {
          const parts = entry.split(":");
          source = parts[0];
          vtype = source && topVolumes.has(source) ? "volume" : "bind";
        }
        if (!source) continue;
        hasVolume = true;

        if (vtype === "volume" || topVolumes.has(source)) {
          const set = volMap.get(source) ?? new Set<string>();
          set.add(svcName);
          volMap.set(source, set);
        } else if (vtype === "bind") {
          const abs = resolve(composeDir, source);
          const existing = bindMap.get(abs) ?? { type: this.classifyBind(abs), services: new Set<string>() };
          existing.services.add(svcName);
          bindMap.set(abs, existing);
        }
      }

      // Compose env_file entries — authoritative env files regardless of scan roots.
      const envFile = svc.env_file;
      if (typeof envFile === "string") {
        envFilePaths.add(this.normalizeEnvPath(workspace, join("docker", envFile)));
      } else if (Array.isArray(envFile)) {
        for (const f of envFile) {
          if (typeof f === "string") {
            envFilePaths.add(this.normalizeEnvPath(workspace, join("docker", f)));
          } else if (f && typeof f === "object" && typeof (f as { path?: unknown }).path === "string") {
            envFilePaths.add(this.normalizeEnvPath(workspace, join("docker", (f as { path: string }).path)));
          }
        }
      }

      // Image reference is the first signal, but custom builds carry
      // registry/project/name strings that don't contain engine keywords
      // (e.g. "${REG}/skeleton/database:${TAG}" is Postgres-under-the-
      // hood because the Dockerfile does `FROM postgres:16`). If the
      // image string is inconclusive, fall through to the Dockerfile's
      // final base image.
      const engine = this.dbEngine(image) ?? this.dbEngineFromBuild(svc, composeDir);
      const backupStrategy: BackupStrategy | null =
        engine === "Postgres" ? "pg_dump" : engine === "MariaDB" ? "mysqldump" : null;
      if (backupStrategy) dumpStrategyServices.add(svcName);

      // Auto-exclude reason priority: self-reference > profile-gated.
      let svcReason: BackupAutoExcludeReason | null = null;
      if (isSelfRef) svcReason = "self-reference";
      else if (isProfileGated) svcReason = "profile-gated";

      serviceList.push({
        name: svcName,
        hasVolume,
        image,
        engine,
        imageFamily: this.imageFamily(image),
        backupStrategy,
        autoExclude: svcReason !== null,
        autoExcludeReason: svcReason,
      });
    }

    serviceList.sort((a, b) => a.name.localeCompare(b.name));

    // Paths/volumes that the secrets directory MUST be archived even
    // though they live inside the workspace (they're gitignored and hold
    // things like the backup encryption keys). Anything else inside the
    // workspace is repo content — authoritative in git, don't back up.
    const workspaceAbs = resolve(workspace);
    const secretsRootAbs = resolve(workspaceAbs, "docker", "secrets");
    const isInsideWorkspace = (p: string) => {
      const rel = relative(workspaceAbs, p);
      return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
    };
    const isSecretsContent = (p: string) => {
      const rel = relative(secretsRootAbs, p);
      return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
    };

    const volumeList: BackupDiscoveredVolume[] = [...volMap.entries()]
      .map(([name, svcs]) => {
        const services = [...svcs].sort();
        const allSelfRef = services.length > 0 && services.every((s) => selfRefServices.has(s));
        const allProfileGated =
          services.length > 0 && services.every((s) => profileGatedServices.has(s));
        const isCache = /cache/i.test(name);
        // Any service mounting this volume has a logical dump strategy
        // that covers it — tar-ing the live volume while the DB writes
        // to it would produce an inconsistent (possibly unrecoverable)
        // snapshot. Prefer the dump.
        const touchedByDbDump = services.some((s) => dumpStrategyServices.has(s));
        let reason: BackupAutoExcludeReason | null = null;
        if (allSelfRef) reason = "self-reference";
        else if (touchedByDbDump) reason = "database-dump";
        else if (allProfileGated) reason = "profile-gated";
        else if (isCache) reason = "cache";
        return {
          name,
          services,
          autoExclude: reason !== null,
          autoExcludeReason: reason,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const pathList: BackupDiscoveredPath[] = [...bindMap.entries()]
      .map(([path, v]) => {
        const services = [...v.services].sort();
        const allSelfRef = services.length > 0 && services.every((s) => selfRefServices.has(s));
        const allProfileGated =
          services.length > 0 && services.every((s) => profileGatedServices.has(s));
        let reason: BackupAutoExcludeReason | null = null;
        // Priority order: socket > workspace root (self-ref) >
        // service-set self-ref > profile-gated > repo content.
        if (v.type === "socket") {
          reason = "socket";
        } else if (path === workspaceAbs) {
          // The repo-root mount that makes the backup sidecar work.
          reason = "self-reference";
        } else if (allSelfRef) {
          reason = "self-reference";
        } else if (allProfileGated) {
          reason = "profile-gated";
        } else if (isInsideWorkspace(path) && !isSecretsContent(path)) {
          // Repo content — lives under the workspace and isn't the
          // secrets directory. Authoritative copy is in git.
          reason = "repo-content";
        }
        return {
          path,
          type: v.type,
          services,
          autoExclude: reason !== null,
          autoExcludeReason: reason,
        };
      })
      .sort((a, b) => a.path.localeCompare(b.path));

    return { services: serviceList, volumes: volumeList, paths: pathList, envFilePaths: [...envFilePaths] };
  }

  private mountsDockerSock(svc: Record<string, unknown>): boolean {
    const volumes = Array.isArray(svc.volumes) ? svc.volumes : [];
    for (const entry of volumes) {
      let source: string | undefined;
      if (entry && typeof entry === "object" && !Array.isArray(entry)) {
        source = (entry as ComposeVolumeEntry).source;
      } else if (typeof entry === "string") {
        source = entry.split(":")[0];
      }
      if (source && /(^|\/)var\/run\/docker\.sock$/.test(source)) return true;
    }
    return false;
  }

  private classifyBind(abs: string): "directory" | "file" | "socket" {
    try {
      const s = statSync(abs);
      if (s.isSocket()) return "socket";
      return s.isDirectory() ? "directory" : "file";
    } catch {
      // Heuristic for paths not present on the server host: treat a basename
      // containing a dot as a file, everything else as a directory.
      const base = abs.split(/[\\/]/).pop() ?? "";
      return base.includes(".") ? "file" : "directory";
    }
  }

  private dbEngine(image: string | null): BackupEngine | null {
    const img = (image ?? "").toLowerCase();
    if (!DB_IMAGE_TOKENS.some((t) => img.includes(t))) return null;
    if (img.includes("mariadb") || (img.includes("mysql") && !img.includes("postgres"))) return "MariaDB";
    return "Postgres";
  }

  /**
   * Fallback classifier for services that build a custom image: parse
   * the Dockerfile and look at the last FROM line's base image. That's
   * what the published image ultimately runs as, so applying the normal
   * DB-image heuristic to it catches custom PostgreSQL / MariaDB
   * builds (e.g. a PostGIS-augmented `FROM postgres:16`).
   *
   * Does not recurse: if the Dockerfile FROMs another custom image that
   * itself FROMs postgres, we'd miss it. That's rare; when it happens
   * the operator can add an explicit hint (future: a compose label).
   */
  private dbEngineFromBuild(svc: Record<string, unknown>, composeDir: string): BackupEngine | null {
    const build = svc.build;
    let contextPath: string;
    let dockerfileName = "Dockerfile";
    if (typeof build === "string") {
      contextPath = resolve(composeDir, build);
    } else if (build && typeof build === "object") {
      const b = build as { context?: string; dockerfile?: string };
      contextPath = resolve(composeDir, b.context ?? ".");
      if (b.dockerfile) dockerfileName = b.dockerfile;
    } else {
      return null;
    }
    const dockerfilePath = resolve(contextPath, dockerfileName);
    if (!existsSync(dockerfilePath)) return null;
    let content: string;
    try {
      content = readFileSync(dockerfilePath, "utf-8");
    } catch {
      return null;
    }
    // Last FROM wins for multi-stage builds (that's the runtime image).
    const froms = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => /^FROM\s+/i.test(l));
    const lastFrom = froms[froms.length - 1];
    if (!lastFrom) return null;
    const m = /^FROM\s+(\S+)/i.exec(lastFrom);
    if (!m) return null;
    return this.dbEngine(m[1]);
  }

  // Parse a Docker image reference into its "family" label — the rightmost
  // path segment, tag and digest stripped, registry dropped.
  //   postgis/postgis:16-3.4-alpine      -> "postgis"
  //   quay.io/keycloak/keycloak:26       -> "keycloak"
  //   lscr.io/linuxserver/bookstack:2    -> "bookstack"
  //   redis:7-alpine                     -> "redis"
  //   ${REGISTRY}/${PROJECT}/server:${T} -> "server"
  //
  // Pure parsing — no allow-list — so fork-added services (e.g. `ollama/ollama`)
  // classify as "ollama" without any code change.
  private imageFamily(image: string | null): string | null {
    const raw = (image ?? "").trim();
    if (!raw) return null;
    const noDigest = raw.split("@")[0];
    const segments = noDigest.split("/").filter(Boolean);
    if (segments.length === 0) return null;
    // Drop a leading registry segment (contains `.` or `:` — e.g. quay.io, ghcr.io, localhost:5000).
    if (segments.length > 1 && /[.:]/.test(segments[0])) segments.shift();
    const last = segments[segments.length - 1];
    const name = last.split(":")[0].trim();
    if (!name || name.startsWith("$")) return null;
    return name.toLowerCase();
  }

  private normalizeEnvPath(workspace: string, p: string): string {
    const abs = resolve(workspace, p);
    const rel = relative(workspace, abs).replace(/\\/g, "/");
    return rel;
  }

  private async scanEnvFiles(workspace: string, composeEnvPaths: string[]): Promise<BackupDiscoveredEnvFile[]> {
    const scanned = new Set<string>();
    await this.walkEnvFiles(workspace, workspace, 0, scanned);

    // "User-modified" = tracked + diverged from HEAD, OR untracked
    // (non-ignored), OR gitignored and present on disk. Anything else
    // that was scanned is a pristine template from a fresh clone and
    // should default to auto-excluded: backing up checked-in files
    // restores the repo, not operator configuration.
    const candidates = new Set<string>([...scanned, ...composeEnvPaths]);
    const userModified = this.userModifiedPaths(workspace, [...candidates]);

    const reasonFor = (p: string): BackupAutoExcludeReason | null =>
      userModified && !userModified.has(p) ? "unchanged" : null;

    const bySource = new Map<string, BackupDiscoveredEnvFile>();
    for (const p of scanned) {
      const reason = reasonFor(p);
      bySource.set(p, {
        path: p,
        exists: true,
        source: "scanned",
        autoExclude: reason !== null,
        autoExcludeReason: reason,
      });
    }
    for (const p of composeEnvPaths) {
      if (!bySource.has(p)) {
        const abs = resolve(workspace, p);
        const exists = existsSync(abs);
        const reason = exists ? reasonFor(p) : null;
        bySource.set(p, {
          path: p,
          exists,
          source: "compose",
          autoExclude: reason !== null,
          autoExcludeReason: reason,
        });
      }
    }
    return [...bySource.values()].sort((a, b) => a.path.localeCompare(b.path));
  }

  /**
   * Use git to determine which workspace files the operator has
   * actually customized vs. what's a pristine checkout. Returns a Set
   * of workspace-relative paths (forward slashes) covering:
   *   - tracked files whose worktree content differs from HEAD
   *   - untracked files not matched by .gitignore
   *   - gitignored files present on disk (e.g. user-created .env.secrets)
   *
   * Returns null when git isn't on PATH or the workspace isn't a git
   * repo — caller treats null as "no detection, don't auto-exclude."
   *
   * The `paths` arg must be the exact set of files to classify.
   * Without a pathspec, `git ls-files --others --ignored` walks the
   * whole worktree (node_modules, .next, dist, .yarn/cache, ...) and
   * because this runs synchronously on the Node event loop it blocks
   * every other request for the duration. Scoping to just the env-file
   * paths keeps the scan bounded.
   */
  private userModifiedPaths(workspace: string, paths: string[]): Set<string> | null {
    if (paths.length === 0) return new Set();
    const run = (args: string[]): string =>
      execFileSync("git", ["-C", workspace, ...args], {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      });
    try {
      const pathspec = ["--", ...paths];
      const modified = run(["diff", "--name-only", "-z", "HEAD", ...pathspec]);
      const untracked = run(["ls-files", "--others", "--exclude-standard", "-z", ...pathspec]);
      const ignoredPresent = run([
        "ls-files",
        "--others",
        "--ignored",
        "--exclude-standard",
        "-z",
        ...pathspec,
      ]);
      const parse = (s: string) =>
        s
          .split("\0")
          .filter(Boolean)
          .map((p) => p.replace(/\\/g, "/"));
      return new Set([...parse(modified), ...parse(untracked), ...parse(ignoredPresent)]);
    } catch (err) {
      this.logger.log(
        `git-based env-file change detection unavailable (${(err as Error).message}); all scanned env files will be treated as user-modified`,
      );
      return null;
    }
  }

  private async walkEnvFiles(root: string, dir: string, depth: number, out: Set<string>): Promise<void> {
    if (depth > SCAN_DEPTH) return;
    let entries: import("fs").Dirent[];
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (SCAN_EXCLUDE_DIRS.has(e.name)) continue;
        await this.walkEnvFiles(root, join(dir, e.name), depth + 1, out);
      } else if (e.isFile() && e.name.startsWith(".env")) {
        const rel = relative(root, join(dir, e.name)).replace(/\\/g, "/");
        out.add(rel);
      }
    }
  }
}
