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
- [secrets/](secrets/) — **host-side** secret files mounted into containers. Gitignored. Populated by `secrets.sh` / `secrets.ps1` at the repo root.

## Run from the repo root, not from here

There is a shim [../docker-compose.yml](../docker-compose.yml) at the repo root that `include:`s this directory's [docker-compose.yml](docker-compose.yml) with `project_directory: ./docker/`. **Always invoke `docker compose` from the repo root** — that's what makes compose auto-load the root [../.env](../.env). Running `docker compose` from inside `docker/` or with `-f docker/docker-compose.yml` from the root causes compose to look for `docker/.env` instead, which is not where the project's env vars live.

## Compose profiles

Core services have no profile (always start). Optional services attach profiles like `proxy`, `sso`, `map`, `nom`, `wiki`, `redis`. Enable from the repo root with:

```
docker compose --profile proxy --profile sso up -d
```

Check [docker-compose.yml](docker-compose.yml) for the authoritative list; [README.md](README.md) documents each profile.

## Secrets model

Two layers:

1. **Docker secrets** (declared at the top of [docker-compose.yml](docker-compose.yml)) — session, JWT, DB passwords, Keycloak, BookStack session key, Nominatim. Each is a file in [secrets/](secrets/) mounted read-only into the containers that need it. Secret files must exist **before** `docker compose up` — the repo-root `secrets.sh` / `secrets.ps1` generates them.
2. **Auto-generated at first boot** — the backup sidecar's encryption keypair. NOT a declared docker secret (would require the file to pre-exist); instead the `init-keys.sh` entrypoint writes into `./secrets/backup/` mounted at `/host-secrets`.

Never commit anything in [secrets/](secrets/) — already gitignored.

**Validation helper (repo root):**
- [../check-env.sh](../check-env.sh) / [../check-env.ps1](../check-env.ps1) — validates `.env`, `.env.secrets`, and `docker/secrets/` are in sync before deploying. Run by `start-services.sh` automatically.

**Secrets script** at [../secrets.sh](../secrets.sh) / [../secrets.ps1](../secrets.ps1) handles everything: bootstrap on first run, fresh-deploy writes, live-credential rotation (ALTER ROLE/ALTER USER/kcadm.sh inside the running container **before** overwriting the file, then service restart). If the target container is down during a rotation, the script refuses to overwrite — pass `--force` only if you know you'll wipe the data volume. `--dry-run` previews the plan.

## Environment

- Root [../.env](../.env) provides defaults and is auto-loaded by compose **only when compose is invoked from the repo root** (see previous section).
- `docker/.env.secrets.docker` (if present) layers on for compose.
- Compose interpolates `${VAR}` from the shell's env — scripts like [../start-services.sh](../start-services.sh) load `.env` before invoking compose.
- `COMPOSE_PROJECT_NAME` prefixes all container names — respect it when writing helper scripts.

## Networking

Traefik terminates TLS at :443 (and :80 for redirect). Service containers don't expose ports to the host by default; they attach to the compose network and Traefik routes by Host/Path rule from labels. The test Traefik dashboard is at `${TRAEFIK_TEST_PORT}`.

## Build context

Image builds for `client`, `server`, `prisma`, and `common` use the **repo root as build context** (`context: ../`), so they can pull in sibling portal-linked modules. The Dockerfiles live in each sub-project. Don't change the context without understanding the portal dependency chain.

## Workflow

- **First run**: `../secrets.sh` (writes stub `.env.secrets`) → edit values → `../secrets.sh` (writes `docker/secrets/*.txt`) → `../check-env.sh` → `docker compose up -d`.
- **Rotate a credential**: edit `../.env.secrets`, then `../secrets.sh` — detects the change, runs the ALTER against the live container, updates the file, restarts the service. Stack must be up.
- **Rebuild images after code change**: `docker compose build <service>` or `--build` on `up`.
- **Reset DB**: `docker compose down -v` wipes volumes — destructive.
- **Logs**: `docker compose logs -f <service>`. Backup and Keycloak have especially chatty entrypoints.
- **Exec**: `docker compose exec database psql -U ...` for DB access; the custom image has PostGIS utilities.

## Gotchas

- The DB image is **custom** — don't replace `image:` with `postgres:16`; you'll lose PostGIS.
- Secrets files must exist before compose start for any service that declares them; ordering of `secrets.sh` → `check-env.sh` → `up` matters. `start-services.sh` enforces this order automatically.
- Bypassing `secrets.sh` (editing `docker/secrets/*.txt` by hand, or passing `--force` to skip rotation) will leave the running database with the OLD credential while the mounted file has the NEW one — next request gets an auth error, not a graceful fallback.
- Traefik v3 syntax differs from v2 in places; check `traefik:v3.5.3` docs before copying older snippets.
- If you change secret names in the top-level `secrets:` block, every `secrets: [...]` reference in each service must match — no fuzzy lookup.
- Optional profiles are opt-in; a service with `profiles: [...]` is invisible to `docker compose up` unless the profile is selected. Don't remove profile gating to "make it simpler" — it's load-bearing for minimal deploys.

## Further reading

- Architecture: [../.claude/architecture/docker.md](../.claude/architecture/docker.md), [../.claude/architecture/deployment.md](../.claude/architecture/deployment.md).
- Project rules: [../.claude/rules.md](../.claude/rules.md).
