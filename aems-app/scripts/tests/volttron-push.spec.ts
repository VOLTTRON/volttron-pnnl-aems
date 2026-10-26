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

// Parked on volttron-sync.md's Open line under its platform claim: on this stack every unit's
// set_temperature_setpoints times out in VUI while the agent retries writes to an RTU that is not
// there. It carries push-reaches-platform's mark once a unit's push can reach Complete.
test.fixme("against the deployed platform, unmocked, a unit pushes to Complete with its setpoints in its agent's store, and a control pushes to Complete", async ({ request }) => {
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
  await pushed("Unit", unit);
  await expect
    .poll(() => (managerStore(system, "set_points") as { OccupiedSetPoint?: number } | undefined)?.OccupiedSetPoint, { timeout: 60_000 })
    .toBe(occupied);

  await mutate(request, `updateControl(where: { id: "${control}" }, update: { label: "pushed ${Date.now()}" }) { id }`);
  await pushed("Control", control);
});
