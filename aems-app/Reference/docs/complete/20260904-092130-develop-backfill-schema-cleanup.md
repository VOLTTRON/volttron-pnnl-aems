# Backfill state → dedicated schema + persist-and-resume config + cleanup UI

Follow-on to yesterday's two-path subscriber provisioning ([20260903-112750](../complete/20260903-112750-develop-subscribe-historian-two-paths.md)).

## Problem

- Backfill bookkeeping (`backfill_progress`, `backfill_stage`) lived in `public` — a `FOR TABLES IN SCHEMA public` foot-gun for any cascaded or promoted subscriber.
- "Resume" required the operator to re-supply the same `--start-ts` / chunk_interval every time; a fresh Terminal window meant looking up your prior args.
- No UI-driven cleanup for the leftover state (backfill schema, migration_stage).

## Approach

- Move backfill state to a dedicated `backfill` schema on the subscriber.
- Add `backfill.config` (single-row) — captures start_ts / end_ts / chunk_interval / publisher_conn on first run. Password is transient.
- `backfill.run_backfill(publisher_password, [publisher_conn], [start_ts], [end_ts], [chunk_interval])` — first arg is the transient password; any non-null overrides upsert to config; a zero-override call just resumes.
- Shell scripts read config as defaults; flags override.
- New cleanup cards in Subscription Removal for the `backfill` schema (subscriber) and `migration_stage` schema (publisher).

## Progress log

### 20260904-092130 — Start

Progress log created. Plan approved.

### 20260904 — Server: `backfillProcedureSql` rewritten

- [server/src/historian/historian.service.ts](../../server/src/historian/historian.service.ts) — emits new SQL for Card 5:
  - `CREATE SCHEMA IF NOT EXISTS backfill;`
  - `backfill.config` (single-row, `id=1` CHECK), `backfill.progress`, `backfill.pending` view, `backfill.run_backfill(publisher_password, [publisher_conn], [start_ts], [end_ts], [chunk_interval])`.
  - First arg is the transient password (required, never persisted). Other args are optional overrides. Zero-override CALL reads config and resumes.
  - `#variable_conflict use_variable` inside the procedure so ambiguous names resolve to the parameter.
  - Emits both a first-run `CALL backfill.run_backfill(publisher_password := 'PW', publisher_conn := '…', start_ts := '…')` example and a commented resume-only `CALL backfill.run_backfill(publisher_password := 'PW');` example.

### 20260904 — Templates: `.sh` + `.ps1`

- [server/src/historian/templates/subscribe-historian.sh](../../server/src/historian/templates/subscribe-historian.sh):
  - Step 4 now creates the `backfill` schema and both `backfill.config` and `backfill.progress`.
  - After the schema-creation step, reads existing config; CLI flags override, otherwise persisted values (start_ts, end_ts, chunk_interval, publisher_host/port/user/sslmode) are reused.
  - After determining effective params, UPSERTs config so future runs can resume.
  - All references to `public.backfill_progress` / `public.backfill_stage` → `backfill.progress` / `backfill.stage` (12 hits total).
- [server/src/historian/templates/subscribe-historian.ps1](../../server/src/historian/templates/subscribe-historian.ps1) — PowerShell mirror.

### 20260904 — Client: cleanup cards

- [client/src/app/historian/page.tsx](../../../client/src/app/historian/page.tsx) — two new entries in the Subscription Removal tab's card array:
  - "Drop Backfill Schema (Subscriber)" → `DROP SCHEMA IF EXISTS backfill CASCADE;` targeting `sub`.
  - "Drop Migration Staging (Publisher)" → `DROP SCHEMA IF EXISTS migration_stage CASCADE;` targeting `pub`.
- Both use the existing `sqlToShell(sql, target, shell)` helper — no new code beyond the array entries.

### 20260904 — Docs

- [aems-app/README.md](../../../README.md) — reference to `public.backfill_progress` updated to `backfill.progress`; mentions the config-and-resume pattern.
- [docs/proposed/aems-deployment-guide/aems-deployment-guide.md](../../../../docs/proposed/aems-deployment-guide/aems-deployment-guide.md) — three references updated; Long-Outages callout mentions `CALL backfill.run_backfill(publisher_password := '…')` for the Path A resume shape.

### 20260904 — End-to-end tests

Fresh `postgres:16-alpine` bare-Postgres subscriber. Server + client images rebuilt and force-recreated.

**Path A** (`psql` against subscriber):

- Setup: Cards 1 + 4 applied cleanly (schema clone, subscription with `copy_data=false`).
- Card 5 setup: `CREATE EXTENSION dblink; CREATE SCHEMA backfill; …` executed via psql `-f`, all objects created.
- Initial CALL: `CALL backfill.run_backfill(publisher_password := 'PW', publisher_conn := '…', start_ts := '2026-09-04 12:00:00'::timestamp, chunk_interval := '30 minutes'::interval);` — 10 chunks processed, 87,031 rows landed, `backfill.config` populated, `backfill.pending` = 0.
- **Resume test**: `DELETE FROM backfill.progress WHERE chunk_start = '2026-09-04 13:00:00'::timestamp;` → then `CALL backfill.run_backfill(publisher_password := 'PW');` (password-only). Log says `Pending: 1`, processes only that chunk, done. ✅
- Gotcha discovered: `psql -c "CALL …; SELECT …;"` (multiple statements) wraps in an implicit transaction, breaking the procedure's `COMMIT`. Must use a single-statement `-c` invocation. Documented in follow-up: emit one `-c` per statement in scripts.

**Path B** (`.sh` downloaded from server):

- `docker cp aems-server:/app/server/dist/historian/templates/subscribe-historian.sh` → placeholder substitution → run inside `postgres:16-alpine` with the aems-app dir bind-mounted.
- Initial: `--start-ts '2026-09-04 15:00:00' --chunk-interval '30 minutes'` — 4 chunks processed (9598 + 8962 + 9598 + 1598 = 29,756 rows), `backfill.config` written.
- **Resume test**: `DELETE FROM backfill.progress WHERE chunk_start IN (...)` → 2 chunks removed. Re-invoke with NO `--start-ts` and NO `--chunk-interval` (only credentials + `--skip-schema --skip-subscription`). Script reports `Existing backfill.config found: start=... end=... interval=00:30:00` and re-processes only the 2 missing chunks; the other 2 are `skip: already completed`. ✅

**Cleanup cards**:

- `DROP SCHEMA IF EXISTS backfill CASCADE;` — drops `backfill.config`, `backfill.progress`, view, procedure. `\dn backfill` returns 0 rows. ✅
- `DROP SCHEMA IF EXISTS migration_stage CASCADE;` — no-op when absent (`NOTICE: schema "migration_stage" does not exist, skipping`). ✅

**Regression**: `./repair-historian-replication.sh --dry-run` on the healthy publisher still reports "publication scope already correct — no publication change." ✅

**Type-check / build**: `yarn check` clean in server and client. Client bundle still contains the "Historian Status" moved-tab position from yesterday. Compiled server has 0 remaining references to `public.backfill_progress`.

Cleanup: `test-subscriber` container removed, orphan slot dropped.

### 20260904 — Complete

Backfill state now lives in a dedicated `backfill` schema. Persistent `backfill.config` means Path A and Path B both resume with just credentials after the initial run. Cleanup cards for `backfill` and `migration_stage` schemas added to Subscription Removal. Progress log moved to `docs/complete/`.
