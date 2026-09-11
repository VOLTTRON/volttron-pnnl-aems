# Develop: outdoor-temperature dashboard fixes

Plan: `C:\Users\d3x573\.claude\plans\the-site-dashboard-shows-iterative-swing.md` (approved 2026-08-27).

No matching design doc in `docs/proposed/` — proceeding without one, decisions documented inline in the plan file.

## Scope

1. Server: add parameterized `historianSiteAggregateUnit` GraphQL query (2-level SQL aggregation) — enables site median.
2. Client SiteDashboard: filter no-data RTU sensors from the "Outdoor Temperature" chart; add a "Site Median" series when ≥2 RTU sensors are reporting.
3. Client UnitDashboard: source outdoor temp in priority order (own RTU → site median → weather station); make the gauge heading + chart series name describe the active source; humanize all raw `PascalCase` chart series names.

## Layer log

### 2026-08-27 10:54 — Prisma layer
Skipped — no schema changes needed. Existing `MetricAggregation.Median` enum and topic-lookup infrastructure sufficed.

### 2026-08-27 10:54 — Common layer
Skipped — no shared type changes needed.

### 2026-08-27 10:54 — Server layer — PASS
- Added `getSiteAggregateUnit` method in `server/src/historian/historian.service.ts` — two-level SQL (`WITH per_topic AS ...` → cross-topic aggregation per bucket). Accepts optional `bucketAggregation`, required `crossSystemAggregation`, optional `excludeSystem`, optional `interval`.
- Added `historianSiteAggregateUnit` Pothos field in `server/src/graphql/historian/query.service.ts`. Auth-scoped `user: true`, uses `filterHistorianAccess` for per-system permission filtering. Returns `HistorianTimeSeries` (same shape as `historianUnitTimeSeries`).
- Ran `yarn compile:schema` in `server/` — regenerated `server/schema.graphql` and `client/schema.graphql` (Pothos driver writes both).
- Ran `yarn check` in `server/` — PASS.

### 2026-08-27 10:59 — Client layer — PASS
- Added `HistorianSiteAggregateUnit` operation to `client/src/queries/historian.graphql`.
- Ran `yarn compile:graphql` — `HistorianSiteAggregateUnitDocument` and query/variables types generated.
- **SiteDashboard** (`client/src/app/dashboards/components/SiteDashboard.tsx`):
  - Filter `outdoorTempData?.historianMultiSystemUnit` to systems with non-null values before rendering. Sensors with no data no longer appear in the chart or legend.
  - Added new `HistorianSiteAggregateUnitDocument` query, skipped unless ≥2 RTU sensors are reporting. Renders as a dashed thicker "Site Median" line series in the "Outdoor Temperature" chart when applicable.
- **UnitDashboard** (`client/src/app/dashboards/components/UnitDashboard.tsx`):
  - Added `HistorianUnitTimeSeriesDocument` query for the RTU's own `UnitMetric.OutdoorAirTemperature`.
  - Added `ReadUnitsInfoDocument` query for sibling systems on the same `campus/building`.
  - Added `HistorianSiteAggregateUnitDocument` query with `crossSystemAggregation: Median` and `excludeSystem: <this system>`.
  - New `outdoorTempSource` memo picks the best source in priority order: RTU own → site median → weather station. Carries `{ source, label, data, metadata }`.
  - Gauge heading (`<h4>`) and chart series `name:` now use `outdoorTempSource.label` — labels: "Outdoor Air Temperature", "Site Median Outdoor Air Temperature", "Weather Station Air Temperature".
  - `outdoorTempValue` reads from `outdoorTempSource.data` and walks backward for the last non-null value.
  - Humanized every raw `PascalCase` series `name:` in the chart legend — "Occupancy Command", "Supply Fan Status", "First Stage Heating", "Cooling Stage", "Zone Temperature", "Occupied Heating Setpoint", "Occupied Cooling Setpoint", "Unoccupied Heating Setpoint", "Unoccupied Cooling Setpoint", "Zone Humidity".
- Ran `yarn check` in `client/` — PASS.

### 2026-08-27 11:03 — Final workspace typecheck — PASS
- `yarn check` in `prisma/` — PASS (exit 0).
- `yarn check` in `common/` — PASS (exit 0).
- `yarn check` in `server/` — PASS (exit 0).
- `yarn check` in `client/` — PASS (exit 0).

## End-to-end verification (manual)

Not yet exercised against a running stack. To verify:
1. `docker compose up -d` from repo root.
2. `cd aems-app/client && yarn dev`.
3. Visit `https://<hostname>:3000/dashboards/<campus>/<building>/site` — confirm the Outdoor Temperature chart hides RTUs with no data and shows a dashed "Site Median" line when ≥2 RTUs are reporting.
4. Visit `.../dashboards/<campus>/<building>/<system>` — confirm the outdoor-temp gauge heading and chart legend describe the active source (own RTU / site median / weather station), and that the chart legend uses spaced human labels.
