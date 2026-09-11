# Zone Comfort Chart — Title + Deployment-Wide Threshold Padding

Rename the site dashboard's "Occupancy Setpoint Error" chart to "Zone Comfort" and add a deployment-wide `HISTORIAN_SETPOINT_ERROR_THRESHOLD_PADDING` env var that widens each comfort bin's boundaries symmetrically (default 0 = current behavior). No Prisma or common changes — server config exposed via existing `readConfig` GraphQL pipeline.

Plan: `C:\Users\d3x573\.claude\plans\the-setpoint-error-chart-dynamic-sun.md`

## Progress

- 20260901-082558 — Progress log started. Plan approved.
- 20260901-083100 — Server layer complete. Added `historian.binning.setpointErrorThresholdPadding: number` field to [aems-app/server/src/app.config.ts](aems-app/server/src/app.config.ts) (typed and populated from `HISTORIAN_SETPOINT_ERROR_THRESHOLD_PADDING` via `parseFloat`, default `0`). Exposed on `ServerConfig` GraphQL object at [aems-app/server/src/graphql/config/query.service.ts](aems-app/server/src/graphql/config/query.service.ts). Extended [query.service.test.ts](aems-app/server/src/graphql/config/query.service.test.ts) with the new field. `yarn compile:schema` regenerated [aems-app/server/schema.graphql](aems-app/server/schema.graphql) — `type ServerConfig` now includes `setpointErrorThresholdPadding: Float`. `yarn check` server: pass. `yarn test` on the config query test: 3/3 pass.
- 20260901-083400 — Client layer complete. Added `setpointErrorThresholdPadding` to [aems-app/client/src/queries/config.graphql](aems-app/client/src/queries/config.graphql). `yarn compile:graphql` regenerated Apollo hooks — `ReadConfigQuery` now types the new field. In [aems-app/client/src/app/dashboards/components/SiteDashboard.tsx](aems-app/client/src/app/dashboards/components/SiteDashboard.tsx): (1) imported `ConfigContext` from providers, (2) read `setpointErrorPadding = config?.setpointErrorThresholdPadding ?? 0` alongside preferences and current, (3) chart title changed from "Occupancy Setpoint Error" to "Zone Comfort", (4) replaced the 6-branch if-chain classifier with an `abs`+sign-branch version that uses precomputed `optimalThreshold`/`slightThreshold`/`outerThreshold` boundaries — worst case 2 comparisons + 1 abs per point (down from 3–6 comparisons today). Padding widens Optimal symmetrically (`|error| ≤ padding`) and pushes each outer boundary outward equally. Updated block comment. `yarn check` client: pass.
- 20260901-083700 — Env layer complete. Added `HISTORIAN_SETPOINT_ERROR_THRESHOLD_PADDING=0` to root [aems-app/.env](aems-app/.env), local-dev [aems-app/server/.env](aems-app/server/.env), and docker pass-through [aems-app/docker/.env.server](aems-app/docker/.env.server).
- 20260901-083900 — Final full check pass: prisma / common / server / client all pass `yarn check` clean.

## Result

Implementation complete. All layers pass type check; config query test passes with the new field. Ready for manual verification in a running stack (see plan's Verification section).

## Out of scope (noted for follow-up)

- Grafana dashboards (`aems-app/docker/grafana/dashboard-site.json`, `aems-edge/configurations/grafana/site_overview.json`) still title their panel "Occupancy Setpoint Error". Not part of this scope.
