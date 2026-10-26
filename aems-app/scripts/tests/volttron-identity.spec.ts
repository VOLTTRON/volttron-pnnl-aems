import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { appDir, container, docker, inspect, readEnv, run } from "./support/stack";

const PLACEHOLDER = "SeT_tHiS_iN_0x3A-.env.secrets-";

// scenario: volttron-password-sentinel
test("tracked .env holds the sentinel for VOLTTRON_PASSWORD, and the platform accepts the live value at /authenticate", () => {
  test.setTimeout(2 * 60_000);

  const tracked = run("git", ["show", "HEAD:aems-app/.env"]);
  const trackedLine = tracked.split(/\r?\n/).find((l) => l.startsWith("VOLTTRON_PASSWORD="));
  expect(trackedLine, `tracked .env is missing VOLTTRON_PASSWORD`).toBeDefined();
  expect(trackedLine).toBe(`VOLTTRON_PASSWORD=${PLACEHOLDER}`);

  const password = readEnv("VOLTTRON_PASSWORD");
  const username = readEnv("VOLTTRON_USERNAME");
  expect(password, "VOLTTRON_PASSWORD must be set in the live .env").toBeTruthy();
  expect(username, "VOLTTRON_USERNAME must be set in the live .env").toBeTruthy();

  // VOLTTRON runs with network_mode: host, so its bind-web-address is reachable from inside
  // its own namespace on localhost. docker exec enters that namespace.
  const body = JSON.stringify({ username, password });
  const out = docker(
    "exec",
    container("volttron"),
    "sh",
    "-c",
    `curl -s -o - -w ' HTTP %{http_code}' http://localhost:5410/authenticate ` +
      `-X POST -H 'Content-Type: application/json' -d ${JSON.stringify(body)}`,
  );
  expect(out, out).toMatch(/ HTTP 200\s*$/);
  const payload = JSON.parse(out.replace(/ HTTP \d+\s*$/, "")) as { access_token?: unknown };
  expect(typeof payload.access_token, out).toBe("string");
});

// scenario: platform-reachable
test("from inside the services container, SERVICE_CONFIG_AUTH_URL and SERVICE_CONFIG_API_URL reach the deployed platform", async () => {
  test.setTimeout(12 * 60_000);

  // Run by the services container's own node, on its own SERVICE_CONFIG_*: neither the password nor
  // the token is in an argv, and only status codes come back out.
  const probe = `(async () => {
    const env = process.env;
    try {
      const auth = await fetch(env.SERVICE_CONFIG_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: env.SERVICE_CONFIG_USERNAME, password: env.SERVICE_CONFIG_PASSWORD }),
      });
      const token = (await auth.json().catch(() => ({}))).access_token;
      const base = env.SERVICE_CONFIG_API_URL.replace(/\\/gs\\/?$/, "");
      const api = typeof token === "string" ? (await fetch(base + "/vui", { headers: { Authorization: "Bearer " + token } })).status : 0;
      console.log(JSON.stringify({ auth: auth.status, token: typeof token === "string", api }));
    } catch (error) {
      console.log(JSON.stringify({ error: String(error.cause?.code ?? error.message) }));
    }
  })()`;
  const reach = () => JSON.parse(docker("exec", container("services"), "node", "-e", probe)) as { auth?: number; token?: boolean; api?: number; error?: string };

  // The platform installs its agents before its web service answers, so a cold stack is waited on.
  await expect.poll(() => reach().auth, { timeout: 10 * 60_000, intervals: [5_000] }).toBe(200);
  const reached = reach();
  expect(reached.token, JSON.stringify(reached)).toBe(true);
  // 2xx is the VUI API, 404 the /gs gateway: either is the platform answering at SERVICE_CONFIG_API_URL.
  expect(reached.api === 404 || (reached.api! >= 200 && reached.api! < 300), JSON.stringify(reached)).toBe(true);
});

// scenario: platform-identity-one-source
test("platform_config.yml and the services container both carry the live .env's VOLTTRON_PLATFORM, _USERNAME, _PASSWORD", () => {
  test.setTimeout(60_000);

  const platform = readEnv("VOLTTRON_PLATFORM");
  const username = readEnv("VOLTTRON_USERNAME");
  const password = readEnv("VOLTTRON_PASSWORD");
  expect(platform, "VOLTTRON_PLATFORM must be set in the live .env").toBeTruthy();
  expect(username).toBeTruthy();
  expect(password).toBeTruthy();

  // At least one of the three is non-default: the sentinel pipeline rotates VOLTTRON_PASSWORD
  // to a strong unique value, so a chain that silently fell back to the previous hardcoded
  // "admin" would fail the assertions below.
  const defaults = { VOLTTRON_PLATFORM: "volttron1", VOLTTRON_USERNAME: "admin", VOLTTRON_PASSWORD: "admin" };
  const live = { VOLTTRON_PLATFORM: platform, VOLTTRON_USERNAME: username, VOLTTRON_PASSWORD: password };
  expect(Object.entries(live).some(([k, v]) => v !== defaults[k as keyof typeof defaults]),
    `at least one VOLTTRON_* must be non-default to prove the chain reads from env: ${JSON.stringify(live)}`).toBe(true);

  // The services container is the server-side consumer of VOLTTRON_*: its SERVICE_CONFIG_* env
  // vars are rendered from VOLTTRON_* through .env.services at compose time.
  const servicesEnv = JSON.parse(inspect(container("services"), "{{json .Config.Env}}")) as string[];
  const envMap = Object.fromEntries(
    servicesEnv.map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
  );
  expect(envMap.SERVICE_CONFIG_PLATFORM, "services container platform").toBe(platform);
  expect(envMap.SERVICE_CONFIG_USERNAME, "services container username").toBe(username);
  expect(envMap.SERVICE_CONFIG_PASSWORD, "services container password").toBe(password);

  // The platform side is platform_config.yml, rendered by volttron-setup under
  // docker/volttron/setup/configs/ and bind-mounted into the volttron container as
  // /platform_config.yml. generate_configs.py renders instance-name from --platform and
  // web_users.{username,password} from --web-user-name/--web-user-password, which setup-volttron.sh
  // threads from VOLTTRON_PLATFORM/_USERNAME/_PASSWORD.
  const rendered = fs.readFileSync(path.join(appDir, "docker/volttron/setup/configs/platform_config.yml"), "utf8");
  const configBlock = rendered.match(/^config:\n((?:[ \t]+.+\n)+)/m)?.[1] ?? "";
  const webUsersBlock = rendered.match(/^web_users:\n((?:[ \t]+.+\n)+)/m)?.[1] ?? "";
  expect(configBlock, rendered).toMatch(new RegExp(`^\\s+instance-name:\\s+${platform}\\s*$`, "m"));
  expect(webUsersBlock, rendered).toMatch(new RegExp(`^\\s+username:\\s+${username}\\s*$`, "m"));
  expect(webUsersBlock, rendered).toMatch(new RegExp(`^\\s+password:\\s+${password}\\s*$`, "m"));
});
