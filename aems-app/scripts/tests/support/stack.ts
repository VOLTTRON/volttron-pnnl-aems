import { execFileSync, ExecFileSyncOptions } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** aems-app/, where compose runs. */
export const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

export const hostname = process.env.APP_HOSTNAME!;

/** The compose project under test; test-integration sets it, and it is never the one in .env. */
export const project = process.env.COMPOSE_PROJECT_NAME ?? "aems-test";

export const container = (service: string) => `${project}-${service}`;

// Git Bash rewrites leading-slash arguments into Windows paths unless told not to.
const env = { ...process.env, MSYS_NO_PATHCONV: "1" };

export function run(file: string, args: string[], options: ExecFileSyncOptions = {}): string {
  return execFileSync(file, args, { cwd: appDir, env, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...options }) as string;
}

export const docker = (...args: string[]) => run("docker", args);

export const compose = (...args: string[]) => docker("compose", ...args);

export function inspect(name: string, format: string): string {
  return docker("inspect", name, "--format", format).trim();
}

export function psql(service: string, user: string, sql: string): string {
  return docker("exec", container(service), "psql", "-U", user, "-d", user, "-tAc", sql).trim();
}

/** A value from aems-app/.env, unquoted; undefined when the key is absent. */
export function readEnv(key: string, file = path.join(appDir, ".env")): string | undefined {
  const line = fs.readFileSync(file, "utf8").split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  if (line === undefined) return undefined;
  const value = line.slice(key.length + 1).trim();
  const quoted = /^(["'])(.*)\1$/.exec(value);
  return quoted ? quoted[2] : value;
}

export const stripAnsi =(text: string) => text.replace(/\x1b\[[0-9;]*m/g, "");
