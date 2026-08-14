import { test, expect } from "@playwright/test";

test.describe("UI — as-user", () => {
  test("main page loads without server errors or JS console errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    const response = await page.goto("/", { waitUntil: "networkidle" });

    expect(response?.status(), "HTTP error on main page").toBeLessThan(500);
    expect(consoleErrors, `Console errors: ${consoleErrors.join(" | ")}`).toHaveLength(0);
  });

  test("navigation links for user-visible routes are present", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Routes with display:true and no scope restriction or scope:'user' should be in the nav
    await expect(page.getByRole("link", { name: /about/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /demo/i })).toBeVisible();
  });

  test("About page loads successfully", async ({ page }) => {
    const response = await page.goto("/about");
    expect(response?.status()).toBeLessThan(500);
    await expect(page).not.toHaveURL(/error/i);
  });

  test("Demo page loads successfully", async ({ page }) => {
    const response = await page.goto("/demo");
    expect(response?.status()).toBeLessThan(500);
    await expect(page).not.toHaveURL(/error/i);
  });

  test("admin routes are not accessible to regular user", async ({ page }) => {
    await page.goto("/users");
    // Should redirect to access denied or sign-in, not render the page
    const url = page.url();
    const denied = url.includes("denied") || url.includes("signin") || url.includes("login");
    expect(denied, `Expected redirect away from /users but got: ${url}`).toBe(true);
  });

  test("signed-in user identity is shown in the UI", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // The user's email should appear somewhere on the page (profile menu, avatar, etc.)
    const emailVisible = await page.getByText("test-user@skeleton.local").isVisible();
    expect(emailVisible, "Expected signed-in user's email to be visible").toBe(true);
  });
});
