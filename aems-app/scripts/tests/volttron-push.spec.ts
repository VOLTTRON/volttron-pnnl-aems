import { test, expect, type APIRequestContext } from "@playwright/test";
import { psql } from "./support/stack";
import { managerStore, pushed } from "./support/push";

const sql = (query: string) => psql("database", "aems", query);

async function mutate(request: APIRequestContext, mutation: string) {
  const response = await request.post("/graphql", {
    data: { query: `mutation { ${mutation} }` },
    headers: { "Content-Type": "application/json" },
  });
  const body = (await response.json()) as { errors?: { message: string }[] };
  expect(body.errors).toBeUndefined();
}

// scenario: push-reaches-platform
test("against the deployed platform, unmocked, with no RTU: a unit pushes to Fail with the platform's error and its setpoints in its agent's store, and a control pushes to Complete", async ({ request }) => {
  test.setTimeout(15 * 60_000);

  // A unit setup created from the platform's own configuration store, so its manager agent is deployed.
  const row = /^([^|]+)\|([^|]+)\|([^|]+)$/.exec(
    sql(
      `SELECT u.id || '|' || lower(u.system) || '|' || c."setpointId" FROM "Unit" u JOIN "Configuration" c ON c.id = u."configurationId" ` +
        `WHERE c."setpointId" IS NOT NULL AND u.system <> '' AND u.name NOT LIKE 'DEMO\\_%' ORDER BY u.name LIMIT 1`,
    ),
  );
  expect(row, "the stack has a unit with a system and a setpoint").not.toBeNull();
  const [, unit, system, setpoint] = row!;
  const control = sql(`SELECT id FROM "Control" WHERE name NOT LIKE 'DEMO\\_%' ORDER BY name LIMIT 1`);
  expect(control, "the stack has a control").toBeTruthy();

  // Distinctive, and inside the unit's heating and cooling bounds, so the agent accepts it.
  const occupied = 70 + (Date.now() % 9) / 4 + 0.25;
  await mutate(request, `updateSetpoint(where: { id: "${setpoint}" }, update: { setpoint: ${occupied} }) { id }`);
  // No RTU answers the agent's BACnet writes, so set_temperature_setpoints fails in VUI after the
  // agent has stored what it was sent.
  const failed = await pushed("Unit", unit, { expected: "Fail" });
  expect(failed.message, "the unit's Fail carries the platform's error").not.toMatch(/^(|Synchronizing with Volttron\.\.\.)$/);
  await expect
    .poll(() => (managerStore(system, "set_points") as { OccupiedSetPoint?: number } | undefined)?.OccupiedSetPoint, { timeout: 60_000 })
    .toBe(occupied);

  // Units push beside controls, and each unit call holds the platform up to VUI's 5 s wait, so a
  // control pushed while units marked by earlier specs are still pushing can time out at 500.
  await expect
    .poll(() => sql(`SELECT count(*) FROM "Unit" WHERE stage IN ('Update', 'Process') AND name NOT LIKE 'DEMO\\_%'`), {
      message: "units still pushing",
      timeout: 5 * 60_000,
      intervals: [2_000],
    })
    .toBe("0");
  await mutate(request, `updateControl(where: { id: "${control}" }, update: { label: "pushed ${Date.now()}" }) { id }`);
  await pushed("Control", control);
});
