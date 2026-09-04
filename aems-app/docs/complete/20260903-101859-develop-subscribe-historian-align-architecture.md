# Align subscribe-historian.sh with Docker Compose architecture

Follow-on refactor to the just-completed [20260903-092049 resumable subscriber provisioning](../complete/20260903-092049-develop-resumable-subscriber-provisioning.md).

## Problem

That work shipped `aems-app/subscribe-historian.sh` as a host-side script that requires `psql` and `pg_dump` on the operator's PATH. Every other historian-side operator tool in this stack (`repair-historian-replication.sh`, `secrets.sh`, `reset-service.sh`, `migrate-historian-data.sh`) is a thin host wrapper that `docker exec`s into the appropriate container. The historian image already ships psql, pg_dump, and bash — the workhorse belongs there.

## Approach

Split into image-baked worker + thin host wrapper, mirroring the [repair-historian-replication.sh](../../../repair-historian-replication.sh) → [aems-app/docker/historian/repair-replication.sh](../../docker/historian/repair-replication.sh) pattern established earlier this session.

- Image-baked: `aems-app/docker/historian/subscribe-historian.sh` (all the workhorse logic from the earlier monolithic script).
- Host wrapper: `aems-app/subscribe-historian.sh` (+ .ps1) — thin, docker-exec-based, no psql on host.
- PowerShell wrapper becomes a full functional wrapper (no more WSL fallback) since it only needs Docker.

## Progress log

### 20260903-101859 — Start

Progress log created. Refactor scoped in the plan file.

### 20260903 — Files moved and rewritten

- Copied [aems-app/subscribe-historian.sh](../../../subscribe-historian.sh) to [aems-app/docker/historian/subscribe-historian.sh](../../docker/historian/subscribe-historian.sh), then adjusted for in-container defaults:
  - Subscriber defaults to local unix socket + `${POSTGRES_USER:-historian}` + `${POSTGRES_DB:-historian}`; reads subscriber password from `/run/secrets/historian_database_password` (mounted secret).
  - Publisher password priority: `$PGPASSWORD_PUBLISHER` → `--publisher-password` → `--publisher-password-file`.
  - New `subscriber_psql()` helper picks socket vs TCP based on whether `--subscriber-host` was passed. Three raw `psql | psql` pipes in Steps 1, 2, and 5 refactored to funnel through the helper so socket mode Just Works.
- [aems-app/docker/historian/Dockerfile](../../docker/historian/Dockerfile): new `COPY subscribe-historian.sh /usr/local/bin/…` + chmod, alongside the existing repair-replication.sh copy.
- [aems-app/subscribe-historian.sh](../../../subscribe-historian.sh): rewritten as a ~120-line thin wrapper, mirroring [aems-app/repair-historian-replication.sh](../../../repair-historian-replication.sh). Loads `.env`, resolves `${COMPOSE_PROJECT_NAME}-historian`, verifies container is running, verifies baked-in script is present, forwards publisher password via `-e PGPASSWORD_PUBLISHER=…` on the docker exec, forwards all other flags verbatim. Confirmation prompt + `--dry-run` + `--yes`.
- [aems-app/subscribe-historian.ps1](../../../subscribe-historian.ps1): rewritten as full PowerShell wrapper (no more WSL fallback). Same shape as the bash wrapper. Uses `& docker @DockerArgs` splat for correct argv handling.

### 20260903 — Client + docs updates

- [aems-app/server/src/historian/historian.service.ts](../../server/src/historian/historian.service.ts) `backfillCommand`: emitted command now reads `./subscribe-historian.sh --publisher-host … --publisher-password …` (from the subscriber's aems-app/ directory, only Docker needed on host). Mentions the alternative explicit-container form.
- [aems-app/client/src/app/historian/page.tsx](../../../client/src/app/historian/page.tsx) Card 5 callout: updated to describe the docker-exec architecture and mention the explicit-container alternative.
- [aems-app/README.md](../../../README.md): three references to `subscribe-historian.sh` updated — dropped "on the subscriber host with psql on PATH" caveats, replaced with "from the subscriber deployment's aems-app/ directory (only Docker needed on the host)."
- [docs/proposed/aems-deployment-guide/aems-deployment-guide.md](../../../../docs/proposed/aems-deployment-guide/aems-deployment-guide.md): Step 3 backfill instructions and prerequisites blocks updated to reflect the container-based architecture. Both the "Off-Site Historian Replication" prerequisites (§809-825) and the Deep-Ops Reference "Subscriber-Side SQL Setup" section (§1129+) rewritten around the aems-historian container as the recommended subscriber shape, with the bare-Postgres path documented as an escape hatch. "Long Outages" callout updated too.

### 20260903 — End-to-end test on the dev env via the new wrapper

Rebuilt historian image so `/usr/local/bin/subscribe-historian.sh` is baked in. Brought up a `test-subscriber` container using `localhost/aems/historian:latest` (matches production subscriber shape) with the publisher's cert volume mounted and password secrets bound in from the publisher's `docker/secrets/*` files. Ran the wrapper with `TARGET_CONTAINER=test-subscriber` env override to point it at the test container.

Test results:

| Scenario | Result |
|---|---|
| `--dry-run --yes` via wrapper | Wrapper resolved target container, verified baked-in script present, docker-execed the inner. All 8 chunks listed correctly. ✅ |
| Fresh provisioning (real run, `--start-ts '2026-09-03 12:00:00'`) | Step 1 DDL clone (2 tables + sequence), Step 2 topics COPY (332 rows), Step 3 subscription created with `copy_data=false, slot_name='historian_test_sub_slot'`, Step 4 progress table, Step 5 2 chunks backfilled (71,607 + 26,236 rows = 97,843 total). ✅ |
| Streaming state | `pg_stat_replication` shows `historian_test_sub` in `state=streaming`; slot `active, wal_status=reserved`; both `topics` and `data` at `srsubstate='r'`; publisher `max(ts)` = subscriber `max(ts)`. ✅ |
| `yarn check` | Passes cleanly in `server/` and `client/`. ✅ |

Cleanup: test-subscriber container removed, test slot dropped, tmp secrets deleted. Publisher back to a clean state (no active subscriptions from the test — the user's `historian_sub_slot` is separately gone, appears to have been dropped on their end during the session).

### Deviation notes

- `--subscriber-host` / `--subscriber-user` / etc. are retained on the inner script for the "point at some other Postgres" case, but the wrapper doesn't expose them cleanly — the inner script is expected to default to the container's local socket. If an operator needs to point the inner script at a non-local subscriber Postgres, they can pass those flags through the wrapper and they'll be forwarded verbatim.
- The wrapper's confirmation prompt runs on the host; when the operator confirms, the wrapper appends `--yes` to the inner script's argv to prevent a second prompt.

### 20260903 — Complete

Architectural refactor complete and verified end-to-end via `docker exec` through the new wrapper. No psql/pg_dump on the host required. Progress log moved to `docs/complete/`.
