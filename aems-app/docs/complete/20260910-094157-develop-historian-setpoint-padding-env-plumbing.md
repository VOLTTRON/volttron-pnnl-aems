# Develop: historian setpoint padding env plumbing

Debug why `HISTORIAN_SETPOINT_ERROR_THRESHOLD_PADDING=0.7` set in `aems-app/.env` is not reaching the running `server` container. No prior design doc — this is a config/env-plumbing debug session.

**Consumer:** [aems-app/server/src/app.config.ts:427](../../server/src/app.config.ts) → `parseFloat(process.env.HISTORIAN_SETPOINT_ERROR_THRESHOLD_PADDING ?? "0")`, exposed via `readConfig` GraphQL query, consumed by client at [SiteDashboard.tsx:95](../../client/src/app/dashboards/components/SiteDashboard.tsx).

**Pending working-tree diff (do not revert):**
- `aems-app/docker-compose.yml` — added `./.env` to include `env_file:`; removed `project_directory: ./docker/`.
- `aems-app/.env` — added `synth` to `COMPOSE_PROFILES` (orthogonal).

**Working hypothesis:** compose's `include:` treats the included file as a sub-project; parent auto-loaded `.env` does NOT flow into `${VAR}` interpolation inside `docker/.env.server`. The pending diff should fix it — verifying diagnostically before making further changes.

## Progress log

### 2026-09-10 09:45 — Step 2: diagnostic
- `docker compose config server` from `aems-app/` → resolves `HISTORIAN_SETPOINT_ERROR_THRESHOLD_PADDING: "0.7"` correctly. Neighbors (`HISTORIAN_BINNING_*`) also resolve correctly.
- `docker compose config` produced no `not set` / `WARN` / `no such file` output — removing `project_directory: ./docker/` did NOT break relative-path resolution.
- **Verdict:** the pending working-tree diff (adding `./.env` to include `env_file:`) fixed the compose-level interpolation. Skipping step 3 fallback.

### 2026-09-10 09:47 — Runtime check
- `docker compose exec aems-server env | grep HISTORIAN` shows `HISTORIAN_SETPOINT_ERROR_THRESHOLD_PADDING=0` — the running container is stale (38 min uptime), predates when the fixed compose config was in effect.
- Next: full stop/start via scripts (user preference).

### 2026-09-10 10:15 — Step 4: full recreate + runtime verify
- `./stop-services.sh` + `./start-services.sh --no-build` — all services recreated (no image rebuild).
- `docker compose exec server env | grep HISTORIAN_SETPOINT` → `HISTORIAN_SETPOINT_ERROR_THRESHOLD_PADDING=0.7`. Root cause confirmed and fixed.

### 2026-09-10 10:17 — Step 5: hardening log
- Added `this.logger.log(\`Historian binning config: ${JSON.stringify(this.historian.binning)}\`)` in [server/src/app.config.ts:430](../../server/src/app.config.ts) after the `this.historian` assignment. Emits at construction so future env-plumbing regressions are visible in `docker compose logs server`.
- `yarn check` in `server/` → EXIT=0.

### 2026-09-10 10:20 — Step 6: end-to-end verify
- `docker compose build server` + `docker compose up -d server` — image rebuilt with the new log line, server container recreated.
- `docker compose logs server | grep -i binning`:
  `[AppConfigService] Historian binning config: {"count":2000,"start":48,"unit":"hours","setpointErrorThresholdPadding":0.7}`
- Runtime env still `HISTORIAN_SETPOINT_ERROR_THRESHOLD_PADDING=0.7`.

## Outcome

**Root cause:** compose's `include:` does not automatically propagate the parent's auto-loaded `.env` into `${VAR}` interpolation inside service-level `env_file:` targets in the included compose. `docker/.env.server:57` (`HISTORIAN_SETPOINT_ERROR_THRESHOLD_PADDING=${HISTORIAN_SETPOINT_ERROR_THRESHOLD_PADDING}`) was resolving to empty because the include's `env_file:` list only contained `./docker/.env.secrets.docker`.

**Fix:** add `./.env` to the include's `env_file:` list in [aems-app/docker-compose.yml](../../docker-compose.yml). Removing the (redundant) `project_directory: ./docker/` is harmless — `docker compose config` produced no path resolution warnings.

**Hardening:** added a startup log of `historian.binning` in [server/src/app.config.ts](../../server/src/app.config.ts) so this class of regression is visible in server logs without needing `docker compose exec … env`.
