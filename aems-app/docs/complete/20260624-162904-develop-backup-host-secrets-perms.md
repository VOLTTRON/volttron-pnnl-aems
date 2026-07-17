# Develop log: backup container `/host-secrets` permission denied

**Slug:** `backup-host-secrets-perms`
**Started:** 2026-06-24 16:29:04 UTC
**Plan:** `~/.claude/plans/the-backup-container-isn-t-mighty-unicorn.md` (no design doc in `docs/proposed/` — fix is small, plan was authored inline during planning)

## Problem

`backup` sidecar restart-looping with:

```
mkdir: cannot create directory '/host-secrets': Permission denied
```

Caused by `USER node` in the Dockerfile + bind-mount/tmpfs root ownership on Docker Desktop for Windows.

## Layers in scope

- **Prisma**: not touched
- **Common**: not touched
- **Server**: not touched
- **Client**: not touched
- **Docker**: Dockerfile, entrypoint.sh, docker-compose.yml (backup service tmpfs)

## Progress

### 2026-06-24 16:29 UTC — Docker layer edits

- `aems-app/docker/backup/Dockerfile`: added `su-exec` to apk install list; removed `USER node` (kept the build-time `mkdir`+`chown` for named-volume first-creation).
- `aems-app/docker/backup/entrypoint.sh`: switched to two-phase pattern. When started as root, chowns `/host-secrets` and `/var/lib/backup` (best-effort), then `exec su-exec node:node "$0" "$@"` to re-enter as node. The init-keys.sh call and worker exec now run as node, so generated `age.key` files inherit correct ownership.
- `aems-app/docker/docker-compose.yml`: added `uid=1000,gid=1000` to the two tmpfs entries so they're node-owned at mount time (chown becomes belt-and-suspenders).
- Plan deviation worth noting: original plan ran init-keys.sh as root with the privilege drop happening only at the final `exec`. Caught during implementation that this would create root-owned `age.key` files on first boot that node couldn't read. Re-exec'ing as node before init-keys.sh is the cleaner fix and what got committed.
- `init-keys.sh`: no change required.

Status: edits complete. Pending: rebuild + verification.

### 2026-06-24 16:35 UTC — Rebuild + verify

- `docker compose build backup` from `aems-app/` — succeeded, new image `localhost/aems/backup:latest` (sha256 272a1dbe…).
- `docker compose up -d --force-recreate backup` — container started.
- Status: was `Restarting (1)` 51 min, now `Up 20 seconds` (no longer restart-looping).
- Logs:
  ```
  [init-keys] Existing private key found at /host-secrets/age.key
  [init-keys] Active public key:   age135ml5s0wup47uy86srwfnc3j6rucht7520xfy8pr0s3zrn8mds2q827lk4
  [init-keys] Key initialization complete.
  [backup-worker backup-1-b9561e] Worker starting (workspace=/workspace, server=http://server:3000, poll=5000ms, heartbeat=10000ms)
  ```
  Existing keypair preserved (init-keys.sh's existing-key branch fired). No regeneration.
- `docker compose exec backup ps -o pid,user,comm` shows PID 1 = `node` user. Privilege drop via su-exec re-exec confirmed working. (Plain `exec ... id` returns root because exec defaults to root when no USER directive — the worker process is what matters.)
- `docker compose exec backup docker ps` lists the running stack — socket access via `docker` group intact after privilege drop.
- Host-side `aems-app/docker/secrets/backup/` still shows May 12 timestamps on `age.key`/`age.pub`/`archive/` — keypair untouched.

Final: PASS. No follow-up layers (prisma/common/server/client) required.

Note about the working-tree state: there were unrelated pre-existing edits to `aems-app/docker/docker-compose.yml` (removed `ports:` blocks under keycloak/grafana/grafana-db that were misplaced label fragments) — left alone, not part of this fix.

