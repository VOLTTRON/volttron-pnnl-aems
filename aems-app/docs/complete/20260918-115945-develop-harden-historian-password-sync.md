# Harden historian password sync

Approved plan: `~/.claude/plans/can-you-make-sense-bright-hickey.md`. No design doc existed in `docs/proposed/` — the plan was drafted in a plan-mode session from the operator's report of `WARN [ConfigService] SyntaxError: Unexpected token 'I'` and the follow-up finding that Volttron's `historian.config` had been reset.

## Objective

Make the historian password sync self-healing so drift between the source (docker-secret file OR env var) and pg_shadow reconciles automatically on `up -d`, regardless of how the source was written. Companion changes: log-hardening in `VolttronService` and a line-integrity check in `check-env.sh`.

## Layers touched

Not a prisma → common → server → client feature. Touches:

- `aems-app/docker/historian/docker-entrypoint-wrapper.sh` (docker layer)
- `aems-app/docker/historian/setup-replication.sh` (docker layer)
- `aems-app/server/src/services/volttron.service.ts` (server layer)
- `aems-app/check-env.sh` (repo-root shell script)

Server layer needs `yarn check`. Docker layer needs `bash -n` and `docker compose config` if compose changes. No schema regeneration.

## Progress log

### 20260918-115945 — kickoff
Plan approved. No design doc existed in `docs/proposed/`. Progress log created here.

### 20260918-120100 — docker layer: entrypoint reconciler
- Edited `aems-app/docker/historian/docker-entrypoint-wrapper.sh`: inserted the pg_shadow reconciler block before `exec /usr/local/bin/docker-entrypoint.sh "$@"`. Uses postgres single-user mode via `gosu postgres postgres --single -D $PGDATA $POSTGRES_DB` so no auth is required to ALTER USER. Fingerprint tagged with source (`secret:` / `env-hist:` / `env-postgres:`) to also detect mode migrations.
- Edited `aems-app/docker/historian/setup-replication.sh`: added the initial fingerprint write after the psql init block (before the "Setup Complete" banner) using the same fallback chain as the wrapper.
- `bash -n` on both files: syntax OK.
- Result: PASS

### 20260918-120200 — server layer: VolttronService log-hardening
- Edited `aems-app/server/src/services/volttron.service.ts`: added private `parseJsonResponseOrThrow(response, context)` helper that checks `response.ok` and content-type before `.json()`, throws with HTTP status + truncated body preview otherwise.
- Replaced the raw `await response.json()` in `makeAuthCall` (line 45, context `"Volttron auth"`) and `makeApiCallWithRetry` (line 85, context `"Volttron API ${method}"`).
- Ran `yarn check` in `aems-app/server/` → exit 0.
- Result: PASS

### 20260918-120300 — repo-root shell: check-env.sh line-integrity
- Edited `aems-app/check-env.sh`: added `check_line_integrity()` function and invocations for both `$ENV_FILE` and `$SECRETS_FILE`, placed after the "Running from" banner and before mode selection. Uses `grep -nE '^[A-Z][A-Z0-9_]*=.*[a-zA-Z0-9][A-Z][A-Z0-9]{2,}(_[A-Z0-9]+)+='` — regex requires an alnum char immediately before the embedded `MULTI_WORD_KEY=` so URL query strings (`?FOO_BAR=`) don't false-positive.
- `sh -n` syntax check: OK.
- Regex validated against 9 test cases: catches the exact `.env.secrets:34` bug, catches other concatenation patterns, ignores URL query strings, base64, JWT tokens.
- Note: the current uncommitted `aems-app/.env.secrets:34` (`HISTORIAN_REPLICATOR_PASSWORD=passwordVOLTTRON_PASSWORD=admin`) WILL now be flagged as an error on the next `check-env.sh` invocation. This is the intended behavior — the check is designed to catch exactly this class of bug — but operators fixing that file first will need to insert the newline before `VOLTTRON_PASSWORD=`.
- Result: PASS

### 20260918-120400 — completion
- `env_secret_keys()` logic and placeholder-key semantics preserved: sites keeping real values in `.env` (no `.env.secrets` file, or values in `.env` alongside `.env.secrets`) still hit the existing env-only / mixed-configuration paths without new errors.
- No prisma/common/client work required. Server layer typecheck passed.
- Verification steps 1-9 in the plan are for the operator to run against a live stack; not exercised here.

## Follow-ups (not implemented)

Left explicitly out of scope per the plan:
- Volttron runtime config-store reconciler — `bootstart.sh` teaching to re-push configs from bind-mount on every start.
- Same reconciler pattern for grafana-db.
- Simplifying `secrets.sh` to defer to the wrapper for the `ALTER ROLE` step.
- Rebuilding to eliminate cache multiplicity entirely.
