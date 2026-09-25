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

Plain env vars, single source, no `/run/secrets/*` mounts:

- Real values live in [../.env.secrets](../.env.secrets) (gitignored). Root `.env` uses the sentinel `SeT_tHiS_iN_0x3A-.env.secrets-` for keys that must be set there.
- Compose interpolates `${VAR}` in the compose file from a project-root `.env` PLUS the files listed in `COMPOSE_ENV_FILES`. The `include: env_file:` list in the root shim does NOT participate in the outer file's interpolation — compose treats it only as documentation of what the operator should be passing in. **You must set `COMPOSE_ENV_FILES=.env,.env.secrets` for every `docker compose` invocation** (or pass `--env-file .env --env-file .env.secrets`), or `${VAR}` interpolation resolves against `.env` alone and every secret becomes the sentinel placeholder.
- [../start-services.sh](../start-services.sh) / [../start-services.ps1](../start-services.ps1) and [../secrets.sh](../secrets.sh) / [../secrets.ps1](../secrets.ps1) both `export COMPOSE_ENV_FILES` automatically before invoking compose. Use them whenever possible. Any hand-typed `docker compose up -d` / `docker compose exec` needs to set the var too.
- The backup sidecar's age keypair is auto-generated on first boot into `./secrets/backup/`, bind-mounted at `/host-secrets`. Unrelated to any Docker secret machinery.

**Validation helper (repo root):**
- [../check-env.sh](../check-env.sh) / [../check-env.ps1](../check-env.ps1) — validates `.env.secrets` is complete and free of placeholders. Run by `start-services.sh` automatically.

**Secrets script** at [../secrets.sh](../secrets.sh) / [../secrets.ps1](../secrets.ps1) handles: bootstrap `.env.secrets` on first run, migrate misplaced values from `.env`, and — most importantly — live credential rotation. When a value in `.env.secrets` differs from what's in the running container's env (looked up via `docker inspect`), the script runs the appropriate handler (`ALTER ROLE` / `ALTER USER` / `kcadm.sh` / `grafana-cli`) against the running container, then `docker compose up -d --no-deps <svc>` to recreate the container with fresh env from `.env.secrets`. **Note:** `docker compose restart` reuses cached env and will NOT pick up new `.env.secrets` values — always use `up -d --no-deps` after editing secrets. If the target container is down during a rotation, the script refuses to proceed — pass `--force` only if you'll wipe the data volume manually. `--dry-run` previews the plan.

## Environment

- Root [../.env](../.env) provides defaults and is auto-loaded by compose **only when compose is invoked from the repo root** (see "Run from the repo root, not from here" above).
- [../.env.secrets](../.env.secrets) (gitignored) holds real secret values. Compose picks it up ONLY when `COMPOSE_ENV_FILES=.env,.env.secrets` is set in the shell (see "Secrets model" above). The wrapper scripts export it; direct compose invocations must too.
- `COMPOSE_PROJECT_NAME` prefixes all container names — respect it when writing helper scripts.

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
- `docker compose restart` reuses cached env — after editing `.env.secrets`, use `docker compose up -d --no-deps <svc>` (or let `secrets.sh` do it) so containers re-read env_file. `secrets.sh` uses the correct form; hand-typed `restart` will silently keep the old value.
- Traefik v3 syntax differs from v2 in places; check `traefik:v3.5.3` docs before copying older snippets.
- Optional profiles are opt-in; a service with `profiles: [...]` is invisible to `docker compose up` unless the profile is selected. Don't remove profile gating to "make it simpler" — it's load-bearing for minimal deploys.

## Further reading

- Architecture: [../.claude/architecture/docker.md](../.claude/architecture/docker.md), [../.claude/architecture/deployment.md](../.claude/architecture/deployment.md).
- Project rules: [../.claude/rules.md](../.claude/rules.md).
