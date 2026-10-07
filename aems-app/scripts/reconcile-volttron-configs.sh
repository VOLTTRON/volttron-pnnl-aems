#!/bin/sh
#
# Make VOLTTRON's config store and every agent's install-time config match what volttron-setup
# rendered, then mark every unit and control for a push so the app's own values win.
#
# The store and the installed configs live in the volttron-home volume and are written once, when
# setup-platform.py first installs the agents; a re-render changes neither. The comparison runs in
# the container (reconcile-volttron-configs.py), where platform_config.yml and the rendered files are
# mounted. The services process's own startup re-push fires before VOLTTRON has finished installing
# its agents, so the re-push is asked for again here, once VOLTTRON answers.
#
# Usage: reconcile-volttron-configs.sh [--timeout SECONDS]   (waits that long for VOLTTRON; default 300)
#
# Exit codes:
#   0 - reconciled, or VOLTTRON is not running
#   1 - an agent's config could not be reconciled (the re-push is still asked for)
#   2 - VOLTTRON did not answer within the timeout

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${REPO_ROOT}/.env"
TIMEOUT_SECONDS=300
if [ "${1:-}" = "--timeout" ] && [ -n "${2:-}" ]; then
  TIMEOUT_SECONDS="$2"
fi

if [ -t 1 ]; then
  BLUE='\033[0;34m'; GREEN='\033[0;32m'; RED='\033[0;31m'; RESET='\033[0m'
else
  BLUE=''; GREEN=''; RED=''; RESET=''
fi

info()  { printf "${BLUE}  →${RESET}  %s\n" "$1"; }
ok()    { printf "${GREEN}  ✓${RESET}  %s\n" "$1"; }
error() { printf "${RED}  ✗${RESET}  %s\n" "$1" >&2; }

# The shell outranks .env, as it does for compose itself.
PROJECT="${COMPOSE_PROJECT_NAME:-}"
if [ -z "${PROJECT}" ] && [ -f "${ENV_FILE}" ]; then
  PROJECT=$(grep -v '^\s*#' "${ENV_FILE}" | tr -d '\r' | grep '^COMPOSE_PROJECT_NAME=' | head -1 | sed "s/^[^=]*=//; s/^['\"]//; s/['\"]$//")
fi
PROJECT="${PROJECT:-skeleton}"
VOLTTRON="${PROJECT}-volttron"
DATABASE="${PROJECT}-database"

if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${VOLTTRON}$"; then
  info "${VOLTTRON} is not running — no VOLTTRON configs to reconcile."
  exit 0
fi

info "Waiting up to ${TIMEOUT_SECONDS}s for VOLTTRON to answer..."
elapsed=0
until docker exec -u volttron "${VOLTTRON}" bash -lc "export PATH=/home/volttron/.local/bin:\$PATH; vctl status" >/dev/null 2>&1; do
  if [ "${elapsed}" -ge "${TIMEOUT_SECONDS}" ]; then
    error "VOLTTRON did not answer within ${TIMEOUT_SECONDS}s — its configs were not reconciled."
    exit 2
  fi
  sleep 3
  elapsed=$((elapsed + 3))
done

STATUS=0
docker exec -i -u volttron "${VOLTTRON}" bash -lc "export PATH=/home/volttron/.local/bin:\$PATH; python3 -" \
  < "${SCRIPT_DIR}/reconcile-volttron-configs.py" || STATUS=1
if [ "${STATUS}" = 0 ]; then
  ok "VOLTTRON holds the rendered configs for every agent."
else
  error "Some VOLTTRON configs could not be reconciled (above)."
fi

# The app's own values -- setpoints, schedules, holidays, ILC -- go out again over whatever was reset.
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${DATABASE}$"; then
  DB_ENV="$(docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "${DATABASE}" 2>/dev/null | tr -d '\r')"
  DB_USER="$(printf '%s\n' "${DB_ENV}" | sed -n 's/^POSTGRES_USER=//p' | head -1)"
  DB_NAME="$(printf '%s\n' "${DB_ENV}" | sed -n 's/^POSTGRES_DB=//p' | head -1)"
  MARK="SET stage = 'Update', message = 'Repushing after VOLTTRON configs were reconciled', \"updatedAt\" = now()"
  if printf 'UPDATE "Unit" %s; UPDATE "Control" %s;\n' "${MARK}" "${MARK}" | \
      docker exec -i "${DATABASE}" psql -U "${DB_USER:-postgres}" -d "${DB_NAME:-${DB_USER:-postgres}}" -v ON_ERROR_STOP=1 >/dev/null 2>&1; then
    ok "Every unit and control is marked for a push."
  else
    error "Could not mark units and controls for a push."
    STATUS=1
  fi
else
  info "${DATABASE} is not running — no units or controls to re-push."
fi

exit "${STATUS}"
