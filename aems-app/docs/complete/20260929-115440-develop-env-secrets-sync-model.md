# .env is the single compose input; secrets.sh syncs from .env.secrets

## Problem

The prior refactor
([20260929-101305-develop-drop-compose-secret-interpolation.md](../complete/20260929-101305-develop-drop-compose-secret-interpolation.md))
tried to keep `.env.secrets` in the compose read path by mounting it as
`env_file: [../.env.secrets, ...]` on every service and adding entrypoint
aliases to hit image-native env-var names. Two things went wrong:

1. Stateful containers (Grafana `grafana.db`, Keycloak realm DB) don't
   re-key their stored admin hash when env changes. Setting the env at
   container start doesn't fix a stale password. Dashboards broke.
2. The `../.env.secrets` traversal from `docker/docker-compose.yml` is
   architecturally ugly.

User-directed correction: **`.env` is the single input compose reads.
`.env.secrets` (optional, gitignored) is an operator-editable overlay.
`secrets.sh` overlays values from `.env.secrets` onto `.env` in place
before compose runs.** Compose then auto-loads `.env` normally. No
`--env-file`, no `COMPOSE_ENV_FILES`, no service-level `env_file`
mount of `.env.secrets`, no `../` traversal.

Full design: `~/.claude/plans/the-docker-secrets-are-imperative-quill.md`.

## Progress log

### 2026-09-29 11:54 — implementation complete, awaiting verification

**Reverts (`git checkout`):**
- [docker/docker-compose.yml](../../docker/docker-compose.yml) — all 17
  services back to pre-refactor `env_file: [.env.<svc>]` only; every
  `POSTGRES_PASSWORD`, `WORKER_TOKEN` `environment:` block restored;
  compose-inline `entrypoint:` overrides removed.
- [docker-compose.yml](../../docker-compose.yml) (root shim) — `include:`
  `env_file:` back to `[./.env]` only.
- Every `docker/.env.<svc>` — restored `KEY=${SECRET_KEY}` shim lines.
- [docker/database/Dockerfile](../../docker/database/Dockerfile) — plain
  PostGIS-on-postgres:16; no `ENTRYPOINT` override.
- [docker/grafana/entrypoint.sh](../../docker/grafana/entrypoint.sh),
  [docker/keycloak/entrypoint.sh](../../docker/keycloak/entrypoint.sh),
  [docker/historian/docker-entrypoint-wrapper.sh](../../docker/historian/docker-entrypoint-wrapper.sh)
  — removed all alias lines added by the prior refactor. Keycloak keeps
  its pre-existing `KC_BOOTSTRAP_ADMIN_PASSWORD` alias. Historian keeps
  the SSL setup and pg_shadow reconciler.
- Deleted `docker/database/docker-entrypoint-alias.sh`,
  `docker/wiki/bookstack-secrets.sh`, `docker/wiki/mariadb-secrets.sh`.

**New logic:**
- [secrets.sh](../../secrets.sh) — added `secrets_file_keys()` and
  `sync_env_from_secrets()`. `deployed_secret()` now reads `.env`
  instead of `docker inspect`. Dropped `container_env_key()`. Removed
  the `--env-file` flag construction from `docker compose` invocations.
  Sync happens after live rotations, before the RESTART pass.
- [secrets.ps1](../../secrets.ps1) — mirror of the sh changes:
  `Get-SecretsFileKeys`, `Sync-EnvFromSecrets`, simplified
  `Get-DeployedSecret`, dropped `Get-ContainerEnvKey`, `$ComposeArgs`
  now empty.
- [check-env.sh](../../check-env.sh) — replaced the "mixed config"
  advisory with a union check that recognizes both pre-sync
  (`.env` has sentinels) and post-sync (`.env.secrets` is
  authoritative) states.
- [start-services.sh](../../start-services.sh) /
  [start-services.ps1](../../start-services.ps1) — dropped
  `--env-file` flags; calls `./secrets.sh` BEFORE `docker compose
  build/up` to guarantee `.env` is synced.

**Docs:**
- [docker/CLAUDE.md](../../docker/CLAUDE.md),
  [CLAUDE.md](../../CLAUDE.md), [README.md](../../README.md) — updated
  "Secrets model" sections to describe the new sync design.

## Verification — PASS

1. `git checkout aems-app/.env` — 18 sentinels present in file.
2. Bare `docker compose config` — every `POSTGRES_PASSWORD` resolves
   to the sentinel string (proves `.env` is being read raw).
3. `./secrets.sh` — overlays `.env.secrets` values into `.env` in
   place. Second run reports every key "unchanged" (idempotent).
   `docker compose config` after sync shows every secret resolved to
   the real value.
4. Bare `docker compose up -d` on the reverted stack — compose
   detects the env drift and recreates every service. `aems-init`
   exit 0, poisoned-container count = 0, no `--env-file` flags used.
5. Historian data flow: MAX(ts) is within 90 s of NOW; server can
   query historian directly with its runtime env; grafana's Postgres
   datasource points at `historian:5432` and the API returns the
   datasource JSON when authenticated as admin.
6. Grafana admin auth: initial 401 due to stale hash in
   `grafana-cache` volume (pre-existing from before the prior
   refactor). One-shot recovery via `docker exec aems-grafana
   grafana-cli admin reset-admin-password $GRAFANA_ADMIN_PASSWORD`.
   Basic-Auth test after reset returns HTTP 200 with datasource JSON.

## Known follow-up (out of scope here)

Stateful-volume credential drift (grafana admin hash in
`grafana-cache`, keycloak admin hash in `keycloak-cache`) is NOT
covered by `secrets.sh`'s current rotation logic — the classifier
only fires when `.env` differs from `.env.secrets`, and if a user
edits `.env.secrets` to match what `.env` already has (post-sync)
there's no drift signal for the volume state. This is a pre-existing
gap and manifested here because the prior refactor exposed it.
Recovery is manual: `docker exec aems-grafana grafana-cli admin
reset-admin-password $VALUE`. A future pass could add an
entrypoint-side fingerprint reconciler like historian's pg_shadow
one, but that's a separate design conversation.
