import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { appDir } from "./stack";

export const PLACEHOLDER = "SeT_tHiS_iN_0x3A-.env.secrets-";

const fakeDocker = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "fake-docker.mjs");
// C:/... rather than /c/...: the scripts run with MSYS_NO_PATHCONV=1, so a POSIX path would reach
// node unconverted, and every fake docker call would fail without logging.
const forward = (p: string) => p.replace(/\\/g, "/");

export type Result = { status: number; out: string };

export type DockerState = {
  running?: string[];
  env?: Record<string, string[]>;
  psql?: Record<string, string[]>;
  files?: Record<string, string>;
  outputs?: [string, string][];
  fail?: string[];
};

/**
 * A copy of aems-app's scripts in a temp git repository holding the tracked .env, with a fake
 * docker first on PATH. The real stack is never reachable from here.
 */
export class Fixture {
  readonly dir: string;
  private readonly shBin: string;
  private readonly psBin: string;
  private readonly statePath: string;
  readonly logPath: string;

  constructor(scripts: string[]) {
    this.dir = fs.mkdtempSync(path.join(os.tmpdir(), "aems-fixture-"));
    for (const s of scripts) {
      fs.mkdirSync(path.dirname(path.join(this.dir, s)), { recursive: true });
      fs.copyFileSync(path.join(appDir, s), path.join(this.dir, s));
      fs.chmodSync(path.join(this.dir, s), 0o755);
    }
    fs.writeFileSync(path.join(this.dir, ".env"), execFileSync("git", ["show", "HEAD:aems-app/.env"], { cwd: appDir }));
    fs.writeFileSync(path.join(this.dir, ".gitignore"), ".env.secrets\n");

    this.shBin = fs.mkdtempSync(path.join(os.tmpdir(), "aems-bin-sh-"));
    fs.writeFileSync(path.join(this.shBin, "docker"), `#!/bin/sh\nexec node "${forward(fakeDocker)}" "$@"\n`, { mode: 0o755 });
    this.psBin = fs.mkdtempSync(path.join(os.tmpdir(), "aems-bin-ps-"));
    fs.writeFileSync(path.join(this.psBin, "docker.cmd"), `@node "${fakeDocker}" %*\r\n`);
    this.statePath = path.join(this.dir, ".fake-docker.json");
    this.logPath = path.join(this.dir, ".fake-docker.log");
    this.docker({});

    const git = (...args: string[]) => execFileSync("git", args, { cwd: this.dir, stdio: "pipe" });
    git("init", "-q");
    git("config", "user.email", "f@x");
    git("config", "user.name", "fixture");
    git("add", ".env", ".gitignore");
    git("commit", "-qm", "fixture");
  }

  docker(state: DockerState) {
    fs.writeFileSync(this.statePath, JSON.stringify(state));
    fs.writeFileSync(this.logPath, "");
  }

  /** The fake docker's state as it now stands, with whatever files its execs wrote. */
  state(): DockerState {
    return JSON.parse(fs.readFileSync(this.statePath, "utf8")) as DockerState;
  }

  /** Every docker call made since the state was last set, as argv strings. */
  calls(): string[] {
    return fs.readFileSync(this.logPath, "utf8").split("\n").filter(Boolean).map((l) => (JSON.parse(l) as { argv: string[] }).argv.join(" "));
  }

  private env(bin: string) {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      FAKE_DOCKER_STATE: this.statePath,
      FAKE_DOCKER_LOG: this.logPath,
      COMPOSE_PROJECT_NAME: "fixture",
      MSYS_NO_PATHCONV: "1",
    };
    const key = Object.keys(env).find((k) => k.toUpperCase() === "PATH") ?? "PATH";
    env[key] = `${bin}${path.delimiter}${env[key]}`;
    return env;
  }

  sh(script: string, ...args: string[]): Result {
    const r = spawnSync("bash", [`./${script}`, ...args], { cwd: this.dir, env: this.env(this.shBin), encoding: "utf8" });
    return { status: r.status ?? -1, out: (r.stdout ?? "") + (r.stderr ?? "") };
  }

  ps(script: string, ...args: string[]): Result {
    const r = spawnSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", `.\\${script}`, ...args], {
      cwd: this.dir,
      env: this.env(this.psBin),
      encoding: "utf8",
    });
    return { status: r.status ?? -1, out: (r.stdout ?? "") + (r.stderr ?? "") };
  }

  /** COMMAND in one PowerShell session, so scripts it invokes with `&` share that session's process. */
  session(command: string): Result {
    const r = spawnSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command], {
      cwd: this.dir,
      env: this.env(this.psBin),
      encoding: "utf8",
    });
    return { status: r.status ?? -1, out: (r.stdout ?? "") + (r.stderr ?? "") };
  }

  read(file: string): Buffer {
    return fs.readFileSync(path.join(this.dir, file));
  }

  text(file: string): string {
    return this.read(file).toString("utf8");
  }

  write(file: string, content: string) {
    fs.mkdirSync(path.dirname(path.join(this.dir, file)), { recursive: true });
    fs.writeFileSync(path.join(this.dir, file), content);
  }

  /** git in the fixture's repository; its output, or the error's when it fails. */
  git(...args: string[]): Result {
    const r = spawnSync("git", args, { cwd: this.dir, encoding: "utf8" });
    return { status: r.status ?? -1, out: (r.stdout ?? "") + (r.stderr ?? "") };
  }

  exists(file: string) {
    return fs.existsSync(path.join(this.dir, file));
  }

  /** The sentinel keys of the tracked .env. */
  sentinelKeys(): string[] {
    return this.text(".env").split("\n").filter((l) => l.endsWith(`=${PLACEHOLDER}`)).map((l) => l.split("=")[0]);
  }

  /** KEY -> value as compose would read it from FILE. */
  values(file: string): Record<string, string> {
    const out: Record<string, string> = {};
    for (const line of this.text(file).replace(/^﻿/, "").split(/\r?\n/)) {
      const m = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
      if (!m) continue;
      const v = m[2];
      out[m[1]] = /^'.*'$/.test(v) ? v.slice(1, -1) : /^".*"$/.test(v) ? v.slice(1, -1).replace(/\\"/g, '"').replace(/\$\$/g, "$") : v;
    }
    return out;
  }

  dispose() {
    for (const d of [this.dir, this.shBin, this.psBin]) fs.rmSync(d, { recursive: true, force: true });
  }
}

/** The [OK]/[WARN]/[ERROR] lines of a check-env run, colour stripped. */
export const findings = (out: string) =>
  out.replace(/\x1b\[[0-9;]*m/g, "").split(/\r?\n/).map((l) => l.trim()).filter((l) => /^\[(OK|WARN|ERROR)\]/.test(l));
