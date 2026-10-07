import { test, expect } from "@playwright/test";
import { psql } from "./support/stack";

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
    expect(body.data?.readCurrent?.role).toBe("admin,keycloak");
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

  // scenario: edit-marks-every-unit
  test("a setpoint saved through the API marks every unit using its configuration for a push; its stage alone marks none", async ({ request }) => {
    const sql = (query: string) => psql("database", "aems", query);
    const configuration = sql(`SELECT u."configurationId" FROM "Unit" u JOIN "Configuration" c ON c.id = u."configurationId" WHERE c."setpointId" IS NOT NULL LIMIT 1`);
    expect(configuration, "the stack has a unit with a configuration and a setpoint").not.toBe("");
    const setpoint = sql(`SELECT "setpointId" FROM "Configuration" WHERE id = '${configuration}'`);
    // Complete, so the push loop leaves them alone and only a mark can write them again.
    const settle = () =>
      sql(`UPDATE "Unit" SET stage = 'Complete', "updatedAt" = now() - interval '1 day' WHERE "configurationId" = '${configuration}'`);
    const unmarked = () =>
      Number(sql(`SELECT count(*) FROM "Unit" WHERE "configurationId" = '${configuration}' AND "updatedAt" < now() - interval '1 hour'`));
    const units = Number(sql(`SELECT count(*) FROM "Unit" WHERE "configurationId" = '${configuration}'`));
    const save = async (update: string) => {
      const response = await request.post("/graphql", {
        data: { query: `mutation { updateSetpoint(where: { id: "${setpoint}" }, update: { ${update} }) { id } }` },
        headers: { "Content-Type": "application/json" },
      });
      const body = (await response.json()) as { errors?: { message: string }[] };
      expect(body.errors).toBeUndefined();
    };

    settle();
    await save(`stage: Complete`);
    expect(unmarked()).toBe(units);

    settle();
    await save(`label: "marked ${Date.now()}"`);
    expect(unmarked()).toBe(0);
  });
});
