# docker/ — Deployment configuration

Docker Compose orchestration for the full Skeleton stack. Core services (client, server, database, redis, certs) always run; everything else is gated behind **compose profiles**.

## Layout

- [docker-compose.yml](docker-compose.yml) — the full stack. Profiles select optional services.
- [backup/](backup/) — backup sidecar (Node worker that snapshots Postgres on a schedule). [Dockerfile](backup/Dockerfile), [worker/index.js](backup/worker/index.js), [entrypoint.sh](backup/entrypoint.sh), [init-keys.sh](backup/init-keys.sh) (auto-generates an age-style keypair on first boot into `./secrets/backup/`).
- [database/](database/) — custom Postgres image with PostGIS installed ([Dockerfile](database/Dockerfile), [postgis.sh](database/postgis.sh)). Vanilla `postgres:16` will not work.
- [certs/](certs/) — cert provisioning helper service (runs before proxy).
- [proxy/](proxy/) — Traefik v3 dynamic config ([certs-traefik.yml](proxy/certs-traefik.yml)). Terminates TLS, routes `/`, `/graphql`, `/api`, `/ext/*`, `/auth/sso/`.
- [keycloak/](keycloak/) — Keycloak image + [default-realm.json](keycloak/default-realm.json) + [init-keycloak.sh](keycloak/init-keycloak.sh).
- [map/](map/) — OSM tile server assets.
- [wiki/](wiki/) — BookStack wiki service assets.
- [seed/](seed/) — DB seed data.
- [secrets/backup/](secrets/) — host-side directory for the backup sidecar's auto-generated age keypair. Gitignored. Created on first boot by `docker/backup/init-keys.sh`. The rest of `docker/secrets/` is legacy (removed with the Docker-secrets → env-vars migration).

## Run from the repo root, not from here

There is a shim [../docker-compose.yml](../docker-compose.yml) at the repo root that `include:`s this directory's [docker-compose.yml](docker-compose.yml) with `project_directory: ./docker/`. **Always invoke `docker compose` from the repo root** — that's what makes compose auto-load the root [../.env](../.env). Running `docker compose` from inside `docker/` or with `-f docker/docker-compose.yml` from the root causes compose to look for `docker/.env` instead, which is not where the project's env vars live.

## Compose profiles

Core services have no profile (always start). Optional services attach profiles like `proxy`, `sso`, `map`, `nom`, `wiki`, `redis`. Enable from the repo root with:

```
docker compose --profile proxy --profile sso up -d
```

Check [docker-compose.yml](docker-compose.yml) for the authoritative list; [README.md](README.md) documents each profile.

## Secrets model

`.env` is the single input docker compose reads. It contains real
values in a running deployment. `.env.secrets` (optional, gitignored)
is an operator's editable secret store. `secrets.sh` / `secrets.ps1`
overlays values from `.env.secrets` into `.env` before compose runs, so
compose's natural `.env` auto-load resolves every `${VAR}` to the real
value. No `--env-file`, no `COMPOSE_ENV_FILES`, no `/run/secrets/*`,
no service-level env_file mount of `.env.secrets`.

- Root [../.env](../.env) is tracked in git with the sentinel
  `SeT_tHiS_iN_0x3A-.env.secrets-` for every declared secret key.
  Compose auto-loads it from the repo root and uses it for `${VAR}`
  interpolation of the compose file and every service's
  `env_file: .env.<svc>` chain.
- [../.env.secrets](../.env.secrets) (gitignored) holds real secret
  values as literal `KEY=VALUE` lines. Deployments that maintain real
  values directly in `.env` may skip this file entirely.
- [../secrets.sh](../secrets.sh) / [../secrets.ps1](../secrets.ps1)
  overlays every non-blank non-placeholder value from `.env.secrets`
  onto `.env` in place. Idempotent — no-op when the two already agree.
- **Do NOT commit `.env` after it has been synced.** The tracked
  baseline is the sentinel version; a locally-synced `.env` contains
  real secrets. `secrets.sh` prints an explicit warning on exit.
- The backup sidecar's age keypair is auto-generated on first boot
  into `./secrets/backup/`, bind-mounted at `/host-secrets`. Unrelated
  to any Docker secret machinery.

**Validation helper (repo root):**
- [../check-env.sh](../check-env.sh) / [../check-env.ps1](../check-env.ps1)
  — validates `.env.secrets` is complete and free of placeholders, and
  warns if `.env` still holds the sentinel for a synced key.

**Rotation.** Edit [../.env.secrets](../.env.secrets), then run
[../secrets.sh](../secrets.sh) / [../secrets.ps1](../secrets.ps1). The
script diffs `.env.secrets` (desired) against `.env` (currently
deployed), runs the appropriate live handler for changed values
(`ALTER ROLE` / `ALTER USER` / `kcadm.sh` / `grafana-cli`) against the
running container, overlays the new value into `.env`, and
`docker compose up -d --no-deps <svc>` to reload env into affected
services. `docker compose restart` reuses cached env vars — always use
`up -d --no-deps` after editing secrets. If a target container is down
during a rotation, the script refuses to proceed — pass `--force` only
if you'll wipe the data volume manually. `--dry-run` previews the plan.

**pg_shadow drift recovery.** If a postgres data volume was initialised
with a wrong password (e.g. a pre-refactor fresh-clone-with-bad-boot),
`docker compose up -d` will bring the container up with the correct env
but `pg_shadow` still rejects the correct password. `secrets.sh`'s
`pg_shadow-drift probe` catches this: probes each DB with the
`.env.secrets` value; if it fails but the sentinel works, rotates
pg_shadow via `ALTER ROLE`. No operator intervention needed.

**Volttron SQLHistorian sync.** VOLTTRON's SQLHistorian agent reads its DB connection from an install-time config file baked into the agent's on-disk state, not the dynamic config store. `secrets.sh`'s `HISTORIAN_DATABASE_PASSWORD` rotation flow `--force-recreate`s the volttron container, which normally makes `setup-platform.py` re-install SQLHistorian from the freshly regenerated [volttron/setup/configs/historian.config](volttron/setup/configs/historian.config) — but drifts happen (an image variant that persists `agents/`, an interrupted rotation, or a manual `docker/secrets/*.txt` edit before the migration). [../scripts/sync-volttron-historian-config.sh](../scripts/sync-volttron-historian-config.sh) is a belt-and-suspenders reconciler: it waits for volttron VIP + SQLHistorian install to be ready, compares the on-disk `historian.config` against the running agent's install-time config, overwrites the agent config on mismatch, and restarts the historian agent. Invoked automatically by `secrets.sh` after any `HISTORIAN_*_PASSWORD` rotation and by `start-services.sh` after every deploy, so `git pull && ./start-services.sh` self-heals a stale volttron install.

## Environment

- Root [../.env](../.env) is auto-loaded by compose **only when compose
  is invoked from the repo root** (see "Run from the repo root, not
  from here" above). Compose uses `.env` for all `${VAR}` interpolation
  in the compose file and in every service's `env_file:` chain.
- [../.env.secrets](../.env.secrets) (gitignored, optional) holds real
  secret values. `secrets.sh` overlays them into `.env` before compose
  runs — compose itself never reads `.env.secrets` directly.
- `COMPOSE_PROJECT_NAME` prefixes all container names — respect it when
  writing helper scripts.

## Networking

Traefik terminates TLS at :443 (and :80 for redirect). Service containers don't expose ports to the host by default; they attach to the compose network and Traefik routes by Host/Path rule from labels. The test Traefik dashboard is at `${TRAEFIK_TEST_PORT}`.

## Build context

Image builds for `client`, `server`, `prisma`, and `common` use the **repo root as build context** (`context: ../`), so they can pull in sibling portal-linked modules. The Dockerfiles live in each sub-project. Don't change the context without understanding the portal dependency chain.

## Workflow

- **First run**: `../secrets.sh` (writes stub `.env.secrets`) → edit values → `../check-env.sh` → `docker compose up -d`.
- **Rotate a credential**: edit `../.env.secrets`, then `../secrets.sh` — detects the change against `docker inspect`'s view of the running container, runs the ALTER against the live container, then `docker compose up -d --no-deps <svc>` to recreate the container with new env. Stack must be up.
- **Rebuild images after code change**: `docker compose build <service>` or `--build` on `up`.
- **Refresh ILC configuration templates**: after editing any file under `../aems-edge/configurations/templates/`, run `../start-services.sh` from `aems-app/`. The build step invalidates the `volttron-setup` image's `COPY` layer, `up -d` recreates the setup container, and its [`setup-volttron.sh`](../../aems-edge/setup-volttron.sh) runs its **pre-lock** template-refresh block that unconditionally `rm -rf`'s and re-copies `${TEMPLATES_DIR}` into `./volttron/setup/templates/` (with `chmod -R a+rX` for the `:ro` mount). This block runs *before* the `${VOLTTRON_LOCK_FILE}` gate, so template edits take effect even when the heavy Volttron-setup steps stay locked to their prior run. The `server` and `services` containers pick up the new files on their next read (10 s ILC cron; on demand for the Admin → Templates preview). Do not add direct host bind-mounts for template files — the setup container is what makes the perms/UID/SELinux dance work. If BuildKit caches the `COPY .` layer despite an edit, force a clean rebuild once with `docker compose build --no-cache volttron-setup` (rare — usually cache invalidation is content-hashed).
- **Reset DB**: `docker compose down -v` wipes volumes — destructive.
- **Logs**: `docker compose logs -f <service>`. Backup and Keycloak have especially chatty entrypoints.
- **Exec**: `docker compose exec database psql -U ...` for DB access; the custom image has PostGIS utilities.

## Gotchas

- The DB image is **custom** — don't replace `image:` with `postgres:16`; you'll lose PostGIS.
- `docker compose restart` reuses cached env — after editing `.env.secrets`, use `docker compose up -d --no-deps <svc>` (or let `secrets.sh` do it) so containers re-read the freshly-synced `.env`. `secrets.sh` uses the correct form; hand-typed `restart` will silently keep the old value.
- **Do NOT commit a synced `.env`.** The tracked baseline is the sentinel version. `secrets.sh` writes real values into `.env` for compose to pick up locally.
- Traefik v3 syntax differs from v2 in places; check `traefik:v3.5.3` docs before copying older snippets.
- Optional profiles are opt-in; a service with `profiles: [...]` is invisible to `docker compose up` unless the profile is selected. Don't remove profile gating to "make it simpler" — it's load-bearing for minimal deploys.

## Further reading

- Architecture: [../.claude/architecture/docker.md](../.claude/architecture/docker.md), [../.claude/architecture/deployment.md](../.claude/architecture/deployment.md).
- Project rules: [../.claude/rules.md](../.claude/rules.md).
