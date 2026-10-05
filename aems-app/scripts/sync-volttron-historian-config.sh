#!/bin/sh
#
# Sync the current historian.config into the running VOLTTRON platform so
# the SQLHistorian agent's DB connection matches HISTORIAN_DATABASE_PASSWORD.
#
# Why: setup-volttron.sh regenerates docker/volttron/setup/configs/historian.config
# whenever the historian password changes, but the volttron image's
# setup-platform.py only installs agents once. The persistent volttron-home
# volume keeps the SQLHistorian agent's install-time config (with the old
# password) forever after that. SQLHistorian reads its connection params
# from the install-time config at $AGENT_CONFIG and does NOT reload them
# from the dynamic config store — so pushing to `vctl config store` alone
# doesn't fix the DB creds. We have to overwrite the install-time config
# file and restart the agent.
#
# What this script does:
#   1. Find the running SQLHistorian agent's AGENT_CONFIG path
#      (via /proc/<pid>/environ, so we don't have to hard-code the UUID).
#   2. Compare that file against docker/volttron/setup/configs/historian.config.
#   3. If different (or if the agent's health is BAD), overwrite the file
#      and `vctl restart --tag historian` so the agent re-runs historian_setup().
#
# No-ops when:
#   - volttron container isn't running (nothing to reconcile);
#   - the installed config already matches the on-disk file AND the agent
#     is healthy.
#
# Exit codes:
#   0 - success (either synced or already in sync or volttron not running)
#   1 - could not read the on-disk historian.config
#   2 - volttron VIP did not come up within the timeout
#   3 - could not locate the historian agent's install-time config
#   4 - config write or agent restart failed

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${REPO_ROOT}/.env"
HISTORIAN_CONFIG_HOST="${REPO_ROOT}/docker/volttron/setup/configs/historian.config"
# Up to 300s: bootstart.sh -> setup-platform.py sequentially installs
# every declared agent (typically 3-4 min) before SQLHistorian appears.
VCTL_TIMEOUT_SECONDS=300

# ── color helpers ──────────────────────────────────────────────────────────────
if [ -t 1 ]; then
  BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; RESET='\033[0m'
else
  BLUE=''; GREEN=''; YELLOW=''; RED=''; RESET=''
fi

info()  { printf "${BLUE}  →${RESET}  %s\n" "$1"; }
ok()    { printf "${GREEN}  ✓${RESET}  %s\n" "$1"; }
warn()  { printf "${YELLOW}  !${RESET}  %s\n" "$1"; }
error() { printf "${RED}  ✗${RESET}  %s\n" "$1" >&2; }

# ── resolve project name ───────────────────────────────────────────────────────
# The shell outranks .env, as it does for compose itself.
PROJECT="${COMPOSE_PROJECT_NAME:-}"
if [ -z "${PROJECT}" ] && [ -f "${ENV_FILE}" ]; then
  PROJECT=$(grep -v '^\s*#' "${ENV_FILE}" | tr -d '\r' | grep '^COMPOSE_PROJECT_NAME=' | head -1 | sed "s/^[^=]*=//; s/^['\"]//; s/['\"]$//")
fi
PROJECT="${PROJECT:-skeleton}"
VOLTTRON_CONTAINER="${PROJECT}-volttron"

# ── pre-flight ─────────────────────────────────────────────────────────────────
if [ ! -f "${HISTORIAN_CONFIG_HOST}" ]; then
  error "historian.config not found at ${HISTORIAN_CONFIG_HOST}"
  error "Run volttron-setup (docker compose up -d volttron-setup) first."
  exit 1
fi

if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${VOLTTRON_CONTAINER}$"; then
  info "${VOLTTRON_CONTAINER} is not running — nothing to reconcile."
  exit 0
fi

# ── vctl helper — vctl isn't on the default PATH inside the image ──────────────
# Runs as the volttron user via a login shell so ~/.local/bin/vctl resolves.
vctl() {
  docker exec -u volttron "${VOLTTRON_CONTAINER}" \
    bash -lc "export PATH=/home/volttron/.local/bin:\$PATH; vctl $*"
}

# ── wait for VIP responsiveness AND for SQLHistorian to be installed ──────────
# After a fresh volttron container start, bootstart.sh -> setup-platform.py
# spends up to a couple of minutes installing agents one at a time before
# SQLHistorian appears. We can't do anything useful until it's running.
info "Waiting up to ${VCTL_TIMEOUT_SECONDS}s for volttron VIP + SQLHistorian install..."
elapsed=0
HISTORIAN_PID=""
while [ "${elapsed}" -lt "${VCTL_TIMEOUT_SECONDS}" ]; do
  if vctl status >/dev/null 2>&1; then
    HISTORIAN_PID=$(docker exec -u volttron "${VOLTTRON_CONTAINER}" \
        bash -c 'pgrep -f "sqlhistorian\.historian" | head -1' 2>/dev/null || true)
    [ -n "${HISTORIAN_PID}" ] && break
  fi
  sleep 3
  elapsed=$((elapsed + 3))
done
if [ "${elapsed}" -ge "${VCTL_TIMEOUT_SECONDS}" ]; then
  error "volttron VIP or SQLHistorian did not become ready within ${VCTL_TIMEOUT_SECONDS}s — skipping sync."
  error "Re-run this helper (./scripts/sync-volttron-historian-config.sh) once the platform finishes booting."
  exit 2
fi

# /proc/<pid>/environ is only readable by the process owner (volttron), so
# run this exec as that user too.
AGENT_CONFIG_PATH=$(docker exec -u volttron "${VOLTTRON_CONTAINER}" \
    sh -c "cat /proc/${HISTORIAN_PID}/environ | tr '\0' '\n' | sed -n 's/^AGENT_CONFIG=//p' | head -1" 2>/dev/null || true)

if [ -z "${AGENT_CONFIG_PATH}" ]; then
  error "Could not resolve AGENT_CONFIG env var for pid ${HISTORIAN_PID}."
  exit 3
fi

# ── compare installed config against on-disk file ─────────────────────────────
# Wrap `cat` in `sh -c` so Git Bash / MSYS on Windows doesn't try to convert
# the leading-slash container path into a C:\… prefix.
INSTALLED_JSON=$(docker exec -u volttron "${VOLTTRON_CONTAINER}" \
    sh -c "cat '${AGENT_CONFIG_PATH}'" 2>/dev/null || true)
DESIRED_JSON=$(cat "${HISTORIAN_CONFIG_HOST}")

normalize() { tr -d '[:space:]'; }

CONFIG_IN_SYNC=0
if [ -n "${INSTALLED_JSON}" ] && \
   [ "$(printf '%s' "${INSTALLED_JSON}" | normalize)" = "$(printf '%s' "${DESIRED_JSON}" | normalize)" ]; then
  CONFIG_IN_SYNC=1
fi

HEALTH=$(vctl status 2>/dev/null | awk '/platform\.historian /{print $NF}')

if [ "${CONFIG_IN_SYNC}" = "1" ] && [ "${HEALTH}" = "GOOD" ]; then
  ok "SQLHistorian install-time config already in sync and health is GOOD — nothing to do."
  exit 0
fi

# ── overwrite the install-time config ─────────────────────────────────────────
if [ "${CONFIG_IN_SYNC}" = "0" ]; then
  info "Overwriting SQLHistorian install-time config at ${AGENT_CONFIG_PATH}"
  # Pipe the file over stdin. Run as the volttron user so the file owner is
  # preserved. Wrap with `sh -c` so MSYS on Windows doesn't mangle the path.
  if ! cat "${HISTORIAN_CONFIG_HOST}" | docker exec -i -u volttron "${VOLTTRON_CONTAINER}" \
      sh -c "cat > '${AGENT_CONFIG_PATH}'" 2>/dev/null; then
    error "Failed to write ${AGENT_CONFIG_PATH}"
    exit 4
  fi
  ok "Install-time config updated."
else
  info "Install-time config already in sync; agent health is ${HEALTH:-unknown} — restarting to recover."
fi

# ── restart the agent so it re-reads config and re-runs historian_setup() ─────
info "Restarting platform.historian..."
if ! vctl restart --tag historian >/dev/null 2>&1; then
  error "vctl restart --tag historian failed."
  warn "Fall back: docker compose up -d --force-recreate volttron"
  exit 4
fi

ok "platform.historian restarted. Give it ~30s to re-run setup, then check:"
ok "  docker exec ${VOLTTRON_CONTAINER} bash -lc 'export PATH=/home/volttron/.local/bin:\$PATH; vctl status' | grep historian"
