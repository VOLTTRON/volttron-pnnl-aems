# Secrets self-heal for sentinel-poisoned containers

## Problem

Whenever anyone runs `docker compose up -d` from a shell without
`COMPOSE_ENV_FILES=.env,.env.secrets` set, compose interpolates every
`${VAR}` against `.env` alone, and each recreated container gets the
sentinel placeholder `SeT_tHiS_iN_0x3A-.env.secrets-` baked into its
env. Init fails Prisma auth, apps fail DB auth, dashboards go dark.
Manual recovery is a one-liner but operators have to know it.

## Approach

Extend `./secrets.sh` (and `.ps1`) with a scan-and-repair phase that
detects sentinel-poisoned containers under `${PROJECT}-*` and queues
them into the existing RESTART pass. Since `secrets.sh` exports
`COMPOSE_ENV_FILES` at pre-flight, the recreates re-interpolate against
real `.env.secrets` values.

Plus a pg_shadow-poisoning corollary: if a running postgres container's
env holds the sentinel AND `pg_shadow` currently accepts the sentinel
as a valid password, rotate_pg to align it to `.env.secrets`. This
handles the "fresh clone booted with bad env, then volume got seeded
with sentinel" edge case.

Full plan at `~/.claude/plans/the-docker-secrets-are-imperative-quill.md`.

## Layer

Docker/deployment. No prisma / common / server / client build-chain
touches.

## Progress log

### 2026-09-28 08:26:56 - start

Plan approved. Building the scan phase in secrets.sh first, then the
pg_shadow corollary, then extending the sync-helper guard, then the
PowerShell mirror.

### 2026-09-28 09:00:00 - implementation complete

**Files:**

- [aems-app/secrets.sh](../../secrets.sh) — new "SENTINEL SCAN" phase
  between classification and the "nothing to do" early-exit (~line 392).
  Enumerates `${PROJECT}-*` containers, checks each for `=<sentinel>$`
  in `docker inspect .Config.Env`, warns and marks poisoned. Follow-up
  "pg_shadow-poisoning corollary" iterates a fixed table of
  postgres services (database, keycloak-db, nominatim, historian x2,
  grafana-db), probes each poisoned container with `PGPASSWORD=<sentinel>`
  auth, and calls `rotate_pg` from sentinel → `.env.secrets` value if
  the probe succeeds. Merges `$POISONED_SERVICES` into `$RESTART_SERVICES`
  so the existing pass handles the recreate. Sync-helper guard extended
  to also fire when `volttron` or `volttron-setup` is in `$POISONED_SERVICES`.
  Default-case in RESTART pass adjusted to recreate poisoned containers
  even when they're Exited/Created (they need to come up with fresh env).
- [aems-app/secrets.ps1](../../secrets.ps1) — mirror of the same three
  additions.
- [aems-app/docker/CLAUDE.md](../../docker/CLAUDE.md) — one paragraph
  under Secrets model documenting the self-heal.

**Verification results on dev:**

1. **Idempotent baseline** — clean stack. `./secrets.sh --dry-run` runs
   the scan and reports "No sentinel-poisoned containers detected."
2. **Poison test** — `unset COMPOSE_ENV_FILES; docker compose up -d
   --force-recreate --no-deps init server client` reproduces the field
   failure exactly. `docker inspect aems-server` shows
   `DATABASE_PASSWORD=<sentinel>`, `aems-init` exits 1.
3. **Recovery** — `./secrets.sh` (no args) detected all three poisoned
   containers, queued them into RESTART, recreated with real env. Post-
   recovery: `aems-init` exit 0 with "No pending migrations to apply",
   all three containers healthy, `DATABASE_PASSWORD=password` in every
   env.
4. **Idempotent re-run** — subsequent `./secrets.sh` reports "No
   sentinel-poisoned containers detected." No churn.
5. **pg_shadow-poisoning edge case** — manually `ALTER ROLE aems WITH
   PASSWORD '<sentinel>'` on aems-database + `docker compose up -d
   --force-recreate --no-deps database` without COMPOSE_ENV_FILES set,
   fully simulating a fresh-clone-with-bad-boot. `./secrets.sh`:
   - Scan detected `aems-database` poisoned.
   - Corollary probed pg_shadow with sentinel → succeeded → `rotate_pg`
     ALTER ROLE aems back to `.env.secrets` value.
   - Container recreated with real env.
   - Post: pg_shadow accepts real value, REJECTS sentinel. aems-server
     authenticates cleanly.
6. **Rotation regression** — explicit-key mode (`./secrets.sh
   DATABASE_PASSWORD`) correctly SKIPS the scan (scoped to full-runs
   only per the plan), classifies the changed value, ALTER ROLEs live,
   recreates client + database + server. Reversed rotation back to
   original works identically.

**Prod recovery guidance:**

```
cd aems-app
./secrets.sh
```

The scan catches sentinel-poisoning; the pg_shadow corollary catches
the initdb-with-bad-env case. No other commands required.

### 2026-09-28 09:35:00 - follow-up hardening after prod re-poisoning

Reproduced on dev: with a clean stack, `docker compose up -d` from an
unrelated shell (no `COMPOSE_ENV_FILES` set) re-poisons the entire
stack in seconds. Just running `./start-services.sh` after that
recovered — its own `docker compose up -d` (this time under the
exported env var) detects the config diff and recreates every
poisoned container. But we can't rely on the operator remembering to
run any specific script; the previous invocation flow left a rake in
the yard.

Two additional hardening changes:

- **Safety-net call to `./secrets.sh` at end of `start-services.sh` /
  `.ps1`.** After the successful `docker compose up -d`, the
  Volttron sync step is now wrapped inside a `./secrets.sh` call.
  secrets.sh's sentinel-scan phase reports "clean" as a no-op when
  everything's already good, and repairs otherwise — so a bare
  `./start-services.sh` from any shell state always leaves the stack
  consistent with `.env.secrets`. (secrets.sh's post-check already
  calls `./check-env.sh`, so we get that too.)

- **cwd-anchoring in both entry-point scripts.** Both
  `start-services.*` and `secrets.*` now `cd` to their own script
  directory as their first action. Removes a class of "user invoked
  from wrong cwd" failures — `docker compose`'s cwd-based `.env`
  auto-load now consistently reads THIS project's `.env`, not
  whatever happened to live next to the caller. Tested by invoking
  `bash /path/to/aems-app/start-services.sh --no-build` from `/tmp` on
  a freshly-poisoned stack: full recovery, init exit 0.

**Final tested recovery path (idempotent, cwd-independent):**

```
./start-services.sh --no-build    # or from any cwd, via absolute path
```

Alone, without any manual `export COMPOSE_ENV_FILES=...` first,
recovers a sentinel-poisoned stack.

### 2026-09-28 09:55:00 - PowerShell error-record propagation fix

On Windows, `start-services.ps1 -NoBuild` against a poisoned stack
reached the safety-net secrets.ps1 call, but secrets.ps1 threw the
psql "authentication failed for user aems" error partway through the
pg_shadow-poisoning probe (before repair could complete). The
exception propagated up to start-services.ps1's catch block, printed
`Failed to start services: psql: error: ...`, and the recreate loop
never ran. Root cause: **PowerShell 5.1 with `$ErrorActionPreference =
"Stop"` treats a native command's stderr write as an ErrorRecord, and
throws even when the caller writes `2>$null`**. The pg_shadow probe
INTENTIONALLY authenticates with the sentinel expecting it to fail
for the common "container env is poisoned but pg_shadow is fine"
case — so the throw was firing on the happy path.

Two changes:

- **`secrets.ps1`** — swapped `$ErrorActionPreference = "Stop"` for
  `"Continue"` at the script top. The script uses explicit
  `if ($LASTEXITCODE -ne 0)` checks everywhere and doesn't need
  ErrorAction=Stop's cascade behaviour; it was purely a footgun for
  the many `docker` / `psql` calls whose non-zero exit is normal.
- **`secrets.ps1` pg_shadow corollary** — additionally wrapped the
  probe and the `Invoke-RotatePg` follow-up in `try/catch` with a
  local `$ErrorActionPreference = 'Continue'`, and used `*> $null` to
  suppress all stream output. Belt-and-suspenders against any future
  regression that reinstates ErrorAction=Stop.

**Verified**: same acid test on PowerShell. Poisoned the stack via
`docker compose up -d --force-recreate --no-deps init server client`
(unset COMPOSE_ENV_FILES), init exited 1, then
`powershell.exe -NoProfile -File start-services.ps1 -NoBuild` alone
recovered — scan detected all 17 poisoned containers, corollary
probed pg_shadow (auth failed cleanly, no throw), RESTART pass
recreated each, aems-init exited 0, real password in every env, all
14 services healthy. No `Failed to start services` catch-block
message.
