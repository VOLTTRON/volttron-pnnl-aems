# Restore synthetic data on `feature/timezone-preference`

Progress log for the `/develop` execution of plan `synthetic-data-is-no-glistening-graham`.

## Goal

Bring the synthetic-data feature (merged to `origin/main` via PR #114, merge commit `db886162`) onto `feature/timezone-preference` so `synth-worker` starts and populates the historian in the local docker compose dev deployment.

No design doc existed under `docs/proposed/` matching this slug. Root cause was diagnosed as a branch/sync issue rather than a code regression: local `main` was 15 commits behind `origin/main`, and `feature/timezone-preference` branched off before PR #114 landed. The `,synth` addition to `COMPOSE_PROFILES` in `aems-app/.env` was a no-op because the `synth-worker` service block did not exist on this branch.

Approved plan: `C:\Users\d3x573\.claude\plans\synthetic-data-is-no-glistening-graham.md`.

## Log

### 2026-08-27 08:53:02 — Start
- Branch `feature/timezone-preference`, working tree has one modification: `aems-app/.env` (adds `,synth` to `COMPOSE_PROFILES`).
- Plan approved by user. Proceeding with the merge-from-main path (not cherry-pick, not branch switch).

### 2026-08-27 09:00:00 — Merge main → feature/timezone-preference
- `git fetch origin` + `git fetch origin main:main` fast-forwarded local main from `5027dfa9` to `db886162` (PR #114 merge commit).
- `git merge main` produced 5 conflicts:
  - `aems-app/client/src/app/demo/page.test.tsx` — kept HEAD (async `act(async () => renderPage())` pattern from timezone branch's async-rendering shift).
  - `aems-app/client/src/app/components/common/echarts.tsx` — kept both sides (HEAD's `makeTimeAxisFormatter` export + main's `DATA_ZOOM_DEBOUNCE_MS` constant; independent additions).
  - `aems-app/client/src/app/dashboards/components/SiteDashboard.tsx` — accepted main (`<BuildingPowerChart>` replaces the inline `<ECharts>` block).
  - `aems-app/client/src/app/dashboards/components/UnitDashboard.tsx` — accepted main (same rationale).
  - `aems-app/server/dist/app.config.js.map` — accepted main; will regenerate on build.
- **Follow-up note (out of scope):** `BuildingPowerChart` from main does not yet accept a `timeAxisFormatter` prop. Adopting main's version means the Building Power chart specifically will render x-axis ticks in the browser default locale/tz rather than the user's timezone preference. Other charts in the dashboards still use `timeAxisFormatter` correctly. The timezone-branch owner should plumb the formatter into `BuildingPowerChart` as a separate change.
- Merge commit: `1d75a25`. Result: pass.

### 2026-08-27 09:10 — Rebuild chain (prisma → common → server → client)
- **prisma**: `yarn build` — regenerated Prisma Client, JSON Types Generator, and Pothos integration. Pass.
- **common**: `yarn build && yarn check`. Pass.
- **server**: first `yarn compile:schema` attempt failed on missing `pg-copy-streams` dep (introduced by merged synthetic feature; declared in `server/package.json` but not installed here). Ran `yarn install` in `server/` (Yarn 4.9.1), then retried. `yarn compile:schema` → NestJS boots, Pothos schema regenerated to `server/schema.graphql`. `yarn check` — pass.
- **client**: `yarn install`, `yarn compile:graphql` — Apollo codegen regenerated hooks including any new synthetic-related types. `yarn check` — pass.
- Files changed by the rebuild are generated artifacts (schemas, `dist/`, `graphql-codegen/`); nothing hand-authored.

### 2026-08-27 09:20 — docker compose up + verify
- `docker compose config --services` after the merge lists `synth-worker` (previously absent → the missing service block from PR #114 is now present).
- `docker compose up -d --build` rebuilt images and started `aems-synth-worker` alongside the existing stack. Exit 0.
- `docker compose logs synth-worker` shows the full happy path:
  - `SyntheticTopologyService: Topology upserted: 18 units across 6 buildings.`
  - `SyntheticTopologyService: Connected 3 seeded users to 18 DEMO units.`
  - `SyntheticService: Historian topics ready: 318`
  - Backfill ran across `DEMO_CAMPUS_RICHLAND/BLDG_A|B|C` and `DEMO_CAMPUS_SEQUIM/BLDG_A|B|C` — 53 topics per building already had data (idempotent detection from prior runs); 0 new backfill rows this run.
  - `SyntheticTickerService: Synthetic ticker started.` (armed for 60s intervals).
- Unrelated warning: `GrafanaRewriteMiddleware: ENOENT: /aems-edge/configurations/grafana` — cosmetic middleware init warning that also fires on other server-image containers; not blocking synthetic data.
- Result: pass. Synthetic data is now visible in the dev docker compose deployment on this machine.

## Summary

Root cause was a stale local `main` (15 commits behind `origin/main`). The synthetic-data feature had already landed on `origin/main` via PR #114 (merge commit `db886162`), but `feature/timezone-preference` branched from the older `main` and therefore had no `synth-worker` service, no `services/synthetic/` code, and no `synthetic` config block — which is why adding `,synth` to `COMPOSE_PROFILES` in `aems-app/.env` did nothing.

Resolution: fetched `origin`, fast-forwarded local `main`, merged `main` into `feature/timezone-preference` (merge commit `1d75a25`), resolved 5 conflicts (kept HEAD's timezone additions and adopted main's `<BuildingPowerChart>` extraction), reinstalled dependencies (`pg-copy-streams` was newly required), rebuilt prisma → common → server → client, and brought the stack up. `aems-synth-worker` now runs and the synthetic ticker is emitting.

Known follow-up (out of scope for this task): `BuildingPowerChart` from main does not yet accept a timezone `axisLabel` formatter, so the Building Power chart specifically will render tick labels in the browser's default timezone. Plumbing `makeTimeAxisFormatter` into `BuildingPowerChart` is a small follow-up owned by the timezone-preference branch.
