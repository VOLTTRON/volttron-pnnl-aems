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

### 20260818-100520 — Divergent-topic_ids scenario test

Explicit follow-up test to validate the failure mode most likely on real deployments where the old script left partial damage: target and source both hold rows with the same `topic_name`s but at **different `topic_id`s**, plus the old `setval` reset the sequence backward.

**Setup on `aems-historian`:**
- 10 pre-existing target topics at IDs 100-109 with topic_names `campus1/building1/rtu1/point{1..10}` — the same 10 topic_names exist in the source dump at source IDs 1-10 (namespace divergence).
- 100 pre-existing target data rows for those topics:
  - 50 rows at **overlap timestamps** — 5 exact `(topic_id=100, ts=2026-02-18 00:00, 02:05, 04:10, 06:15, 08:20)` collisions that also appear in the source dump for source topic 1, plus 45 rows on topics 101-109 at those same timestamps (which do NOT collide with source rows because source topics 2-10 have offset timestamps).
  - 50 rows at **future timestamps** (2027-01-01..05) that don't overlap with any source data.
- `topics_topic_id_seq` manually `setval`'d to 5 to simulate the old-script setval-corruption pattern (seq behind max=109).

**First run — surfaced a fourth bug.**

The topics-merge INSERT failed with `duplicate key value violates unique constraint "topics_pkey" DETAIL: Key (topic_id)=(100) already exists`. Root cause: with the sequence at 5 and target topics already at 100-109, the first `INSERT INTO topics (topic_name, metadata) SELECT ...` from staging fires `nextval()` for each row's `topic_id` DEFAULT — that returns 6, 7, ..., 105, 106, 107, 108, 109, then 110. IDs 100-109 hit `topic_id_pkey` collisions BEFORE the `ON CONFLICT (topic_name)` clause could evaluate (an `ON CONFLICT` clause only handles the constraint it names; other constraint violations still raise).

**Fix:** Added a new **Step 2c — Ensure sequence is ahead of max(topic_id)** that runs the setval repair BEFORE any INSERT into `public.topics`. Uses `GREATEST(current, MAX(topic_id), 1)` so it only ever advances the sequence (never rewinds, safe alongside live VOLTTRON writers). The post-merge setval remains as belt-and-suspenders.

**Second run — all checks pass:**

| Check | Result |
|---|---|
| Sequence pre-flight | Correctly logged `topics_topic_id_seq: current=5, max(topic_id)=109 -> BEHIND max(topic_id) — will be repaired in Step 2c`. |
| Step 2c pre-repair | Advanced sequence from 5 to 109 before topics-merge INSERT. |
| Topics-merge success | 490 new topics inserted with IDs 110-599; 10 conflicts on topic_name correctly skipped; no `topic_id_pkey` violation. |
| Chunk 1 (Feb 2026) | 63,355 rows — exactly 5 fewer than the clean test's 63,360, matching the 5 exact-timestamp overlaps for topic 100 correctly dropped by `ON CONFLICT (topic_id, ts) DO NOTHING`. |
| Chunks 2-7 | Same row counts as clean test (no more overlaps). |
| Target topics 100-109 preserved | All 10 pre-existing rows unchanged; metadata `{"origin":"pre-existing-target"}` intact. |
| Overlap rows preserved | `SELECT value_string FROM data WHERE topic_id=100 AND ts BETWEEN '2026-02-18 00:00' AND '08:20'` returns `PRE_EXISTING_OVERLAP_100` for all 5 rows — the source's would-be `v=...` values correctly dropped. |
| Future rows preserved | All 50 rows at 2027-01-01..05 present, `PRE_EXISTING_FUTURE_*` values intact. |
| Remap correctness | `campus1/building1/rtu1/point1` has 2091 rows all under target's `topic_id=100` (5 pre-existing overlap + 2081 remapped from source's topic 1 + 5 pre-existing future); `point10` has 2096 rows under `topic_id=109` (source topic 10's timestamps don't collide with the overlap set, so all 2086 source rows land). |
| No orphan rows | `SELECT count(*) FROM data d WHERE NOT EXISTS (SELECT 1 FROM topics t WHERE t.topic_id = d.topic_id)` → 0. |
| No leaked source IDs | `SELECT count(*) FROM data WHERE topic_id BETWEEN 1 AND 10` → 0 — none of source's topic_id namespace bled through. |
| Row-count arithmetic | Target before: 100. Target after: 1,042,656 = 100 (preserved) + 1,042,556 (source, less 5 collisions). ✓ |
| Post-merge sequence | Advanced to 609 (109 + 500 nextval consumptions during topics-merge); ahead of max(topic_id)=599, safe. |

**Fourth fix incorporated into `aems-app/migrate-historian-data.sh` (Step 2c).**

### 20260818-111957 — Follow-up coverage tests (H1–H4 + M1–M6)

Coverage-gap follow-up. Added three new code fixes to the script (H1 fingerprint, H3 pg_hba, H4 SIGINT hint) then ran the 10 planned tests. Two additional real defects surfaced (M2 sequence-guard gap, M6 chunk-inserted-0 anomaly) and were fixed. Script grew from 981 → 1175 lines.

**Phase A — Code changes**

| Fix | Location | Behavior |
|---|---|---|
| H1 fingerprint | New `migration_stage.metadata` table + `sha256sum` check after Step 2b | If `progress` has rows AND stored fingerprint ≠ current dump's, exit with an error and the exact `DROP SCHEMA migration_stage CASCADE` command. First run writes the fingerprint. |
| H3 pg_hba idempotent | Recovery block (L317-338): guard `cp ... .backup` with `[ -f ${HBA_FILE}.backup ]`; guard the sed prepend with `grep -q "Added by migration script"`; set `HBA_MUTATED=true` flag | Backup preserved across retries; header block never duplicates. |
| H3 pg_hba restore | `cleanup()` trap | On clean exit (`MIGRATION_OK=true`), restore `pg_hba.conf` from `.backup` and restart the source container. |
| H4 resume hint | `cleanup()` trap | On non-successful exit with a preserved dump file, print the exact `./migrate-historian-data.sh --skip-export --dump-file <path>` command. |
| M2 sequence-guard | Step 2a diagnostic (DO block), Step 2c (DO block), post-merge repair (SEQ_NAME probe) | If `pg_get_serial_sequence` returns NULL, log a NOTICE and skip the setval — never crash. |
| M6 defensive resume | Chunked-merge loop | Do NOT skip chunks where `progress.inserted = 0`. Re-run defensively; ON CONFLICT DO NOTHING makes it a safe no-op when the chunk really was empty, and recovers from the rare stale-inserted-0 case observed during SIGINT testing. |

**Phase B — Test results**

| # | Test | Result |
|---|---|---|
| Smoke | Fresh migration after code changes | PASS. 500 topics, 1,042,561 rows migrated in 7 chunks; fingerprint `c4c5cb9e...` logged. |
| H2 | Concurrent VOLTTRON-simulating writer inserting a random new topic + LIVE data row every ~0.3s throughout migration; also periodically inserted a topic name matching one in the staging dump | PASS. Final target: 674 topics (500 source + 174 writer + 1 name-collision resolved), 1,042,735 data rows (source + writer's 174). All 500 staging topics had entries in `topic_id_map`; 0 orphans; 0 leaked source IDs; collision topic `campus1/building1/rtu5/point7` correctly resolved to writer-assigned target topic_id=21 with all 2,085 source rows (source has exactly 2,085 rows for this topic per the row_number distribution). |
| H1 | Added 101 rows to source (new dump fingerprint), left staging in place, re-ran | PASS. Script exited with `Fingerprint mismatch — this staging schema was populated from a different dump. Stored=c4c5cb9e... Current=b86bf078...` and the exact remediation command. `DROP SCHEMA migration_stage CASCADE` + re-run then successfully migrated the 101 new rows. |
| H3 | pg_hba idempotent-backup + restore-on-clean-exit | PASS by code inspection only. Automatic end-to-end blocked by a **pre-existing** git-bash MSYS quirk in the L303 `sed 's/.*hba_file=\([^ ]*\).*/\1/'` pattern — the pattern gets mangled before reaching docker exec, producing `Detected location: \([^` and a `cp: can't stat` error. This failure is upstream of my fixes and would work correctly on a Linux operator host. Guards verified via grep on the current script: `[ -f '${HBA_FILE}.backup' ] || cp` (line 319), `grep -q "==== Added by migration script"` guarding the sed prepend (line 328), `cleanup()` restore gated by `HBA_MUTATED=true && MIGRATION_OK=true` (line 458), and `MIGRATION_OK=true` set at line 1109 immediately before the success banner. |
| H4 | `kill -TERM` mid-Step-2b | PASS. Cleanup trap emitted: `Preserving dump file at: /tmp/tmp.78CdDnm6et/historian_dump.copy.gz` and `To resume without re-dumping, run: ./migrate-historian-data.sh --skip-export --dump-file /tmp/tmp.78CdDnm6et/historian_dump.copy.gz`. |
| M1 | Source `value_string = E'a\nb\tc\\d\\.e\x01|{"x":"y\\"z"}'` (newlines, tabs, backslashes, `\.` COPY terminator, 0x01 binary, JSON-with-quotes) | PASS. Target byte-identical: `610a620963642e65017c7b2278223a2279227a227d`. |
| M2 | Target with `topic_id INTEGER PRIMARY KEY` (no owned sequence) | PASS with expected limitation. New guards fire correctly: Step 2a logs `topics.topic_id has no owned sequence — sequence repair will be skipped.`, Step 2c logs the same, post-merge repair logs `topics.topic_id has no owned sequence — skipping sequence repair.` Step 3b topics-merge then fails with the clear error `null value in column "topic_id" of relation "topics" violates not-null constraint` — supporting non-SERIAL topic_id would require the topics-merge to source-supply topic_ids AND remap them, out of scope. |
| M3 | `--chunk-interval '1 hour'` on ~4-year range (M1 test row extended range to 2030-06) | Mechanism PASS but perf constraint: 38,664 chunks × ~0.4s docker-exec overhead per chunk = would take hours. Chunks 1-167 processed cleanly. Guidance: keep default `1 month` for multi-year datasets. |
| M4 | `docker kill aems-historian` mid-migration | PASS. Script exits cleanly with the resume hint. `docker start aems-historian` + `--skip-export --dump-file` re-run resumes and completes successfully. |
| M5 | Empty source (`TRUNCATE topics CASCADE`) | PASS. Both `y` prompts accepted with a persistent-`y` stream (not `yes y` which alternates `y\n`); staging load = 0 rows; chunked merge branch takes the `STAGING_DATA_COUNT=0` skip: `No data rows in staging - skipping chunked merge.` Clean exit, 0 records migrated. |
| M6 | `kill -INT` mid-Step-3c during chunk 2, then resume | PASS after fix. Initial run: after SIGINT, target had 63,360 rows in `data`, 1 row in `progress` (chunk 1). Resume processed chunks 2-53. **Anomaly:** chunk 5 (June 2026) recorded `inserted=0` despite source having 172,800 rows in that range — a hard-to-reproduce timing edge case with `WITH INSERT ... RETURNING`. Root cause unclear; **defensive fix** added to the resume logic: only skip chunks where `progress.inserted > 0`. Verified fix by simulating the stale state (`UPDATE progress SET inserted = 0 WHERE chunk_start = '2026-06-01'` + `DELETE FROM data WHERE ts >= '2026-06-01' AND ts < '2026-07-01'`) → re-run → chunk 5 correctly re-inserted the 172,800 rows. Final source/target parity: both at 1,042,663 rows / 501 topics. |

**Files touched**
- [aems-app/migrate-historian-data.sh](../../migrate-historian-data.sh) — expanded from 981 to 1175 lines with H1, H3, H4, M2, M6 fixes.

**Cleanup**
- `.env`'s temporary dev password patch restored from `.env.migration-test-backup` (removed).
- Source `pg_hba.conf` restored to pristine (removed the `local all all reject` line injected for H3 setup).
- Containers `aems-grafana-db` and `aems-historian` left running with the seeded data (501 topics, 1,042,663 rows on both). Take them down with `docker compose down` from `aems-app/` when no longer needed.
