import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { appDir, container, hostname, inspect, readEnv, run } from "./support/stack";
import { headersOn, routers } from "./support/routers";

const PLACEHOLDER = "SeT_tHiS_iN_0x3A-.env.secrets-";

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
