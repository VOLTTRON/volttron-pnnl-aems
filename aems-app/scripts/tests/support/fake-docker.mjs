// A stand-in for the docker CLI, put first on PATH by the script fixtures.
//
// FAKE_DOCKER_STATE names a JSON file:
//   { "running": ["proj-database", ...],           names `docker ps` reports
//     "env": { "proj-server": ["KEY=value", ...] },  what `docker inspect` reports as Config.Env
//     "psql": { "proj-database": ["pw", ...] },      passwords a `psql` exec accepts
//     "fail": ["compose up"] }                       argv prefixes that exit 1
// FAKE_DOCKER_LOG names a file each call appends one JSON line to: { argv, env } where env holds
// any -e NAME=VALUE the call passed.
import fs from "node:fs";

const argv = process.argv.slice(2);
const state = process.env.FAKE_DOCKER_STATE ? JSON.parse(fs.readFileSync(process.env.FAKE_DOCKER_STATE, "utf8")) : {};
const env = {};
for (let i = 0; i < argv.length - 1; i++) if (argv[i] === "-e") env[argv[i + 1].split("=")[0]] = argv[i + 1].slice(argv[i + 1].indexOf("=") + 1);
if (process.env.FAKE_DOCKER_LOG) fs.appendFileSync(process.env.FAKE_DOCKER_LOG, JSON.stringify({ argv, env }) + "\n");

const joined = argv.join(" ");
if ((state.fail ?? []).some((prefix) => joined.startsWith(prefix))) process.exit(1);

const running = state.running ?? [];
switch (argv[0]) {
  case "ps":
    if (running.length) process.stdout.write(running.join("\n") + "\n");
    break;
  case "inspect": {
    const name = argv.find((a, i) => i > 0 && !a.startsWith("-") && argv[i - 1] !== "--format" && argv[i - 1] !== "-f");
    if (!running.includes(name) && !(state.env ?? {})[name]) process.exit(1);
    process.stdout.write(((state.env ?? {})[name] ?? []).join("\n") + "\n");
    break;
  }
  case "exec": {
    const container = argv.slice(1).find((a, i, rest) => !a.startsWith("-") && rest[i - 1] !== "-e");
    if (!running.includes(container)) process.exit(1);
    if (argv.includes("psql") && state.psql?.[container] && env.PGPASSWORD !== undefined) {
      process.exit(state.psql[container].includes(env.PGPASSWORD) ? 0 : 2);
    }
    break;
  }
}
process.exit(0);
