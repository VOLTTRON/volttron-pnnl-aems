# Predictable & Suitable List Ordering

Ensure every client list uses predictable, suitable ordering. Server-side per-entity `orderBy` defaults + stable `{ id: "asc" }` tie-breaker; explicit `orderBy` on four auxiliary client call sites; fix the `readFiles` resolver's dropped args.

No design doc existed in `docs/proposed/` — plan captured at `C:\Users\d3x573\.claude\plans\check-that-the-client-steady-dawn.md`.

## Progress

### 2026-09-17 11:09 — Plan approved, work begins
- Plan approved by user with scope: server defaults + `id` tie-breaker + explicit `orderBy` on four auxiliary client queries.
- No prisma or common changes.
- Starting server layer.

### 2026-09-17 11:20 — Server layer complete
- Added `SchemaBuilderService.withOrderBy(arg, fallback)` static helper to [builder.service.ts](../../server/src/graphql/builder.service.ts). Normalizes single-object/array/null/empty inputs, uses fallback when caller sends nothing, appends `{ id: "asc" }` unless caller already ordered by `id`.
- Routed 16 `read*` resolvers through the helper with per-entity defaults:
  - Named things (`readUnits`, `readControls`, `readConfigurations`, `readSetpoints`, `readSchedules`, `readLocations`, `readUsers`) → alphabetical by name/label/email, hierarchical for units/controls.
  - Log-style (`readBanners`, `readChanges`, `readLogs`, `readFeedbacks`, `readComments`) → `createdAt desc`.
  - Calendar (`readOccupancies`, `readHolidays`) → chronological.
  - `readGeographies` → group, then name.
  - `readAccounts` → provider, then createdAt.
- Fixed `readFiles` resolver bug: previously dropped `distinct`/`orderBy`/`paging` and returned unmodified `where`. Now forwards all four args. Registered `createdAt`/`updatedAt` in `FileOrderBy`.
- Routed all four backup resolvers through the helper (preserving their existing per-entity defaults so the `id` tie-breaker is appended).
- `yarn compile:schema` — regenerated [server/schema.graphql](../../server/schema.graphql); only change is `FileOrderBy` gaining `createdAt`/`updatedAt` members.
- `yarn check` — clean.
- `yarn test --testPathPattern='graphql.*query.service'` — 165 tests, 4 backup tests failed on the tie-breaker addition. Updated their expected `orderBy` to include `{ id: "asc" }`. Re-ran: 165/165 pass.
- `yarn lint` — clean.

### 2026-09-17 11:35 — Client layer complete
- `yarn compile:graphql` — regenerated Apollo hooks (only `FileOrderBy` schema shifted).
- Added explicit `orderBy` to four auxiliary call sites:
  - [dashboards/page.tsx](../../client/src/app/dashboards/page.tsx) — `ReadUnitsDocument` now sends `[campus asc, building asc, system asc]`.
  - [keycloak/page.tsx](../../client/src/app/keycloak/page.tsx) — `ReadUsersDocument` now sends `[email asc]` alongside `paging` (fixes stale paging-without-ordering bug).
  - [users/page.tsx](../../client/src/app/users/page.tsx) — auxiliary `ReadUnitsDocument` unit-picker dropdown now sends `[campus asc, building asc, system asc]`.
  - [components/feedback/feedback.tsx](../../client/src/app/components/feedback/feedback.tsx) — admin-user assignee dropdown now sends `[email asc]`.
- `yarn check` — clean.
- `yarn lint` — clean.
- `yarn test --testPathPattern='(users|keycloak|dashboards|feedback)'` — 420/420 pass.

### 2026-09-17 11:45 — Complete
- Server: 18 files touched (1 helper + 17 resolver files + 1 test file).
- Client: 4 call-site files touched; no `.graphql` edits needed (operations already declared `$orderBy`).
- Generated files updated: [server/schema.graphql](../../server/schema.graphql), [client/schema.graphql](../../client/schema.graphql), Apollo hooks.
- Verification: all typecheck, lint, and affected tests pass. Docker smoke test deferred to normal QA (spot-check `/dashboards`, `/keycloak` pagination, `/holidays` regression, feedback dropdown alphabetization).

### 2026-09-17 12:00 — Follow-up: ILC page ordering
- User request: top-level site ordering by campus/building, unit ordering by campus/building/unit.
- [ilc/page.tsx](../../client/src/app/ilc/page.tsx):
  - `ReadControlsDocument` query and `SubscribeControlsDocument` subscription orderBy changed from `{ createdAt: Desc }` to `[{ campus: Asc }, { building: Asc }]` (server appends `{ id: "asc" }` tie-breaker).
  - Nested `control.units` (which come with the readControls response and can't be server-sorted at the nested level) sorted client-side in the `controls` `useMemo` via `orderBy` from `@local/common/dist/utils/lodash` using `["campus", "building", "name"]`.
- `yarn check` — clean. `yarn lint` — clean. No ILC-specific tests exist.
