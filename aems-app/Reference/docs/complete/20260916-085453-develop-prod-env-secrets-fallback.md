# Restore env-only mode for prod deploys with passwords in `.env`

## Problem

`./start-services.sh` on the prod server fails after a `git pull`:

```
WARN[0001] secret file aems_redis_password does not exist
WARN[0001] secret file aems_keycloak_database_password does not exist
WARN[0001] secret file aems_historian_database_password does not exist
Error response from daemon: invalid mount config for type "bind":
bind source path does not exist:
  /home/volttron/volttron-pnnl-aems/aems-app/docker/secrets/.placeholder
```

Prod keeps its passwords directly in `.env` (env-only mode, documented in
`check-env.sh` and `docker/CLAUDE.md`). Two bugs in the docker secrets
fallback chain break that mode:

1. `.gitignore` excludes the `docker/secrets/` directory, which silently
   nullifies `!docker/secrets/.placeholder` — the placeholder file was
   never actually tracked, so fresh clones don't have it.
2. `docker/.env.secrets.docker` was committed populated with real
   `_SOURCE=./secrets/*.txt` and `_FILE=/run/secrets/*` lines, so the
   `${..._SOURCE:-./secrets/.placeholder}` fallback in
   `docker/docker-compose.yml` never activates.

No design doc existed for this — decisions are documented in the plan file
at `~/.claude/plans/updating-on-the-prod-harmonic-kite.md`.

## Progress log

### 2026-09-16 08:54:53 — start

Plan approved. No prisma/common/server/client work needed; changes are
confined to the docker/deployment layer:

- `aems-app/.gitignore` — replace `docker/secrets/` with `docker/secrets/*`
  so `!docker/secrets/.placeholder` takes effect.
- `aems-app/docker/secrets/.placeholder` — new empty tracked file (force-add).
- `aems-app/docker/.env.secrets.docker` — truncate to comment-only header.
- `aems-app/check-env.sh` / `check-env.ps1` — ensure `.placeholder` exists
  before compose runs (belt-and-suspenders against `rm` or
  `docker compose down -v`).

### 2026-09-16 08:57:00 — implementation complete

All four changes applied:

- `.gitignore`: line 22 `docker/secrets/*`; negation `!docker/secrets/.placeholder`
  on line 28 now takes effect (`git check-ignore -v` confirms `.placeholder`
  is un-ignored while `docker/secrets/database_password.txt` remains ignored).
- `docker/secrets/.placeholder`: force-staged; empty (blob `e69de29b`, git's
  hash for a zero-byte file).
- `docker/.env.secrets.docker`: reset to a header-only comment block —
  no `_FILE=` and no `_SOURCE=` lines. Env-only mode now works out of the
  box; `secrets.sh` still rewrites the file locally on opt-in.
- `check-env.sh` + `check-env.ps1`: added an `mkdir -p` + touch guard on
  `docker/secrets/.placeholder` at pre-flight, before any subsequent
  compose invocation.

No layer checks (yarn build/check) run — the fix touches only shell scripts,
gitignore, and a docker env file. No TypeScript, no schema, no generated
artifacts. `docker-compose.yml` was intentionally not touched; the
`${..._SOURCE:-./secrets/.placeholder}` fallback was already correct.

Pre-existing `aems-app/.env` diff (adds `synth` to `COMPOSE_PROFILES`) is
unrelated and left alone per the plan.

**Verification** (per the plan) still to be performed manually by the
operator on a prod-like host: docker compose up on a fresh clone with
passwords in `.env` should now succeed, and running `./secrets.sh` on that
same host should migrate values without breaking auth. Pushed to prod via
`git pull && ./start-services.sh`.
