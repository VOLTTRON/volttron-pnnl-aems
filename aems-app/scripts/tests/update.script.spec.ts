import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Fixture } from "./support/fixture";

type Shell = "sh" | "ps";

let fx: Fixture | undefined;
let remote: string | undefined;
test.afterEach(() => {
  fx?.dispose();
  fx = undefined;
  if (remote) fs.rmSync(remote, { recursive: true, force: true });
  remote = undefined;
});

const git = (dir: string, ...args: string[]) =>
  execFileSync("git", args, { cwd: dir, encoding: "utf8" });

/** Point the fixture at a bare remote whose main matches its HEAD; return its path. */
function wireRemote(fixture: Fixture): string {
  const bare = fs.mkdtempSync(path.join(os.tmpdir(), "aems-update-remote-"));
  git(bare, "init", "--bare", "-q", "-b", "main");
  fixture.git("branch", "-M", "main");
  fixture.git("remote", "add", "origin", bare);
  fixture.git("push", "-q", "-u", "origin", "main");
  return bare;
}

/** Clone bare, apply changes, push back — the remote now has one new commit. */
function advanceRemote(bare: string, changes: (dir: string) => void) {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "aems-update-work-"));
  try {
    git(work, "clone", "-q", bare, ".");
    git(work, "config", "user.email", "r@x");
    git(work, "config", "user.name", "release");
    changes(work);
    git(work, "add", "-A");
    git(work, "commit", "-qm", "release change");
    git(work, "push", "-q", "origin", "main");
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

const run = (shell: Shell, script: string, ...args: string[]) =>
  shell === "sh" ? fx!.sh(`${script}.sh`, ...args) : fx!.ps(`${script}.ps1`, ...args);

/** Stand in for start-services; logs that it ran, with the argv it got. */
function stubStart(shell: Shell) {
  const ext = shell === "sh" ? "sh" : "ps1";
  const line = JSON.stringify({ argv: ["#start-services"], env: {} });
  if (shell === "sh") {
    fx!.write(`start-services.${ext}`, `#!/bin/sh\nprintf '%s\\n' '${line}' >> "$FAKE_DOCKER_LOG"\nexit 0\n`);
  } else {
    fx!.write(`start-services.${ext}`, `Add-Content -LiteralPath $env:FAKE_DOCKER_LOG -Value '${line}'\nexit 0\n`);
  }
}

/** The fixture scripts update.sh/ps1 needs in a fresh fixture, scripted-in. */
function freshFixture(shell: Shell): Fixture {
  const ext = shell === "sh" ? "sh" : "ps1";
  return new Fixture([`update.${ext}`, `secrets.${ext}`, `check-env.${ext}`]);
}

for (const shell of ["sh", "ps"] as const) {
  const ext = shell === "sh" ? "sh" : "ps1";

  test.describe(`update (.${ext})`, () => {
    // scenario: update-pulls-changed-env
    test("pulls a release that changed the tracked .env, under a .env synced from .env.secrets", () => {
      fx = freshFixture(shell);
      // Sync .env with real values first, so .env (skip-worktree'd) differs from HEAD.
      fx.write(".env.secrets", "SESSION_SECRET='real-s'\n");
      fx.docker({});
      const sync = run(shell, "secrets");
      expect(sync.status, sync.out).toBe(0);
      expect(fx.values(".env").SESSION_SECRET, sync.out).toBe("real-s");

      remote = wireRemote(fx);
      stubStart(shell);

      // The release adds a new key to tracked .env.
      advanceRemote(remote, (dir) => {
        fs.appendFileSync(path.join(dir, ".env"), "\nNEW_KEY=new-default\n");
      });

      fx.docker({});
      const r = run(shell, "update");
      expect(r.status, r.out).toBe(0);
      expect(fx.git("log", "--format=%s", "-1").out, "the release commit landed").toContain("release change");
      expect(fx.calls(), fx.calls().join("\n")).toContain("#start-services");
      expect(fx.values(".env.secrets").SESSION_SECRET, "no value was lost").toBe("real-s");
      // After scrub+pull but before start-services' secrets.sh, .env is the pulled tracked version:
      // the new key is there, and the sentinel is back under the secret key.
      expect(fx.values(".env").NEW_KEY, "pulled the new key").toBe("new-default");
    });

    // scenario: update-keeps-env-only-values
    test("a value held only in .env is in .env.secrets and .env afterwards", () => {
      fx = freshFixture(shell);
      // The operator edited .env directly, bypassing .env.secrets.
      fx.write(".env", fx.text(".env").replace(/^SESSION_SECRET=.*$/m, "SESSION_SECRET='env-only'"));
      fx.write(".env.secrets", "");
      remote = wireRemote(fx);
      stubStart(shell);

      // Any release — the .env-only value must survive the scrub.
      advanceRemote(remote, (dir) => {
        fs.appendFileSync(path.join(dir, ".env"), "\nNEW_KEY=new-default\n");
      });

      fx.docker({});
      const r = run(shell, "update");
      expect(r.status, r.out).toBe(0);
      expect(fx.values(".env.secrets").SESSION_SECRET, ".env.secrets carries the captured value").toBe("env-only");
      // start-services → secrets.sh would then sync it back into .env; prove update left it ready.
      expect(fx.calls(), fx.calls().join("\n")).toContain("#start-services");
    });

    // scenario: update-refused-pull-safe
    test("a diverged checkout: .env re-synced, nothing started, the reason named", () => {
      fx = freshFixture(shell);
      fx.write(".env.secrets", "SESSION_SECRET='real-s'\n");
      fx.docker({});
      expect(run(shell, "secrets").status).toBe(0);

      remote = wireRemote(fx);
      stubStart(shell);

      // Both sides advance: remote with a release, fixture with an unrelated local commit.
      advanceRemote(remote, (dir) => {
        fs.appendFileSync(path.join(dir, ".env"), "\nREMOTE_KEY=remote\n");
      });
      fx.write("local-file.txt", "local-only\n");
      fx.git("add", "local-file.txt");
      fx.git("-c", "user.email=f@x", "-c", "user.name=f", "commit", "-qm", "local");

      fx.docker({});
      const r = run(shell, "update");
      expect(r.status, r.out).not.toBe(0);
      expect(r.out, "the reason is named").toMatch(/refused|non-fast-forward|not possible/i);
      expect(fx.calls(), "start-services did not run").not.toContain("#start-services");
      expect(fx.values(".env").SESSION_SECRET, ".env was re-synced from .env.secrets").toBe("real-s");
      expect(fx.values(".env").REMOTE_KEY ?? "", "the diverged remote did not land").toBe("");
    });
  });
}

// scenario: update-sh-ps1-parity
test.describe("update sh/ps1 parity", () => {
  test("both shells carry a .env-only value into .env.secrets, pull, and run start-services", () => {
    const results: Record<Shell, { exit: number; secretsSession: string; envSession: string; calledStart: boolean }> = {} as never;
    for (const shell of ["sh", "ps"] as const) {
      fx = freshFixture(shell);
      fx.write(".env", fx.text(".env").replace(/^SESSION_SECRET=.*$/m, "SESSION_SECRET='parity'"));
      fx.write(".env.secrets", "");
      remote = wireRemote(fx);
      stubStart(shell);
      advanceRemote(remote, (dir) => fs.writeFileSync(path.join(dir, "release-note.txt"), "x\n"));

      fx.docker({});
      const r = run(shell, "update");
      results[shell] = {
        exit: r.status,
        secretsSession: fx.values(".env.secrets").SESSION_SECRET ?? "",
        envSession: fx.values(".env").SESSION_SECRET ?? "",
        calledStart: fx.calls().includes("#start-services"),
      };
      fx.dispose();
      fs.rmSync(remote, { recursive: true, force: true });
      fx = undefined;
      remote = undefined;
    }
    expect(results.ps, JSON.stringify(results)).toEqual(results.sh);
    expect(results.sh.exit).toBe(0);
    expect(results.sh.secretsSession).toBe("parity");
    expect(results.sh.calledStart).toBe(true);
  });
});
