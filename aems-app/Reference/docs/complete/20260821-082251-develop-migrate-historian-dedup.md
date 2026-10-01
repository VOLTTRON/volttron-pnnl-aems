# migrate-historian-dedup — Progress Log

## Problem

The pre-batch version of `migrate-historian-data.sh` ran to completion on a production historian database, leaving `public.topics` with duplicate `topic_name` rows under distinct `topic_id` values and `public.data.topic_id` referencing some of those duplicates. The current batch script's Step 3b builds `migration_stage.topic_id_map` by joining `USING (topic_name)` — with duplicates in `public.topics` that join is cartesian and the INSERT (whose PK is `src_topic_id`) fails. Migration cannot proceed against the corrupted target.

No design doc in `docs/proposed/` — creating this log inline per the develop-workflow rule.

## Approach (from approved plan)

- New **Step 2d — Topic deduplication** in `migrate-historian-data.sh`, run between Step 2c and Step 3.
- Canonical `topic_id` = `MIN(topic_id) per topic_name`.
- Rewrite `public.data.topic_id` from duplicate → canonical; on `(canonical_id, ts)` collision, drop the duplicate row.
- Delete non-canonical `public.topics` rows.
- Re-add `UNIQUE(topic_name)` if missing.
- Single transaction, `LOCK TABLE public.topics IN SHARE ROW EXCLUSIVE MODE`.
- New `--dedup-only` flag; mutually exclusive with `--verify-only`. Skips source-side connectivity, pg_dump, staging load, and chunked merge.

Plan reference: `C:\Users\d3x573\.claude\plans\the-migrate-historian-script-functional-rose.md`.

## Build chain impact

- Prisma: **none** — historian tables are VOLTTRON-owned, not modeled in Prisma.
- Common / server / client: **none**.
- Shell script + docs only.

## Progress

### 2026-08-21 08:22:51 — Started
Plan approved. Progress log created.

### 2026-08-21 08:23-08:27 — Script edits complete
- Added `DEDUP_ONLY=false` to state vars in [aems-app/migrate-historian-data.sh](../../migrate-historian-data.sh#L52) alongside `VERIFY_ONLY`.
- Added `--dedup-only` case to the argument parser (~L182) and its help entry with a repair-oriented description; new usage example after `--verify-only`.
- Added mutex check `--dedup-only` ⊕ `--verify-only` right after the `--chunk-interval` validation.
- Config-echo now emits `"Mode: DEDUP ONLY (Step 2d, no export/merge)"`.
- Gated source-side blocks on `[ "$DEDUP_ONLY" != true ]`: source container check, source DB connectivity, pg_hba.conf mutation path, source stats block (topics/data counts + time range).
- Split the dry-run early-exit so `--dry-run --dedup-only` falls through to Step 2d, which does its own dry-run report.
- Split the confirmation prompt into two branches — a dedup-focused one under `--dedup-only`, and the original migration prompt otherwise.
- Gated Step 1 (export + `DUMP_FP` compute) on `[ "$DEDUP_ONLY" != true ]`; prints a "Step 1/3: Skipped" line in dedup-only mode.
- Gated Step 2b (staging schema + fingerprint check/write) and Step 2c (sequence advance) as a unit — none of them are needed for dedup, which mutates `public.topics`/`public.data` directly.
- Added **Step 2d** inline between Step 2c and Step 3:
  - Pre-check: `SELECT count(*) FROM (SELECT 1 FROM public.topics GROUP BY topic_name HAVING count(*) > 1) g;` plus `pg_constraint` check for `UNIQUE(topic_name)`. No-op with `log_success` when both are clean.
  - Single transaction with `LOCK TABLE public.topics IN SHARE ROW EXCLUSIVE MODE`.
  - `_dup_map` temp table built from `min(topic_id) OVER (PARTITION BY topic_name)`.
  - `DELETE public.data` for `(canonical_id, ts)` collisions BEFORE the rewrite (guarantees no PK violation).
  - `UPDATE public.data SET topic_id = canonical_id`.
  - `DELETE public.topics` for non-canonical rows.
  - `ALTER TABLE ... ADD CONSTRAINT topics_topic_name_key UNIQUE (topic_name)` guarded on `pg_constraint`.
  - Summary parsed from `psql`'s `DELETE N` / `UPDATE N` / `DELETE N` command tags.
  - Post-check refuses to continue if any duplicate groups remain.
- Added early-exit after Step 2d: sets `MIGRATION_OK=true` and `exit 0` under `--dedup-only`, which also suppresses the resume-hint from `cleanup()`.

### 2026-08-21 08:27 — Verification
- `bash -n migrate-historian-data.sh` — SYNTAX OK.
- `bash migrate-historian-data.sh --help` — renders cleanly, `--dedup-only` is listed with the other options and appears in the examples.
- `bash migrate-historian-data.sh --dedup-only --verify-only` — rejected with `[ERROR] --dedup-only and --verify-only cannot be combined`.
- `bash migrate-historian-data.sh --dedup-flumph` — falls through to the unknown-option handler.

### 2026-08-21 08:28 — Docs updated
- [README.md:165](../../../README.md#L165) — the migrate-historian-data.sh entry now mentions `--dedup-only`.
- [docs/proposed/aems-deployment-guide/aems-deployment-guide.md:1304](../../../docs/proposed/aems-deployment-guide/aems-deployment-guide.md#L1304) — same.

### 2026-08-21 08:35-08:50 — Dev-docker verification

Ran the full test matrix against `aems-historian` in the local dev docker environment (501 real topics, 1,042,663 real data rows, unique constraint already present).

Two small issues surfaced and were fixed inline:

1. **Cleanup emitted a misleading "Staging schema 'migration_stage' is retained" hint on the `--dedup-only` exit path** — we never create staging in that mode. Gated the whole staging-hint block on `[ "$DEDUP_ONLY" != true ]` in `cleanup()`.
2. **Summary counter was misordered.** My Step 2d SQL used `CREATE TEMP TABLE _dup_map AS (window-fn query); DELETE FROM _dup_map WHERE dup_id = canonical_id;`. The trailing DELETE emitted a `DELETE N` command tag that stole the first slot in the `awk 'NR==1..3'` parser, so the reported counts were rotated (data-conflicts → dup_map-cleanup, rewrites → conflicts, topics-removed → rewrites). The dedup itself was correct (verified by inspecting post-state); only the summary line was wrong. Fixed by folding the `WHERE dup_id <> canonical_id` filter into the outer SELECT of the CTAS so only one command tag (`SELECT N`) is emitted before the mutating block. Post-fix summary matches actual row counts.

Test scenarios executed:

- **T1: Clean target no-op.** `./migrate-historian-data.sh --dedup-only` on the untouched dev historian. Reported `"No duplicate topic_name groups and UNIQUE(topic_name) present — nothing to do."` and exited cleanly. No mutations.
- **T2: Seeded duplicates.** Dropped `topics_topic_name_key`, inserted 3 rows for `__dedup_test/probe/A` and 2 for `__dedup_test/probe/B`, plus 6 data rows including one deliberate `(canonical_id, ts)` collision on probe/A at 03:00.
- **T3: `--dry-run --dedup-only` against seeded target.** Reported 2 duplicate groups and missing constraint; made no changes (confirmed by re-running the detection query).
- **T4: `--dedup-only` against seeded target.** Reported: 2 groups processed, 3 data rows rewritten (UPDATE), 1 data row dropped as PK dupe (the collision), 3 topics rows removed. Post-state: 2 topic rows remain at MIN(topic_id), 5 data rows all pointing at canonical IDs (collision correctly dropped), 0 orphans, 0 duplicate groups, unique constraint present.
- **T5: Idempotency.** Re-ran `--dedup-only`; reported `"nothing to do"` and exited.
- **T6: Real dev data preservation.** After all tests, deleted the `__dedup_test/*` topics + data. Final counts matched the pre-test baseline exactly: 501 topics, 1,042,663 data rows. None of the real seeded data was touched.

### Operator verification (still open — requires prod-adjacent target)

The plan's scratch-target repro is not executed here. Ops-side runbook:

```sql
-- On a throwaway historian:
ALTER TABLE public.topics DROP CONSTRAINT IF EXISTS topics_topic_name_key;
INSERT INTO public.topics (topic_name, metadata) VALUES ('devices/site/AHU1/temp', '{}'), ('devices/site/AHU1/temp', '{}');
-- Populate data at both IDs, including an overlapping ts on canonical vs dup.
```

Then: `./migrate-historian-data.sh --dry-run --dedup-only` → `./migrate-historian-data.sh --dedup-only` → assert `GROUP BY topic_name HAVING count(*) > 1` returns 0, no orphan data rows, `topics_topic_name_key` constraint present, second `--dedup-only` run reports "nothing to do".

## Build chain summary

- Prisma: no changes.
- Common: no changes.
- Server: no changes.
- Client: no changes.
- Shell + docs only.

## Files changed

- `aems-app/migrate-historian-data.sh` — new state var, arg parser case, mutex check, help/example, source-side gates, dry-run gate, confirm-prompt split, Step 1 gate, Step 2b/2c gate, new Step 2d block, dedup-only early exit.
- `README.md` — script table entry now mentions `--dedup-only`.
- `docs/proposed/aems-deployment-guide/aems-deployment-guide.md` — same.
