#!/bin/sh
#
# Make the historian role the services log in as accept the password .env holds, whatever it held
# before, then report the login.
#
# The role's password lives in the historian volume, and nothing that can log in without it is
# reachable from outside the container: initdb made POSTGRES_USER the only superuser, and pg_hba
# holds it to scram-sha-256 even on the local socket. The historian's entrypoint wrapper re-asserts
# POSTGRES_PASSWORD in single-user mode on every boot, so a role that refuses the .env value is
# repaired by restarting the container, which compose up has already created from that value.
#
# Usage: reconcile-historian-logins.sh [--timeout SECONDS]
#
# Exit codes:
#   0 - the login is accepted, or the historian is not running
#   1 - the role still refuses the .env password after a restart

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${REPO_ROOT}/.env"
TIMEOUT_SECONDS=60
if [ "${1:-}" = "--timeout" ] && [ -n "${2:-}" ]; then
  TIMEOUT_SECONDS="$2"
fi

if [ -t 1 ]; then
  BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; RESET='\033[0m'
else
  BLUE=''; GREEN=''; YELLOW=''; RED=''; RESET=''
fi

info()  { printf "${BLUE}  →${RESET}  %s\n" "$1"; }
ok()    { printf "${GREEN}  ✓${RESET}  %s\n" "$1"; }
warn()  { printf "${YELLOW}  !${RESET}  %s\n" "$1"; }
error() { printf "${RED}  ✗${RESET}  %s\n" "$1" >&2; }

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
CONTAINER="${PROJECT}-historian"

if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${CONTAINER}$"; then
  info "${CONTAINER} is not running — no historian login to check."
  exit 0
fi

PASSWORD="$(env_value HISTORIAN_DATABASE_PASSWORD)"
CONTAINER_ENV="$(docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "${CONTAINER}" 2>/dev/null | tr -d '\r')"
ROLE="$(printf '%s\n' "${CONTAINER_ENV}" | sed -n 's/^POSTGRES_USER=//p' | head -1)"
ROLE="${ROLE:-historian}"
DATABASE="$(printf '%s\n' "${CONTAINER_ENV}" | sed -n 's/^POSTGRES_DB=//p' | head -1)"
DATABASE="${DATABASE:-${ROLE}}"

login() {
  docker exec -e PGPASSWORD="${PASSWORD}" "${CONTAINER}" psql -U "${ROLE}" -h localhost -d "${DATABASE}" -tAc 'SELECT 1;' >/dev/null 2>&1
}

if login; then
  ok "historian login: role ${ROLE} accepts the password .env holds"
  exit 0
fi

warn "historian login: role ${ROLE} refuses the password .env holds — restarting ${CONTAINER} to reset it"
docker restart "${CONTAINER}" >/dev/null || { error "could not restart ${CONTAINER}"; exit 1; }
elapsed=0
while [ "${elapsed}" -lt "${TIMEOUT_SECONDS}" ]; do
  if login; then
    ok "historian login: role ${ROLE} reset, and accepts the password .env holds"
    exit 0
  fi
  sleep 2
  elapsed=$((elapsed + 2))
done
error "historian login: role ${ROLE} still refuses the password .env holds after a restart"
exit 1
