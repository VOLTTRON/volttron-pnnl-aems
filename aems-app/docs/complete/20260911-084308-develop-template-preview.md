# Develop: Test, verify, and preview ILC configuration templates

Design plan: `C:\Users\d3x573\.claude\plans\i-need-a-plan-nested-star.md` (no design doc in `docs/proposed/` — plan was authored inline).

## Goal

- Refactor server template tests to load real on-disk files from `aems-edge/configurations/templates/`.
- Extract render loop from `ControlService` cron into a reusable method.
- Add `previewControlTemplates` GraphQL query.
- Add a new admin page under Admin → Templates (below Historian) that lets an admin pick any Unit and view/download the four rendered ILC config JSONs.

## Progress

### 20260911-084308 — Kickoff
- Plan approved. Todo list initialized. Progress log created.

### 20260911-085000 — Server tests refactored
- Extracted canonical fixture to [server/src/utils/template.fixtures.ts](../../server/src/utils/template.fixtures.ts).
- Rewrote [server/src/utils/template.test.ts](../../server/src/utils/template.test.ts) to `readFileSync` the real templates under [aems-edge/configurations/templates/](../../../aems-edge/configurations/templates/) and assert against the correct rendered outputs. Removed the drift where inline copies used `{meter}`, `config://control.config`, `setpointPeakOffset`, etc.
- All 11 tests pass against the on-disk templates.

### 20260911-085200 — Server render helper extracted
- Extracted the inline template render loop from [server/src/services/control/control.service.ts:88-97](../../server/src/services/control/control.service.ts#L88) into a new standalone utility at [server/src/utils/render-control-templates.ts](../../server/src/utils/render-control-templates.ts) — reusable from the cron and the GraphQL resolver, no DI plumbing needed.
- Cron `task()` calls the new utility.

### 20260911-085500 — Pothos query added
- Added `previewControlTemplates(where: ControlUniqueFilter!): Json` in [server/src/graphql/control/query.service.ts](../../server/src/graphql/control/query.service.ts). Admin-scoped. Injects `AppConfigService` for the template paths and calls the render utility against a hydrated `Control` (same `include` shape as the cron).
- Updated [server/src/graphql/control/query.service.test.ts](../../server/src/graphql/control/query.service.test.ts) to pass a mock config service and expect the new query key.
- `yarn compile:schema` — schema.graphql regenerated cleanly; the new field is present at line 2343.

### 20260911-085800 — Client GraphQL op + hooks
- Added `PreviewControlTemplates` query to [client/src/queries/control.graphql](../../client/src/queries/control.graphql).
- `yarn compile:graphql` — hooks regenerated. `PreviewControlTemplatesDocument` and `PreviewControlTemplatesQuery` present in [client/src/graphql-codegen/graphql.ts](../../client/src/graphql-codegen/graphql.ts).

### 20260911-085900 — Route + admin page
- Registered a new `templates` route in [client/src/app/routes.ts](../../client/src/app/routes.ts) immediately after `historian`, under the Admin nav, scoped `admin`.
- Built [client/src/app/templates/page.tsx](../../client/src/app/templates/page.tsx) + [page.module.scss](../../client/src/app/templates/page.module.scss). Uses `HTMLSelect` to pick a unit, resolves its `controlId`, fires `PreviewControlTemplatesQuery`, and renders four tabs (`config.json`, `control_config.json`, `criteria_config.json`, `pairwise_criteria.json`) each with **Copy** and **Download .json** buttons. Download uses the same `Blob + object URL + anchor click` pattern as the historian page.

### 20260911-090013 — Verification
- Full typecheck across all four workspaces: `yarn check` green in prisma, common, server, client.
- Server unit tests: 78 passing across template + control suites.

## Outcome

- Tests now load the real on-disk template files; future edits to any of the four ILC configuration templates will surface as test failures instead of silent divergence.
- ControlService cron and the new GraphQL resolver share the same `renderControlTemplates` utility.
- Admins can navigate to **Admin → Templates**, pick any unit, and view or download the exact ILC configuration JSON blobs (rendered against the unit's parent Control) that the ILC agent would receive over VOLTTRON RPC.

## Remaining verification (post-implementation)

- Bring up the stack (`docker compose up -d` from [aems-app/](../..)) and click through **Admin → Templates** in the browser as an admin. Confirm the four tabs render valid JSON matching a spot-check of the running ILC agent's config.

### 20260911-105200 — refresh-templates admin script
- Edited templates on the host don't reach the running server automatically. The templates are baked into the `volttron-setup` image at build time via `COPY . .` in [aems-edge/Dockerfile](../../../aems-edge/Dockerfile) and then dropped into the shared `./docker/volttron/setup/templates/` directory by [aems-edge/setup-volttron.sh:387-391](../../../aems-edge/setup-volttron.sh#L387-L391) when the setup container runs. Since `volttron-setup` is `restart: no` and completes once per compose lifecycle, host edits are invisible to the server until the image is rebuilt and the container reruns.
- Added [aems-app/refresh-templates.sh](../../refresh-templates.sh) + [aems-app/refresh-templates.ps1](../../refresh-templates.ps1) modeled on the existing `restart-service.*` / `reset-service.*` admin scripts. The scripts run `docker compose build volttron-setup` followed by `docker compose up -d --no-deps --force-recreate volttron-setup`, then poll the container until it exits successfully and list the refreshed `./docker/volttron/setup/templates/` contents so the admin can confirm the new state. Supports `-h/--help` and `-n/--dry-run`.
- No other services are stopped: `aems-server` picks up the new files on the next `previewControlTemplates` call via its read-only bind mount at `/app/volttron/`; `aems-services` picks them up on its next 10 s ILC cron tick. The `volttron` platform container mounts `./volttron/setup/configs/`, not `templates/`, so it doesn't need a restart.
- Documented the flow in [aems-app/docker/CLAUDE.md](../../docker/CLAUDE.md) under the "Workflow" bullets, and added a short pointer sentence to the Admin → Templates page description so admins know where the source files are and which script to run.

### 20260911-104200 — Per-file error context in renderControlTemplates
- Previously a bad JSON file or a bad `_type: ...` expression bubbled up to the admin page as a raw `SyntaxError`/expression error with no indication of *which* of the four template files caused it. Wrapped `JSON.parse` and `transformTemplate` in [server/src/utils/render-control-templates.ts](../../server/src/utils/render-control-templates.ts) so the thrown Error now names the failing file and the phase (parse vs render), e.g. `Failed to parse template file "config.json": Unexpected token } in JSON at position 42`.
- Apollo Server has no `formatError` masking configured (checked [server/src/graphql/builder.service.ts](../../server/src/graphql/builder.service.ts)), so the server message reaches the client verbatim. The client already renders `preview.error.message` in a `NonIdealState` on the templates page and toasts it via `onError` — no client changes needed.
- `yarn check` in server green.

### 20260911-103610 — Dropdown granularity: unit → building
- Templates render at the Control (building) level, not per-unit — the unit dropdown made the picker N×larger than the underlying rendered output. Switched the picker to a building granularity.
- Client changes:
  - [client/src/queries/control.graphql](../../client/src/queries/control.graphql): added `name`, `campus`, `building` to the `ReadControls` query selection.
  - [client/src/app/templates/page.tsx](../../client/src/app/templates/page.tsx): now queries `ReadControlsDocument` (ordered by `label`), derives a `BuildingOption` per Control from `Control.campus` / `Control.building` (falling back to `units[0]` if either is unset), and passes the selected `controlId` directly to `previewControlTemplates`. Removed the unit-picker + "unit has no control" callout; download filenames still use `${basename}-${campus}-${building}.json`.
- `yarn compile:graphql` + `yarn check` in client both green.
