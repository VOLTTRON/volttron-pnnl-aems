import { test, expect } from "@playwright/test";
import { Fixture } from "./support/fixture";

let fx: Fixture | undefined;
test.afterEach(() => fx?.dispose());

const SCRIPT = "scripts/reconcile-volttron-setup";
const VOLUME = "fixture_volttron-setup";
const INVALIDATE = `run --rm -v ${VOLUME}:/data busybox`;

for (const shell of ["sh", "ps"] as const) {
  const ext = shell === "sh" ? "sh" : "ps1";
  const reconcile = () => (shell === "sh" ? fx!.sh(`${SCRIPT}.sh`) : fx!.ps(`${SCRIPT}.ps1`));

  /** A fixture with .env, generate_configs.py, an optional registry file, and a prior fingerprint. */
  function deployment(opts: {
    env?: Record<string, string>;
    generatePy?: string;
    registryPath?: string;
    registryContent?: string;
    priorFingerprint?: string;
  } = {}) {
    fx = new Fixture([`${SCRIPT}.${ext}`]);
    let envText = fx.text(".env");
    for (const [k, v] of Object.entries(opts.env ?? {})) {
      const re = new RegExp(`^${k}=.*$`, "m");
      envText = re.test(envText) ? envText.replace(re, `${k}=${v}`) : envText + `\n${k}=${v}`;
    }
    fx.write(".env", envText);
    if (opts.generatePy !== undefined) {
      fx.write("aems-edge/configurations/docker/generate_configs.py", opts.generatePy);
    }
    if (opts.registryPath !== undefined && opts.registryContent !== undefined) {
      fx.write(opts.registryPath, opts.registryContent);
    }
    if (opts.priorFingerprint !== undefined) {
      fx.write("volttron/setup/.render_fingerprint", opts.priorFingerprint);
    }
    // The volume exists in all these cases unless the test overrides -- fake docker's
    // `volume inspect` has no handler, so it falls through to exit 0, i.e. "exists".
    fx.docker({});
  }

  const invalidations = () => fx!.calls().filter((c) => c.startsWith(INVALIDATE));

  test.describe(`volttron-setup render fingerprint (.${ext})`, () => {
    // scenario: volttron-setup-rerenders
    test("a changed VOLTTRON_* value invalidates the completion lock", () => {
      deployment({
        env: { VOLTTRON_CAMPUS: "PNNL" },
        generatePy: "# original",
        priorFingerprint: "stale-fp-from-earlier-run",
      });
      const r = reconcile();
      expect(r.status, r.out).toBe(0);
      expect(invalidations().length, fx!.calls().join("\n")).toBe(1);
      expect(invalidations()[0]).toMatch(/rm -f \/data\/\.setup_complete \/data\/\.setup_complete\.fingerprint/);
    });

    test("a changed HISTORIAN_DB_* value invalidates the completion lock", () => {
      // Baseline run writes the fingerprint for the initial values.
      deployment({ env: { HISTORIAN_DB_PASSWORD: "first" }, generatePy: "# g" });
      expect(reconcile().status).toBe(0);
      // The next run with a different HISTORIAN_DB_* value must invalidate.
      let envText = fx!.text(".env").replace(/^HISTORIAN_DB_PASSWORD=.*$/m, "HISTORIAN_DB_PASSWORD=second");
      // Add the key if the baseline .env didn't carry it.
      if (!/^HISTORIAN_DB_PASSWORD=/m.test(envText)) envText += "\nHISTORIAN_DB_PASSWORD=second";
      fx!.write(".env", envText);
      fx!.docker({});
      const r = reconcile();
      expect(r.status, r.out).toBe(0);
      expect(invalidations().length, fx!.calls().join("\n")).toBe(1);
    });

    test("a changed generate_configs.py invalidates the completion lock", () => {
      deployment({ generatePy: "# original" });
      expect(reconcile().status).toBe(0);
      fx!.write("aems-edge/configurations/docker/generate_configs.py", "# changed");
      fx!.docker({});
      const r = reconcile();
      expect(r.status, r.out).toBe(0);
      expect(invalidations().length, fx!.calls().join("\n")).toBe(1);
    });

    test("a changed registry file invalidates the completion lock", () => {
      const registryPath = shell === "sh" ? "registry.csv" : "registry.csv";
      deployment({
        env: { VOLTTRON_REGISTRY_FILE_PATH: registryPath },
        registryPath,
        registryContent: "point,unit\na,1\n",
      });
      expect(reconcile().status).toBe(0);
      fx!.write(registryPath, "point,unit\na,2\n");
      fx!.docker({});
      const r = reconcile();
      expect(r.status, r.out).toBe(0);
      expect(invalidations().length, fx!.calls().join("\n")).toBe(1);
    });

    test("unchanged inputs do not invalidate the completion lock", () => {
      deployment({
        env: { VOLTTRON_CAMPUS: "PNNL", HISTORIAN_DB_PASSWORD: "p" },
        generatePy: "# g",
      });
      expect(reconcile().status).toBe(0);
      // Reset the fake docker log; the first run may have invalidated once (no prior fp).
      fx!.docker({});
      const r = reconcile();
      expect(r.status, r.out).toBe(0);
      expect(invalidations().length, fx!.calls().join("\n")).toBe(0);
    });

    test("start-services runs it before compose up", () => {
      fx = new Fixture([`start-services.${ext}`]);
      const scripts = ["secrets", "check-env", SCRIPT];
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
      const at = (name: string) => calls.indexOf(`#${name}`);
      const up = calls.indexOf("compose up -d");
      expect(at(SCRIPT), calls.join("\n")).toBeGreaterThan(-1);
      expect(up, calls.join("\n")).toBeGreaterThan(-1);
      expect(at(SCRIPT), calls.join("\n")).toBeLessThan(up);
    });
  });
}
