import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { appDir, container, hostname, inspect, readEnv, run } from "./support/stack";

const PLACEHOLDER = "SeT_tHiS_iN_0x3A-.env.secrets-";

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
