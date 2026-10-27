import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { appDir, container, docker, hostname, inspect, psql, readEnv, run, stripAnsi } from "./support/stack";
import { pushed } from "./support/push";
import { headersOn, routers } from "./support/routers";

const PLACEHOLDER = "SeT_tHiS_iN_0x3A-.env.secrets-";

const healthy = (service: string) =>
  expect
    .poll(() => inspect(container(service), "{{.State.Health.Status}}"), { timeout: 10 * 60_000, intervals: [5_000] })
    .toBe("healthy");

// Runs here because it restarts the server: the services container boots the same application and
// writes the same lines to the same table, so only a line written after the server alone restarted
// is known to be the server's.
// scenario: log-to-console-and-table
test("a log entry reaches the server's console and the Log table", async () => {
  test.setTimeout(15 * 60_000);
  const BOOTED = "Nest application successfully started";
  docker("restart", container("server"));
  const started = inspect(container("server"), "{{.State.StartedAt}}");
  await healthy("server");
  expect(stripAnsi(docker("logs", "--since", started, container("server")))).toContain(BOOTED);
  const since = `"createdAt" >= '${started}'::timestamptz - interval '1 second'`;
  await expect
    .poll(() => Number(psql("database", "aems", `SELECT count(*) FROM "Log" WHERE message LIKE '%${BOOTED}%' AND ${since}`)), {
      timeout: 60_000,
    })
    .toBeGreaterThan(0);
});

// Runs here because it restarts the server and the background services.
// scenario: log-pruned-by-worker
test("the Log table is pruned by the process whose INSTANCE_TYPE includes log, and not by the server", async () => {
  test.setTimeout(15 * 60_000);
  const instanceType = (service: string) =>
    (JSON.parse(inspect(container(service), "{{json .Config.Env}}")) as string[])
      .find((e) => e.startsWith("INSTANCE_TYPE="))
      ?.slice("INSTANCE_TYPE=".length)
      .split(",");
  const includesLog = (types: string[] = []) => !types.includes("!log") && ["log", "^log", "*"].some((t) => types.includes(t));
  expect(includesLog(instanceType("services"))).toBe(true);
  expect(includesLog(instanceType("server"))).toBe(false);

  const marker = `prune-marker-${Date.now()}`;
  const present = () => Number(psql("database", "aems", `SELECT count(*) FROM "Log" WHERE id = '${marker}'`));
  psql(
    "database",
    "aems",
    `INSERT INTO "Log" (id, type, message, "createdAt", "updatedAt") VALUES ('${marker}', 'Info', '${marker}', now() - interval '1 day', now())`,
  );
  expect(present()).toBe(1);

  docker("restart", container("server"));
  await healthy("server");
  await new Promise((resolve) => setTimeout(resolve, 15_000));
  expect(present()).toBe(1);

  docker("restart", container("services"));
  await expect.poll(present, { timeout: 5 * 60_000, intervals: [2_000] }).toBe(0);
});

// Runs here because it recreates every service that carries a router.
// scenario: hsts-follows-sts-seconds
test("HSTS max-age is STS_SECONDS on every router, Grafana's too, and absent when it is 0", async ({ request }) => {
  test.setTimeout(20 * 60_000);
  const routed = ["client", "server", "keycloak", "grafana"];
  const recreate = (env: NodeJS.ProcessEnv) =>
    run("docker", ["compose", "up", "-d", "--no-deps", ...routed], { env: { ...env, MSYS_NO_PATHCONV: "1" }, stdio: "pipe" });
  const answering = async () => {
    await expect
      .poll(() => inspect(container("server"), "{{.State.Health.Status}}"), { timeout: 10 * 60_000, intervals: [5_000] })
      .toBe("healthy");
    for (const p of ["/auth/sso/realms/default", "/grafana/api/health", "/"]) {
      await expect.poll(async () => (await request.get(`https://${hostname}${p}`)).status(), { timeout: 5 * 60_000 }).toBe(200);
    }
  };
  const hsts = async (env: NodeJS.ProcessEnv) => {
    const sent: Record<string, string | undefined> = {};
    for (const { name, url } of routers(env)) sent[name] = (await headersOn(request, url))["strict-transport-security"];
    return sent;
  };
  const unset = { ...process.env };
  delete unset.STS_SECONDS;

  // The stack as the tracked .env leaves it: STS_SECONDS blank.
  expect(readEnv("STS_SECONDS") ?? "").toMatch(/^0?$/);
  const none = await hsts(unset);
  expect(Object.keys(none)).toEqual(expect.arrayContaining(["client", "server", "keycloak", "keycloak-admin", "grafana"]));
  expect(Object.entries(none).filter(([, v]) => v !== undefined)).toEqual([]);

  const seconds = { ...unset, STS_SECONDS: "600" };
  try {
    recreate(seconds);
    await answering();
    const sent = await hsts(seconds);
    expect(Object.entries(sent).filter(([, v]) => v !== "max-age=600")).toEqual([]);
  } finally {
    recreate(unset);
    await answering();
  }
  expect(Object.entries(await hsts(unset)).filter(([, v]) => v !== undefined)).toEqual([]);
});

// Runs last: it restarts the stack every other spec ran against.
// Runs here because it restarts the historian.
// scenario: historian-logins-verified
test("a historian role on a stale password is reset to the .env value by the reconciler start-services runs", async () => {
  test.setTimeout(5 * 60_000);
  const historian = container("historian");
  const password = readEnv("HISTORIAN_DATABASE_PASSWORD")!;
  const role = inspect(historian, "{{range .Config.Env}}{{println .}}{{end}}")
    .split(/\r?\n/)
    .find((e) => e.startsWith("POSTGRES_USER="))!
    .slice("POSTGRES_USER=".length);
  const sql = (pw: string, statement: string) =>
    docker("exec", "-e", `PGPASSWORD=${pw}`, historian, "psql", "-U", role, "-h", "localhost", "-d", role, "-tAc", statement);
  const logsIn = (pw: string) => {
    try {
      return sql(pw, "SELECT 1;").trim() === "1";
    } catch {
      return false;
    }
  };

  expect(logsIn(password)).toBe(true);
  const stale = `stale-${Date.now()}`;
  sql(password, `ALTER ROLE "${role}" WITH PASSWORD '${stale}';`);
  expect(logsIn(password)).toBe(false);

  const out = stripAnsi(run("bash", ["./scripts/reconcile-historian-logins.sh"]));
  expect(out).toMatch(/reset, and accepts the password \.env holds/);
  expect(out).not.toContain(password);
  expect(logsIn(password)).toBe(true);
  expect(logsIn(stale)).toBe(false);
});

// Runs here because it restarts a VOLTTRON agent and re-pushes every unit.
// scenario: volttron-store-reconciled
test("a stale config-store entry and a stale install-time config are brought back to the rendered configs, and every unit and control is marked for a push", async () => {
  test.setTimeout(15 * 60_000);
  const volttron = container("volttron");
  const vsh = (script: string) =>
    docker("exec", "-u", "volttron", volttron, "bash", "-lc", `export PATH=/home/volttron/.local/bin:$PATH; ${script}`).trim();
  const rendered = (file: string) => JSON.parse(fs.readFileSync(path.join(appDir, "docker/volttron/setup/configs", file), "utf8")) as unknown;
  const watcherConfig = "$(ls $(dirname $(grep -l -x platform.topic_watcher $VOLTTRON_HOME/agents/*/IDENTITY))/*/*.dist-info/config)";
  const storedDriverConfig = () =>
    JSON.parse((JSON.parse(vsh("cat $VOLTTRON_HOME/configuration_store/platform.driver.store")) as Record<string, { data: string }>).config.data) as unknown;

  await expect
    .poll(
      () => {
        try {
          return vsh(`vctl status >/dev/null && cat ${watcherConfig} >/dev/null && echo ready`);
        } catch {
          return "";
        }
      },
      { timeout: 10 * 60_000, intervals: [5_000] },
    )
    .toBe("ready");

  vsh(`printf '{"stale": true}' > /tmp/stale.json && vctl config store platform.driver config /tmp/stale.json --json`);
  vsh(`printf '{"stale": true}' > ${watcherConfig}`);
  expect(storedDriverConfig()).toEqual({ stale: true });
  for (const table of ["Unit", "Control"]) psql("database", "aems", `UPDATE "${table}" SET "updatedAt" = now() - interval '1 day'`);

  let out = "";
  try {
    out = run("bash", ["./scripts/reconcile-volttron-configs.sh"]);
  } catch (error) {
    // An agent this stack never installs is reported and is not this test's concern.
    out = String((error as { stdout?: string }).stdout ?? "");
  }
  expect(stripAnsi(out), out).toMatch(/reconciled: platform\.driver store config/);
  expect(stripAnsi(out), out).toMatch(/reconciled: platform\.topic_watcher install-time config/);
  expect(storedDriverConfig()).toEqual(rendered("driver.config"));
  expect(JSON.parse(vsh(`cat ${watcherConfig}`))).toEqual(rendered("topic_watcher.config"));
  const marked = Number(psql("database", "aems", `SELECT (SELECT count(*) FROM "Unit") + (SELECT count(*) FROM "Control")`));
  expect(marked).toBeGreaterThan(0);
  for (const table of ["Unit", "Control"]) {
    expect(Number(psql("database", "aems", `SELECT count(*) FROM "${table}" WHERE "updatedAt" < now() - interval '1 hour'`)), table).toBe(0);
  }
});

// Runs here because it breaks the historian and VOLTTRON and runs start-services over them.
// scenario: upgrade-from-broken-fixture
test("a deployment whose historian role is on a stale password and whose VOLTTRON holds stale configs comes up working after one start-services", async () => {
  test.setTimeout(20 * 60_000);
  const historian = container("historian");
  const volttron = container("volttron");
  const password = readEnv("HISTORIAN_DATABASE_PASSWORD")!;
  const vsh = (script: string) =>
    docker("exec", "-u", "volttron", volttron, "bash", "-lc", `export PATH=/home/volttron/.local/bin:$PATH; ${script}`).trim();
  const login = (pw: string) => {
    try {
      return docker("exec", "-e", `PGPASSWORD=${pw}`, historian, "psql", "-U", "historian", "-h", "localhost", "-d", "historian", "-tAc", "SELECT 1;").trim() === "1";
    } catch {
      return false;
    }
  };
  const rendered = (file: string) => JSON.parse(fs.readFileSync(path.join(appDir, "docker/volttron/setup/configs", file), "utf8")) as unknown;
  const watcherConfig = "$(ls $(dirname $(grep -l -x platform.topic_watcher $VOLTTRON_HOME/agents/*/IDENTITY))/*/*.dist-info/config)";
  const storedDriverConfig = () =>
    JSON.parse((JSON.parse(vsh("cat $VOLTTRON_HOME/configuration_store/platform.driver.store")) as Record<string, { data: string }>).config.data) as unknown;

  // Both broken states at once.
  docker("exec", "-e", `PGPASSWORD=${password}`, historian, "psql", "-U", "historian", "-h", "localhost", "-d", "historian", "-tAc", `ALTER ROLE historian WITH PASSWORD 'stale-${Date.now()}';`);
  vsh(`printf '{"stale": true}' > /tmp/stale.json && vctl config store platform.driver config /tmp/stale.json --json`);
  vsh(`printf '{"stale": true}' > ${watcherConfig}`);
  expect(login(password)).toBe(false);
  expect(storedDriverConfig()).toEqual({ stale: true });

  const out = stripAnsi(
    run("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ".\\start-services.ps1", "-NoBuild"], { stdio: "pipe" }),
  );

  expect(login(password), out).toBe(true);
  expect(storedDriverConfig()).toEqual(rendered("driver.config"));
  expect(JSON.parse(vsh(`cat ${watcherConfig}`))).toEqual(rendered("topic_watcher.config"));
  await expect
    .poll(() => vsh("vctl status").split(/\r?\n/).find((l) => l.includes("platform.historian")) ?? "", { timeout: 5 * 60_000, intervals: [5_000] })
    .toMatch(/GOOD\s*$/);
  const report = out.slice(out.lastIndexOf("Deployment report"));
  expect(report.split(/\r?\n/).find((l) => l.includes("historian login: role")), out).toMatch(/\bOK\b/);
});

// Runs here because it rotates VOLTTRON_PASSWORD and recreates volttron, server, services and
// synth-worker. Not marked with the `volttron-password-rotated` scenario: its push waits out
// setup-platform's restart, and whether a push inside that restart may Fail is rotation.md's Open
// line under the claim.
test("a VOLTTRON_PASSWORD rotation flips /authenticate on the platform, and a control's push then reaches Complete", async () => {
  // Each force-recreate of volttron runs setup-platform.py from a fresh config — about four
  // minutes of agent installs to write a new web-users.json. The test rotates there and back, so
  // the budget covers both passes.
  test.setTimeout(30 * 60_000);
  const username = readEnv("VOLTTRON_USERNAME");
  const oldPassword = readEnv("VOLTTRON_PASSWORD");
  expect(username, "VOLTTRON_USERNAME must be set in .env").toBeTruthy();
  expect(oldPassword, "VOLTTRON_PASSWORD must be set in .env").toBeTruthy();
  expect(oldPassword, "VOLTTRON_PASSWORD must not be the sentinel").not.toBe(PLACEHOLDER);
  const newPassword = `rotated-${Date.now()}-abcDEF`;

  const secretsPath = path.join(appDir, ".env.secrets");
  expect(fs.existsSync(secretsPath), ".env.secrets must exist").toBe(true);
  const originalSecrets = fs.readFileSync(secretsPath, "utf8");

  const auth = (password: string) => {
    // VOLTTRON runs with network_mode: host, so its bind-web-address is reachable from inside its
    // own namespace on localhost. docker exec enters that namespace. Any thrown failure (container
    // not running yet, connection refused during restart) is returned so expect.poll can retry.
    try {
      const body = JSON.stringify({ username, password });
      return docker(
        "exec",
        container("volttron"),
        "sh",
        "-c",
        `curl -s -o - -w ' HTTP %{http_code}' http://localhost:5410/authenticate ` +
          `-X POST -H 'Content-Type: application/json' -d ${JSON.stringify(body)}`,
      );
    } catch (e) {
      const err = e as { stderr?: Buffer | string; stdout?: Buffer | string; message?: string };
      return `curl-failed: ${String(err.stderr ?? err.stdout ?? err.message ?? "")}`.trim();
    }
  };

  const writeSecret = (value: string) => {
    const lines = fs.readFileSync(secretsPath, "utf8").split(/\r?\n/);
    const idx = lines.findIndex((l) => l.startsWith("VOLTTRON_PASSWORD="));
    const line = `VOLTTRON_PASSWORD=${value}`;
    if (idx === -1) lines.push(line);
    else lines[idx] = line;
    fs.writeFileSync(secretsPath, lines.join("\n"));
  };

  const servicesPassword = () =>
    (JSON.parse(inspect(container("services"), "{{json .Config.Env}}")) as string[])
      .find((e) => e.startsWith("VOLTTRON_PASSWORD="))
      ?.slice("VOLTTRON_PASSWORD=".length);

  try {
    writeSecret(newPassword);
    run("bash", ["./secrets.sh"]);

    // The platform must stop accepting the old password and start accepting the new one. The
    // first-boot setup inside the recreated volttron container installs every agent before
    // writing web-users.json, so the window to wait on is minutes, not seconds.
    await expect
      .poll(() => auth(newPassword), { timeout: 10 * 60_000, intervals: [5_000] })
      .toMatch(/ HTTP 200\s*$/);
    expect(auth(oldPassword!), "the platform must refuse the old password").not.toMatch(/ HTTP 200\s*$/);

    // The services container is the server-side consumer; a recreate against the synced .env is
    // what carries the new value there.
    await healthy("services");
    expect(servicesPassword(), "services env must hold the new VOLTTRON_PASSWORD").toBe(newPassword);

    // A control's push logs in to the platform from the services process, so it reaching Complete is
    // that process calling with the new password; the old one is refused above. Marked the way the
    // services cron reads a mark, since this project has no signed-in session. setup-platform
    // answers /authenticate a moment before it shuts the platform down to start it for real, so the
    // mark waits for that start.
    await expect
      .poll(() => /Setup of Volttron platform is complete\./i.test(docker("logs", container("volttron"))), {
        message: "setup-platform never finished",
        timeout: 10 * 60_000,
        intervals: [5_000],
      })
      .toBe(true);
    await expect
      .poll(() => auth(newPassword), { timeout: 5 * 60_000, intervals: [5_000] })
      .toMatch(/ HTTP 200\s*$/);
    const control = psql("database", "aems", `SELECT id FROM "Control" WHERE name NOT LIKE 'DEMO\\_%' ORDER BY name LIMIT 1`);
    expect(control, "the stack has a control").toBeTruthy();
    psql("database", "aems", `UPDATE "Control" SET stage = 'Update' WHERE id = '${control}'`);
    await pushed("Control", control, { timeout: 10 * 60_000 });
  } finally {
    fs.writeFileSync(secretsPath, originalSecrets);
    try {
      run("bash", ["./secrets.sh"]);
    } catch {
      // best-effort: the next test-integration run starts cold
    }
  }
});

// scenario: fresh-checkout-boots
test("a checkout with only sentinels and blank secrets boots, and boots again", async ({ request }) => {
  test.setTimeout(20 * 60_000);

  // The first boot was cold, from the tracked .env. Whatever .env.secrets it left holds no value
  // that is not blank or the sentinel, so the sentinels are still the running credentials.
  expect(readEnv("DATABASE_PASSWORD")).toBe(PLACEHOLDER);
  const secrets = path.join(appDir, ".env.secrets");
  if (fs.existsSync(secrets)) {
    const values = fs.readFileSync(secrets, "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+_(PASSWORD|SECRET|TOKEN)=/.test(l));
    expect(values.filter((l) => !/=('|")?('|")?$/.test(l) && !l.includes(PLACEHOLDER) && !l.startsWith("VOLTTRON_"))).toEqual([]);
  }

  const second = run("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ".\\start-services.ps1", "-NoBuild"], {
    stdio: "pipe",
  });
  expect(second).toContain("All Docker Compose services are now running");

  expect(inspect(container("init"), "{{.State.ExitCode}}")).toBe("0");
  await expect
    .poll(() => inspect(container("server"), "{{.State.Health.Status}}"), { timeout: 10 * 60_000, intervals: [5_000] })
    .toBe("healthy");
  await expect
    .poll(async () => (await request.get(`https://${hostname}/auth/sso/realms/default`)).status(), { timeout: 5 * 60_000 })
    .toBe(200);
  expect((await request.get(`https://${hostname}/`)).status()).toBe(200);
});
