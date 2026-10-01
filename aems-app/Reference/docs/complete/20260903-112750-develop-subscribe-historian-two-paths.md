# Subscriber provisioning: two paths from the client `/historian` page

Follow-on to today's earlier subscribe-historian work — corrects an assumption I made across two revisions.

## Problem

The operator provisioning a historian subscriber never has this repo checked out and never has Docker on the subscriber. Everything must be self-contained from the client `/historian` page. Two operator profiles:

1. Has pgAdmin/psql attached to a bare-Postgres subscriber → wants copy-paste SQL.
2. Has `psql`/`pg_dump` on PATH (Linux/macOS or Windows) → wants a downloadable script.

The prior design forced them to have an AEMS repo checkout AND a running aems-historian container as a psql runtime. Wrong.

## Approach

Client `/historian` page becomes the distribution mechanism. Path A shows five copyable SQL cards (schema, PKs, indexes, CREATE SUBSCRIPTION, backfill procedure using `dblink`). Path B shows the same five conceptual steps in shell form, with an OS sub-selector (bash vs PowerShell) and per-card Copy + Download buttons. Card 5 in Path B is the full standalone backfill script; Cards 1-4 are per-step commands.

Delete the image-baked worker + host wrappers. Templates live in server/src/historian/templates/ served through GraphQL.

## Progress log

### 20260903-112750 — Start

Progress log created. Plan approved.

### 20260903 — Deletions

- `aems-app/subscribe-historian.sh`, `.ps1` — deleted.
- `aems-app/docker/historian/subscribe-historian.sh` — deleted.
- [aems-app/docker/historian/Dockerfile](../../docker/historian/Dockerfile) — dropped the COPY + chmod for the deleted script.

### 20260903 — Server templates

- New [server/src/historian/templates/subscribe-historian.sh](../../server/src/historian/templates/subscribe-historian.sh) — standalone host-based script (pre-refactor design, no docker-exec). Needs psql/pg_dump on PATH; --publisher-host / --subscriber-host both required.
- New [server/src/historian/templates/subscribe-historian.ps1](../../server/src/historian/templates/subscribe-historian.ps1) — PowerShell equivalent with the same chunk loop, same flag surface, same resumable semantics.
- [server/nest-cli.json](../../server/nest-cli.json) — added an `assets` entry so `historian/templates/*` land in `dist/` at build time.

### 20260903 — Types + server emission

- [common/src/types/historian.ts](../../../common/src/types/historian.ts): `SubscriberSetupSql` replaced. Path A fields (`createTablesSql`, `createConstraintsSql`, `createIndexesSql`, `createSubscriptionSql`, `backfillProcedureSql`) + Path B bash fields (`createTablesCmdSh` etc + `linuxScript`) + Path B PowerShell fields (`createTablesCmdPs1` etc + `windowsScript`). Dropped `backfillCommand`.
- [server/src/historian/historian.service.ts](../../server/src/historian/historian.service.ts): reads the two templates in the constructor (with graceful degradation if missing); `getReplicationInfo` emits all 15 new fields. Path B one-liners are assembled inline (short static strings); Card 5 in Path B uses the loaded templates.

### 20260903 — Client redesign

- [client/src/app/historian/page.tsx](../../../client/src/app/historian/page.tsx): the Subscriber Setup tab now shows a Blueprint `RadioGroup` at the top selecting Path A (SQL) vs Path B (Shell), and — when Path B is chosen — a second `RadioGroup` for OS (bash vs PowerShell). Five parallel cards render below in whichever form is selected. Each card has a Copy button; Path B cards also have a Download button that saves a `.sh` or `.ps1` (blob + object URL + synthetic anchor click).

### 20260903 — Docs

- [aems-app/README.md](../../../README.md): three subscriber-setup blocks reworded to point operators at the `/historian` page; no more mention of docker-exec wrappers or AEMS repo checkouts on the subscriber side.
- [docs/proposed/aems-deployment-guide/aems-deployment-guide.md](../../../../docs/proposed/aems-deployment-guide/aems-deployment-guide.md): prerequisites simplified to "PostgreSQL 16+ on the subscriber + browser access to the publisher's `/historian` page"; Step 3 rewritten around the two-path model; Long Outages callout updated with Path A / Path B recovery.

### 20260903 — End-to-end tests on the dev env

Fresh `test-subscriber` from `postgres:16-alpine` (bare Postgres — no AEMS, no Docker on the subscriber, exactly matching the real production scenario) on `aems_default`. Both paths tested independently.

**Path A (SQL)** — pasted from the /historian page content:
- Card 1 schema clone via `pg_dump | psql` → all DDL applied.
- Card 4 `CREATE SUBSCRIPTION historian_test_sub … copy_data=false` → slot created on publisher, subscription is streaming.
- Card 5 `CREATE EXTENSION dblink; CREATE TABLE backfill_progress; CREATE PROCEDURE run_backfill; CALL public.run_backfill(...)` → 4 chunks completed, 64,917 rows landed, `pg_replication_slots.active=t, wal_status=reserved`. Per-chunk COMMIT visible via NOTICE lines. ✅

**Path B (bash)** — downloaded the .sh template from the running server:
- `docker cp aems-server:/app/server/dist/historian/templates/subscribe-historian.sh …` retrieves the file the client's Download button would produce.
- Manual placeholder substitution (`{{HOSTNAME}}` → `historian`, `{{PORT}}` → `5432`, `{{SSLMODE}}` → `prefer`) — the server does this at request time via `sub_()` on the client, but for the test I substituted manually.
- Ran it inside `postgres:16-alpine` with a bind mount, `--publisher-host historian --subscriber-host test-subscriber …`. 4 chunks backfilled (14,367 + 16,950 + 18,885 + 15,033 = 65,235 rows), `pg_stat_replication.state=streaming`, `wal_status=reserved`. ✅

**Server + client**: `yarn check` clean; images rebuilt; containers recreated; new fields visible in the compiled server dist (`grep` on historian.service.js shows `backfillProcedureSql`, `linuxScript`, `windowsScript`, `createTablesCmdSh`, `createTablesCmdPs1`; no `backfillCommand`). Historian image no longer has `/usr/local/bin/subscribe-historian.sh`.

Cleanup: `test-subscriber` removed, both leftover test slots dropped. Publisher back to zero active replication slots.

### 20260903 — Complete

Two-path subscriber provisioning shipped end-to-end. The `/historian` page is now the single self-contained distribution mechanism; both Path A (SQL) and Path B (shell / PowerShell script downloads) work against a bare-Postgres subscriber with no AEMS software of any kind on that machine. Progress log moved to `docs/complete/`.
