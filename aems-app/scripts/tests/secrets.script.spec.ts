import { test, expect } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { Fixture, findings, PLACEHOLDER } from "./support/fixture";

const SCRIPTS = ["secrets.sh", "secrets.ps1", "check-env.sh", "check-env.ps1"];

// Values compose would otherwise interpolate, comment out or split.
const AWKWARD = { DATABASE_PASSWORD: "p$ss#word with spaces", JWT_SECRET: "$HOME${PATH}", SESSION_SECRET: "a=b;c" };

let fx: Fixture;
test.beforeEach(() => (fx = new Fixture(SCRIPTS)));
test.afterEach(() => fx.dispose());

const run = (shell: "sh" | "ps", script: string, ...args: string[]) =>
  shell === "sh" ? fx.sh(`${script}.sh`, ...args) : fx.ps(`${script}.ps1`, ...args);

const secretsFile = (values: Record<string, string>) =>
  fx.sentinelKeys().map((k) => `${k}=${values[k] ?? ""}`).join("\n") + "\n";

test.describe("check-env", () => {
  // scenario: check-env-warns
  test("reports the same findings from .sh and .ps1, and never blocks on them", () => {
    const states: Record<string, () => void> = {
      "no .env.secrets": () => undefined,
      "blank .env.secrets": () => fx.write(".env.secrets", secretsFile({})),
      "sentinel .env beside a real .env.secrets": () => fx.write(".env.secrets", secretsFile({ DATABASE_PASSWORD: "real" })),
    };
    for (const [name, arrange] of Object.entries(states)) {
      arrange();
      const sh = run("sh", "check-env");
      const ps = run("ps", "check-env");
      expect(sh.status, `${name}: .sh\n${sh.out}`).toBe(0);
      expect(ps.status, `${name}: .ps1\n${ps.out}`).toBe(0);
      expect(findings(ps.out), name).toEqual(findings(sh.out));
      expect(findings(sh.out).length, name).toBeGreaterThan(0);
    }

    const out = findings(run("sh", "check-env").out);
    expect(out).toContain("[WARN]  JWT_SECRET: blank in .env.secrets, so the .env sentinel is used");
    expect(out).toContain(
      "[WARN]  DATABASE_PASSWORD: .env holds the sentinel while .env.secrets has a value; run secrets before docker compose",
    );
  });
});

for (const shell of ["sh", "ps"] as const) {
  test.describe(`secrets.${shell === "sh" ? "sh" : "ps1"}`, () => {
    // scenario: secrets-bootstrap
    test("with no .env.secrets, writes a stub of every sentinel key and leaves .env alone", () => {
      const before = fx.text(".env");
      const r = run(shell, "secrets");
      expect(r.status, r.out).toBe(0);
      expect(fx.exists(".env.secrets")).toBe(true);
      const stub = fx.values(".env.secrets");
      for (const key of fx.sentinelKeys()) expect(stub[key], key).toBe("");
      expect(fx.text(".env")).toBe(before);
    });

    // scenario: secrets-overlay-idempotent
    test("overlays every non-blank value onto .env, and a second run changes nothing", () => {
      fx.write(".env.secrets", secretsFile({ ...AWKWARD, REDIS_PASSWORD: PLACEHOLDER }));
      const first = run(shell, "secrets");
      expect(first.status, first.out).toBe(0);
      const env = fx.values(".env");
      for (const [k, v] of Object.entries(AWKWARD)) expect(env[k], k).toBe(v);
      expect(env.REDIS_PASSWORD).toBe(PLACEHOLDER);
      expect(env.KEYCLOAK_ADMIN_PASSWORD).toBe(PLACEHOLDER);

      const after = fx.read(".env");
      fx.docker({});
      const second = run(shell, "secrets");
      expect(second.status, second.out).toBe(0);
      expect(fx.read(".env").equals(after)).toBe(true);
      expect(fx.calls().length, "the fake docker was never reached").toBeGreaterThan(0);
      expect(fx.calls().filter((c) => /^(exec|compose)/.test(c))).toEqual([]);
    });

    // scenario: fresh-checkout-boots
    test("leaves a stack running on sentinels alone, and recreates one stale against .env.secrets", () => {
      const sentinelEnv = { "fixture-server": [`SESSION_SECRET=${PLACEHOLDER}`], "fixture-certs": [`JWT_SECRET=${PLACEHOLDER}`] };
      fx.write(".env.secrets", secretsFile({}));
      fx.docker({ running: Object.keys(sentinelEnv), env: sentinelEnv });
      const fresh = run(shell, "secrets");
      expect(fresh.status, fresh.out).toBe(0);
      expect(fx.calls().length, "the fake docker was never reached").toBeGreaterThan(0);
      expect(fx.calls().filter((c) => c.startsWith("compose"))).toEqual([]);

      fx.write(".env.secrets", secretsFile({ SESSION_SECRET: "real" }));
      fx.docker({ running: Object.keys(sentinelEnv), env: sentinelEnv });
      const stale = run(shell, "secrets");
      expect(stale.status, stale.out).toBe(0);
      const recreated = fx.calls().filter((c) => c.startsWith("compose"));
      expect(recreated.some((c) => /up -d.* server$/.test(c)), recreated.join("\n")).toBe(true);
      expect(recreated.some((c) => /certs$/.test(c)), recreated.join("\n")).toBe(false);
    });

    // scenario: env-write-format
    test("writes .env as UTF-8 without a BOM, with LF, quoted so compose reads each value unchanged", () => {
      fx.write(".env.secrets", secretsFile(AWKWARD));
      expect(run(shell, "secrets").status).toBe(0);
      const bytes = fx.read(".env");
      expect([...bytes.subarray(0, 3)]).not.toEqual([0xef, 0xbb, 0xbf]);
      expect(bytes.includes(0x0d)).toBe(false);

      // What compose itself makes of the file, which is the only reading that matters.
      fx.write(
        "docker-compose.yml",
        `services:\n  t:\n    image: alpine\n    environment:\n${Object.keys(AWKWARD).map((k) => `      ${k}: \${${k}}\n`).join("")}`,
      );
      const config = spawnSync("docker", ["compose", "config", "--format", "json"], { cwd: fx.dir, encoding: "utf8" });
      expect(config.status, config.stderr).toBe(0);
      const environment = (JSON.parse(config.stdout) as { services: { t: { environment: Record<string, string> } } }).services.t
        .environment;
      // compose config prints a literal $ as $$.
      for (const [k, v] of Object.entries(AWKWARD)) expect(environment[k].replace(/\$\$/g, "$"), k).toBe(v);
    });
  });
}
