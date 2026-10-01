# Historian replication — durable fix

Design doc: none in `docs/proposed/` at start of work. Plan lives in the approved Claude plan file for this session and is reproduced below in condensed form for reference.

## Problem

Two live deployments broken:
1. `historian_pub` is `FOR ALL TABLES` (setup-replication.sh:105). `migrate-historian-data.sh` creates `migration_stage` schema and leaves it in place for resume, so its unlogged tables auto-join the publication. Subscribers fail `CREATE SUBSCRIPTION` with `schema "migration_stage" does not exist` (SQL state 3F000).
2. `historian_pub` has zero tables on one deployment. `setup-replication.sh` runs only on fresh volumes; no post-init repair automation exists. `fix-replication.sql` is documented as recreating the publication but does not.

## Approach

- Narrow publication scope to `FOR TABLES IN SCHEMA public` at fresh init.
- Add an image-baked repair script (`/usr/local/bin/repair-replication.sh` in the historian container) + a user-facing wrapper at `aems-app/repair-historian-replication.{sh,ps1}`.
- Auto-drop `migration_stage` on successful migration completion; keep `--keep-staging` opt-out; preserve retention on incomplete/interrupted runs (resume).
- Delete the dead `ensureTablesInPublication()` in `historian.service.ts` — it silently errored on `FOR ALL TABLES` publications and is redundant under schema-scoped scope.
- Update docs (deployment guide + README troubleshooting).

## Progress log

Entries appended below as each layer completes or fails.

### 20260902-111917 — Start

- Progress log created. No design doc in `docs/proposed/` for this feature; plan is inline.

### 20260902 — Publication scope narrowed

- Edited [aems-app/docker/historian/setup-replication.sh:101-108](../../docker/historian/setup-replication.sh#L101-L108): `CREATE PUBLICATION historian_pub FOR TABLES IN SCHEMA public` in place of `FOR ALL TABLES`. Guard `IF NOT EXISTS` retained.

### 20260902 — Image-baked repair script

- Created [aems-app/docker/historian/repair-replication.sh](../../docker/historian/repair-replication.sh): idempotent publisher-side repair. Detects publication scope, rebuilds if `FOR ALL TABLES` / non-public / missing, drops `migration_stage`, re-applies replicator grants + PKs. Supports `--dry-run`.
- Edited [aems-app/docker/historian/Dockerfile:12-18](../../docker/historian/Dockerfile#L12-L18): `COPY` the script to `/usr/local/bin/repair-replication.sh` and `chmod 755`.

### 20260902 — User-facing wrappers

- Created [aems-app/repair-historian-replication.sh](../../../repair-historian-replication.sh): `.env` loader, `--dry-run` / `--yes` flags, container liveness check, refuses if the baked-in script is missing.
- Created [aems-app/repair-historian-replication.ps1](../../../repair-historian-replication.ps1): PowerShell companion following `reset-service.ps1` conventions.

### 20260902 — fix-replication.sql header note

- Edited [aems-app/docker/historian/fix-replication.sql:1-16](../../docker/historian/fix-replication.sql#L1-L16): clarified subscriber-side scope, corrected outdated "drops and recreates the publication" documentation lineage, pointed operators at `repair-historian-replication.sh` for publisher-side issues.

### 20260902 — Auto-drop migration_stage on success

- Edited [aems-app/migrate-historian-data.sh](../../../migrate-historian-data.sh): after `MIGRATION_OK=true`, execute `DROP SCHEMA IF EXISTS migration_stage CASCADE` unless `--keep-staging`. Retained the manual-drop hint on the `--keep-staging` path. Updated `RESUMABILITY:` help text and cleaned up the `cleanup()` retention hint so it only fires on incomplete runs.

### 20260902 — Removed dead server code

- Deleted `ensureTablesInPublication()` (was silently erroring on `FOR ALL TABLES` publications; redundant under `FOR TABLES IN SCHEMA public`) and its call site in `getReplicationInfo()` from [aems-app/server/src/historian/historian.service.ts](../../server/src/historian/historian.service.ts).
- Verification: `yarn check` (tsc --noEmit) passed with exit 0. `yarn lint` on the modified file passed with exit 0.

### 20260902 — Docs updated

- Deployment guide [docs/proposed/aems-deployment-guide/aems-deployment-guide.md](../../../../docs/proposed/aems-deployment-guide/aems-deployment-guide.md):
  - Line 794: publication scope description updated to `FOR TABLES IN SCHEMA public`.
  - Added a caveat that `pg_hba.conf` IP restrictions do not apply on the Traefik proxy path (subscribers appear as Docker-network IPs); IP restriction must live at the host firewall.
  - "Resetting Wedged Replication" rewritten to split publisher-side (`repair-historian-replication.sh`) from subscriber-side (`fix-replication.sql`) recovery, and corrected the incorrect claim that `fix-replication.sql` recreates the publication.
- [aems-app/README.md](../../../README.md): troubleshooting section (publication does not exist / no tables published / `schema "..." does not exist`) rewritten to point at the new repair wrapper.

### 20260902 — End-to-end testing in local dev environment

Rebuilt the historian image and exercised the full flow against a running container.

**Bugs found and fixed during testing:**

1. **`repair-replication.sh` had no way to authenticate to psql inside the container.** `pg_hba.conf` requires `scram-sha-256` even for local socket connections as the `historian` user (only `postgres` has `local peer` auth), so `psql -U ${POSTGRES_USER}` failed with `password authentication failed`. Fix: source the mounted `/run/secrets/historian_database_password` into `PGPASSWORD` at the top of the script, with a `POSTGRES_PASSWORD` env fallback.

2. **User-facing wrapper broke on Git Bash / MSYS.** `docker exec $CT test -x /usr/local/bin/repair-replication.sh` gets its container-side path rewritten to `C:/Program Files/Git/usr/local/bin/...` before docker sees it, so the presence check always fails and the wrapper aborts with a misleading "script missing" message. Fix: `export MSYS_NO_PATHCONV=1` in the wrapper before invoking docker exec.

**Test results:**

- **Broken deployment simulation.** Started with a pre-existing volume that had `historian_pub` as `FOR ALL TABLES` and a leaked `migration_stage` schema (3 tables visible in `pg_publication_tables`, 2 additional UNLOGGED tables skipped from the view but still present as objects). `./repair-historian-replication.sh --dry-run` correctly reported: `puballtables=true`, `5 tables in publication (3 non-public)`, `migration_stage: present`. `./repair-historian-replication.sh --yes` rebuilt the publication (post-state: `puballtables=f`, 2 tables in publication, both `public`), dropped `migration_stage` (5 cascaded object drops), re-applied grants, no orphan slots.

- **Idempotency.** Re-ran `--dry-run` on the healthy deployment: reported `publication scope already correct — no publication change`. Re-ran the full repair with `--yes`: state unchanged, no publication rebuild, `migration_stage` still absent. Safe as a routine operator action.

- **Fresh init.** Removed the `aems_historian-data` volume and recreated the container. `setup-replication.sh` ran during init and produced a publication with `puballtables=false`, `pg_publication_namespace` covering `public`, and zero tables (VOLTTRON hadn't populated `data`/`topics` yet — this is the expected "empty publication" state, distinct from the broken "empty publication" case).

- **Leak resistance.** On the fresh instance, created `public.topics`, `public.data`, and `migration_stage.foo`. Publication auto-included both public tables and correctly excluded `migration_stage.foo`. Confirms the durable fix by construction.

- **Auto-drop SQL.** Executed the `DROP SCHEMA IF EXISTS migration_stage CASCADE` statement that `migrate-historian-data.sh` will run on success against a container with `migration_stage.foo`: dropped cleanly with a `NOTICE: drop cascades to table migration_stage.foo`.

### 20260902 — Complete

All plan items applied and tested end-to-end in the local Docker dev environment. Server `yarn check` passes. No prisma/common/client/graphql changes; no migrations. Log file moved to `docs/complete/`.

Deferred / separate concerns noted (not implemented):
- Adding a Traefik-level `ipAllowList` middleware to [aems-app/docker/proxy/historian-tcp.yml](../../docker/proxy/historian-tcp.yml) so the recommended proxy path actually enforces subscriber CIDR restrictions. The deployment guide now warns operators that pg_hba edits are inoperative on this path; the durable fix is a separate task.
