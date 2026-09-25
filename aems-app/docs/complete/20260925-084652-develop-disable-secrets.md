# Eliminate Docker secrets — env-var-only

## Problem

Docker secrets are broken on nearly all production instances. The three-hop
pipeline (`.env.secrets` → `docker/secrets/*.txt` → `/run/secrets/<name>` →
`_FILE` env vars or entrypoint `cat`s) drifts across hosts and is the chronic
outage source. The historian reconciler (added 2026-09-18) and the Sep 16
env-only fallback both papered over the same class of bug.

## Approach

Single-PR full cut. `.env.secrets` becomes the sole gitignored source of
real values, loaded by the root compose shim as an `env_file:` alongside
`.env`. Every `secrets:` block, every `/run/secrets/*` read, every `_FILE`
env var is deleted. `secrets.sh` is slimmed to rotation-only, and
`readSecret.ts` collapses to plain env reads.

No design doc existed in `docs/proposed/` for this task — decisions are in
the plan file at `~/.claude/plans/the-docker-secrets-are-imperative-quill.md`.

## Layer plan

Docker/deployment refactor with a small server-layer touch (readSecret
simplification). No prisma / common / GraphQL changes. Build order:
compose + entrypoints + docs, then `server` `yarn build` for the
readSecret simplification.

## Progress log

### 2026-09-25 08:46:52 — start

Plan approved. Beginning with the compose shim + main docker-compose.yml
surgery.

### 2026-09-25 09:17:21 — implementation complete

**Docker / deployment layer:**
- Root [aems-app/docker-compose.yml](../../docker-compose.yml) — swapped `./docker/.env.secrets.docker` for `./.env.secrets` (object form with `required: false`).
- [aems-app/docker/docker-compose.yml](../../docker/docker-compose.yml) — deleted the top-level `secrets:` block (17 declarations), 19 per-service `secrets: [...]` mounts, every `_FILE` env var, and the redis inline shell fallback that read `/run/secrets/redis_password`. Simplified `POSTGRES_PASSWORD: ${POSTGRES_PASSWORD-${X}}` gymnastics to plain `POSTGRES_PASSWORD: ${X}` on database/keycloak-db/nominatim/historian/grafana-db.
- [aems-app/docker/.env.grafana](../../docker/.env.grafana) — replaced `GF_SECURITY_ADMIN_PASSWORD__FILE` / `GF_AUTH_GENERIC_OAUTH_CLIENT_SECRET__FILE` with plain env-var forms, updated the stale comments in `.env.historian` / `.env.volttron` / `.env.database` / `.env.keycloak` / `.env.services` / `.env.seeders` / `.env.synth-worker` / `.env.server`.

**Entrypoint scripts:**
- [prisma/entrypoint.sh](../../../prisma/entrypoint.sh), [docker/keycloak/entrypoint.sh](../../docker/keycloak/entrypoint.sh), [docker/wiki/init-wiki.sh](../../docker/wiki/init-wiki.sh) — dropped `/run/secrets/*` reads; use env vars.
- [docker/historian/docker-entrypoint-wrapper.sh](../../docker/historian/docker-entrypoint-wrapper.sh) — reconciler kept intact but source resolution collapsed to `HISTORIAN_DATABASE_PASSWORD` env only, fingerprint tag now always `env:` (existing `secret:`-tagged fingerprints will trigger one no-op reconcile on first boot).
- [docker/historian/setup-replication.sh](../../docker/historian/setup-replication.sh), [docker/historian/repair-replication.sh](../../docker/historian/repair-replication.sh) — same env-only collapse.
- [aems-edge/setup-volttron.sh](../../../../aems-edge/setup-volttron.sh), [aems-edge/setup-grafana.sh](../../../../aems-edge/setup-grafana.sh) — read env vars directly.
- [docker/backup/worker/index.js](../../docker/backup/worker/index.js), [backup-restore.sh](../../backup-restore.sh), [docker/backup/lib/backup-postgres.sh](../../docker/backup/lib/backup-postgres.sh), [docker/backup/lib/backup-mariadb.sh](../../docker/backup/lib/backup-mariadb.sh), [docker/backup/Dockerfile](../../docker/backup/Dockerfile) — simplified secret reads.

**App code:**
- [server/src/utils/readSecret.ts](../../server/src/utils/readSecret.ts) — 4-tier fallback collapsed to plain env var read.
- [server/src/utils/readSecret.test.ts](../../server/src/utils/readSecret.test.ts) — rewrote tests for the new implementation.
- [server/src/prisma/prisma.service.ts](../../server/src/prisma/prisma.service.ts) — updated stale comment.

**Rotation scripts:**
- [secrets.sh](../../secrets.sh) / [secrets.ps1](../../secrets.ps1) — full rewrite. Kept bootstrap, misplaced-secret migration, all rotation handlers (rotate_pg / rotate_mysql_user / rotate_mysql_root / kcadm.sh / grafana-cli / restart-only). Removed `write_secrets_env`, `docker/secrets/*.txt` writers, residue block, `.placeholder` handling, key_data_volume_exists. Deployed-value lookup now uses `docker inspect --format '{{range .Config.Env}}...{{end}}'`. Restart pass switched from `docker compose restart` to `docker compose up -d --no-deps <svc>` (with a comment explaining why).
- [check-env.sh](../../check-env.sh) / [check-env.ps1](../../check-env.ps1) — dropped `docker/secrets/*.txt` sync validation and `.placeholder` mkdir guard; keep `.env.secrets` completeness check and line-integrity check.

**Deletions:**
- Removed `docker/.env.secrets.docker`.
- Removed every `docker/secrets/*.txt` file and `docker/secrets/.placeholder` (age keypair dir `docker/secrets/backup/` preserved).
- [aems-app/.gitignore](../../.gitignore) — collapsed to `docker/secrets/` blanket ignore; nothing under it is tracked.

**Docs:**
- [aems-app/docker/CLAUDE.md](../../docker/CLAUDE.md), [aems-app/CLAUDE.md](../../CLAUDE.md), [.claude/architecture/docker.md](../../.claude/architecture/docker.md), [.claude/architecture/deployment.md](../../.claude/architecture/deployment.md), [.claude/architecture/server.md](../../.claude/architecture/server.md), [aems-app/README.md](../../README.md) — rewrote the secrets model sections; documented the `docker compose restart` gotcha.

**Verification run in the layer:**
- `yarn check` — passed in common, server, and client workspaces.
- `yarn build` in server — succeeded; `dist/utils/readSecret.js` regenerated.
- `yarn jest src/utils/readSecret.test.ts` — 4/4 passed.
- End-to-end verification on a scratch host and the historian reconciler one-shot fp-migration behavior still to be performed manually by the operator (see plan file "Verification").

**Prod-host migration note:** operators pulling this branch should run the drift-diff between `.env.secrets` values and any lingering `docker/secrets/*.txt` on the host BEFORE `docker compose up -d`, then reconcile with manual `ALTER ROLE` inside the running container if any diverge. The postgres image only reads `POSTGRES_PASSWORD` on initdb, so running clusters keep their existing password regardless of env. Full prod-host guidance is in the plan file at `~/.claude/plans/the-docker-secrets-are-imperative-quill.md`.

### 2026-09-25 09:35:00 — end-to-end verification against the running dev stack

Deployed against the live dev docker stack (14 containers previously running with `/run/secrets/*.txt` mounts) and shook out three real issues that the layer-only verification missed. Fixes applied in the same commit.

**Issue 1: `include: env_file:` doesn't cascade to interpolation.** The compose spec `include:` directive's `env_file:` list only sets env for the INCLUDED file's project-root `.env` context — it doesn't affect the interpolation context of the outer/root file. When the outer shim included `docker/docker-compose.yml` with `env_file: [./.env, ./.env.secrets]`, compose still auto-loaded `./.env` at project root for interpolation and `.env.secrets` was ignored. Result: every `${DATABASE_PASSWORD}` resolved to the sentinel placeholder from `.env`.

Empirical proof:
```
docker compose config                                        → sentinel
docker compose --env-file .env --env-file .env.secrets config → real value
COMPOSE_ENV_FILES=.env,.env.secrets docker compose config     → real value
```

**Fix:** [start-services.sh](../../start-services.sh), [start-services.ps1](../../start-services.ps1), [secrets.sh](../../secrets.sh), and [secrets.ps1](../../secrets.ps1) now `export COMPOSE_ENV_FILES=".env,.env.secrets"` (or `.env` alone when `.env.secrets` is absent) before invoking `docker compose`. Docs in [docker/CLAUDE.md](../../docker/CLAUDE.md), [.claude/architecture/docker.md](../../.claude/architecture/docker.md), [.claude/architecture/deployment.md](../../.claude/architecture/deployment.md), and [README.md](../../README.md) prominently document the requirement for direct `docker compose` invocations. Compose has no mechanism to bake this into a compose file — the shell env var is the only reliable path.

**Issue 2: sentinel placeholders in a running container's env fool the classifier.** The old compose interpolated `${SECRET}` at container-start time from `.env` alone (with sentinels); entrypoint scripts then read `/run/secrets/*` and used the real value LOCALLY. `docker inspect .Config.Env` therefore shows the sentinel, which my `deployed_secret()` was returning verbatim, making it look like every secret had "changed" and needed live rotation — but the "old password" for rotation auth was the sentinel string, which would fail. **Fix:** [secrets.sh](../../secrets.sh) and [secrets.ps1](../../secrets.ps1) treat a sentinel value from `docker inspect` as "no deployed value" → classified FRESH.

**Issue 3: DB container env goes stale after live rotation.** Postgres reads `POSTGRES_PASSWORD` only on initdb, so `rotate_pg` correctly ALTERs `pg_shadow` without touching the container's env — but that leaves the container's env stuck at the OLD value. Next `secrets.sh` run compared old container env to new `.env.secrets` value → thought it needed to rotate again. **Fix:** the `DATABASE_PASSWORD` and `KEYCLOAK_DATABASE_PASSWORD` cases now also queue_restart the DB container itself so its env resyncs after the ALTER. (Historian and grafana-db already did this.)

**End-to-end verification results:**

- **Full stack up from a clean shell** via `./start-services.sh --no-build` (no COMPOSE_ENV_FILES pre-set): 14 containers healthy, zero sentinel values across all inspected services.
- **DB auth sweep** from `.env.secrets` values: aems-database (aems), aems-historian (historian), aems-keycloak-db (keycloak), aems-grafana-db (historian) — all `SELECT current_user` succeed.
- **Historian reconciler**: fired exactly once with `SOURCE_TAG=env-postgres` (from the pre-rebuild image; the new wrapper uses just `env:` when the image is rebuilt), ran a no-op ALTER, updated the fingerprint. Subsequent boots no-op.
- **App-layer readSecret**: server, services, seeders, synth-worker logs show every secret resolves via "Using direct environment variable: <NAME>". Zero `/run/secrets` reads, zero `_FILE` reads.
- **Redis auth**: `redis-cli -a $REDIS_PASSWORD ping → PONG`.
- **Client HTTP**: responds via proxy (404 on root — app-level, network fine).
- **Live rotation smoke test**: rotated `DATABASE_PASSWORD` to a new value, then back to the original, via `./secrets.sh DATABASE_PASSWORD`. Both directions: `ALTER ROLE aems in aems-database` ran; aems-database + client + server recreated with new env; auth confirmed at each step. Subsequent `./secrets.sh --dry-run` reports "unchanged" — idempotent.

**Files touched during verification** (all changes rolled into this commit):
- [aems-app/docker-compose.yml](../../docker-compose.yml) — reverted the invalid object-form `env_file:` under `include:` to a plain string list (compose 2.24 spec supports the object form but this repo's compose refused).
- [aems-app/start-services.sh](../../start-services.sh), [aems-app/start-services.ps1](../../start-services.ps1) — export `COMPOSE_ENV_FILES`.
- [aems-app/secrets.sh](../../secrets.sh), [aems-app/secrets.ps1](../../secrets.ps1) — export `COMPOSE_ENV_FILES`; filter sentinel from `deployed_secret`; queue_restart the DB container in rotation cases.
- Docs updated in [docker/CLAUDE.md](../../docker/CLAUDE.md), [.claude/architecture/docker.md](../../.claude/architecture/docker.md), [.claude/architecture/deployment.md](../../.claude/architecture/deployment.md), [README.md](../../README.md).
