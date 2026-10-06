import { test, expect } from "@playwright/test";
import { Fixture } from "./support/fixture";

type Shell = "sh" | "ps";

let fx: Fixture | undefined;
test.afterEach(() => fx?.dispose());

const HISTORIAN = "fixture-historian";
const SCRIPT = "scripts/reconcile-historian-logins";

for (const shell of ["sh", "ps"] as const satisfies readonly Shell[]) {
  const ext = shell === "sh" ? "sh" : "ps1";
  const reconcile = (...args: string[]) => (shell === "sh" ? fx!.sh(`${SCRIPT}.sh`, ...args) : fx!.ps(`${SCRIPT}.ps1`, ...args));
  const timeout = shell === "sh" ? ["--timeout", "2"] : ["-Timeout", "2"];

  /** A historian whose role accepts ACCEPTED, created with CREATED as its POSTGRES_PASSWORD; .env holds real-h. */
  function historian(accepted: string[], created = "real-h") {
    fx = new Fixture([`${SCRIPT}.${ext}`]);
    fx.write(".env", fx.text(".env").replace(/^HISTORIAN_DATABASE_PASSWORD=.*$/m, "HISTORIAN_DATABASE_PASSWORD='real-h'"));
    fx.docker({
      running: [HISTORIAN],
      env: { [HISTORIAN]: ["POSTGRES_USER=historian", `POSTGRES_PASSWORD=${created}`] },
      psql: { [HISTORIAN]: accepted },
    });
  }

  const logins = () => fx!.calls().filter((c) => c.startsWith(`exec -e PGPASSWORD=real-h ${HISTORIAN} psql`) && / -U historian /.test(c));

  test.describe(`historian logins (.${ext})`, () => {
    // scenario: historian-logins-verified
    test("a historian role on a stale password is reset to the .env value, then logs in", () => {
      historian(["stale-h"]);
      const r = reconcile(...timeout);
      expect(r.status, r.out).toBe(0);
      expect(fx!.calls(), r.out).toContain(`restart ${HISTORIAN}`);
      expect(fx!.state().psql![HISTORIAN]).toEqual(["real-h"]);
      expect(logins().length, fx!.calls().join("\n")).toBeGreaterThanOrEqual(2);
      expect(r.out).not.toContain("real-h");
    });

    test("a role that already accepts the .env value is left running", () => {
      historian(["real-h"]);
      const r = reconcile(...timeout);
      expect(r.status, r.out).toBe(0);
      expect(fx!.calls().filter((c) => c.startsWith("restart")), r.out).toEqual([]);
      expect(logins().length).toBe(1);
    });

    test("a reset that does not take fails, naming the role", () => {
      historian(["stale-h"], "other-h");
      const r = reconcile(...timeout);
      expect(r.status, r.out).not.toBe(0);
      expect(r.out).toMatch(/historian/);
    });

    test("does nothing when the historian is not running", () => {
      historian(["stale-h"]);
      fx!.docker({ running: [] });
      const r = reconcile(...timeout);
      expect(r.status, r.out).toBe(0);
      expect(fx!.calls().filter((c) => c.startsWith("restart") || c.startsWith("exec"))).toEqual([]);
    });

    test("start-services runs it after compose up and before the SQLHistorian sync", () => {
      fx = new Fixture([`start-services.${ext}`]);
      for (const script of ["secrets", "check-env", SCRIPT, "scripts/sync-volttron-historian-config"]) {
        const line = JSON.stringify({ argv: [`#${script}`], env: {} });
        fx.write(
          `${script}.${ext}`,
          shell === "sh"
            ? `#!/bin/sh\nprintf '%s\\n' '${line}' >> "$FAKE_DOCKER_LOG"\n`
            : `Add-Content -LiteralPath $env:FAKE_DOCKER_LOG -Value '${line}'\nexit 0\n`,
        );
      }
      fx.write(".env.secrets", "");
      fx.docker({});
      const r = shell === "sh" ? fx.sh("start-services.sh", "--no-build") : fx.ps("start-services.ps1", "-NoBuild");
      expect(r.status, r.out).toBe(0);
      const calls = fx.calls();
      const up = calls.indexOf("compose up -d");
      const reconciled = calls.indexOf(`#${SCRIPT}`);
      expect(up, calls.join("\n")).toBeGreaterThan(-1);
      expect(reconciled, calls.join("\n")).toBeGreaterThan(up);
      expect(calls.indexOf("#scripts/sync-volttron-historian-config"), calls.join("\n")).toBeGreaterThan(reconciled);
    });
  });
}
