import { test, expect } from "@playwright/test";

test.describe("Authentication — unauthenticated", () => {
  test("unauthenticated visit to protected route redirects to sign-in", async ({ page }) => {
    await page.goto("/");
    // The app redirects unauthenticated users to the sign-in page
    await page.waitForURL(/\/(authjs\/signin|auth\/)/);
    expect(page.url()).toMatch(/\/(authjs\/signin|auth\/)/);
  });

  test("sign-in page offers Keycloak login option", async ({ page }) => {
    await page.goto("/authjs/signin");
    // There should be a link or button that initiates Keycloak OAuth
    const keycloakLink = page.getByRole("link", { name: /keycloak/i }).or(
      page.getByRole("button", { name: /keycloak/i }),
    );
    await expect(keycloakLink).toBeVisible();
  });

  test("clicking Keycloak sign-in redirects to Keycloak login page", async ({ page }) => {
    await page.goto("/authjs/signin/keycloak");
    await page.waitForURL(/\/auth\/sso\/realms\//);
    expect(page.url()).toContain("/auth/sso/realms/");
  });

  test("invalid Keycloak credentials show an error and do not redirect to the app", async ({
    page,
  }) => {
    await page.goto("/authjs/signin/keycloak");
    await page.waitForURL(/\/auth\/sso\/realms\//);

    await page.locator("#username").fill("notauser@skeleton.local");
    await page.locator("#password").fill("WrongPassword1!");
    await page.locator("[type=submit]").click();

    // Should stay on the Keycloak page with an error message
    await expect(page).toHaveURL(/\/auth\/sso\/realms\//);
    // Keycloak renders an error message in .alert-error or #input-error
    const errorVisible =
      (await page.locator(".alert-error").isVisible()) ||
      (await page.locator("#input-error").isVisible()) ||
      (await page.locator("[class*=error]").first().isVisible());
    expect(errorVisible, "Expected an error message on invalid login").toBe(true);
  });
});

test.describe("Authentication — authenticated user", () => {
  test("authenticated user reaches the app without being redirected to sign-in", async ({
    page,
  }) => {
    await page.goto("/");
    // Should NOT redirect to sign-in when session is valid
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).not.toMatch(/\/(authjs\/signin|auth\/login)/);
  });

  test("sign out clears the session and redirects to sign-in", async ({ page, context }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Trigger sign-out via the API route Auth.js uses
    await page.goto("/auth/logout");
    await page.waitForLoadState("domcontentloaded");

    // Open a fresh page in the same context — session should be gone
    const freshPage = await context.newPage();
    await freshPage.goto("/");
    await freshPage.waitForURL(/\/(authjs\/signin|auth\/)/);
    expect(freshPage.url()).toMatch(/\/(authjs\/signin|auth\/)/);
    await freshPage.close();
  });
});
