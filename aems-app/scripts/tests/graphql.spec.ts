import { test, expect } from "@playwright/test";

test.describe("GraphQL API — as-user", () => {
  test("__typename probe returns Query", async ({ request }) => {
    const response = await request.post("/graphql", {
      data: { query: "{ __typename }" },
      headers: { "Content-Type": "application/json" },
    });
    expect(response.ok()).toBe(true);
    const body = await response.json() as { data?: { __typename?: string } };
    expect(body.data?.__typename).toBe("Query");
  });

  test("readCurrent returns the signed-in user's email", async ({ request }) => {
    const response = await request.post("/graphql", {
      data: {
        query: `query {
          readCurrent {
            id
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
    expect(body.data?.readCurrent?.email).toBe("test-user@skeleton.local");
  });

  test("admin-only query (readLogs) is rejected for regular user", async ({ request }) => {
    const response = await request.post("/graphql", {
      data: {
        query: `query {
          readLogs { id }
        }`,
      },
      headers: { "Content-Type": "application/json" },
    });
    // Pothos scope-auth returns a GraphQL-level error, not an HTTP error
    expect(response.ok()).toBe(true);
    const body = await response.json() as {
      errors?: Array<{ message: string }>;
      data?: unknown;
    };
    expect(body.errors).toBeDefined();
    expect(body.errors!.length).toBeGreaterThan(0);
  });
});

