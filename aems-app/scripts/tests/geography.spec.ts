import { test, expect } from "@playwright/test";
import { psql } from "./support/stack";

const square = (x: number, y: number, d: number) => ({
  type: "Polygon",
  coordinates: [[[x, y], [x + d, y], [x + d, y + d], [x, y + d], [x, y]]],
});

// scenario: geography-raw-sql
test("a geography is written as a PostGIS type in SQL and read back through raw SQL", async ({ request }) => {
  const id = `geo-test-${Date.now()}`;
  // Far from anything seeded, so the area query can only find this row.
  const shape = square(-170.5, -80.5, 0.01);
  const feature = JSON.stringify({ type: "Feature", properties: {}, geometry: shape });
  try {
    psql(
      "database",
      "aems",
      `INSERT INTO "Geography" (id, name, "group", type, geojson, "updatedAt") VALUES ('${id}', '${id}', 'test', 'test', '${feature}', now())`,
    );
    // Written: the column is a PostGIS geography, filled from the GeoJSON in SQL, not by the app.
    expect(psql("database", "aems", `SELECT pg_typeof(geometry)::text, ST_Area(geometry) > 0 FROM "Geography" WHERE id = '${id}'`)).toBe(
      "geography|t",
    );

    const query = `query ($area: GeographyGeoJson!) { areaGeographies(area: $area) { id name } }`;
    const read = async (area: object) => {
      const response = await request.post("/graphql", { data: { query, variables: { area } } });
      expect(response.ok()).toBe(true);
      const body = (await response.json()) as { data?: { areaGeographies?: { id: string }[] }; errors?: unknown };
      expect(body.errors).toBeUndefined();
      return (body.data?.areaGeographies ?? []).map((g) => g.id);
    };
    expect(await read({ type: "Point", coordinates: [-170.495, -80.495] })).toEqual([id]);
    expect(await read({ type: "Point", coordinates: [-170.4, -80.4] })).not.toContain(id);
  } finally {
    psql("database", "aems", `DELETE FROM "Geography" WHERE id = '${id}'`);
  }
});
