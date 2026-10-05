import { test, expect } from "@playwright/test";
import { hostname } from "./support/stack";

// scenario: ext-checks-roles-first
test("the deployed /ext/ refuses an anonymous caller before forwarding anywhere", async ({ request }) => {
  // None of the map, nom and wiki profiles runs here, so a forwarded request would answer 502.
  for (const p of ["/ext/map/", "/ext/nominatim/status", "/ext/wiki/"]) {
    const response = await request.get(p, { maxRedirects: 0 });
    expect(response.status(), p).toBe(302);
    expect(response.headers()["location"], p).toBe(`https://${hostname}`);
  }
});
