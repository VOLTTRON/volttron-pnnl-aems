import { test, expect, APIResponse } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import tls from "node:tls";
import {
  appDir,
  compose,
  container,
  docker,
  hostname,
  inspect,
  project,
  psql,
  readEnv,
  run,
  stripAnsi,
} from "./support/stack";

type Config = {
  services: Record<string, { profiles?: string[]; depends_on?: Record<string, { condition: string; required?: boolean }> }>;
};

function config(profiles: string): Config {
  return JSON.parse(run("docker", ["compose", "config", "--format", "json"], {
    env: { ...process.env, COMPOSE_PROFILES: profiles, MSYS_NO_PATHCONV: "1" },
  }));
}

function connect(options: tls.ConnectionOptions): Promise<tls.TLSSocket> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host: hostname, port: 443, servername: hostname, ...options }, () => resolve(socket));
    socket.on("error", reject);
  });
}

const poweredBy = (response: APIResponse) => response.headers()["x-powered-by"];

test.describe("stack", () => {
  // scenario: http-redirects-to-https
  test("port 80 redirects to HTTPS on the same host", async ({ request }) => {
    const response = await request.get(`http://${hostname}/`, { maxRedirects: 0 });
    expect([301, 302, 307, 308]).toContain(response.status());
    expect(response.headers()["location"]).toMatch(new RegExp(`^https://${hostname.replace(/\./g, "\\.")}/`));
  });

  // scenario: tls-cert-names-hostname
  test("the certificate served for APP_HOSTNAME names it and chains to the certs service's CA", async () => {
    const ca = docker("exec", container("proxy"), "cat", "/etc/certs/mkcert-ca.crt");
    const socket = await connect({ ca, rejectUnauthorized: true });
    try {
      expect(socket.authorized).toBe(true);
      expect(socket.getPeerCertificate().subjectaltname).toContain(`DNS:${hostname}`);
    } finally {
      socket.end();
    }
  });

  // scenario: proxy-config-all-loaded
  test("every file under docker/proxy is loaded by the one file provider", async () => {
    const args = JSON.parse(inspect(container("proxy"), "{{json .Args}}")) as string[];
    expect(args).toContain("--providers.file.directory=/etc/traefik/dynamic");
    expect(args.filter((a) => a.startsWith("--providers.file.filename"))).toEqual([]);

    const given = fs.readdirSync(path.join(appDir, "docker/proxy")).filter((f) => /\.(ya?ml|toml)$/.test(f)).sort();
    const mounted = docker("exec", container("proxy"), "ls", "/etc/traefik/dynamic").split(/\s+/).filter(Boolean)
      .filter((f) => /\.(ya?ml|toml)$/.test(f)).sort();
    expect(mounted).toEqual(given);

    const errors = stripAnsi(docker("logs", container("proxy")) + "")
      .split("\n")
      .filter((line) => / ERR /.test(line) && /file|tls|conflict|configuration/i.test(line));
    expect(errors).toEqual([]);

    // dynamic.yml is what offers the postgresql ALPN protocol; it answers only if that file is loaded.
    const socket = await connect({ ALPNProtocols: ["postgresql"], rejectUnauthorized: false });
    try {
      expect(socket.alpnProtocol).toBe("postgresql");
    } finally {
      socket.end();
    }
  });

  // scenario: proxy-routes-by-path
  test("paths route to server, Keycloak, Grafana and client", async ({ request }) => {
    for (const p of ["/authjs/providers", "/graphql", "/api/", "/ext/"]) {
      expect(poweredBy(await request.get(p, { maxRedirects: 0 })), p).toBe("Express");
    }
    const realm = await request.get("/auth/sso/realms/default", { maxRedirects: 0 });
    expect(realm.headers()["x-robots-tag"]).toBe("none");
    expect((await realm.json()).realm).toBe("default");

    const grafana = await request.get("/grafana/api/health", { maxRedirects: 0 });
    expect(grafana.status()).toBe(200);
    expect(await grafana.json()).toHaveProperty("database");

    for (const p of ["/", "/no-such-page"]) {
      expect(poweredBy(await request.get(p, { maxRedirects: 0 })), p).toBe("Next.js");
    }
  });

  // scenario: security-headers-present
  test("responses carry HSTS, X-Frame-Options and X-Content-Type-Options", async ({ request }) => {
    test.fixme(true, "parked: the HSTS claim carries an Open line in docs/units/stack.md");
    for (const p of ["/", "/graphql"]) {
      const headers = (await request.get(p, { maxRedirects: 0 })).headers();
      expect(headers["strict-transport-security"], p).toMatch(/max-age=[1-9]/);
      expect(headers["x-frame-options"], p).toBeTruthy();
      expect(headers["x-content-type-options"], p).toBe("nosniff");
    }
  });

  // scenario: certs-before-proxy
  test("the certs service completes before the proxy starts", () => {
    expect(config("proxy").services.proxy.depends_on?.certs?.condition).toBe("service_completed_successfully");
    expect(inspect(container("certs"), "{{.State.ExitCode}}")).toBe("0");
    const finished = Date.parse(inspect(container("certs"), "{{.State.FinishedAt}}"));
    const started = Date.parse(inspect(container("proxy"), "{{.State.StartedAt}}"));
    expect(finished).toBeLessThanOrEqual(started);
  });

  // scenario: cold-init-migrates
  test("init applies every migration to the empty database and exits 0", () => {
    expect(inspect(container("init"), "{{.State.ExitCode}}")).toBe("0");
    const migrations = fs.readdirSync(path.join(appDir, "prisma/prisma/migrations"), { withFileTypes: true })
      .filter((d) => d.isDirectory()).length;
    const applied = psql("database", "aems", "SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL");
    expect(Number(applied)).toBe(migrations);
    // Applied by this init run, not found already there: the harness started this database empty.
    const initStarted = Date.parse(inspect(container("init"), "{{.State.StartedAt}}"));
    const earliest = psql("database", "aems", "SELECT extract(epoch FROM min(started_at)) FROM _prisma_migrations");
    expect(Number(earliest) * 1000).toBeGreaterThanOrEqual(initStarted - 1000);
  });

  // scenario: cold-seed-system-user
  test("the seeders create the system user on the cold database", async () => {
    await expect
      .poll(() => psql("database", "aems", `SELECT count(*) FROM "User" WHERE email = 'system-user@pnnl.gov'`), {
        timeout: 120_000,
      })
      .toBe("1");
  });

  // scenario: profiles-gate-services
  test("the profiles are exactly the twelve, and a service starts only under its own", () => {
    const profiles = compose("config", "--profiles").split(/\s+/).filter(Boolean).sort();
    expect(profiles).toEqual(
      ["proxy", "sso", "map", "nom", "wiki", "redis", "grafana", "historian", "volttron", "fastapi", "fastapi-agents", "synth"].sort(),
    );

    const all = config("*").services;
    // A selection admits a service only if the service has no profile or one of the selected ones.
    const admitted = (selection: string[]) => (s: string) =>
      !all[s].profiles?.length || all[s].profiles!.some((p) => selection.includes(p));

    // A profile whose services require a service of another profile cannot be selected without it
    // (synth needs historian, fastapi-agents needs fastapi), so switching one off switches those off too.
    const requires = (q: string, p: string) =>
      Object.values(all).some((svc) => svc.profiles?.includes(q) && Object.entries(svc.depends_on ?? {}).some(
        ([dep, o]) => (o as { required?: boolean }).required !== false && all[dep].profiles?.length && all[dep].profiles!.every((x) => x === p),
      ));
    const without = (p: string) => {
      const off = new Set([p]);
      for (let grew = true; grew; ) {
        grew = false;
        for (const q of profiles) if (!off.has(q) && [...off].some((o) => requires(q, o))) { off.add(q); grew = true; }
      }
      return profiles.filter((q) => !off.has(q));
    };

    // None selected, and each one switched off from the full set.
    const selections = [[], ...profiles.map(without)];
    for (const selection of selections) {
      const present = Object.keys(config(selection.join(",")).services);
      expect(present.filter((s) => !admitted(selection)(s)), selection.join(",") || "(none)").toEqual([]);
    }

    // And in the running stack, nothing from an unselected profile exists.
    const selected = (readEnv("COMPOSE_PROFILES") ?? "").split(",").filter(Boolean);
    const running = docker("ps", "--filter", `label=com.docker.compose.project=${project}`, "--format", '{{.Label "com.docker.compose.service"}}')
      .split(/\s+/).filter(Boolean);
    expect(running.length).toBeGreaterThan(0);
    expect(running.filter((s) => !admitted(selected)(s))).toEqual([]);
  });

  // scenario: reset-warns-subscribers
  test("reset-service warns about subscribers before it removes historian-data", () => {
    const outputs = [
      run("bash", ["./reset-service.sh", "historian", "--dry-run"]),
      run("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ".\\reset-service.ps1", "historian", "--dry-run"]),
    ];
    for (const raw of outputs) {
      const out = stripAnsi(raw);
      const warning = out.search(/every remote\s+subscriber must drop and re-create its subscription/);
      const removal = out.search(/remove volume:?\s+\S*historian-data/i);
      expect(warning, out).toBeGreaterThan(-1);
      expect(removal, out).toBeGreaterThan(warning);
    }
  });
});
