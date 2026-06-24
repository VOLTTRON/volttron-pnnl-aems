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

Secrets must exist on the host before `docker compose up`:

1. Run [secrets.sh](../../secrets.sh) (POSIX) or [secrets.ps1](../../secrets.ps1) (PowerShell) at the repo root. This:
   - Reads `.env.secrets` (gitignored) for any pre-set values.
   - Generates random values for any unset secrets (session, JWT, DB passwords, etc.).
   - Writes them into [docker/secrets/](../../docker/secrets/) as files named per the compose `secrets:` block.
   - In PowerShell, also exports them as user environment variables (persistent across sessions).
2. The backup sidecar's encryption keypair is auto-generated at first container boot via [docker/backup/init-keys.sh](../../docker/backup/init-keys.sh).

Subsequent runs reuse the existing files unless you delete them. **Never commit anything in [docker/secrets/](../../docker/secrets/)** — already gitignored.

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
| [secrets.sh](../../secrets.sh) / [secrets.ps1](../../secrets.ps1) | Generate / load secrets into [docker/secrets/](../../docker/secrets/). |
| [start-services.sh](../../start-services.sh) / [start-services.ps1](../../start-services.ps1) | Load `.env`, then `docker compose up -d`. |
| [reset-service.sh](../../reset-service.sh) / [reset-service.ps1](../../reset-service.ps1) | Reset specific service volumes/certs (e.g., `reset-service.sh certs`). |
| [update-user-role.sh](../../update-user-role.sh) / [update-user-role.ps1](../../update-user-role.ps1) | Update a user's role by email — runs against the running DB container. |
| [env.sh](../../env.sh) | Cross-platform `.env` loader (POSIX/macOS/FreeBSD). |

## Deploy flow (typical)

```
1. git pull / checkout
2. ./secrets.sh              ← generates/loads secrets if missing
3. ./build.sh                ← optional if images will be rebuilt by docker
4. docker compose up -d --build
5. docker compose ps         ← verify
6. docker compose logs -f server   ← watch boot
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
