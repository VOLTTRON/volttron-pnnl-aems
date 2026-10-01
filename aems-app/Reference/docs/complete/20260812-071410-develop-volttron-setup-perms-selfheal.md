# Develop log — volttron-setup perms self-heal

## Problem

Same failure as [20260720-081721-develop-volttron-setup-perms.md](../complete/20260720-081721-develop-volttron-setup-perms.md), still occurring on Linux deployments that were initialized before that fix landed:

```
[ControlService] Error: EACCES: permission denied, scandir '/app/volttron/templates'
  at getConfigFiles (/app/server/dist/utils/file.js:30:50)
```

The `chmod -R a+rX "${OUTPUT_DIR}"` from the earlier fix sits behind the `.setup_complete` lock check in [aems-edge/setup-volttron.sh:157-168](../../../aems-edge/setup-volttron.sh#L157-L168) and [aems-edge/setup-grafana.sh:276-287](../../../aems-edge/setup-grafana.sh#L276-L287). The lock lives in the `volttron-setup` named docker volume, so pre-fix deployments carry a stale lock into the new code and the chmod is skipped forever. Prior doc's Concerns line 71 called this out as a follow-up.

## Chosen approach

Insert an idempotent, pre-gate `chmod -R a+rX "${OUTPUT_DIR}"` (guarded by `-d`) in both setup scripts, before the lock check. Heavy setup work still short-circuits on the lock; only the cheap perm fix runs unconditionally. Self-heals existing deployments on next `docker compose up` — no volume wipe or host chmod required.

## Layers

No prisma / common / server / client changes. Shell scripts only.

### aems-edge/setup-volttron.sh
- 20260812-071410 — inserted `if [[ -d "${OUTPUT_DIR}" ]]; then chmod -R a+rX "${OUTPUT_DIR}"; fi` between the "Starting" log (line 151) and the `VOLTTRON_LOCK_FILE` check (now at line 167). Runs on every start; no-op on fresh installs. DONE.
- 20260812-071410 — `bash -n` clean. DONE.

### aems-edge/setup-grafana.sh
- 20260812-071410 — inserted the same guarded block between the "Starting" log (line 270) and the `GRAFANA_LOCK_FILE` check. DONE.
- 20260812-071410 — `bash -n` clean. DONE.

### Final check
- 20260812-071410 — no TS/GraphQL touched, so no `yarn check` needed. shellcheck not available in this environment; both scripts pass `bash -n`. Manual verification steps documented in the plan file and reproduced in the "Recovery / verification" section below. DONE.

## Recovery / verification for the affected Linux deployment

The reporting deployment already has the stale-lock state that this fix targets. On that host:

```bash
# 1. Confirm current failure
docker compose logs services 2>&1 | grep -c 'EACCES.*/app/volttron/templates'   # expect > 0

# 2. Pull, rebuild the two setup sidecars, and let them run once. Do NOT wipe volumes.
git pull
docker compose build volttron-setup grafana-setup
docker compose up -d volttron-setup grafana-setup

# 3. Confirm the new pre-gate chmod block executed even though the lock short-circuits the rest
docker compose logs volttron-setup | grep 'Ensuring output tree is world-readable'
docker compose logs grafana-setup  | grep 'Ensuring output tree is world-readable'

# 4. Confirm host tree is readable
ls -ld aems-app/docker/volttron/setup/templates                             # expect drwxr-xr-x
find aems-app/docker/volttron/setup/templates -type d ! -perm -a+rx         # expect empty
find aems-app/docker/volttron/setup/templates -type f ! -perm -a+r          # expect empty

# 5. Restart the consumer; loop should clear
docker compose restart services
sleep 30
docker compose logs --since 30s services | grep -c 'EACCES.*/app/volttron/templates'   # expect 0
```

Fresh-install regression: on a scratch host with no persisted volumes, the pre-gate block is a no-op because the bind-mount dir exists but is empty, `chmod -R` walks nothing, then setup runs normally and the tail chmod at line 383 (was 371) still executes.

## Concerns

- No new attack surface. Same `a+rX` "world-readable inside container" already accepted by the 2026-07-20 doc.
- Windows dev environment can't reproduce the bug (files owned by the Windows user, not root:root with mode 0700). Verification is Linux-only, documented above.
- Still doesn't fully solve the "lock file is a boolean, not a version stamp" concern from the prior doc — but for a chmod-only fix, running the chmod every start is strictly better than versioning the lock. If a future fix needs to re-run heavy setup, the lock-versioning follow-up will still be needed.
