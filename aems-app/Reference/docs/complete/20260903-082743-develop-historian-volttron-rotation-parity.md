# Historian & grafana secret-rotation parity + VOLTTRON fingerprint

Design doc: none in `docs/proposed/` at start of work. Plan is inline (see the approved Claude plan for this session).

## Problem

Two gaps combining into "historian looks broken":

1. `secrets.sh` / `secrets.ps1` have no live-rotation handlers for `HISTORIAN_DATABASE_PASSWORD`, `HISTORIAN_REPLICATOR_PASSWORD`, `GRAFANA_ADMIN_PASSWORD`, `GRAFANA_DATABASE_PASSWORD`, `KEYCLOAK_GRAFANA_CLIENT_SECRET` — they fall through to the `*)` default and only overwrite the file with a warning. Other keys do `ALTER ROLE` / `kcadm.sh` / `grafana-cli` and enqueue restarts.
2. `aems-edge/setup-volttron.sh` caches the historian password into `historian.config` on first run, then gates re-runs with a `.setup_complete` sentinel. If the mounted `/run/secrets/historian_database_password` changes underneath it (rotation, volume wipe, out-of-band edit), the sentinel stays valid and setup skips.

## Approach

- Fingerprint the mounted historian secret next to the sentinel; invalidate on drift.
- Add the five missing rotation handlers to secrets.sh/ps1 with the appropriate `rotate_pg` / `grafana-cli` / `kcadm.sh` action and downstream restarts.
- Extend `rotate_pg` with an optional current-password param so it can talk to the historian's password-required socket auth (custom pg_hba.conf).

## Progress log

### 20260903-082743 — Start

Progress log created. No design doc in `docs/proposed/` for this feature; plan is inline.

### 20260903 — Fingerprint gate + fingerprint write in setup-volttron.sh

- [aems-edge/setup-volttron.sh:169-197](../../../aems-edge/setup-volttron.sh#L169-L197): new `compute_historian_fp()` helper + gate that reads `.setup_complete.fingerprint` and short-circuits only when the stored fingerprint matches the current `sha256sum /run/secrets/historian_database_password`. Drift → re-run.
- [aems-edge/setup-volttron.sh:414-415](../../../aems-edge/setup-volttron.sh#L414-L415): writes the fingerprint alongside the sentinel on successful setup.

### 20260903 — secrets.sh rotation handlers + rotate_pg extension

- [aems-app/secrets.sh:155-171](../../../secrets.sh#L155-L171): 5 new `key_data_volume()` entries.
- [aems-app/secrets.sh:596-621](../../../secrets.sh#L596-L621): `rotate_pg` gained an optional 5th `old_pw` arg for `PGPASSWORD` auth (needed for historian's scram-sha-256 local socket).
- [aems-app/secrets.sh:795-874](../../../secrets.sh#L795-L874): 5 new rotation handlers (HISTORIAN_DATABASE_PASSWORD, HISTORIAN_REPLICATOR_PASSWORD, GRAFANA_DATABASE_PASSWORD, GRAFANA_ADMIN_PASSWORD, KEYCLOAK_GRAFANA_CLIENT_SECRET).
- [aems-app/secrets.sh:919-948](../../../secrets.sh#L919-L948): restart pass special-cases `volttron` (`up -d --force-recreate` so the writable layer is regenerated) and `volttron-setup` (`up -d` since it's `restart: no`).

### 20260903 — secrets.ps1 mirror

- [aems-app/secrets.ps1:148-161](../../../secrets.ps1#L148-L161): 5 new `$SECRET_DATA_VOLUME` entries.
- [aems-app/secrets.ps1:565-594](../../../secrets.ps1#L565-L594): `Invoke-PgRotate` gained an optional `-OldPw` param.
- [aems-app/secrets.ps1:751-838](../../../secrets.ps1#L751-L838): 5 mirrored case blocks.
- [aems-app/secrets.ps1:868-905](../../../secrets.ps1#L868-L905): restart pass mirror with the same `volttron` / `volttron-setup` special cases.

### 20260903 — Documentation updates

- [aems-app/docs/complete/20260813-104248-develop-historian-password-interpolation.md](../complete/20260813-104248-develop-historian-password-interpolation.md): appended a 2026-09-03 post-fix note explaining that the earlier "`./reset-service.sh historian` regenerates the config" claim was only true first-time and pointing at the new fingerprint mechanism.
- [aems-app/README.md](../../../README.md): new troubleshooting subsection under the historian section for `password authentication failed for user "historian"`.
- [docs/proposed/aems-deployment-guide/aems-deployment-guide.md](../../../../docs/proposed/aems-deployment-guide/aems-deployment-guide.md): new `Historian Password Recovery` section between the replication recovery and the Direct kcadm Recovery sections.

### 20260903 — End-to-end verification on the currently-broken dev deployment

The exact scenario this fix was designed to heal: yesterday's testing left `docker/secrets/historian_database_password.txt` = `password` while volttron-setup's `.setup_complete` sentinel was still pinned to the pre-fix cached placeholder, causing `password authentication failed for user "historian"` on every SQLHistorian connection attempt for ~20 hours.

Recovery test:

1. `docker compose build volttron-setup` — image picks up the new setup-volttron.sh.
2. `./reset-service.sh volttron-setup` — clears the stale sentinel (reset-service also brings the rest of the stack back up).
3. On the fresh `up`, volttron-setup ran to completion, wrote `.setup_complete` + `.setup_complete.fingerprint` (both visible via `docker run --rm -v aems_volttron-setup:/mnt alpine ls /mnt/`).
4. `historian.config` on disk now contains `"password": "password"` instead of the placeholder.
5. Post-setup, `docker logs aems-volttron | grep -iE 'historian_setup'` showed clean setup with no `password authentication failed` errors.
6. `\dt public.*` on the historian confirmed `public.data` and `public.topics` created; row counts climbed to 318/318 within ~90 seconds as VOLTTRON's `platform.driver` started publishing.
7. `pg_publication_tables WHERE pubname='historian_pub'` correctly listed both public tables (schema-scoped auto-inclusion from the earlier durable-fix work).

Fingerprint gate tests:

- **Idempotency**: `docker compose up -d --force-recreate volttron-setup` on the healthy stack with no secret change — log shows `Historian secret fingerprint unchanged - nothing to do` and setup exits at the gate. ✅
- **Drift detection**: manually overwrote `.setup_complete.fingerprint` on the volume with a bogus hash, forced recreate — log shows `Historian secret changed since last setup - regenerating configs` and full setup re-runs. ✅
- **Post-drift fingerprint**: after the re-run, `.setup_complete.fingerprint` on the volume matches `sha256sum docker/secrets/historian_database_password.txt` exactly. ✅

### 20260903 — Complete

All plan items applied and tested end-to-end. Broken dev deployment is now recovered — VOLTTRON's SQLHistorian is connected and writing. Log file moved to `docs/complete/`.
