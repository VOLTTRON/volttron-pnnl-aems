#!/bin/sh
#
# The last thing start-services prints: whether the historian role accepts the password .env holds,
# and the health VOLTTRON reports for each of its agents. A service its profile did not start is
# named as not running, which is not a failure.
#
# Exit codes:
#   0 - everything running is healthy
#   1 - a login is refused, VOLTTRON did not answer, or an agent is not GOOD

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${REPO_ROOT}/.env"

if [ -t 1 ]; then
  BLUE='\033[0;34m'; GREEN='\033[0;32m'; RED='\033[0;31m'; RESET='\033[0m'
else
  BLUE=''; GREEN=''; RED=''; RESET=''
fi

# A value as compose reads it from .env: single quotes literal, double quotes with \" and $$.
unquote() {
  case "$1" in
    \'*\') v=${1#\'}; printf '%s' "${v%\'}" ;;
    \"*\") v=${1#\"}; v=${v%\"}; printf '%s' "$v" | sed 's/\\"/"/g; s/\$\$/$/g' ;;
    *)     printf '%s' "$1" ;;
  esac
}

env_value() {
  [ -f "${ENV_FILE}" ] || return 0
  unquote "$(sed '1s/^\xEF\xBB\xBF//; s/\r$//' "${ENV_FILE}" | grep -v '^\s*#' | grep "^$1=" | head -1 | sed 's/^[^=]*=//')"
}

# The shell outranks .env, as it does for compose itself.
PROJECT="${COMPOSE_PROJECT_NAME:-$(env_value COMPOSE_PROJECT_NAME)}"
PROJECT="${PROJECT:-skeleton}"
HISTORIAN="${PROJECT}-historian"
VOLTTRON="${PROJECT}-volttron"
RUNNING="$(docker ps --format '{{.Names}}' 2>/dev/null)"
running() { printf '%s\n' "${RUNNING}" | grep -q "^$1$"; }

UNHEALTHY=0
good() { printf "  ${GREEN}%-12s${RESET} %s\n" "$1" "$2"; }
bad()  { printf "  ${RED}%-12s${RESET} %s\n" "$1" "$2"; UNHEALTHY=1; }
note() { printf "  ${BLUE}%-12s${RESET} %s\n" "$1" "$2"; }

echo ""
echo "Deployment report"

if running "${HISTORIAN}"; then
  PASSWORD="$(env_value HISTORIAN_DATABASE_PASSWORD)"
  CONTAINER_ENV="$(docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "${HISTORIAN}" 2>/dev/null | tr -d '\r')"
  ROLE="$(printf '%s\n' "${CONTAINER_ENV}" | sed -n 's/^POSTGRES_USER=//p' | head -1)"
  ROLE="${ROLE:-historian}"
  DATABASE="$(printf '%s\n' "${CONTAINER_ENV}" | sed -n 's/^POSTGRES_DB=//p' | head -1)"
  DATABASE="${DATABASE:-${ROLE}}"
  if docker exec -e PGPASSWORD="${PASSWORD}" "${HISTORIAN}" psql -U "${ROLE}" -h localhost -d "${DATABASE}" -tAc 'SELECT 1;' >/dev/null 2>&1; then
    good "OK" "historian login: role ${ROLE}"
  else
    bad "FAILED" "historian login: role ${ROLE} refuses the password .env holds"
  fi
else
  note "-" "historian: not running"
fi

if running "${VOLTTRON}"; then
  if STATUS="$(docker exec -u volttron "${VOLTTRON}" bash -lc "export PATH=/home/volttron/.local/bin:\$PATH; vctl status" 2>/dev/null)"; then
    AGENTS="$(printf '%s\n' "${STATUS}" | tr -d '\r' | grep -v '^[[:space:]]*$' | grep -v 'AGENT.*HEALTH')"
    if [ -z "${AGENTS}" ]; then
      bad "NO AGENTS" "VOLTTRON: vctl status lists no agent"
    fi
    printf '%s\n' "${AGENTS}" | while IFS= read -r line; do
      [ -n "${line}" ] || continue
      agent="$(printf '%s' "${line}" | tr -s ' ' | sed 's/^ //')"
      if [ "$(printf '%s' "${line}" | awk '{print $NF}')" = "GOOD" ]; then
        good "GOOD" "agent: ${agent}"
      else
        bad "NOT HEALTHY" "agent: ${agent}"
      fi
    done
    # The loop runs in a subshell, so its verdict is read back from the lines themselves.
    printf '%s\n' "${AGENTS}" | awk 'NF && $NF != "GOOD" { bad = 1 } END { exit bad }' || UNHEALTHY=1
  else
    bad "NO ANSWER" "VOLTTRON: did not answer vctl status"
  fi
else
  note "-" "VOLTTRON: not running"
fi

exit "${UNHEALTHY}"
