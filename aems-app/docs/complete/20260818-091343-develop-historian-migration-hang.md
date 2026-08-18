# Fix historian migration hang on 3GB dumps

Progress log for the `/develop` workflow. Corresponds to approved plan `C:\Users\d3x573\.claude\plans\the-migration-script-on-iterative-melody.md`.

## Summary

Rewrite `aems-app/migrate-historian-data.sh` to remove the three defects that make it hang on multi-GB dumps and silently corrupt the target's `topics_topic_id_seq`. Fix damage from prior runs. Preserve existing rows. Add resumability.

No Prisma/common/server/client changes — historian tables (`topics`, `data`) are owned by the VOLTTRON SQLHistorian agent, not Prisma. Prisma/common/server/client layers of the /develop workflow do not apply.

## Progress

### 20260818-091343 — Start

- Plan approved. Progress log created.
- Root causes: `pg_dump --inserts` produces 5-20× oversized dumps; two `sed -i` passes rewrite the entire 3GB file and produce invalid SQL for `data`; `pg_dump` also emits a tail `SELECT pg_catalog.setval(...)` that resets `topics_topic_id_seq` backward on the target.
- No design doc in `docs/proposed/` — proceeding without one. All decisions live in the plan file.

### Layers

- **prisma** — not applicable (no schema change).
- **common** — not applicable (no shared code change).
- **server** — not applicable (historian tables not owned by Prisma).
- **client** — not applicable.
- **script layer** — rewrite `aems-app/migrate-historian-data.sh`. This is the only code change.

### 20260818-092034 — Complete

Rewrote [aems-app/migrate-historian-data.sh](../../migrate-historian-data.sh) (981 lines). `bash -n` passes. Changes vs the original:

**Dump (Step 1)**
- Removed `--inserts` and `--on-conflict-do-nothing` from pg_dump. Default COPY format instead — 5-20× smaller and orders of magnitude faster to replay.
- Pipe pg_dump through `gzip -c` to disk. New default dump path: `<TEMP_DIR>/historian_dump.copy.gz`.
- Local `set -o pipefail` around the export so a pg_dump failure isn't masked by a successful gzip.
- Post-export validation: file non-empty and `gzip -t` passes. Same check runs again before Step 3a in case a reused dump was corrupted.

**Prepare (Step 2)**
- Removed the two `CREATE INDEX IF NOT EXISTS` on `public.data` (idx_data_ts, idx_data_topic_id). Deferred to post-merge to speed the bulk load.
- Added **Step 2a — pre-flight target integrity check**: reports current `topics_topic_id_seq` vs `MAX(topic_id)` and warns "BEHIND max(topic_id) — will be repaired post-merge" if a prior broken run corrupted the sequence.
- Added **Step 2b — staging schema**: unlogged `migration_stage.topics` / `migration_stage.data` (LIKE public EXCLUDING DEFAULTS so staging doesn't consume from public sequences), plus `migration_stage.progress` (checkpoint table for resume) and `migration_stage.topic_id_map`.

**Import (Step 3)**
- **Deleted** the two `sed -i` passes on the 3 GB file (they were the root cause of the hang AND produced invalid SQL that silently dropped rows).
- New **Step 3a — streaming staging load**: `gzip -dc | sed | psql --single-transaction`. sed rewrites the two COPY header lines and filters any `SELECT pg_catalog.setval(...)` line pg_dump appends after data blocks (the setval was what corrupted `topics_topic_id_seq` on prior runs). Data rows never match either anchor so multi-GB payloads stream at line-buffer speed. Wrapped in local `set -o pipefail`.
- New **Step 3b — topics merge with `topic_id` remapping**: `INSERT ... ON CONFLICT (topic_name) DO NOTHING` for new topics, then rebuild `migration_stage.topic_id_map` by joining staging→target on the natural key `topic_name`. Source-side topic_ids are never copied blindly.
- New **Step 3c — chunked data merge**: generate one chunk_start per `$CHUNK_INTERVAL` (default `1 month`) via `generate_series`, then for each chunk: skip if already in `migration_stage.progress`, otherwise run `INSERT INTO public.data SELECT ... JOIN topic_id_map ... ON CONFLICT (topic_id, ts) DO NOTHING RETURNING 1` and record the row count in `progress` in the same transaction. Log per-chunk timing, row count, cumulative %.
- New background **watchdog**: prints `public.data` row count + total size every 60s during the merge so the operator can see forward motion during a single long chunk. Killed via exit trap.

**Post-merge**
- Repair `topics_topic_id_seq`: `SELECT setval(pg_get_serial_sequence('public.topics', 'topic_id'), GREATEST(MAX(topic_id), 1), true)`. Safe no-op on healthy targets; on damaged targets logs `[WARNING] Repaired topics_topic_id_seq from N to M — VOLTTRON's next topic insert would have collided before this fix.`
- Create deferred `idx_data_ts` and `idx_data_topic_id`.
- Keep existing `ANALYZE topics; ANALYZE data`.
- Print the operator-run `DROP SCHEMA migration_stage CASCADE` command instead of auto-dropping (safety net).

**CLI additions**
- `--skip-export`, `--dump-file PATH`, `--chunk-interval INTERVAL`, `--keep-dump`, `--keep-staging`. All documented in `show_help`. Chunk interval is validated to a whitelisted `N unit` shape to keep its interpolation into SQL predictable.

**Cleanup trap**
- Kills the watchdog if it's still running.
- Preserves the dump file when `--keep-dump` or `--dump-file` were used.
- Leaves the `migration_stage` schema in place — that's what enables resume.

**Preserves existing rows on the target** — every insert is `ON CONFLICT DO NOTHING`; no `DELETE` / `TRUNCATE` on `public.*` anywhere. **Repairs prior damage** — sequence repair block runs unconditionally.

### Final check

- `bash -n aems-app/migrate-historian-data.sh` → OK.
- `shellcheck` not installed on this host — skipped.
- No changes to `prisma/`, `common/`, `server/`, `client/`. Build chain unaffected — the `yarn check` step of the /develop workflow is a no-op for this change.

### 20260818-095106 — End-to-end test in dev docker stack

Brought up `grafana-db` + `historian` via `docker compose --profile grafana --profile historian up -d grafana-db historian` from `aems-app/`. `historian` volume had stale password state from Aug 5 — wiped its volume and recreated it fresh.

Seeded source (`aems-grafana-db`, db `grafana`): **500 topics**, **1,042,561 data rows** over 6 months (2026-02-18 → 2026-08-18), one row every ~2 hours per topic, 92 MB.

Ran migration end-to-end with `--keep-dump`. First run failed and surfaced **three latent bugs in the original script** that my rewrite had inherited or introduced:

1. **`CREATE TABLE IF NOT EXISTS` heredoc attached to the wrong end of the pipe.** `psql ... 2>&1 | tee -a "$LOG_FILE" > "$TEMP_SQL_OUTPUT" << 'EOF'` sends the heredoc to `tee`, not `psql` — so `psql` runs with empty stdin (silent no-op), while the SQL bytes end up in the log file. In prod this was masked because VOLTTRON's SQLHistorian already created the tables. Fresh test target had no tables and Step 2 failed at ALTER TABLE. Fixed by moving `<<'EOF'` before the pipe and switching the exit-status check to `${PIPESTATUS[0]}`.
2. **`docker exec` missing `-i` on all heredoc-fed psql invocations.** Without `-i`, docker exec closes stdin, so the heredoc payload is discarded even when it lexically attaches to `psql`. Fixed on all six heredoc call sites (staging schema create, staging index/analyze, topics merge, chunk-merge inside loop, deferred data indexes, tables create).
3. **`CREATE TABLE data ... REFERENCES topics(topic_id)` when `topics` has no unique constraint on `topic_id`.** The original design was: create tables (no PK) → later add PK via ALTER TABLE. But the FK reference at CREATE time needs `topic_id` to be UNIQUE or PK on `topics`. Prod worked because VOLTTRON had already added the PK. Fixed by adding `PRIMARY KEY` inline on both tables — the subsequent PK-verify blocks become safe no-ops on already-migrated targets.

Also refined the post-merge setval repair: original version unconditionally `setval(seq, MAX(topic_id))` could **wind the sequence backward** when it was already ahead (e.g., after topics-merge's `ON CONFLICT DO NOTHING` consumed sequence values). Rewinding is racy against live VOLTTRON writers. Changed to `setval(seq, GREATEST(current, MAX(topic_id), 1))` so the sequence only ever advances.

**Test results (all passed):**

| Scenario | Result |
|---|---|
| Full clean end-to-end migration | 500 topics, 1,042,561 data rows migrated in ~45s of chunk-merge time (7 monthly chunks: 63k/179k/173k/179k/173k/179k/98k rows, 3-8s each). pg_dump+gzip took 4s (8.3 MB compressed vs a ~9 GB `--inserts` extrapolation), staging load 3s. Byte-identical row spot-check via topic_name join. |
| Watchdog visibility | Fired at t=60s during chunk 6 with `public.data now: 944640 89 MB`. |
| Idempotency re-run (`--skip-export`) | All 7 chunks reported as `Skip … already merged: N rows`. 0 topics, 0 data rows inserted. Row counts unchanged. |
| `setval`-corruption repair | Manually `setval(topics_topic_id_seq, 42, true)` while `MAX(topic_id)=500`. Pre-flight (Step 2a) correctly logged `topics_topic_id_seq: current=42, max(topic_id)=500 -> BEHIND max(topic_id) — will be repaired post-merge`. Post-migration the sequence was at 542 (advanced past max), no data lost. |
| topic_id remap (target has divergent name→id) | Pre-seeded target with 3 topics at IDs 9001, 9002, 9003 whose `topic_name`s also appear in the source at IDs 1, 2, 3. Post-migration: `campus1/building1/rtu1/point1` in target holds `topic_id=9001` with all 2086 rows correctly attached (rather than getting a duplicate row at source's `topic_id=1`). 497 new topics inserted (500 in source − 3 pre-existing). |
| No data loss when target has prior rows | Multiple re-runs on a fully-populated target: row count strictly non-decreasing at every step. |

**Not tested in this session:**
- Concurrent-writer test (VOLTTRON actively inserting during merge) — VOLTTRON container not brought up.
- Ctrl-C mid-chunk resume — with 45s total merge time and 3-8s per chunk, the window is tight; the logic is exercised implicitly by the idempotency re-run.

### Files changed

- [aems-app/migrate-historian-data.sh](../../migrate-historian-data.sh) — rewrite + the three test-driven fixes above.

### Cleanup

- `.env`'s temporary dev password patch was restored from `.env.migration-test-backup` (removed).
- Containers `aems-grafana-db` and `aems-historian` left running with the seeded data (500 topics, 1,042,561 rows on both). Take them down with `docker compose down` from `aems-app/` when no longer needed.
- The three testing test data (seeded source, migrated target) remain in their respective volumes.
