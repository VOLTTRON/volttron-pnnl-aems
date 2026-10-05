import { test, expect } from "@playwright/test";
import { Fixture, PLACEHOLDER } from "./support/fixture";

type Shell = "sh" | "ps";

let fx: Fixture | undefined;
test.afterEach(() => fx?.dispose());

const run = (shell: Shell, script: string, ...args: string[]) =>
  shell === "sh" ? fx!.sh(`${script}.sh`, ...args) : fx!.ps(`${script}.ps1`, ...args);

const noBuild = (shell: Shell) => (shell === "sh" ? "--no-build" : "-NoBuild");

/** A stand-in for SCRIPT that records, in the fake docker's log, the moment it ran. */
function stub(shell: Shell, script: string) {
  const line = JSON.stringify({ argv: [`#${script}`], env: {} });
  if (shell === "sh") fx!.write(`${script}.sh`, `#!/bin/sh\nprintf '%s\\n' '${line}' >> "$FAKE_DOCKER_LOG"\n`);
  else fx!.write(`${script}.ps1`, `Add-Content -LiteralPath $env:FAKE_DOCKER_LOG -Value '${line}'\nexit 0\n`);
}

// An init container that has already exited cleanly, so a failed `up` is healed at once.
const HEALED_INIT: [string, string][] = [
  ["compose ps -a -q init", "fixture-init"],
  ["{{.State.Status}}", "exited"],
  ["{{.State.ExitCode}}", "0"],
];

for (const shell of ["sh", "ps"] as const) {
  const ext = shell === "sh" ? "sh" : "ps1";

  test.describe(`compose paths (.${ext})`, () => {
    // scenario: compose-paths-sync-first
    test("every script that creates containers syncs .env first; start-services before check-env and again after a failed up", () => {
      fx = new Fixture([`start-services.${ext}`, `reset-service.${ext}`, `restart-service.${ext}`]);
      stub(shell, "secrets");
      stub(shell, "check-env");
      fx.write(".env.secrets", "");

      fx.docker({ fail: ["compose up -d"], outputs: HEALED_INIT });
      const started = run(shell, "start-services", noBuild(shell));
      expect(started.status, started.out).toBe(0);
      const calls = fx.calls();
      const up = calls.indexOf("compose up -d");
      expect(calls[0], calls.join("\n")).toBe("#secrets");
      expect(calls.indexOf("#check-env"), calls.join("\n")).toBeGreaterThan(0);
      expect(up, calls.join("\n")).toBeGreaterThan(calls.indexOf("#check-env"));
      expect(calls.slice(up + 1), calls.join("\n")).toContain("#secrets");

      const config = JSON.stringify({ name: "fixture", services: { database: { volumes: [{ type: "volume", source: "database-data", target: "/data" }] } } });
      fx.docker({ outputs: [["compose config --services", "database"], ["compose config --format json", config]] });
      const reset = run(shell, "reset-service", "database", shell === "sh" ? "--force" : "-f");
      expect(reset.status, reset.out).toBe(0);
      expect(fx.calls()[0], fx.calls().join("\n")).toBe("#secrets");
      expect(fx.calls().some((c) => c.startsWith("compose up -d")), fx.calls().join("\n")).toBe(true);

      fx.docker({ outputs: [["compose config --services", "database"]] });
      const restarted = run(shell, "restart-service", "database");
      expect(restarted.status, restarted.out).toBe(0);
      expect(fx.calls()[0], fx.calls().join("\n")).toBe("#secrets");
      expect(fx.calls().some((c) => c.startsWith("compose up -d")), fx.calls().join("\n")).toBe(true);
    });

    // scenario: restart-recreates
    test("restart-service recreates each service it names, after syncing .env, and restarts none", () => {
      fx = new Fixture([`restart-service.${ext}`]);
      stub(shell, "secrets");
      fx.write(".env.secrets", "");

      fx.docker({ outputs: [["compose config --services", "database\nserver\nclient"]] });
      const restarted = run(shell, "restart-service", "database", "server");
      expect(restarted.status, restarted.out).toBe(0);
      const calls = fx.calls();
      const synced = calls.indexOf("#secrets");
      expect(synced, calls.join("\n")).toBe(0);
      for (const service of ["database", "server"]) {
        expect(calls.indexOf(`compose up -d --force-recreate --no-deps ${service}`), calls.join("\n")).toBeGreaterThan(synced);
      }
      expect(calls.filter((c) => / restart\b|client/.test(c)), calls.join("\n")).toEqual([]);
    });
  });

  test.describe(`SQLHistorian config (.${ext})`, () => {
    const CONFIG = "docker/volttron/setup/configs/historian.config";
    const AGENT = "/home/volttron/.volttron/agents/u1/sqlhistorianagent-4.0.0/sqlhistorianagent-4.0.0.dist-info/config";
    const desired = (password: string) =>
      JSON.stringify({ connection: { type: "postgresql", params: { host: "historian", user: "historian", password } } }, null, 2);
    const volttron = {
      files: { [AGENT]: desired("old-h") },
      outputs: [
        ["vctl status", "platform.historian  sqlhistorianagent-4.0.0  historian  running [7]  GOOD"],
        ["pgrep", "7"],
        ["/proc/7/environ", AGENT],
      ] as [string, string][],
    };
    const installed = () => JSON.parse(fx!.state().files![AGENT]) as unknown;

    // scenario: historian-config-reconciled
    test("matches historian.config after a historian password rotation, and after every start-services", () => {
      fx = new Fixture([
        `secrets.${ext}`,
        `check-env.${ext}`,
        `start-services.${ext}`,
        `scripts/sync-volttron-historian-config.${ext}`,
      ]);
      const blank = fx.sentinelKeys().map((k) => `${k}=`);

      fx.write(CONFIG, desired("new-h"));
      fx.write(".env.secrets", blank.map((l) => (l === "HISTORIAN_DATABASE_PASSWORD=" ? "HISTORIAN_DATABASE_PASSWORD='new-h'" : l)).join("\n") + "\n");
      fx.docker({
        ...volttron,
        running: ["fixture-historian", "fixture-volttron"],
        env: { "fixture-historian": ["POSTGRES_PASSWORD=old-h"] },
        psql: { "fixture-historian": ["old-h", "new-h"] },
      });
      const rotated = run(shell, "secrets");
      expect(rotated.status, rotated.out).toBe(0);
      expect(installed(), rotated.out).toEqual(JSON.parse(desired("new-h")));

      fx.write(".env.secrets", blank.join("\n") + "\n");
      fx.write(".env", fx.git("show", "HEAD:.env").out);
      fx.write(CONFIG, desired(PLACEHOLDER));
      fx.docker({ ...volttron, running: ["fixture-volttron"] });
      const started = run(shell, "start-services", noBuild(shell));
      expect(started.status, started.out).toBe(0);
      expect(installed(), started.out).toEqual(JSON.parse(desired(PLACEHOLDER)));
    });
  });
}
