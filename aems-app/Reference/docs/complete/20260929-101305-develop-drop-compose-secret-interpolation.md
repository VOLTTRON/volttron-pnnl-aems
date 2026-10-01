# Drop compose-time `${SECRET}` interpolation

> **REVERTED 2026-09-29** — the env_file-mount approach worked for env
> injection but missed stateful-container credential drift (Grafana
> admin hash stored in `grafana.db` didn't rewrite when the env
> changed). The user reported broken dashboards and rejected the
> approach architecturally. Follow-up:
> [20260929-115440-develop-env-secrets-sync-model.md](20260929-115440-develop-env-secrets-sync-model.md)
> replaces every change from this pass with a `.env`-as-single-input
> design where `secrets.sh` overlays `.env.secrets` values onto `.env`
> before compose runs. All 20+ files touched by this pass were reverted
> via `git checkout` before the follow-up began.

## Problem

Docker compose interpolates `${SECRET}` at parse time from
`--env-file` / `COMPOSE_ENV_FILES` / auto-loaded `.env`, and NONE of
those cascade from the root compose file's `include: env_file:` list.
Any bare `docker compose <anything>` invocation (terminal, Docker
Desktop, IDE, Watchtower, CI) recreates containers with the sentinel
string in their env. Postgres then bakes the sentinel into
`pg_shadow` on first init and the outage sticks.

Two prior migration passes (secrets-elimination, self-heal) do NOT
close the class — they only recover after poisoning. This pass makes
poisoning impossible: every secret reaches its container via
service-level `env_file: [../.env.secrets]` at runtime, with
image-native renames done inside entrypoint wrappers.

Full design: `~/.claude/plans/the-docker-secrets-are-imperative-quill.md`.

## Progress log

### 2026-09-29 10:13 — implementation complete, awaiting verification

Applied the class-of-bug fix per plan. Layer summary:

**Docker layer** (only affected layer — no prisma/common/server/client
changes needed):

- [docker/docker-compose.yml](../../docker/docker-compose.yml): removed all
  7 `${SECRET}` interpolation sites; added
  `env_file: [../.env.secrets, .env.<svc>]` to every service that
  consumes a secret (17 services touched); added compose-inline
  `entrypoint:` aliases with `$$VAR` escapes for the three
  bare-postgres-image services (`keycloak-db`, `grafana-db`,
  `nominatim`); wired `backup` (previously had no `env_file:` at all)
  to `../.env.secrets`.
- [docker/database/](../../docker/database/) — new
  `docker-entrypoint-alias.sh` that aliases
  `DATABASE_PASSWORD` → `POSTGRES_PASSWORD`; Dockerfile installs it and
  sets it as ENTRYPOINT.
- [docker/keycloak/entrypoint.sh](../../docker/keycloak/entrypoint.sh) —
  added `KC_DB_PASSWORD` alias (already had `KC_BOOTSTRAP_ADMIN_PASSWORD`).
- [docker/grafana/entrypoint.sh](../../docker/grafana/entrypoint.sh) —
  added `GF_SECURITY_ADMIN_PASSWORD` and
  `GF_AUTH_GENERIC_OAUTH_CLIENT_SECRET` aliases.
- [docker/historian/docker-entrypoint-wrapper.sh](../../docker/historian/docker-entrypoint-wrapper.sh)
  — added `HISTORIAN_DATABASE_PASSWORD` → `POSTGRES_PASSWORD` alias.
- [docker/wiki/bookstack-secrets.sh](../../docker/wiki/bookstack-secrets.sh)
  + [docker/wiki/mariadb-secrets.sh](../../docker/wiki/mariadb-secrets.sh)
  — new s6-overlay init hooks (write to
  `/var/run/s6/container_environment/`) aliasing BOOKSTACK_* to
  APP_KEY / DB_PASSWORD / OIDC_CLIENT_SECRET / MYSQL_*.
- Every `.env.<svc>` under [docker/](../../docker/) — stripped the
  `KEY=${SECRET}` shim lines. env_file merge order now injects the real
  value from `.env.secrets` without being clobbered by a
  sentinel-interpolated shim.

**Rotation scripts**:
- [secrets.sh](../../secrets.sh), [secrets.ps1](../../secrets.ps1):
  removed `container_env_key()` / `Get-ContainerEnvKey` translation
  table. `deployed_secret()` / `Get-DeployedSecret` now looks up the
  host-side key name directly in `docker inspect` output (which is
  what env_file injects). SENTINEL SCAN and pg_shadow-drift probe
  retained as safety net for legacy poisoned volumes.

**Docs**:
- [docker/CLAUDE.md](../../docker/CLAUDE.md), [CLAUDE.md](../../CLAUDE.md),
  [README.md](../../README.md) — updated "Secrets model" section to
  reflect env_file-injection + entrypoint-alias architecture.

**Verification (complete, PASS):**

1. `docker compose config` (bare, no `--env-file`, no
   `COMPOSE_ENV_FILES`) produces **zero** sentinel strings anywhere in
   the output. Every `POSTGRES_PASSWORD`, `SESSION_SECRET`,
   `WORKER_TOKEN` line resolves to the literal `.env.secrets` value.
2. Image rebuild (`database`, `historian`, `grafana`, `keycloak`)
   completed exit 0.
3. **`docker compose down` then bare `docker compose up -d`** (no CLI
   flags, no env var) on the freshly-rebuilt images:
   - **Poisoned containers: 0** across the whole 13-container stack.
   - `aems-init` exited 0 — prisma migrations completed against the
     real DB password.
   - `aems-database`, `aems-keycloak-db`, `aems-grafana-db`,
     `aems-historian` all healthy; postgres correctly aliased its
     `POSTGRES_PASSWORD` from the host-side key.
   - `aems-server`, `aems-services`, `aems-client` all healthy.
   - `aems-grafana` reports `healthy` (its healthcheck passed —
     `GF_SECURITY_ADMIN_PASSWORD` alias works).
   - `aems-keycloak` Up 5 minutes with keycloak-db attached (the
     `KC_DB_PASSWORD` alias works — otherwise DB connection would fail
     and the pod would exit).
4. `./secrets.ps1` (no args) reports every secret as **unchanged**
   (no drift between `.env.secrets` and running container envs); no
   sentinel-poisoned containers detected. Rotation flow intact.
5. Removed the redundant `.env.secrets` reference from the root
   `include: env_file:` list — it was never functional (compose
   ignored it for interpolation of the included file) and its
   presence was misleading.

**Result:** the "sentinel poisoning" class of bug is eliminated at the
mechanism level. Any operator or tool that invokes
`docker compose up -d` (VS Code button, Docker Desktop UI, bare
terminal, cron job, etc.) produces containers with real secret env
values. Wrapper scripts retain their rotation and pg_shadow-drift
recovery duties.
