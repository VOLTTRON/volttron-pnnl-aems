import { test, expect, Page } from "@playwright/test";

// Where the app sends a visitor with no session: its welcome page, or Auth.js sign-in.
const SIGNED_OUT = /\/(welcome|authjs\/signin|auth\/)/;

// Auth.js v5 starts an OAuth sign-in only from a POST carrying the CSRF token; a GET on
// /authjs/signin/keycloak is an unknown action.
async function startKeycloakSignIn(page: Page) {
  await page.goto("/authjs/csrf");
  const { csrfToken } = JSON.parse(await page.locator("body").innerText()) as { csrfToken: string };
  await page.evaluate((token) => {
    const form = Object.assign(document.createElement("form"), { method: "POST", action: "/authjs/signin/keycloak" });
    for (const [name, value] of [["csrfToken", token], ["callbackUrl", "/"]]) {
      form.append(Object.assign(document.createElement("input"), { type: "hidden", name, value }));
    }
    document.body.appendChild(form);
    form.submit();
  }, csrfToken);
  await page.waitForURL(/\/auth\/sso\/realms\//);
}

test.describe("Authentication — unauthenticated", () => {
  test.beforeEach(({}, info) => info.skip(info.project.name !== "unauthenticated", "needs no session"));

  test("unauthenticated visit to the app is sent away from it", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(SIGNED_OUT);
    expect(page.url()).toMatch(SIGNED_OUT);
  });

  // scenario: authjs-endpoints-answer
  test("/authjs/signin never answers 500 and /authjs/providers never 404 or 502", async ({ request }) => {
    const signin = await request.get("/authjs/signin", { maxRedirects: 0 });
    expect(signin.status()).toBeLessThan(500);
    const providers = await request.get("/authjs/providers", { maxRedirects: 0 });
    expect([404, 502]).not.toContain(providers.status());
    expect(providers.status()).toBe(200);
    expect(await providers.json()).toHaveProperty("keycloak");
  });

  test("sign-in page offers Keycloak login option", async ({ page }) => {
    await page.goto("/authjs/signin");
    // There should be a link or button that initiates Keycloak OAuth
    const keycloakLink = page.getByRole("link", { name: /keycloak/i }).or(
      page.getByRole("button", { name: /keycloak/i }),
    );
    await expect(keycloakLink).toBeVisible();
  });

  test("starting a Keycloak sign-in reaches the Keycloak login page", async ({ page }) => {
    await startKeycloakSignIn(page);
    expect(page.url()).toContain("/auth/sso/realms/");
  });

  test("invalid Keycloak credentials show an error and do not redirect to the app", async ({
    page,
  }) => {
    await startKeycloakSignIn(page);

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
  test.beforeEach(({}, info) => info.skip(info.project.name !== "as-user", "needs a session"));

  // scenario: session-cookie-attributes
  test("the session cookie is Secure and scoped to APP_HOSTNAME", async ({ context }) => {
    const session = (await context.cookies()).find((c) => /next-auth\.session-token$/.test(c.name));
    expect(session, "no Auth.js session cookie").toBeTruthy();
    expect(session!.secure).toBe(true);
    // A cookie set with a Domain attribute reads back with a leading dot; a host-only one without.
    expect(session!.domain).toBe(`.${process.env.APP_HOSTNAME}`);
  });

  test("authenticated user reaches the app without being redirected to sign-in", async ({
    page,
  }) => {
    await page.goto("/");
    // Should NOT redirect to sign-in when session is valid
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).not.toMatch(SIGNED_OUT);
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
    await freshPage.waitForURL(SIGNED_OUT);
    expect(freshPage.url()).toMatch(SIGNED_OUT);
    await freshPage.close();
  });
});
