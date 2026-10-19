import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Fixture } from "./support/fixture";
import { appDir } from "./support/stack";

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

/**
 * Leave a tracked file's executable bit in the worktree differing from git's, as `chmod +x` over a
 * 100644 checkout does. Where the filesystem reports no executable bit (Windows), the difference is
 * made from the index's side instead: tracked 100755, read back as 100644.
 */
function chmodOutOfStep(fixture: Fixture, file: string) {
  fixture.git("config", "core.fileMode", "true");
  fs.chmodSync(path.join(fixture.dir, file), 0o755);
  if (!fixture.git("status", "--porcelain", "--", file).out.trim()) {
    fixture.git("update-index", "--chmod=+x", file);
    fixture.git("commit", "-qm", "tracked executable");
  }
  expect(fixture.git("status", "--porcelain", "--", file).out, "only the mode differs").toMatch(/^ M /);
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

    // scenario: update-ignores-exec-bit
    test("a checkout whose scripts were chmod +x'd pulls a release changing them, and the stack comes up", () => {
      fx = freshFixture(shell);
      stubStart(shell);
      fx.git("add", `start-services.${ext}`);
      fx.git("commit", "-qm", "track start-services");
      chmodOutOfStep(fx, `start-services.${ext}`);
      remote = wireRemote(fx);

      advanceRemote(remote, (dir) => {
        fs.appendFileSync(path.join(dir, `start-services.${ext}`), "# release change\n");
      });

      fx.docker({});
      const r = run(shell, "update");
      expect(r.status, r.out).toBe(0);
      expect(fx.git("log", "--format=%s", "-1").out, "the release commit landed").toContain("release change");
      expect(fx.text(`start-services.${ext}`), "the changed script was pulled").toContain("# release change");
      expect(fx.calls(), fx.calls().join("\n")).toContain("#start-services");
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

/** main as it stood when update was added: it ships no update.sh and tracks every script 100644. */
const MAIN = "7c65251ea9b730e0a6ea1fec594c8989c1767f22";
const MAIN_SCRIPTS = ["start-services.sh", "secrets.sh", "check-env.sh"];

/** The command the README names for a deployment of a release that predates update. */
function readmeUpgradeCommand(): string {
  const top = git(appDir, "rev-parse", "--show-toplevel").trim();
  const readme = fs.readFileSync(path.join(top, "README.md"), "utf8");
  const m = /<!-- upgrade-from-before-update -->\s*```(?:bash|sh)\r?\n([^\r\n]+)\r?\n```/.exec(readme);
  expect(m, "the README names one command under <!-- upgrade-from-before-update -->").not.toBeNull();
  return m![1].trim();
}

// scenario: main-reaches-release
test("a deployment of main reaches a release changing .env and its scripts by the README's command", () => {
  const command = readmeUpgradeCommand();
  const fromMain = (file: string) => git(appDir, "show", `${MAIN}:aems-app/${file}`);

  fx = new Fixture([]);
  for (const f of MAIN_SCRIPTS) fx.write(f, fromMain(f));
  fx.write(".env", fromMain(".env"));
  fx.git("add", ".env", ...MAIN_SCRIPTS);
  fx.git("commit", "-qm", "main");
  for (const f of MAIN_SCRIPTS) chmodOutOfStep(fx, f);
  // main's operator: a hand edit in .env, and secrets in main's plain .env.secrets.
  fx.write(".env", fx.text(".env").replace(/^APP_HOSTNAME=.*$/m, "APP_HOSTNAME=aems.example.org"));
  fx.write(".env.secrets", "SESSION_SECRET=main-session\nJWT_SECRET=main-jwt\n");
  remote = wireRemote(fx);

  // The release changes the tracked .env and every script, and ships update.sh.
  advanceRemote(remote, (dir) => {
    const release = (file: string, content: string | Buffer) => {
      fs.writeFileSync(path.join(dir, file), content);
      fs.chmodSync(path.join(dir, file), 0o755);
      git(dir, "add", file);
      git(dir, "update-index", "--chmod=+x", file);
    };
    for (const f of ["update.sh", "secrets.sh", "check-env.sh"]) release(f, fs.readFileSync(path.join(appDir, f)));
    // Stands in for start-services: syncs .env as the real one does first, then logs that it ran.
    const line = JSON.stringify({ argv: ["#start-services"], env: {} });
    release("start-services.sh", `#!/bin/sh\n./secrets.sh || exit 1\nprintf '%s\\n' '${line}' >> "$FAKE_DOCKER_LOG"\n`);
    fs.writeFileSync(path.join(dir, ".env"), git(appDir, "show", "HEAD:aems-app/.env") + "\nNEW_KEY=new-default\n");
  });

  const plain = fx.git("pull", "--ff-only");
  expect(plain.status, `a plain pull is refused, as on a main host:\n${plain.out}`).not.toBe(0);

  fx.docker({});
  const r = fx.bash(command);
  expect(r.status, r.out).toBe(0);
  expect(fx.git("log", "--format=%s", "-1").out, "the release commit landed").toContain("release change");
  expect(fx.calls(), fx.calls().join("\n")).toContain("#start-services");
  const secrets = fx.values(".env.secrets");
  const env = fx.values(".env");
  for (const [key, value] of Object.entries({ SESSION_SECRET: "main-session", JWT_SECRET: "main-jwt", APP_HOSTNAME: "aems.example.org" })) {
    expect(secrets[key], `${key} kept in .env.secrets`).toBe(value);
    expect(env[key], `${key} reached .env`).toBe(value);
  }
  expect(env.NEW_KEY, "the release's .env was pulled").toBe("new-default");
  expect(fx.git("ls-files", "--error-unmatch", "update.sh").status, "from then on it updates with update").toBe(0);
});

// scenario: scripts-tracked-executable
test("every tracked .sh has mode 100755", () => {
  const top = git(appDir, "rev-parse", "--show-toplevel").trim();
  const entries = git(top, "ls-files", "-s", "--", "*.sh").trim().split("\n").filter(Boolean);
  expect(entries.length, "some .sh is tracked").toBeGreaterThan(0);
  const notExecutable = entries.filter((e) => !e.startsWith("100755 ")).map((e) => e.split("\t")[1]);
  expect(notExecutable, notExecutable.join("\n")).toEqual([]);
});
