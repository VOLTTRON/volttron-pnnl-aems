import { test, expect } from "@playwright/test";
import { Fixture } from "./support/fixture";

let fx: Fixture | undefined;
test.afterEach(() => fx?.dispose());

const VOLTTRON = "fixture-volttron";
const DATABASE = "fixture-database";
const SCRIPT = "scripts/reconcile-volttron-configs";
const READY = ["vctl status", "a  sqlhistorianagent-4.0.0  platform.historian  historian  running [7]  GOOD"] as [string, string];

for (const shell of ["sh", "ps"] as const) {
  const ext = shell === "sh" ? "sh" : "ps1";
  const reconcile = () =>
    shell === "sh" ? fx!.sh(`${SCRIPT}.sh`, "--timeout", "2") : fx!.ps(`${SCRIPT}.ps1`, "-Timeout", "2");

  function deployment(state: { volttron?: boolean; ready?: boolean; reconciled?: boolean }) {
    fx = new Fixture([`${SCRIPT}.${ext}`, `${SCRIPT}.py`]);
    fx.docker({
      running: [...(state.volttron === false ? [] : [VOLTTRON]), DATABASE],
      env: { [DATABASE]: ["POSTGRES_USER=aems", "POSTGRES_DB=aems"] },
      outputs: [...(state.ready === false ? [] : [READY]), ["python3 -", "reconciled: platform.driver store config"]],
      fail: [
        ...(state.ready === false ? [`exec -u volttron ${VOLTTRON}`] : []),
        ...(state.reconciled === false ? [`exec -i -u volttron ${VOLTTRON}`] : []),
      ],
    });
  }

  const reconciled = () => fx!.calls().findIndex((c) => c.startsWith(`exec -i -u volttron ${VOLTTRON}`) && c.includes("python3 -"));
  const repushed = () => fx!.calls().findIndex((c) => c.startsWith(`exec -i ${DATABASE} psql`) && /UPDATE "Unit"/.test(c) && /UPDATE "Control"/.test(c));

  test.describe(`VOLTTRON configs (.${ext})`, () => {
    // scenario: volttron-store-reconciled
    test("reconciles every agent's configs in VOLTTRON, then marks every unit and control for a push", () => {
      deployment({});
      const r = reconcile();
      expect(r.status, r.out).toBe(0);
      expect(reconciled(), fx!.calls().join("\n")).toBeGreaterThan(-1);
      expect(repushed(), fx!.calls().join("\n")).toBeGreaterThan(reconciled());
      expect(r.out).toContain("reconciled: platform.driver store config");
    });

    test("still re-pushes the app's values when a config could not be reconciled, and fails", () => {
      deployment({ reconciled: false });
      const r = reconcile();
      expect(r.status, r.out).not.toBe(0);
      expect(repushed(), fx!.calls().join("\n")).toBeGreaterThan(-1);
    });

    test("does nothing when VOLTTRON is not running", () => {
      deployment({ volttron: false });
      const r = reconcile();
      expect(r.status, r.out).toBe(0);
      expect(reconciled()).toBe(-1);
      expect(repushed()).toBe(-1);
    });

    test("fails, reconciling and marking nothing, when VOLTTRON does not answer", () => {
      deployment({ ready: false });
      const r = reconcile();
      expect(r.status, r.out).not.toBe(0);
      expect(reconciled()).toBe(-1);
      expect(repushed()).toBe(-1);
    });

    test("start-services runs it after the SQLHistorian sync and before the report", () => {
      fx = new Fixture([`start-services.${ext}`]);
      const scripts = ["secrets", "check-env", "scripts/reconcile-historian-logins", "scripts/sync-volttron-historian-config", SCRIPT, "scripts/deploy-report"];
      for (const script of scripts) {
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
      const at = (script: string) => calls.indexOf(`#${script}`);
      expect(at(SCRIPT), calls.join("\n")).toBeGreaterThan(at("scripts/sync-volttron-historian-config"));
      expect(at("scripts/deploy-report"), calls.join("\n")).toBeGreaterThan(at(SCRIPT));
    });
  });
}
