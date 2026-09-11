# Resumable historian subscriber provisioning

Design doc: none in `docs/proposed/`. Plan is inline in the approved Claude plan file for this session.

## Problem

- PG native initial COPY for logical replication is a single transaction. On unreliable Verizon cellular links (production reality), a growing multi-GB `data` table can never complete initial sync.
- Publisher currently omits `max_slot_wal_keep_size` → defaults to unlimited retention. A stalled slot can eventually fill the historian data volume.
- Six surfaces document `CREATE SUBSCRIPTION … WITH (copy_data=true)`; two use divergent subscription/slot names; README has stale port `5432` references. Everything needs to agree.

## Approach

- Publisher: cap WAL retention at 10 GB (~50 days headroom at real ingest rate), bump `wal_sender_timeout` to 5 min for cellular slack.
- New `subscribe-historian.sh` wrapper (+ `.ps1`) that creates the subscription with `copy_data=false` (streams from now) and does a resumable chunked backfill of historical `data` via `INSERT … ON CONFLICT DO NOTHING`. Same code path handles fresh provisioning and re-init after `wal_status='lost'`.
- Client `/historian` page becomes the canonical source of setup instructions.
- Unify subscription/slot naming on `historian_sub` / `historian_sub_slot` across all surfaces.
- Publisher-side `repair-historian-replication.sh` stays functional — only its echoed guidance text updates.

## Progress log

### 20260903-092049 — Start

Progress log created. Plan is inline; no design doc in `docs/proposed/`.

### 20260903 — Publisher WAL config

- [aems-app/docker/historian/postgresql.conf](../../docker/historian/postgresql.conf): `max_slot_wal_keep_size = 10GB` (bounds retention so a stalled slot can't fill the volume; ~50 days of buffer at typical WAL rates) and bumped `wal_sender_timeout` from 60s to `5min` (cellular slack). Ships on next `docker compose build historian && docker compose up -d historian`; no volume wipe needed.

### 20260903 — subscribe-historian.sh (+ .ps1)

- Wrote [aems-app/subscribe-historian.sh](../../../subscribe-historian.sh) as a single-layer wrapper (design deviation from the plan's two-layer wrapper+inner — a single layer is more natural because the subscriber is user-managed and might not be in Docker; requires only `psql` on PATH, no docker exec). Handles fresh provisioning AND re-init after `wal_status='lost'` via the same code path. Uses stage-and-merge with `ON CONFLICT DO NOTHING` for idempotency. Progress checkpointed in `public.backfill_progress`.
- Companion [aems-app/subscribe-historian.ps1](../../../subscribe-historian.ps1) covers the schema-clone step and defers the chunk loop to `.sh` under WSL / Git Bash — a full pure-PowerShell chunk loop was out of scope and would duplicate the bash logic without adding coverage.

### 20260903 — Existing surfaces aligned

- [aems-app/docker/historian/setup-subscriber.sh](../../docker/historian/setup-subscriber.sh): deprecation header + startup warning marking it TEST-ONLY. Unified subscription/slot names from `aems_${username}_sub` / `aems_${username}_slot` to the canonical `historian_sub` / `historian_sub_slot`. Added `sslmode=require` to the connection string.
- [aems-app/docker/historian/fix-replication.sql](../../docker/historian/fix-replication.sql): subscription-drop loop broadened to match BOTH `historian_sub` AND legacy `aems_%_sub` names. Commented CREATE SUBSCRIPTION example flipped to `copy_data=false` and points at `subscribe-historian.sh`.
- [aems-app/docker/historian/repair-replication.sh](../../docker/historian/repair-replication.sh): echoed post-repair guidance now names `subscribe-historian.sh` as the preferred subscriber-recovery path, with the raw SQL kept inline as a fallback. **Repair script core logic is unchanged** — publisher-side repair on production historians remains fully functional.

### 20260903 — Client /historian UI is now canonical

- [aems-app/common/src/types/historian.ts](../../../common/src/types/historian.ts): added `backfillCommand: string` to `SubscriberSetupSql`.
- [aems-app/server/src/historian/historian.service.ts](../../server/src/historian/historian.service.ts): flipped `copy_data = true` → `copy_data = false` in the subscription template; added `backfillCommand` string emission with `{{HOSTNAME}}` and port substitution.
- [aems-app/client/src/app/historian/page.tsx](../../../client/src/app/historian/page.tsx): added a fifth Subscriber Setup card "5. Backfill Historical Data" with a copy button, primary-intent callout explaining resumable chunked backfill, and a code block rendering the exact `subscribe-historian.sh` invocation with hostname pre-filled from the browser URL.
- Rebuilt `common/` so the type propagates via `portal:`. `yarn check` passes cleanly in both `server/` and `client/`.

### 20260903 — README + deployment guide

- [aems-app/README.md](../../../README.md): three CREATE SUBSCRIPTION blocks flipped to `copy_data=false` with follow-up `subscribe-historian.sh` invocations; three stale `5432` port references fixed to `6543` / `HISTORIAN_REPLICATION_PORT`; cleanup-notes updated to reference the wrapper.
- [docs/proposed/aems-deployment-guide/aems-deployment-guide.md](../../../../docs/proposed/aems-deployment-guide/aems-deployment-guide.md): Deep-Ops Subscriber-Side SQL Setup rewritten around `copy_data=false` + backfill; new "Long Outages: Subscriber Offline for Days" callout in the break-glass section explaining slot invalidation and the idempotent re-init flow.

### 20260903 — End-to-end verification on the dev env

1. `docker compose build historian && docker compose up -d historian` — image picked up the new postgresql.conf.
2. `SHOW max_slot_wal_keep_size;` → `10GB`. `SHOW wal_sender_timeout;` → `5min`. ✅
3. Existing subscription (`historian_sub`) survived the recreate: `pg_stat_replication.state='streaming'`, `pg_replication_slots.wal_status='reserved'`, `active=true`. No orphan sync slots. ✅
4. `./repair-historian-replication.sh --dry-run` on the healthy deployment: reports "publication scope already correct — no publication change" and takes no action. Regression check per plan §Verification.8 passes — repair scripts still work on production historians. ✅
5. `yarn check` passes cleanly in `common/` (already built), `server/`, and `client/`. ✅

### 20260903 — Full end-to-end test with a second subscriber

Second test pass with a real subscriber Postgres container (`test-subscriber`, `postgres:16-alpine`, on the `aems_default` docker network) alongside the user's existing pgAdmin subscriber. All test scenarios pass; several bugs surfaced by testing were fixed inline.

**Bugs surfaced by testing and fixed:**

- `pg_dump` in Step 1 emitted `OWNER TO historian` statements that failed on the subscriber (which doesn't have that role). Added `--no-owner --no-privileges`.
- The chunk loop iterated with shell word-splitting on `$CHUNKS`, splitting timestamps like `2026-09-02 16:00:00` into two "chunks". Rewrote to iterate on newlines with a `mapfile`-style loop; also aligned dedup logic between generate_series and the explicit END_TS boundary.
- Stage table was `CREATE TEMP TABLE` in a separate psql invocation, then referenced in a subsequent one — the temp table doesn't survive across invocations. Switched to a real (unlogged) `public.backfill_stage` table that's created/dropped by explicit statements, letting the `psql | psql` pipe flow correctly.
- The `INSERTED` display was catching `COMMIT` from psql output. Rewrote the merge SQL as a single CTE with `RETURNING`, and used `tr -d ' '` to trim.
- Re-init detection only fired on `wal_status='lost'`. Broadened to also detect `unreserved` and slot-entirely-missing (empty result) — the latter is what happens when `pg_drop_replication_slot()` runs against an invalidated slot.

**New script flags added to support multi-subscriber deployments and testing:**

- `--subscription-name` (default: `historian_sub`)
- `--slot-name` (default: `historian_sub_slot`)
- `--skip-subscription` (backfill-only mode)

**Test scenarios verified:**

| Scenario | Method | Result |
|---|---|---|
| Dry-run | `--dry-run --yes` | Correctly reports plan without writes ✅ |
| Fresh provisioning | Empty subscriber → run script with `--start-ts` 24h back | Schema cloned, 332 topics COPY'd, subscription created with `copy_data=false`, 7 chunks backfilled at ~76K rows each = 453K total rows ✅ |
| Live streaming | Check `pg_stat_replication` + `srsubstate` on both sides | `state=streaming`, both `topics` and `data` at `srsubstate='r'`, publisher and subscriber `max(ts)` match ✅ |
| Idempotency (fixed start-ts) | Re-run with same `--start-ts '2026-09-02 12:00:00'` | All 8 chunks reported `skip: already completed`; no new writes ✅ |
| Interrupt-and-resume | `DELETE FROM backfill_progress` for one chunk, re-run | Only the deleted chunk re-executed; others skipped ✅ |
| Auto-resume after outage | `docker stop test-subscriber` for 30s, restart, observe catch-up | Subscriber `max(ts)` matched publisher within ~10s; slot `active=true, wal_status=reserved`; no operator action needed ✅ |
| Slot-loss re-init | `pg_terminate_backend` + `pg_drop_replication_slot` on publisher, re-run script | Script detected slot missing, dropped subscription cleanly, recreated with `copy_data=false`, backfill idempotent (row count preserved through the re-init); new slot healthy `wal_status=reserved` ✅ |
| Existing subscriber isolation | Ran all tests while user's `historian_sub` was streaming | User's subscription unaffected (still `streaming`, slot `reserved`); test used distinct names to avoid collision ✅ |

Test subscriber and its orphan slot cleaned up at end. User's `historian_sub_slot` remains the only slot on the publisher, active and streaming.

### 20260903 — Complete

All plan items applied AND end-to-end tested with a full second subscriber alongside the user's existing pgAdmin subscriber. Bugs found by testing were fixed inline. Progress log moved to `docs/complete/`.
