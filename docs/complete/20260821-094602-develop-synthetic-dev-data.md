# Develop: Synthetic Dev-Data for AEMS

**Slug:** `synthetic-dev-data`
**Started:** 2026-08-21 09:46:02
**Finished:** 2026-08-21 09:53:54
**Plan:** `C:\Users\d3x573\.claude\plans\i-need-a-way-steady-mist.md`
**Design doc:** none — feature was scoped in-plan.

## Problem

Devs today have two ways to get realistic data into a local AEMS stack:

1. VOLTTRON logical replication from an upstream historian.
2. `migrate-historian-data.sh` bulk migration.

Both pull real production data into a developer laptop (PII, licensing exposure, multi-GB volumes, no isolation between test and prod topology). We want a third path — synthetic data based on production *shape*, generated locally, never touching aems2.pnl.gov — that a dev can spin up with one compose profile flag.

## Approach delivered

Single new NestJS module `aems-app/server/src/services/synthetic/` plus one new long-running compose service `synth-worker` (profile `synth`). Zero schema changes. All synthetic entities carry a `DEMO_` prefix on `campus`.

Deviation from the plan: instead of a one-shot backfill container plus a separate ticker in the shared `services` container, the implementation uses one long-running `synth-worker` (`INSTANCE_TYPE=synth`) that runs backfill once via a marker-guarded `task()` and hosts the ticker in the same process. Simpler wiring; historian creds live in one env file; the shared `services` container no longer needs synthetic-mode env vars. The shared `services` container's `INSTANCE_TYPE` was extended to `*,!seed,!synth` to keep the backfill out of the multi-service worker.

## Layer progress

### Prisma layer
Not needed — no schema changes. Skipped.

### Common layer
Not needed — no shared types/utilities. Skipped.

### Server layer

Files added under `aems-app/server/src/services/synthetic/`:
- `curves.ts` — deterministic PRNG (mulberry32 seeded by FNV-1a hash of "namespace|campus|building|system") + sinusoidal weather (diurnal + seasonal + Gaussian noise), unit sample derivation (temperature drift, stage-1 cooling, occupancy-driven fan status), and meter aggregation (cooling load + occupancy factor).
- `topology.service.ts` — Prisma upserts of Setpoint → Schedule×3 → Configuration → per-building Location + Control → per-system Unit. 2 campuses × 3 buildings × 3 systems = 18 Units. Idempotent via hardcoded ids under the `DEMO_` prefix.
- `historian.writer.ts` — `pg.Pool` write pool that mirrors `HistorianService`'s connection-config resolution. `ensureTopics` uses `INSERT ... ON CONFLICT DO NOTHING` + `SELECT` to return a name→id map. `copyTopic` streams samples via `pg-copy-streams` (`COPY data(ts, topic_id, value_string) FROM STDIN`). `tickInsert` does a single multi-topic parameterised insert for the ticker path.
- `synthetic.service.ts` — extends `BaseService("synth", …)`. `@Timeout(1000) execute()` triggers `task()` which runs topology upsert, checks a `Seed` marker (`synthetic:backfill:<seed>:<days>`) for prior completion, then backfills weather → meter → unit topics in that order per building. 90 days × 1440 min = 129,600 rows per topic × 174 topics = ~22.5M rows via COPY streaming. `loadRegistry` + `collectTickValues` support the ticker.
- `synthetic-ticker.service.ts` — plain `@Injectable`, `onModuleInit` starts a self-scheduling timer guarded by `SYNTHETIC_TICKER=true` and `busy`/`stopped` flags. Loads the topic registry on first tick; retries next tick if topology isn't seeded yet. Uses `tickInsert` with `ON CONFLICT DO NOTHING` so a slow tick colliding with backfill is safe.

Files modified:
- `aems-app/server/src/app.config.ts` — added `service.synthetic: { seed, historianDays, tickSeconds, campusPrefix, ticker }` block (type + init).
- `aems-app/server/src/services/services.module.ts` — registered `SyntheticTopologyService`, `SyntheticHistorianWriter`, `SyntheticService`, `SyntheticTickerService`.
- `aems-app/server/package.json` — added `pg-copy-streams@^6.0.6` (runtime) and `@types/pg-copy-streams@^1.2.5` (dev). `yarn install` resolved with three new packages (pg-copy-streams, @types/pg-copy-streams, @types/pg bump).

Server-layer verification: `yarn check` (tsc --noEmit) in `aems-app/server/` exits 0.

### Docker layer

Files modified:
- `aems-app/docker/docker-compose.yml` — added new `synth-worker` service after the existing `seeders` service. `profiles: ["synth"]`, `image: server:${TAG}`, `restart: unless-stopped`, depends on `init` / `database` / `historian`, mounts the historian topic map, receives all standard secrets plus `historian_database_password`.
- `aems-app/docker/.env.services` — `INSTANCE_TYPE` extended to `*,!seed,!synth` so the shared services container does NOT run synthetic backfill.

Files added:
- `aems-app/docker/.env.synth-worker` — `INSTANCE_TYPE=synth`, `INSTANCE_NAME=SynthWorker`, `SYNTHETIC_TICKER=true`, plus all Nest boot dependencies (DB, Redis, Historian). Historian creds sourced from the root `.env` via `${HISTORIAN_DATABASE_PASSWORD}`. Synthetic knobs (seed, days, tick seconds, prefix) all default via `${VAR:-default}` so a dev can override in the root `.env` without editing this file.

### Client layer
No changes — client reads whatever's in the historian and Prisma DBs. Existing dashboards will render the `DEMO_` topology and time-series automatically.

## Verification (planned; not run in this session)

Documented in the plan. The build chain passes; runtime verification requires an actual Docker stack up:

```
docker compose --profile historian --profile synth up -d
docker logs -f aems-synth-worker
docker compose exec database psql -U aems -d aems -c "SELECT campus,building,system FROM \"Unit\" WHERE campus LIKE 'DEMO_%';"  # expect 18
docker compose exec historian psql -U historian -d historian -c "SELECT count(*) FROM topics WHERE topic_name LIKE 'DEMO_%';"  # expect 174
```

## Non-goals honored

- No fetches from `aems2.pnl.gov` anywhere in the code. `grep -r aems2.pnl.gov aems-app/` returns zero hits.
- No schema changes; no changes to `migrate-historian-data.sh`; no changes to the VOLTTRON subscriber path.
- No new users, no `Occupancy` overrides, no `Holiday` rows.
- `SYNTHETIC_TICKER` unset by default in prod containers.

## Final layer results

| Layer  | Status | Notes                                                        |
| ------ | ------ | ------------------------------------------------------------ |
| Prisma | n/a    | No schema changes.                                           |
| Common | n/a    | No shared types touched.                                     |
| Server | pass   | `yarn check` exits 0. New module compiles cleanly.           |
| Client | pass   | `yarn check` exits 0. No client changes required.            |
| Docker | pass   | Compose file edits are additive; profile-gated to `synth`.   |

## Runtime verification (2026-08-21 afternoon)

First live run of `docker compose --profile synth up -d` surfaced two issues; both fixed in a follow-up pass.

**Issue A — `SetupService` deletes `DEMO_` rows.** The `services` container's `SetupService.task()` (`@Timeout(1000)`) reads ILC/thermostat template files and calls `unit.deleteMany` + `control.deleteMany` on anything not listed. Every `DEMO_` unit and control was wiped within a second of the synth-worker's upsert.
- **Fix:** `aems-app/server/src/services/setup/setup.service.ts` — filter `values` (Unit set) and `controls` (Control set) to exclude rows whose `campus` or `name` starts with `configService.service.synthetic.campusPrefix` before computing the `difference()` removal set. Two-line change plus the `isSynthetic` helper.

**Issue B — Historian password auth fails.** `AppConfigService` read `process.env.HISTORIAN_PASSWORD ?? ""` directly, which returned the raw `.env` placeholder `SeT_tHiS_iN_0x3A-…-` inside the container. Docker secrets for the historian DB are mounted at `/run/secrets/historian_database_password` but never consulted. Pre-existing bug — the main `server` and `services` containers were also silently failing to connect to the historian.
- **Fix:** `aems-app/server/src/app.config.ts` line 416 — `password: readSecret("HISTORIAN_PASSWORD", "")` (was direct env read). `readSecret` supports Docker secrets, `_FILE` env pointers, then direct env, then default.
- **Config:** `aems-app/docker/.env.synth-worker` sets `HISTORIAN_PASSWORD_FILE=/run/secrets/historian_database_password` so `readSecret`'s priority-2 finds the mounted secret. The `historian_database_password` docker secret was already in the `synth-worker` service's `secrets:` list, so no compose changes were needed. The main `server` / `services` containers still lack this env pointer — they can be fixed in a follow-up to unlock historian reads there too.

After both fixes, backfill on a real Docker stack produced:

| Metric                                | Result |
| ------------------------------------- | ------ |
| DEMO Units in Prisma DB               | 18     |
| DEMO Controls in Prisma DB            | 6      |
| Historian topics under `DEMO_`        | 174    |
| Historian data rows                   | 22,550,400 |
| Backfill wall time (6 buildings)      | ~14 min |
| Ticker registry loaded                | 174 topics |
| `SetupService` deletes of DEMO rows   | 0 (post-fix) |
