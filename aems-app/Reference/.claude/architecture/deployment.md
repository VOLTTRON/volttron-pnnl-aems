# Deployment

How the stack actually runs in production-like environments: instance types for background services, secret bootstrapping, backup/restore, and the helper scripts at the repo root.

## Instance types

The server's background services (seed, log pruning, backup, event) are gated by the `INSTANCE_TYPE` env var. This lets you scale by running multiple server containers, each handling a different subset of background work — or none at all (workers vs. request handlers).

The grammar is a comma-separated list of service names with optional negations:

| Value | Meaning |
|---|---|
| `*` | Run all background services. |
| `seed` | Run only the seed service. |
| `seed,log` | Run seed + log services. |
| `*,!event` | All except event. |
| `^shutdown-only` | A special mode used for graceful shutdown handling. |
| (unset) | Treated as none / request-handler only. |

Wiring lives in [server/src/services/services.module.ts](../../server/src/services/services.module.ts). Each service's `OnModuleInit` checks `INSTANCE_TYPE` before starting work.

For multi-instance deployments, run **one** container with `INSTANCE_TYPE=*` (or specific workers) and **N** containers without it (request handlers only).

## Secret bootstrap

Real values live in `.env.secrets` (gitignored) at the repo root. `docker compose` reads it for `${VAR}` interpolation ONLY when `COMPOSE_ENV_FILES=.env,.env.secrets` is set in the shell (or `--env-file` is passed on the CLI). The `include: env_file:` list in the root shim does not participate in interpolation of the outer file — compose limits each file's interpolation to its own project-root `.env` unless `COMPOSE_ENV_FILES` overrides. The wrapper scripts ([start-services.sh](../../start-services.sh) / [secrets.sh](../../secrets.sh)) export the env var automatically; direct `docker compose` invocations must too.

**Bootstrap:**
1. Run [secrets.sh](../../secrets.sh) (POSIX) or [secrets.ps1](../../secrets.ps1) (PowerShell) at the repo root. On first run it derives the required keys from `.env`'s placeholder sentinels and writes a stub `.env.secrets`.
2. Edit `.env.secrets` and fill in real values.
3. Run [check-env.sh](../../check-env.sh) / [check-env.ps1](../../check-env.ps1) to verify the file is complete and free of placeholders.

**Alternative (simple dev): env-only.** You can put real values directly in `.env` and skip `.env.secrets`. `check-env.sh` warns about the security posture (`.env` is typically committed) but does not block.

**Credential rotation (after changing a password or secret):**
- Re-run [secrets.sh](../../secrets.sh) / [secrets.ps1](../../secrets.ps1). It detects which values changed by comparing against the running container's env via `docker inspect`, applies the change to the live container (ALTER ROLE for Postgres, ALTER USER for MariaDB, kcadm for Keycloak, grafana-cli for Grafana admin, restart for Redis/app secrets), then `docker compose up -d --no-deps <svc>` to recreate the container with fresh env from `.env.secrets`. If a target container is down during rotation it refuses to proceed (pass `--force` to override).
- **`docker compose restart` reuses cached env** — always use `up -d --no-deps` (or let `secrets.sh` do it) after editing `.env.secrets`.
- Use `--dry-run` to preview.

**Backup keypair:**
The backup sidecar's age-style encryption keypair is auto-generated at first container boot via [docker/backup/init-keys.sh](../../docker/backup/init-keys.sh) into `./docker/secrets/backup/`. Unrelated to any Docker-secret machinery.

## Backups

The backup sidecar runs in [docker/backup/](../../docker/backup/) and snapshots Postgres on a schedule. Snapshots are encrypted with the auto-generated keypair and written to a configured target.

Top-level helper scripts:

- [backup.sh](../../backup.sh) — trigger an ad-hoc backup.
- [backup-restore.sh](../../backup-restore.sh) / [backup-restore.ps1](../../backup-restore.ps1) — restore from a snapshot. The PS1 script is interactive and walks through archive + key discovery.

## Helper scripts at the repo root

| Script | Purpose |
|---|---|
| [build.sh](../../build.sh) / [build.ps1](../../build.ps1) | Run the full build chain (`prisma → common → server → client`). |
| [test.sh](../../test.sh) / [test.ps1](../../test.ps1) | Run `lint → check → test:cov` across all workspaces. |
| [secrets.sh](../../secrets.sh) / [secrets.ps1](../../secrets.ps1) | Bootstrap `.env.secrets` from `.env`, and rotate live credentials (SQL ALTER / kcadm / grafana-cli / restart) with `docker compose up -d --no-deps` to reload env. |
| [check-env.sh](../../check-env.sh) / [check-env.ps1](../../check-env.ps1) | Validate `.env.secrets` is complete before deploying. |
| [start-services.sh](../../start-services.sh) / [start-services.ps1](../../start-services.ps1) | Run `check-env`, then `docker compose build && docker compose up -d`. |
| [reset-service.sh](../../reset-service.sh) / [reset-service.ps1](../../reset-service.ps1) | Reset specific service volumes/certs (e.g., `reset-service.sh certs`). |
| [update-user-role.sh](../../update-user-role.sh) / [update-user-role.ps1](../../update-user-role.ps1) | Update a user's role by email — runs against the running DB container. |
| [env.sh](../../env.sh) | Cross-platform `.env` loader (POSIX/macOS/FreeBSD). |

## Deploy flow (typical)

```
1. git pull / checkout
2. ./secrets.sh              ← bootstrap .env.secrets if missing; migrate misplaced values
3. ./check-env.sh            ← verify .env.secrets is complete
4. ./build.sh                ← optional if images will be rebuilt by docker
5. docker compose up -d --build
6. docker compose ps         ← verify
7. docker compose logs -f server   ← watch boot
```

To rotate a credential after the stack is running:

```
1. Edit .env.secrets (or .env in env-only mode)
2. ./secrets.sh              ← detects the change vs running container, ALTERs the DB, `up -d --no-deps` to reload env
   ./secrets.sh --dry-run    ← preview without executing
```

For a hot redeploy of just the server:

```
docker compose build server && docker compose up -d server
```

## Production considerations

- **TLS**: Traefik is the canonical TLS terminator. Configure Let's Encrypt via [docker/proxy/](../../docker/proxy/) for production certs (mkcert is for dev only).
- **DNS**: the hostname in `.env` must resolve to the host running Traefik. Cookies and OAuth redirects assume it.
- **Postgres backups**: cover both DB snapshots (via the backup sidecar) **and** Docker volumes (so PostGIS extension state is preserved).
- **Multi-instance**: scale request-handlers freely; run exactly one worker (`INSTANCE_TYPE=*`) per intended worker role.
- **Logs**: server logs go to console (Docker captures) **and** the DB log table via the multi-transport logging service. The log service can prune old rows when `INSTANCE_TYPE` includes `log`.

## Gotchas

- **Adding a new background service?** Add it to `INSTANCE_TYPE` parsing in [server/src/services/services.module.ts](../../server/src/services/services.module.ts), document the value, and gate startup on it.
- **Two containers both with `INSTANCE_TYPE=*`** will both try to take the same locks (e.g., backup) — undefined behavior. Run exactly one.
- **`docker compose down -v` is destructive** — wipes named volumes including the DB.
- **The proxy needs certs before it boots** — the `certs` service runs first to provision them; in prod, swap to Let's Encrypt config.

## Pointers

- Docker topology: [docker.md](docker.md)
- Server services wiring: [server.md](server.md), [server/CLAUDE.md](../../server/CLAUDE.md)
