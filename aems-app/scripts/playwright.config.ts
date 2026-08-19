import { defineConfig, devices } from "@playwright/test";

const hostname = process.env.APP_HOSTNAME;
if (!hostname) {
  throw new Error("APP_HOSTNAME environment variable is required");
}

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["html"], ["line"]],
  globalSetup: "./tests/global-setup.ts",
  globalTeardown: "./tests/global-teardown.ts",
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
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "unauthenticated",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /\.(smoke|auth)\.spec\.ts/,
    },
    {
      name: "as-user",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/user.json",
      },
      dependencies: ["setup"],
      testMatch: /\.(auth|graphql|ui)\.spec\.ts/,
    },
    {
      name: "as-admin",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/admin.json",
      },
      dependencies: ["setup"],
      testMatch: /graphql-admin\.spec\.ts/,
    },
  ],
});
