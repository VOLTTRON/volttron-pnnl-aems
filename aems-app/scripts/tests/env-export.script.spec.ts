import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { Fixture } from "./support/fixture";
import { appDir } from "./support/stack";

// Every way a script has put .env into its own environment, where the values outrank .env for any
// compose it runs and, for a .ps1 invoked from a prompt, stay in the operator's session after it.
const EXPORTS: Record<string, RegExp[]> = {
  sh: [
    /^\s*export\s+"?\$(?!\{?[A-Za-z_][A-Za-z0-9_]*\}?=)/m, // export "$line", export $(...)
    /^\s*set\s+(-a\b|-o\s+allexport)/m,
    /^\s*(\.|source)\s+["']?(\.\/)?\.env["']?\s*$/m,
  ],
  ps1: [/SetEnvironmentVariable/, /(Set|New)-Item\b[^\n]*\benv:/i, /\$env:\$/],
};

const tracked = () =>
  execFileSync("git", ["ls-files", "--", "*.sh", "*.ps1", "*.bash"], { cwd: appDir, encoding: "utf8" })
    .split("\n")
    .filter((f) => f && !/^(Reference|server\/dist|[^/]+\/node_modules)\//.test(f));

let fx: Fixture | undefined;
test.afterEach(() => fx?.dispose());

// scenario: no-env-export
test.describe("nothing exports .env into the shell", () => {
  test("there is no env.sh", () => {
    expect(fs.existsSync(path.join(appDir, "env.sh"))).toBe(false);
  });

  test("no tracked script puts .env into its environment", () => {
    const scripts = tracked();
    expect(scripts.length).toBeGreaterThan(20);
    const offenders = scripts.flatMap((file) => {
      const text = fs.readFileSync(path.join(appDir, file), "utf8");
      const patterns = EXPORTS[file.endsWith(".ps1") ? "ps1" : "sh"];
      return patterns.filter((p) => p.test(text)).map((p) => `${file}: ${p}`);
    });
    expect(offenders).toEqual([]);
  });

  test("a PowerShell session that runs the .ps1 scripts that read .env holds none of its keys afterwards", () => {
    const scripts = ["update-user-role.ps1", "repair-historian-replication.ps1"];
    fx = new Fixture(scripts);
    fx.write("server/.env", "KEYCLOAK_ISSUER_URL=https://x/realms/r\n");
    const names = (out: string) => out.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const before = new Set(names(fx.session("Get-ChildItem env: | ForEach-Object Name").out));
    const keys = [...Object.keys(fx.values(".env")), "KEYCLOAK_ISSUER_URL"].filter((k) => !before.has(k));
    expect(keys).toEqual(expect.arrayContaining(["DATABASE_PASSWORD", "HISTORIAN_DATABASE_PASSWORD"]));

    const project = fx.values(".env").COMPOSE_PROJECT_NAME;
    const ran = fx.session(
      [
        "Remove-Item env:COMPOSE_PROJECT_NAME",
        "& .\\update-user-role.ps1 someone@example.com admin *>&1 | Out-String",
        "& .\\repair-historian-replication.ps1 *>&1 | Out-String",
        "'---'",
        "Get-ChildItem env: | ForEach-Object Name",
      ].join("; "),
    );
    const [said, listed] = ran.out.split("---");
    // Both read .env: the containers they look for are named from its project.
    expect(said, ran.out).toContain(`${project}-database`);
    expect(said, ran.out).toContain(`${project}-historian`);
    const after = names(listed ?? "");
    expect(after.length, ran.out).toBeGreaterThan(0);
    expect(keys.filter((k) => after.includes(k)), ran.out).toEqual([]);
  });
});
