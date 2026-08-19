import { test as setup, expect } from "@playwright/test";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const authDir = path.join(__dirname, "../.auth");

const TEST_USERS = [
  {
    email: "test-user@skeleton.local",
    password: "TestUser1!",
    stateFile: path.join(authDir, "user.json"),
    role: null,
  },
  {
    email: "test-admin@skeleton.local",
    password: "TestAdmin1!",
    stateFile: path.join(authDir, "admin.json"),
    role: "admin",
  },
];

for (const user of TEST_USERS) {
  setup(`authenticate as ${user.email}`, async ({ page, context }) => {
    fs.mkdirSync(authDir, { recursive: true });

    // Auth.js v5 requires a CSRF token for OAuth provider initiation.
    // GET /authjs/signin/keycloak → 302 to /authjs/error?error=Configuration
    // POST without CSRF cookie → 302 to /authjs/signin?error=MissingCSRF
    // Correct flow: GET /authjs/csrf (sets the CSRF cookie + returns token),
    // then POST /authjs/signin/keycloak with the token. page.goto sets the
    // cookie into the browser context; the subsequent form POST carries it.
    await page.goto("/authjs/csrf");
    const csrfData = JSON.parse(await page.locator("body").innerText()) as { csrfToken: string };
    const csrfToken = csrfData.csrfToken;

    // POST the signin form from within the page so the CSRF cookie is sent.
    await page.evaluate(
      ({ token }) => {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "/authjs/signin/keycloak";
        const t = document.createElement("input");
        t.type = "hidden"; t.name = "csrfToken"; t.value = token;
        const cb = document.createElement("input");
        cb.type = "hidden"; cb.name = "callbackUrl"; cb.value = "/";
        form.append(t, cb);
        document.body.appendChild(form);
        form.submit();
      },
      { token: csrfToken },
    );

    // Wait for the Keycloak login page (URL will contain /auth/sso/realms/)
    await page.waitForURL(/\/auth\/sso\/realms\//, { timeout: 30000 });

    await page.locator("#username").fill(user.email);
    await page.locator("#password").fill(user.password);
    await page.locator("[type=submit]").click();

    // Wait for redirect back to the app
    await page.waitForURL((url) => !url.toString().includes("/auth/sso/"), { timeout: 30000 });

    // Confirm a successful app page load (not an error page)
    await expect(page).not.toHaveURL(/error/i);

    await context.storageState({ path: user.stateFile });

    // Elevate role using the repo's management script
    if (user.role) {
      console.log(`  [auth.setup] Elevating ${user.email} to role: ${user.role}`);
      const isWindows = process.platform === "win32";
      const cmd = isWindows
        ? `powershell -ExecutionPolicy Bypass -File "${path.join(repoRoot, "update-user-role.ps1")}" "${user.email}" "${user.role}"`
        : `bash "${path.join(repoRoot, "update-user-role.sh")}" "${user.email}" "${user.role}"`;
      execSync(cmd, { cwd: repoRoot, stdio: "pipe" });
    }
  });
}
