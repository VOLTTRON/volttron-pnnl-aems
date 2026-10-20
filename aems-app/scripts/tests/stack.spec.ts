import { test, expect, APIResponse } from "@playwright/test";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import tls from "node:tls";
import { Fixture, PLACEHOLDER } from "./support/fixture";
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
import { headersOn, routers } from "./support/routers";

type Config = {
  services: Record<string, {
    image?: string;
    environment?: Record<string, string | null>;
    profiles?: string[];
    depends_on?: Record<string, { condition: string; required?: boolean }>;
  }>;
};

function config(profiles: string, env: Record<string, string> = {}): Config {
  return JSON.parse(run("docker", ["compose", "config", "--format", "json"], {
    env: { ...process.env, COMPOSE_PROFILES: profiles, MSYS_NO_PATHCONV: "1", ...env },
  }));
}

function connect(options: tls.ConnectionOptions): Promise<tls.TLSSocket> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host: hostname, port: 443, servername: hostname, ...options }, () => resolve(socket));
    socket.on("error", reject);
  });
}

type Served = { authorized: boolean; san: string };

/**
 * What a Traefik on the proxy's image and environment, given only the dynamic files in `dynamic` and
 * the certificates in `certs` (a volume or a directory), serves for SNI APP_HOSTNAME, checked against
 * each CA in `cas`. Only the file provider runs: the certificates Traefik holds come from it alone.
 */
async function servedFor(
  image: string,
  dynamic: string,
  certs: string,
  environment: Record<string, string | null>,
  cas: Record<string, string>,
): Promise<Record<string, Served>> {
  const name = `${project}-tls-probe`;
  run("docker", ["rm", "-f", name], { stdio: "pipe" });
  const env = Object.entries(environment).flatMap(([k, v]) => ["-e", `${k}=${v ?? ""}`]);
  docker("run", "-d", "--name", name, "-p", "127.0.0.1::443", ...env,
    "-v", `${certs}:/etc/certs:ro`, "-v", `${dynamic}:/etc/traefik/dynamic:ro`, image,
    "--entrypoints.websecure.address=:443", "--entrypoints.websecure.http.tls=true",
    "--providers.file.directory=/etc/traefik/dynamic");
  try {
    const port = Number(docker("port", name, "443/tcp").trim().split(":").pop());
    const open = (ca?: string) => new Promise<tls.TLSSocket>((resolve, reject) => {
      const socket = tls.connect({ host: "127.0.0.1", port, servername: hostname, ca, rejectUnauthorized: false }, () => resolve(socket));
      socket.on("error", reject);
    });
    // Until the file provider has loaded, Traefik serves a certificate of its own.
    await expect.poll(async () => {
      const socket = await open().catch(() => undefined);
      const cn = socket?.getPeerCertificate().subject?.CN;
      socket?.end();
      return cn === undefined ? "not answering" : cn;
    }, { timeout: 30_000 }).not.toMatch(/^(not answering|TRAEFIK DEFAULT CERT)$/);
    const served: Record<string, Served> = {};
    for (const [label, ca] of Object.entries(cas)) {
      const socket = await open(ca);
      served[label] = { authorized: socket.authorized, san: socket.getPeerCertificate().subjectaltname ?? "" };
      socket.end();
    }
    return served;
  } finally {
    run("docker", ["rm", "-f", name], { stdio: "pipe" });
  }
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

  // scenario: tls-cert-single-source
  test.describe("the certificate for APP_HOSTNAME has one source", () => {
    const mkcertCa = () => docker("exec", container("proxy"), "cat", "/etc/certs/mkcert-ca.crt");

    test("with CERT_RESOLVER set, Traefik holds no mkcert certificate for APP_HOSTNAME", async () => {
      const proxy = config("proxy", { CERT_RESOLVER: "letsencrypt" }).services.proxy;
      expect(proxy.environment?.CERT_RESOLVER, "the proxy is given CERT_RESOLVER").toBe("letsencrypt");
      const dynamic = path.join(appDir, "docker/proxy");
      const volume = `${project}_certs-data`;
      const ca = { mkcert: mkcertCa() };

      // The control: on the fallback, the same probe does see the mkcert certificate for APP_HOSTNAME.
      const fallback = await servedFor(proxy.image!, dynamic, volume, { ...proxy.environment, CERT_RESOLVER: "" }, ca);
      expect(fallback.mkcert, JSON.stringify(fallback)).toEqual({ authorized: true, san: expect.stringContaining(`DNS:${hostname}`) });

      const resolver = await servedFor(proxy.image!, dynamic, volume, proxy.environment!, ca);
      expect(resolver.mkcert.authorized, JSON.stringify(resolver)).toBe(false);
    });

    for (const shell of ["sh", "ps"] as const) {
      test(`with a third-party certificate installed by install-third-party-cert.${shell === "sh" ? "sh" : "ps1"}, Traefik holds no mkcert certificate for APP_HOSTNAME`, async () => {
        const services = config("proxy").services;
        const certs = fs.mkdtempSync(path.join(os.tmpdir(), "aems-tls-certs-"));
        const fx = new Fixture([`install-third-party-cert.${shell === "sh" ? "sh" : "ps1"}`, "docker/proxy/certs-traefik.yml"]);
        const dynamic = fs.mkdtempSync(path.join(os.tmpdir(), "aems-tls-dynamic-"));
        try {
          // The certs service's files, and a certificate for APP_HOSTNAME from a CA that is not its.
          docker("run", "--rm", "-v", `${project}_certs-data:/src:ro`, "-v", `${certs}:/out`, services.certs.image!, "sh", "-c",
            "cp /src/mkcert-* /out/ && " +
            "mkcert create-ca --key /out/third-ca.key --cert /out/third-ca.crt && " +
            `mkcert create-cert --ca-key /out/third-ca.key --ca-cert /out/third-ca.crt --key /out/custom.key --cert /out/custom.crt --domain ${hostname}`);

          const crt = path.join(certs, "custom.crt");
          const key = path.join(certs, "custom.key");
          const r = shell === "sh"
            ? fx.sh("install-third-party-cert.sh", "--cert", crt.replace(/\\/g, "/"), "--key", key.replace(/\\/g, "/"), "--skip-restart")
            : fx.ps("install-third-party-cert.ps1", "-Cert", crt, "-Key", key, "-SkipRestart");
          expect(r.status, r.out).toBe(0);
          const installed = fs.readFileSync(path.join(fx.dir, "docker/proxy/certs-traefik.yml"), "utf8");
          // With two certificates for one name, which one is served varies; the file is what decides.
          expect(installed, "the file gives Traefik no mkcert certificate for APP_HOSTNAME").not.toContain("mkcert-hostname");
          fs.writeFileSync(path.join(dynamic, "certs-traefik.yml"), installed);

          const served = await servedFor(services.proxy.image!, dynamic, certs, services.proxy.environment ?? {}, {
            mkcert: mkcertCa(),
            installed: fs.readFileSync(path.join(certs, "third-ca.crt"), "utf8"),
          });
          expect(served.installed, JSON.stringify(served)).toEqual({ authorized: true, san: expect.stringContaining(`DNS:${hostname}`) });
          expect(served.mkcert.authorized, JSON.stringify(served)).toBe(false);
        } finally {
          fx.dispose();
          fs.rmSync(dynamic, { recursive: true, force: true });
          fs.rmSync(certs, { recursive: true, force: true });
        }
      });
    }
  });

  // scenario: trust-ca-installs-issuer
  test.describe("on the mkcert fallback, each trust-ca installs the CA that issued the certificate served for APP_HOSTNAME", () => {
    /** A deployment directory holding SCRIPT and a .env naming the project under test, where trust-ca finds the proxy. */
    function deployment(script: string) {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aems-trust-ca-"));
      fs.copyFileSync(path.join(appDir, script), path.join(dir, script));
      fs.writeFileSync(path.join(dir, ".env"), `COMPOSE_PROJECT_NAME=${project}\nAPP_HOSTNAME=${hostname}\n`);
      return dir;
    }

    /** What a client trusting only CA makes of the certificate Traefik serves for APP_HOSTNAME. */
    async function verifies(ca: string): Promise<Served> {
      const socket = await connect({ ca, rejectUnauthorized: false });
      try {
        return { authorized: socket.authorized, san: socket.getPeerCertificate().subjectaltname ?? "" };
      } finally {
        socket.end();
      }
    }

    test("trust-ca.sh, on a Debian host, adds it to the system trust store", async () => {
      const dir = deployment("trust-ca.sh");
      // The host is a Debian container. It has no docker CLI of its own, so this one lists what the
      // real one lists, and copies out of the proxy's volumes, mounted at the paths the proxy has them.
      fs.mkdirSync(path.join(dir, "bin"));
      fs.writeFileSync(path.join(dir, "running"), docker("ps", "--format", "{{.Names}}"));
      fs.writeFileSync(path.join(dir, "bin/docker"), [
        "#!/bin/sh",
        'case "$1" in',
        "  ps) cat /work/running ;;",
        `  cp) [ "\${2%%:*}" = "${container("proxy")}" ] && cp "\${2#*:}" "$3" ;;`,
        "  *) exit 1 ;;",
        "esac",
        "",
      ].join("\n"));
      fs.writeFileSync(path.join(dir, "bin/sudo"), '#!/bin/sh\nexec "$@"\n');
      try {
        const host = config("proxy").services.database.image!;
        const out = run("docker", ["run", "--rm", "--entrypoint", "sh", "--volumes-from", `${container("proxy")}:ro`,
          "-v", `${dir}:/work`, "-w", "/work", host, "-c",
          "chmod +x bin/* && export PATH=/work/bin:$PATH && " +
          "cp /etc/ssl/certs/ca-certificates.crt before.pem && sh ./trust-ca.sh && cp /etc/ssl/certs/ca-certificates.crt after.pem"]);
        expect(stripAnsi(out)).toContain("Debian/Ubuntu");

        // The control: until trust-ca runs, the host's store does not trust what Traefik serves.
        const before = await verifies(fs.readFileSync(path.join(dir, "before.pem"), "utf8"));
        expect(before.authorized, JSON.stringify(before)).toBe(false);
        const after = await verifies(fs.readFileSync(path.join(dir, "after.pem"), "utf8"));
        expect(after, out).toEqual({ authorized: true, san: expect.stringContaining(`DNS:${hostname}`) });
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    test("trust-ca.ps1 imports it into the local machine's trusted roots", async () => {
      const dir = deployment("trust-ca.ps1");
      const record = path.join(dir, "imported.json");
      // A test may not write the machine's trust store: this Import-Certificate records what it is given.
      const importCertificate =
        "function Import-Certificate { param([string]$FilePath, [string]$CertStoreLocation) " +
        `@{ store = $CertStoreLocation; pem = [IO.File]::ReadAllText($FilePath) } | ConvertTo-Json | Set-Content -LiteralPath '${record}'; ` +
        "[pscustomobject]@{ Subject = 'CN=recorded'; Thumbprint = '0000000000000000000000000000000000000000' } }";
      try {
        const r = spawnSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command",
          `${importCertificate}; & .\\trust-ca.ps1; exit $LASTEXITCODE`], { cwd: dir, encoding: "utf8" });
        const out = (r.stdout ?? "") + (r.stderr ?? "");
        expect(r.status, out).toBe(0);
        const imported = JSON.parse(fs.readFileSync(record, "utf8")) as { store: string; pem: string };
        expect(imported.store).toBe("Cert:\\LocalMachine\\Root");
        expect(await verifies(imported.pem), out).toEqual({ authorized: true, san: expect.stringContaining(`DNS:${hostname}`) });
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
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
  test("every router, Grafana's included, sends X-Frame-Options and X-Content-Type-Options", async ({ request }) => {
    const all = routers();
    expect(all.map((r) => r.name)).toEqual(expect.arrayContaining(["client", "server", "keycloak", "keycloak-admin", "grafana"]));
    const missing: string[] = [];
    for (const { name, url } of all) {
      const headers = await headersOn(request, url);
      if (!/^(DENY|SAMEORIGIN)$/i.test(headers["x-frame-options"] ?? "")) missing.push(`${name}: X-Frame-Options`);
      if (headers["x-content-type-options"] !== "nosniff") missing.push(`${name}: X-Content-Type-Options`);
    }
    expect(missing).toEqual([]);
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

  // scenario: compose-pubsub-shared
  test("every service that runs the server image sets a shared pub/sub backend", () => {
    const services = Object.entries(
      (JSON.parse(run("docker", ["compose", "config", "--format", "json"], {
        env: { ...process.env, COMPOSE_PROFILES: "*", MSYS_NO_PATHCONV: "1" },
      })) as { services: Record<string, { image?: string; environment?: Record<string, string> }> }).services,
    ).filter(([, s]) => /\/server:[^/]*$/.test(s.image ?? ""));
    expect(services.map(([name]) => name)).toEqual(expect.arrayContaining(["server", "services"]));
    const unshared = services.filter(([, s]) => !["redis", "ioredis", "prisma", "database", "postgres", "postgresql"].includes(s.environment?.GRAPHQL_PUBSUB ?? ""));
    expect(unshared.map(([name, s]) => `${name}: GRAPHQL_PUBSUB=${s.environment?.GRAPHQL_PUBSUB ?? "(unset)"}`)).toEqual([]);
  });

  // scenario: instance-type-deployed-values
  test("server runs none, services *,!seed,!synth, seeders ^seed and synth-worker synth", () => {
    const services = config("*").services as Record<string, { environment?: Record<string, string> }>;
    const deployed = Object.fromEntries(
      ["server", "services", "seeders", "synth-worker"].map((s) => [s, services[s]?.environment?.INSTANCE_TYPE]),
    );
    expect(deployed).toEqual({ server: "none", services: "*,!seed,!synth", seeders: "^seed", "synth-worker": "synth" });
  });

  // scenario: instance-type-run-once
  test("the seeders run the seed service once and their process exits 0", async () => {
    await expect.poll(() => inspect(container("seeders"), "{{.State.Status}}"), { timeout: 300_000, intervals: [5_000] }).toBe("exited");
    expect(inspect(container("seeders"), "{{.State.ExitCode}}")).toBe("0");
    // on-failure restarts would show here; a process that exited 0 once was never restarted.
    expect(inspect(container("seeders"), "{{.RestartCount}}")).toBe("0");
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

  // scenario: historian-config-reconciled
  test("after start-services the SQLHistorian agent runs on the install-time config historian.config holds", async () => {
    test.setTimeout(10 * 60_000);
    const volttron = container("volttron");
    const exec = (script: string) => docker("exec", "-u", "volttron", volttron, "sh", "-c", script).trim();
    let pid = "";
    await expect
      .poll(
        () => {
          try {
            pid = exec("pgrep -f 'sqlhistorian\\.historian' | head -1");
          } catch {
            pid = "";
          }
          return pid;
        },
        { timeout: 8 * 60_000, intervals: [5_000] },
      )
      .not.toBe("");
    const agentConfig = exec(`tr '\\0' '\\n' < /proc/${pid}/environ | sed -n 's/^AGENT_CONFIG=//p'`);
    expect(agentConfig).not.toBe("");
    const desired = fs.readFileSync(path.join(appDir, "docker/volttron/setup/configs/historian.config"), "utf8");
    const squash = (text: string) => text.replace(/\s+/g, "");
    expect(squash(exec(`cat '${agentConfig}'`))).toBe(squash(desired));
  });

  // Runs after the SQLHistorian test, which waits for VOLTTRON to finish installing its agents.
  // scenario: deploy-report
  test("the deployment report names the historian login and each VOLTTRON agent with its health", () => {
    let out = "";
    try {
      out = run("bash", ["./scripts/deploy-report.sh"]);
    } catch (error) {
      // An unhealthy agent exits 1 and is still a report.
      out = String((error as { stdout?: string }).stdout ?? "");
    }
    const lines = stripAnsi(out).split(/\r?\n/);
    expect(lines.find((l) => l.includes("historian login")), out).toMatch(/\bOK\b.*historian login: role \S+/);
    const agents = lines.filter((l) => l.includes("agent: "));
    expect(agents.find((l) => l.includes("platform.historian")), out).toMatch(/\bGOOD\b/);
    for (const agent of agents) expect(agent, out).toMatch(/^\s+(GOOD|NOT HEALTHY)\s+agent: \S/);
  });

  // Runs late, after deploy-report, so VOLTTRON setup has finished writing to docker/volttron/logs/.
  // scenario: no-secret-in-logs
  test("no container's docker logs and no volttron log file holds the value any sentinel key is deployed with", () => {
    // The sentinel keys of the tracked .env, read from HEAD: a working-tree .env with real values
    // overlaid by start-services still tracks the same keys as sentinels.
    const envHead = run("git", ["show", "HEAD:aems-app/.env"]);
    const sentinelKeys = new Set(
      envHead.split(/\r?\n/).filter((l) => l.endsWith(`=${PLACEHOLDER}`)).map((l) => l.split("=")[0]),
    );
    expect(sentinelKeys.size, "the tracked .env holds sentinel keys").toBeGreaterThan(0);

    const names = docker("ps", "-a", "--filter", `label=com.docker.compose.project=${project}`, "--format", "{{.Names}}")
      .split(/\s+/).filter(Boolean);
    expect(names.length, "the stack under test is running").toBeGreaterThan(0);

    // For each sentinel key, the value a running container holds it with: on a sentinel stack
    // that is PLACEHOLDER for every key; on a real-value stack it is each real secret.
    const deployed = new Set<string>();
    for (const name of names) {
      const env = JSON.parse(inspect(name, "{{json .Config.Env}}")) as string[];
      for (const line of env) {
        const idx = line.indexOf("=");
        if (idx < 0) continue;
        const key = line.slice(0, idx);
        const value = line.slice(idx + 1);
        if (sentinelKeys.has(key) && value !== "") deployed.add(value);
      }
    }
    expect(deployed.size, "a sentinel key is deployed to some container by its own name").toBeGreaterThan(0);

    let hits: string[] = [];
    const scan = (source: string, text: string) => {
      for (const value of deployed) {
        if (!text.includes(value)) continue;
        const line = text.split(/\r?\n/).find((l) => l.includes(value)) ?? "";
        hits.push(`${source}: ${line.slice(0, 240)}`);
      }
    };

    // The control: a known leak embedded in a synthetic log must be found before the real check
    // is trusted. Guards whose failure path is never observed are decoration.
    scan("control", `benign line\nleak ${[...deployed][0]} embedded\nmore benign\n`);
    expect(hits.length, "the scan catches a known leak").toBeGreaterThan(0);
    hits = [];

    for (const name of names) {
      let logs = "";
      try {
        logs = run("docker", ["logs", name]);
      } catch (error) {
        const e = error as { stdout?: string; stderr?: string };
        logs = (e.stdout ?? "") + (e.stderr ?? "");
      }
      scan(`docker logs ${name}`, logs);
    }

    // docker/volttron/logs/ is a bind mount shared across compose projects, so files predating
    // the volttron container's start belong to earlier runs and are out of scope.
    const logsDir = path.join(appDir, "docker", "volttron", "logs");
    if (fs.existsSync(logsDir)) {
      const cutoff = Date.parse(inspect(container("volttron"), "{{.State.StartedAt}}")) - 2000;
      for (const entry of fs.readdirSync(logsDir, { withFileTypes: true })) {
        if (!entry.isFile()) continue;
        const file = path.join(logsDir, entry.name);
        if (fs.statSync(file).mtimeMs < cutoff) continue;
        scan(`volttron/logs/${entry.name}`, fs.readFileSync(file, "utf8"));
      }
    }

    expect(hits, hits.join("\n")).toEqual([]);
  });
});
