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

### 20260902 — Complete

All plan items applied. Server `yarn check` passes. No prisma/common/client/graphql changes; no migrations. Log file moved to `docs/complete/`.

Deferred / separate concerns noted (not implemented):
- Adding a Traefik-level `ipAllowList` middleware to [aems-app/docker/proxy/historian-tcp.yml](../../docker/proxy/historian-tcp.yml) so the recommended proxy path actually enforces subscriber CIDR restrictions. The deployment guide now warns operators that pg_hba edits are inoperative on this path; the durable fix is a separate task.
