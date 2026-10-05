import { test, expect } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { Fixture, findings, PLACEHOLDER } from "./support/fixture";

const SCRIPTS = ["secrets.sh", "secrets.ps1", "check-env.sh", "check-env.ps1"];
const FLAGS: Record<string, string> = { "dry-run": "-DryRun", force: "-Force", scrub: "-Scrub" };

// Values compose would otherwise interpolate, comment out or split.
const AWKWARD = { DATABASE_PASSWORD: "p$ss#word with spaces", JWT_SECRET: "$HOME${PATH}", SESSION_SECRET: "a=b;c" };

let fx: Fixture;
test.beforeEach(() => (fx = new Fixture(SCRIPTS)));
test.afterEach(() => fx.dispose());

const run = (shell: "sh" | "ps", script: string, ...args: string[]) =>
  shell === "sh" ? fx.sh(`${script}.sh`, ...args) : fx.ps(`${script}.ps1`, ...args);

/** A flag as each script spells it: --dry-run for .sh, -DryRun for .ps1. */
const flag = (shell: "sh" | "ps", name: string) => (shell === "sh" ? `--${name}` : FLAGS[name]);

/** Docker calls that change something: an exec that is not a read-only probe, or a compose call. */
const changes = () => fx.calls().filter((c) => /^compose/.test(c) || (/^exec/.test(c) && !/SELECT 1;$/.test(c)));

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

    // scenario: env-hidden-from-git
    test("hides a .env holding a real value from git through stash, checkout and reset, and --scrub restores it", () => {
      fx.write(".env.secrets", secretsFile({ DATABASE_PASSWORD: "real" }));
      const r = run(shell, "secrets");
      expect(r.status, r.out).toBe(0);
      const real = fx.read(".env");
      expect(fx.values(".env").DATABASE_PASSWORD).toBe("real");
      expect(fx.git("ls-files", "-v", ".env").out).toMatch(/^S /);
      expect(fx.git("status", "--porcelain", "--", ".env").out).toBe("");

      for (const op of [["stash"], ["checkout", "--", "."], ["checkout", "HEAD", "--", ".env"], ["reset", "--hard"]]) {
        fx.git(...op);
        expect(fx.read(".env").equals(real), op.join(" ")).toBe(true);
      }
      fx.git("add", "-A");
      expect(fx.git("diff", "--cached", "--name-only").out.split("\n")).not.toContain(".env");
      fx.git("reset", "-q");

      const scrub = run(shell, "secrets", flag(shell, "scrub"));
      expect(scrub.status, scrub.out).toBe(0);
      expect(fx.text(".env")).toBe(fx.git("show", "HEAD:.env").out);
      expect(fx.git("ls-files", "-v", ".env").out).toMatch(/^H /);
    });

    // scenario: env-reset-resynced
    test("re-syncs a .env reset to its sentinels under a running stack, reading what is deployed from the containers", () => {
      const tracked = fx.text(".env");
      const stack = {
        running: ["fixture-server", "fixture-database"],
        env: { "fixture-server": ["SESSION_SECRET=real-s"], "fixture-database": ["POSTGRES_PASSWORD=real-d"] },
        psql: { "fixture-database": ["real-d"] },
      };
      fx.write(".env.secrets", secretsFile({ SESSION_SECRET: "real-s", DATABASE_PASSWORD: "real-d" }));

      // Reset to the sentinels, and reset to an older checkout's real values: either way .env is
      // not what the stack runs on.
      const resets = {
        sentinels: tracked,
        "older values": tracked.replace(`SESSION_SECRET=${PLACEHOLDER}`, "SESSION_SECRET='old-s'").replace(`DATABASE_PASSWORD=${PLACEHOLDER}`, "DATABASE_PASSWORD='old-d'"),
      };
      for (const [name, env] of Object.entries(resets)) {
        fx.write(".env", env);
        fx.docker(stack);
        const r = run(shell, "secrets");
        expect(r.status, `${name}\n${r.out}`).toBe(0);
        expect(fx.values(".env").SESSION_SECRET, name).toBe("real-s");
        expect(fx.values(".env").DATABASE_PASSWORD, name).toBe("real-d");
        expect(changes(), name).toEqual([]);
      }
    });

    // scenario: secrets-rotate-live
    test("applies a changed value to the running service with the old one, refuses when it is down, and --dry-run changes nothing", () => {
      const desired = secretsFile({ DATABASE_PASSWORD: "new-d", HISTORIAN_DATABASE_PASSWORD: "new-h" });
      const live = {
        running: ["fixture-database", "fixture-historian"],
        env: { "fixture-database": ["POSTGRES_PASSWORD=old-d"], "fixture-historian": ["POSTGRES_PASSWORD=old-h"] },
        psql: { "fixture-historian": ["old-h", "new-h"] },
      };
      const before = fx.read(".env");

      fx.write(".env.secrets", desired);
      fx.docker(live);
      const dry = run(shell, "secrets", flag(shell, "dry-run"));
      expect(dry.status, dry.out).toBe(0);
      expect(fx.read(".env").equals(before)).toBe(true);
      expect(fx.text(".env.secrets")).toBe(desired);
      expect(fx.calls().length, "the fake docker was never reached").toBeGreaterThan(0);
      expect(changes()).toEqual([]);

      fx.docker({ ...live, running: ["fixture-historian"] });
      const down = run(shell, "secrets");
      expect(down.status, down.out).not.toBe(0);
      expect(fx.read(".env").equals(before)).toBe(true);
      expect(changes()).toEqual([]);

      fx.docker({ ...live, running: ["fixture-historian"] });
      const forced = run(shell, "secrets", flag(shell, "force"));
      expect(forced.status, forced.out).toBe(0);
      expect(fx.values(".env").DATABASE_PASSWORD).toBe("new-d");
      fx.write(".env", before.toString("utf8"));

      fx.docker(live);
      const r = run(shell, "secrets");
      expect(r.status, r.out).toBe(0);
      const calls = fx.calls();
      expect(calls.some((c) => /^exec .*fixture-database psql .*ALTER ROLE .*'new-d'/.test(c)), calls.join("\n")).toBe(true);
      expect(calls.some((c) => /^exec -e PGPASSWORD=old-h .*fixture-historian psql .*ALTER ROLE .*historian.*'new-h'/.test(c)), calls.join("\n")).toBe(true);
      expect(calls).toContain("compose up -d --no-deps database");
      expect(calls).toContain("compose up -d --no-deps historian");
      expect(fx.values(".env").DATABASE_PASSWORD).toBe("new-d");
      expect(fx.values(".env").HISTORIAN_DATABASE_PASSWORD).toBe("new-h");
    });

    // scenario: pg-shadow-drift-healed
    test("rotates a Postgres role still on the sentinel to the .env.secrets value, with nothing else changed", () => {
      // .env, .env.secrets and the container all agree; only the role in the volume does not.
      fx.write(".env.secrets", secretsFile({ HISTORIAN_DATABASE_PASSWORD: "real-h" }));
      fx.write(".env", fx.text(".env").replace(`HISTORIAN_DATABASE_PASSWORD=${PLACEHOLDER}`, "HISTORIAN_DATABASE_PASSWORD='real-h'"));
      fx.docker({
        running: ["fixture-historian"],
        env: { "fixture-historian": ["POSTGRES_PASSWORD=real-h"] },
        psql: { "fixture-historian": [PLACEHOLDER] },
      });
      const r = run(shell, "secrets");
      expect(r.status, r.out).toBe(0);
      const calls = fx.calls();
      expect(
        calls.some((c) => c.startsWith(`exec -e PGPASSWORD=${PLACEHOLDER} fixture-historian psql`) && /ALTER ROLE .*historian.*'real-h'/.test(c)),
        calls.join("\n"),
      ).toBe(true);
      expect(calls.some((c) => /^compose up -d .*volttron$/.test(c)), calls.join("\n")).toBe(true);
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
