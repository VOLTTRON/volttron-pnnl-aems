import { test, expect } from "@playwright/test";

const hostname = process.env.APP_HOSTNAME!;

test.describe("Smoke", () => {
  test("root path returns HTTP 200 with HTML body", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    const body = await page.content();
    expect(body).toContain("<html");
  });

  test("security headers are present", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers() ?? {};

    expect(headers["strict-transport-security"], "Missing HSTS header").toBeTruthy();
    expect(
      headers["x-frame-options"]?.toUpperCase(),
      "X-Frame-Options should be DENY",
    ).toContain("DENY");
    expect(headers["x-content-type-options"], "Missing X-Content-Type-Options header").toBeTruthy();
  });

  test("no JS console errors on initial page load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/", { waitUntil: "networkidle" });
    expect(errors, `Console errors: ${errors.join(" | ")}`).toHaveLength(0);
  });

  test("sign-in page loads without server error", async ({ request }) => {
    const response = await request.get("/authjs/signin");
    expect(response.status()).toBeLessThan(500);
  });

  test("Keycloak OIDC discovery endpoint is reachable", async ({ request }) => {
    const response = await request.get(
      "/auth/sso/realms/default/.well-known/openid-configuration",
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("issuer");
    expect(body).toHaveProperty("authorization_endpoint");
  });

  test("GraphQL endpoint responds to introspection probe", async ({ request }) => {
    const response = await request.post("/graphql", {
      data: { query: "{ __typename }" },
      headers: { "Content-Type": "application/json" },
    });
    // Unauthenticated GraphQL probe — expect either 200 with auth error or 401
    expect(response.status()).toBeLessThan(500);
  });
});
