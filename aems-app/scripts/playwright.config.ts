import { defineConfig, devices } from "@playwright/test";

// PLAYWRIGHT_SCRIPTS_ONLY=1 with --project scripts runs the script fixtures with no stack at all.
const scriptsOnly = process.env.PLAYWRIGHT_SCRIPTS_ONLY === "1";

const hostname = process.env.APP_HOSTNAME;
if (!hostname && !scriptsOnly) {
  throw new Error("APP_HOSTNAME environment variable is required");
}

// Matches tests/<name>.spec.ts for the listed names. The character before the name is a path
// separator, so it is matched explicitly; a leading `\.` there silently matches nothing.
const specs = (...names: string[]) => new RegExp(`(^|[\\\\/])(${names.join("|")})\\.spec\\.ts$`);

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["html"], ["line"]],
  ...(scriptsOnly ? {} : { globalSetup: "./tests/global-setup.ts", globalTeardown: "./tests/global-teardown.ts" }),
  use: {
    baseURL: `https://${hostname}`,
    // TLS cert trust is verified explicitly in smoke.spec.ts (EC-TLS check).
    // Playwright's bundled Chromium doesn't use the Windows system cert store,
    // so we allow self-signed certs here and rely on verify-browser.mjs +
    // the smoke spec to assert that the cert is trusted by a real browser.
    ignoreHTTPSErrors: true,
    trace: "on-first-retry",
  },
  projects: [
    {
      // Drives the repository's shell scripts in temp directories against a fake `docker`;
      // no browser and no live container.
      name: "scripts",
      testMatch: /\.script\.spec\.ts$/,
    },
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "unauthenticated",
      use: { ...devices["Desktop Chrome"] },
      testMatch: specs("smoke", "auth", "stack"),
    },
    {
      name: "as-user",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/user.json",
      },
      dependencies: ["setup"],
      testMatch: specs("auth", "graphql", "ui"),
    },
    {
      name: "as-admin",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/admin.json",
      },
      dependencies: ["setup"],
      testMatch: specs("graphql-admin"),
    },
    {
      // Restarts the stack, so it waits for everything that uses it.
      name: "reboot",
      dependencies: ["unauthenticated", "as-user", "as-admin"],
      testMatch: specs("reboot"),
    },
  ],
});
