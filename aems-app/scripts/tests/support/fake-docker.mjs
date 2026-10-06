// A stand-in for the docker CLI, put first on PATH by the script fixtures.
//
// FAKE_DOCKER_STATE names a JSON file:
//   { "running": ["proj-database", ...],           names `docker ps` reports
//     "env": { "proj-server": ["KEY=value", ...] },  what `docker inspect` reports as Config.Env; a
//                                                     container here and not running is stopped,
//                                                     and `docker ps -a` lists it
//     "psql": { "proj-database": ["pw", ...] },      passwords a `psql` exec accepts; a `restart`
//                                                     leaves it accepting only the POSTGRES_PASSWORD
//                                                     its env holds, as the historian's entrypoint
//                                                     wrapper re-asserts it at boot
//     "files": { "/path": "content" },               files inside the containers: an exec of
//                                                     `cat '/path'` prints one and `cat > '/path'`
//                                                     writes stdin to it, kept in this state file
//     "outputs": [["substring", "stdout"], ...],     the first whose substring is in the argv
//                                                     prints its stdout
//     "fail": ["compose up"] }                       argv prefixes that exit 1
// FAKE_DOCKER_LOG names a file each call appends one JSON line to: { argv, env } where env holds
// any -e NAME=VALUE the call passed.
import fs from "node:fs";

const argv = process.argv.slice(2);
const statePath = process.env.FAKE_DOCKER_STATE;
const state = statePath ? JSON.parse(fs.readFileSync(statePath, "utf8")) : {};
const env = {};
for (let i = 0; i < argv.length - 1; i++) if (argv[i] === "-e") env[argv[i + 1].split("=")[0]] = argv[i + 1].slice(argv[i + 1].indexOf("=") + 1);
if (process.env.FAKE_DOCKER_LOG) fs.appendFileSync(process.env.FAKE_DOCKER_LOG, JSON.stringify({ argv, env }) + "\n");

const joined = argv.join(" ");
if ((state.fail ?? []).some((prefix) => joined.startsWith(prefix))) process.exit(1);

const output = (state.outputs ?? []).find(([substring]) => joined.includes(substring));
if (output) {
  process.stdout.write(output[1] + "\n");
  process.exit(0);
}

const running = state.running ?? [];
switch (argv[0]) {
  case "ps": {
    const names = argv.includes("-a") ? [...new Set([...running, ...Object.keys(state.env ?? {})])] : running;
    if (names.length) process.stdout.write(names.join("\n") + "\n");
    break;
  }
  case "inspect": {
    const name = argv.find((a, i) => i > 0 && !a.startsWith("-") && argv[i - 1] !== "--format" && argv[i - 1] !== "-f");
    if (!running.includes(name) && !(state.env ?? {})[name]) process.exit(1);
    process.stdout.write(((state.env ?? {})[name] ?? []).join("\n") + "\n");
    break;
  }
  case "restart": {
    const name = argv[argv.length - 1];
    if (!running.includes(name)) process.exit(1);
    const password = ((state.env ?? {})[name] ?? []).find((e) => e.startsWith("POSTGRES_PASSWORD="));
    if (state.psql?.[name] && password) {
      state.psql[name] = [password.slice("POSTGRES_PASSWORD=".length)];
      fs.writeFileSync(statePath, JSON.stringify(state));
    }
    break;
  }
  case "exec": {
    const container = argv.slice(1).find((a, i, rest) => !a.startsWith("-") && rest[i - 1] !== "-e" && rest[i - 1] !== "-u");
    if (!running.includes(container)) process.exit(1);
    if (argv.includes("psql") && state.psql?.[container] && env.PGPASSWORD !== undefined) {
      process.exit(state.psql[container].includes(env.PGPASSWORD) ? 0 : 2);
    }
    const script = argv[argv.length - 1];
    const write = /^cat > '([^']+)'$/.exec(script);
    const read = /^cat '([^']+)'$/.exec(script);
    if (write) {
      state.files = { ...(state.files ?? {}), [write[1]]: fs.readFileSync(0, "utf8") };
      fs.writeFileSync(statePath, JSON.stringify(state));
    } else if (read) {
      if (!(read[1] in (state.files ?? {}))) process.exit(1);
      process.stdout.write(state.files[read[1]]);
    }
    break;
  }
}
process.exit(0);
