import { test, expect } from "@playwright/test";

test.describe("GraphQL API — as-admin", () => {
  test("readCurrent returns the admin user's email", async ({ request }) => {
    const response = await request.post("/graphql", {
      data: {
        query: `query {
          readCurrent {
            email
            role
          }
        }`,
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(response.ok()).toBe(true);
    const body = await response.json() as {
      data?: { readCurrent?: { email: string; role: string } };
    };
    expect(body.data?.readCurrent?.email).toBe("test-admin@skeleton.local");
    expect(body.data?.readCurrent?.role).toBe("admin");
  });

  test("admin-only query (readLogs) succeeds for admin user", async ({ request }) => {
    const response = await request.post("/graphql", {
      data: {
        query: `query {
          readLogs { id }
        }`,
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(response.ok()).toBe(true);
    const body = await response.json() as {
      errors?: Array<{ message: string }>;
      data?: { readLogs?: unknown };
    };
    expect(body.errors).toBeUndefined();
    expect(body.data?.readLogs).toBeDefined();
  });
});
