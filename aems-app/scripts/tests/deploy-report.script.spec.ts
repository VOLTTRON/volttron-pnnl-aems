import { test, expect } from "@playwright/test";
import { Fixture } from "./support/fixture";

let fx: Fixture | undefined;
test.afterEach(() => fx?.dispose());

const HISTORIAN = "fixture-historian";
const VOLTTRON = "fixture-volttron";
const SCRIPT = "scripts/deploy-report";
const STATUS = [
  "  UUID AGENT                    IDENTITY            TAG       STATUS          HEALTH",
  "a  sqlhistorianagent-4.0.0     platform.historian  historian running [7]     GOOD",
  "b  ilcagent-1.0                agent.ilc           ilc       running [9]     BAD",
  "c  manageragent-0.1            manager.rtu1        rtu1",
].join("\n");

const strip = (text: string) => text.replace(/\x1b\[[0-9;]*m/g, "");
const lineFor = (out: string, needle: string) => strip(out).split(/\r?\n/).find((l) => l.includes(needle)) ?? "";

for (const shell of ["sh", "ps"] as const) {
  const ext = shell === "sh" ? "sh" : "ps1";
  const report = () => (shell === "sh" ? fx!.sh(`${SCRIPT}.sh`) : fx!.ps(`${SCRIPT}.ps1`));

  function deployment(state: { historian?: string[]; volttron?: string }) {
    fx = new Fixture([`${SCRIPT}.${ext}`]);
    fx.write(".env", fx.text(".env").replace(/^HISTORIAN_DATABASE_PASSWORD=.*$/m, "HISTORIAN_DATABASE_PASSWORD='real-h'"));
    fx.docker({
      running: [...(state.historian ? [HISTORIAN] : []), ...(state.volttron !== undefined ? [VOLTTRON] : [])],
      env: state.historian ? { [HISTORIAN]: ["POSTGRES_USER=historian", "POSTGRES_PASSWORD=real-h"] } : {},
      psql: state.historian ? { [HISTORIAN]: state.historian } : {},
      outputs: state.volttron !== undefined ? [["vctl status", state.volttron]] : [],
      fail: state.volttron === "" ? [`exec -u volttron ${VOLTTRON}`] : [],
    });
  }

  test.describe(`deploy report (.${ext})`, () => {
    // scenario: deploy-report
    test("names the historian login and every VOLTTRON agent, healthy or not", () => {
      deployment({ historian: ["real-h"], volttron: STATUS });
      const r = report();
      expect(r.status, r.out).not.toBe(0);
      expect(lineFor(r.out, "historian login"), r.out).toMatch(/\bOK\b.*historian login: role historian/);
      expect(lineFor(r.out, "platform.historian"), r.out).toMatch(/\bGOOD\b/);
      expect(lineFor(r.out, "agent.ilc"), r.out).toMatch(/NOT HEALTHY/);
      expect(lineFor(r.out, "manager.rtu1"), r.out).toMatch(/NOT HEALTHY/);
      expect(r.out).not.toContain("real-h");
    });

    test("succeeds when every login and agent is healthy", () => {
      deployment({ historian: ["real-h"], volttron: STATUS.split("\n").slice(0, 2).join("\n") });
      const r = report();
      expect(r.status, r.out).toBe(0);
      expect(lineFor(r.out, "platform.historian"), r.out).toMatch(/\bGOOD\b/);
    });

    test("names a historian login that is refused", () => {
      deployment({ historian: ["stale-h"] });
      const r = report();
      expect(r.status, r.out).not.toBe(0);
      expect(lineFor(r.out, "historian login"), r.out).toMatch(/FAILED/);
    });

    test("says when VOLTTRON does not answer", () => {
      deployment({ historian: ["real-h"], volttron: "" });
      const r = report();
      expect(r.status, r.out).not.toBe(0);
      expect(lineFor(r.out, "VOLTTRON"), r.out).toMatch(/did not answer/);
    });

    test("names services that are not running without failing", () => {
      deployment({});
      const r = report();
      expect(r.status, r.out).toBe(0);
      expect(lineFor(r.out, "historian"), r.out).toMatch(/not running/);
      expect(lineFor(r.out, "VOLTTRON"), r.out).toMatch(/not running/);
    });

    /** start-services with every script it runs stubbed to log itself; the report exits REPORT. */
    function stubbedStart(report: number) {
      fx = new Fixture([`start-services.${ext}`]);
      for (const script of ["secrets", "check-env", "scripts/reconcile-historian-logins", "scripts/sync-volttron-historian-config", SCRIPT]) {
        const line = JSON.stringify({ argv: [`#${script}`], env: {} });
        const code = script === SCRIPT ? report : 0;
        fx.write(
          `${script}.${ext}`,
          shell === "sh"
            ? `#!/bin/sh\nprintf '%s\\n' '${line}' >> "$FAKE_DOCKER_LOG"\nexit ${code}\n`
            : `Add-Content -LiteralPath $env:FAKE_DOCKER_LOG -Value '${line}'\nexit ${code}\n`,
        );
      }
      fx.write(".env.secrets", "");
      fx.docker({});
    }

    test("start-services ends with it", () => {
      stubbedStart(0);
      const r = shell === "sh" ? fx!.sh("start-services.sh", "--no-build") : fx!.ps("start-services.ps1", "-NoBuild");
      expect(r.status, r.out).toBe(0);
      const calls = fx!.calls();
      expect(calls[calls.length - 1], calls.join("\n")).toBe(`#${SCRIPT}`);
    });

    // test-integration.ps1 runs start-services in its own session and reads $LASTEXITCODE after it.
    test("an unhealthy report does not fail start-services, even for a caller in the same session", () => {
      stubbedStart(1);
      const r =
        shell === "sh"
          ? fx!.sh("start-services.sh", "--no-build")
          : fx!.session("& .\\start-services.ps1 -NoBuild; exit $LASTEXITCODE");
      expect(r.status, r.out).toBe(0);
      expect(fx!.calls().pop(), r.out).toBe(`#${SCRIPT}`);
    });
  });
}
