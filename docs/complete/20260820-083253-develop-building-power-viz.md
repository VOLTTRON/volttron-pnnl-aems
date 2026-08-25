# Develop — Building Power Dashboard Visualization Overhaul

## Summary

Rework the Building Power chart on Site and Unit dashboards:
1. Display in **kW** instead of "W" (values are already kW; only the label is wrong).
2. Keep raw historian cadence for ranges up to 7 days via a per-call binning override.
3. Add 15m and 30m rolling-average overlays for raw-mode ranges.
4. Add min-max range and boxplot visualizations for binned ranges (extend server aggregations with Q1/Q3).
5. Extract to a shared `<BuildingPowerChart>` component used by both dashboards, with a Blueprint `SegmentedControl` toggle inside the card.

Plan reference: `C:\Users\d3x573\.claude\plans\these-are-changes-to-joyful-yao.md`.

## Design doc

None. No matching file under `docs/proposed/` — proceeding without one, decisions captured in the plan file above.

## Deploy-time note

Deployments that override `HISTORIAN_CONFIG_MAPPING_PATH` will also need to change `"suffix": " W"` → `"suffix": " kW"` for the `Power` entry in their custom topic map, matching the default change here.

## Progress

### 2026-08-20 08:35 — Prisma layer ✅

- Edited [prisma/src/types/historian.ts](aems-app/prisma/src/types/historian.ts): added `Q1` and `Q3` to `MetricAggregation` enum with updated doc comment; added new `HistorianAggregationSeries` interface and optional `aggregations?: HistorianAggregationSeries[]` field on `HistorianTimeSeries`.
- `yarn build` in prisma/ passed (Prisma Client + JSON Types + Pothos integration regenerated).
- `yarn check` passed.

### 2026-08-20 08:47 — Server layer ✅

- Display fix (kW): [metrics.ts:380](aems-app/server/src/historian/metrics.ts#L380) suffix `" W"` → `" kW"` for `MeterMetric.Power`; [metrics.ts:498](aems-app/server/src/historian/metrics.ts#L498) info `unit: "W"` → `"kW"`; [historian-topic-map.default.json:47](aems-app/server/config/historian-topic-map.default.json#L47) `"suffix": " kW"`. Only `Power` changed — `Demand` untouched to match user scope.
- `aggregationSql` [metrics.ts](aems-app/server/src/historian/metrics.ts): added `Q1` → `percentile_cont(0.25)` and `Q3` → `percentile_cont(0.75)` cases.
- `resolveBucketing` [historian.service.ts:1738](aems-app/server/src/historian/historian.service.ts#L1738): added optional `rawThresholdOverride` param that reuses `parseClientInterval` to override the config binning threshold when set.
- `getMeterTimeSeries` [historian.service.ts:756](aems-app/server/src/historian/historian.service.ts#L756): added `opts?: { rawThreshold?; aggregations?: MetricAggregation[] }`. When binned with extra aggregations, the SELECT gains one `agg_${i}` column per requested aggregation; response includes a new `aggregations` list. Raw mode ignores requested aggregations.
- Pothos [object.service.ts](aems-app/server/src/graphql/historian/object.service.ts): registered the shared `MetricAggregation` enum.
- Pothos [query.service.ts:305](aems-app/server/src/graphql/historian/query.service.ts#L305): added `rawThreshold: String` and `aggregations: [MetricAggregation!]` args to `historianMeterTimeSeries`, forwarded to the service.
- `yarn build` in common/, `yarn check` in server/, `yarn compile:schema` all passed. `schema.graphql` diff purely additive.

### 2026-08-20 09:15 — Client layer ✅

- GraphQL op: [client/src/queries/historian.graphql](aems-app/client/src/queries/historian.graphql) `HistorianMeterTimeSeries` gained optional `rawThreshold: String` and `aggregations: [MetricAggregation!]` variables. `yarn compile:graphql` regenerated Apollo hooks.
- Rolling-average util: [client/src/utils/rollingAverage.ts](aems-app/client/src/utils/rollingAverage.ts) — pure two-pointer trailing window over time-ordered points, emits null when fewer than 2 non-null samples in the window. Colocated Jest tests pass (6/6).
- New shared component: [client/src/app/dashboards/components/BuildingPowerChart.tsx](aems-app/client/src/app/dashboards/components/BuildingPowerChart.tsx) + `.module.scss`. Owns its own query with `rawThreshold: "7d"` unconditionally. Blueprint `SegmentedControl` in the card header switches viz mode: raw-mode options `Raw / +15m / +30m / All` control which rolling overlays render; binned-mode options `Line / Range / Boxplot` also drive which server aggregations the query requests (`[Min, Max]` for range, `[Min, Q1, Median, Q3, Max]` for boxplot). Boxplot uses ECharts `type: "boxplot"` with `[timestamp, min, q1, median, q3, max]` rows.
- Dashboards refactored to use the shared component:
  - [SiteDashboard.tsx](aems-app/client/src/app/dashboards/components/SiteDashboard.tsx): replaced the inline power `<Card>...<ECharts>` block; removed the outer power `useQuery` (component owns it) and the corresponding entry in the top-level `pickBinningInfo` list; dropped now-unused `HistorianMeterTimeSeriesDocument` and `MeterMetric` imports.
  - [UnitDashboard.tsx](aems-app/client/src/app/dashboards/components/UnitDashboard.tsx): same treatment.
- `yarn check` passed in client/; `yarn lint` clean; `yarn test rollingAverage` 6/6 pass.

### 2026-08-20 09:30 — Final check ✅

Ran `yarn check` in prisma/ → common/ → server/ → client/. All exit 0.

