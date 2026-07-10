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

Secrets must exist on the host before `docker compose up`. There are two supported modes:

**Secrets mode (recommended for production):**
1. Copy `.env.secrets.example` → `.env.secrets` and fill in real values.
2. Run [secrets.sh](../../secrets.sh) (POSIX) or [secrets.ps1](../../secrets.ps1) (PowerShell) at the repo root. This reads `.env.secrets` and writes individual secret files into [docker/secrets/](../../docker/secrets/) (one `.txt` file per key, named to match the compose `secrets:` block).
3. Run [check-env.sh](../../check-env.sh) / [check-env.ps1](../../check-env.ps1) to verify the chain is consistent before starting the stack.

**Env-only mode (simple dev):**
- Edit `.env` directly with real values instead of using `.env.secrets`. No secrets script needed.
- `check-env.sh` will warn about the security posture but will not block.

**Credential rotation (after changing a password or secret):**
- Run [rotate-secrets.sh](../../rotate-secrets.sh) / [rotate-secrets.ps1](../../rotate-secrets.ps1). This detects which values changed, applies the change to running containers (ALTER ROLE for Postgres, kcadm for Keycloak, restart for Redis/app secrets), regenerates the secret files, and restarts affected services.
- Use `--dry-run` to preview what would happen without executing.

**Backup keypair:**
The backup sidecar's age-style encryption keypair is auto-generated at first container boot via [docker/backup/init-keys.sh](../../docker/backup/init-keys.sh) — it is NOT a pre-declared Docker secret.

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
| [secrets.sh](../../secrets.sh) / [secrets.ps1](../../secrets.ps1) | Generate secret files in [docker/secrets/](../../docker/secrets/) from `.env.secrets`. |
| [check-env.sh](../../check-env.sh) / [check-env.ps1](../../check-env.ps1) | Validate `.env` / `.env.secrets` / `docker/secrets/` are consistent before deploying. |
| [rotate-secrets.sh](../../rotate-secrets.sh) / [rotate-secrets.ps1](../../rotate-secrets.ps1) | Apply changed credentials to running services (SQL ALTER, kcadm, restart). |
| [start-services.sh](../../start-services.sh) / [start-services.ps1](../../start-services.ps1) | Run `check-env`, then `docker compose build && docker compose up -d`. |
| [reset-service.sh](../../reset-service.sh) / [reset-service.ps1](../../reset-service.ps1) | Reset specific service volumes/certs (e.g., `reset-service.sh certs`). |
| [update-user-role.sh](../../update-user-role.sh) / [update-user-role.ps1](../../update-user-role.ps1) | Update a user's role by email — runs against the running DB container. |
| [env.sh](../../env.sh) | Cross-platform `.env` loader (POSIX/macOS/FreeBSD). |

## Deploy flow (typical)

```
1. git pull / checkout
2. ./secrets.sh              ← write docker/secrets/ from .env.secrets (skip for env-only mode)
3. ./check-env.sh            ← verify secrets chain is consistent; aborts if broken
4. ./build.sh                ← optional if images will be rebuilt by docker
5. docker compose up -d --build
6. docker compose ps         ← verify
7. docker compose logs -f server   ← watch boot
```

To rotate a credential after the stack is running:

```
1. Edit .env.secrets (or .env in env-only mode)
2. ./rotate-secrets.sh       ← applies change to running containers + restarts affected services
   ./rotate-secrets.sh --dry-run   ← preview without executing
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
