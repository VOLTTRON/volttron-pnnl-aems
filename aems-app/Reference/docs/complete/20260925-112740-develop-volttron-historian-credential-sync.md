# Volttron historian credential sync

## Problem

After the 2026-09-25 Docker-secrets -> env-vars migration, dashboards on
prod went empty. The historian reconciler in `docker-entrypoint-wrapper.sh`
correctly reconciles postgres `pg_shadow` with the current
`HISTORIAN_DATABASE_PASSWORD`, but Volttron's SQLHistorian agent's
install-time config (cached in the persistent `volttron-home` named
volume at `/home/volttron/.volttron/agents/<uuid>/sqlhistorianagent-*/dist-info/config`)
is never updated after the initial install. No repo-owned code runs
`vctl config store platform.historian config …` on rotation, so the
agent keeps presenting the OLD password, auth fails silently, no rows
land in `historian.data`, and dashboards read nothing.

Verified on dev: installed agent config = `"password": "volttron"`;
`.env.secrets` = `"password"`. Same shape as prod.

## Approach

Push the on-disk `historian.config` into VOLTTRON's dynamic config
store whenever it drifts from what the platform currently holds.
SQLHistorian subscribes to config-store updates and reloads without a
reinstall. One helper, two call sites: `start-services.*` (deploy path)
and `secrets.*` (rotation path). Both idempotent.

Full plan at `~/.claude/plans/the-docker-secrets-are-imperative-quill.md`.

## Layer

Docker/deployment. No prisma / common / server / client build-chain touches.

## Progress log

### 2026-09-25 11:27:40 - start

Plan approved. Building the sync helper first, then wiring the two call
sites, then verifying against the currently-drifted dev stack.

### 2026-09-25 12:05:00 - implementation complete

Discovered during implementation that SQLHistorian does NOT reload its
DB connection from the dynamic config store (only generic settings like
retry_period, storage limits). Connection params come from the agent's
install-time config at `$AGENT_CONFIG` (env var pointing to
`/home/volttron/.volttron/agents/<uuid>/sqlhistorianagent-*/dist-info/config`).
Pivoted the sync mechanism from "push to config store" to "overwrite the
install-time file + `vctl restart --tag historian`".

Also discovered on Windows Docker Desktop the bind-mount at
`/home/volttron/configurations/` is unreadable by the volttron user
(9p mount lands as root:root, uid 0/gid 0), so the helper pipes the
`historian.config` content via stdin instead of passing an infile path.
And MSYS auto-path-conversion mangles absolute container paths passed
as bare `docker exec` args — wrapped every `cat`/`sh -c` with a quoted
container-side command to keep the path intact.

**Files:**

- New — [aems-app/scripts/sync-volttron-historian-config.sh](../../scripts/sync-volttron-historian-config.sh):
  wait for VIP + SQLHistorian process, resolve the agent's
  `$AGENT_CONFIG` path from `/proc/<pid>/environ`, compare vs on-disk
  historian.config, overwrite the file on mismatch (piped via stdin,
  written as volttron user), then `vctl restart --tag historian`.
  Idempotent: no-op when config in sync and agent healthy.
- New — [aems-app/scripts/sync-volttron-historian-config.ps1](../../scripts/sync-volttron-historian-config.ps1):
  Windows/PowerShell twin.
- Modified — [aems-app/secrets.sh](../../secrets.sh) /
  [aems-app/secrets.ps1](../../secrets.ps1): after the RESTART pass,
  if `HISTORIAN_DATABASE_PASSWORD` or `HISTORIAN_REPLICATOR_PASSWORD`
  rotated, invoke the sync helper.
- Modified — [aems-app/start-services.sh](../../start-services.sh) /
  [aems-app/start-services.ps1](../../start-services.ps1): after
  `docker compose up -d`, invoke the sync helper best-effort so
  `git pull && ./start-services.sh` self-heals a stale volttron
  install without any operator ceremony.
- Modified — [aems-app/docker/CLAUDE.md](../../docker/CLAUDE.md):
  documented the SQLHistorian sync in the Secrets model section.

**Verification results against the (currently-drifted) dev stack:**

- Pre-fix state: installed agent config `"password": "volttron"` (from
  a previous historian.config on this machine); .env.secrets and pg_shadow
  both = "password"; SQLHistorian HEALTH: BAD; no rows written.
- `./scripts/sync-volttron-historian-config.sh` — overwrote the
  install-time config, restarted the agent, HEALTH went to GOOD.
- Rows in `historian.data` (last 2 min): **636** — data flowing.
- Idempotent re-run: reported "already in sync and health is GOOD —
  nothing to do".
- Rotation test (rot-hist-1790361856): secrets.sh ALTER'd pg_shadow,
  volttron force-recreated, setup-platform.py re-installed SQLHistorian
  with the new password automatically, helper confirmed "already in sync",
  agent GOOD, 328 new rows in 90s.
- Reverse rotation back to original: same clean path, 318 new rows
  in 60s.

**Design note:** the sync helper turned out to be redundant on the
happy rotation path — force-recreate wipes the ephemeral `agents/` dir
in this image variant, so setup-platform.py re-installs SQLHistorian
with the current historian.config. The helper still earns its keep on:
(a) prod hosts where a stale install-time config predates a rotation
that never completed cleanly, (b) any future image variant that
persists `agents/`, and (c) the current prod recovery path — one deploy
via `git pull && ./start-services.sh` and the sync helper reconciles
the running installation without any operator intervention.

**Prod recovery guidance:**

```
cd aems-app
git pull
./start-services.sh --no-build
```

Dashboards should start filling within ~1 minute as SQLHistorian
reconnects with the correct password.
