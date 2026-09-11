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
