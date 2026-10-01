---
description: docker compose up -d from the repo root, with optional profiles
---

Run `docker compose up -d` **from the repo root** (NEVER from `docker/`, NEVER with `-f docker/docker-compose.yml` — those load the wrong `.env`).

If $ARGUMENTS contains `--profile <name>` flags or other compose args, pass them through. Common profiles: `proxy`, `keycloak`, `map`, `nominatim`, `wiki`. Example invocations the user might want:

- `/docker-up` — core services only (client, server, db, redis, certs).
- `/docker-up --profile proxy` — add Traefik.
- `/docker-up --profile proxy --profile keycloak` — add Traefik + SSO.

After `up` returns:

1. Run `docker compose ps` to show service status.
2. Highlight any container that is not `running (healthy)` — those are the ones to investigate.
3. If anything failed, suggest `docker compose logs -f <service>` for the failing container.

Pre-flight check: if the user requested `up` but no [docker/secrets/](../../docker/secrets/) files exist, remind them to run `./secrets.sh` (or `.\secrets.ps1`) first.
