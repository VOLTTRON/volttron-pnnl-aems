#!/bin/sh
#
# Fingerprint the inputs the volttron-setup container renders from, and invalidate its completion
# lock when any of them changes, so the next `docker compose up` re-renders. The container's own
# gate (setup-volttron.sh's VOLTTRON_LOCK_FILE) is narrower -- it fingerprints only
# HISTORIAN_DB_PASSWORD -- and misses a changed VOLTTRON_* value, a changed generate_configs.py or
# a changed registry file.
#
# Must run BEFORE `docker compose up -d` -- the volttron-setup container reads the lock the moment
# it starts.
#
# Inputs:
#   - every VOLTTRON_* and HISTORIAN_DB_* value from .env (plus HISTORIAN_DATABASE_PASSWORD, which
#     setup-volttron.sh reads under the HISTORIAN_DB_PASSWORD alias)
#   - the SHA of ../aems-edge/configurations/docker/generate_configs.py
#   - the SHA of the file at VOLTTRON_REGISTRY_FILE_PATH, if the path is set and the file exists
#
# Exit codes:
#   0 - fingerprint unchanged, or lock successfully invalidated
#   1 - the volume exists but the lock could not be invalidated

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${REPO_ROOT}/.env"
# aems-edge is a sibling of aems-app in the standard checkout. The script fixture places
# its own aems-edge tree inside the sandbox, so a path at ${REPO_ROOT}/aems-edge wins when
# it exists.
if [ -f "${REPO_ROOT}/aems-edge/configurations/docker/generate_configs.py" ]; then
  GEN_PY="${REPO_ROOT}/aems-edge/configurations/docker/generate_configs.py"
else
  GEN_PY="${REPO_ROOT}/../aems-edge/configurations/docker/generate_configs.py"
fi
STATE_DIR="${REPO_ROOT}/volttron/setup"
STATE_FILE="${STATE_DIR}/.render_fingerprint"

if [ -t 1 ]; then
  BLUE='\033[0;34m'; GREEN='\033[0;32m'; RED='\033[0;31m'; RESET='\033[0m'
else
  BLUE=''; GREEN=''; RED=''; RESET=''
fi

info()  { printf "${BLUE}  →${RESET}  %s\n" "$1"; }
ok()    { printf "${GREEN}  ✓${RESET}  %s\n" "$1"; }
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

# Every VOLTTRON_* and HISTORIAN_DB_* line from .env, plus HISTORIAN_DATABASE_PASSWORD, as `KEY=VALUE`
# with the quoting normalised. Sorted so key order in the file does not shift the fingerprint.
env_pairs() {
  [ -f "${ENV_FILE}" ] || return 0
  sed '1s/^\xEF\xBB\xBF//; s/\r$//' "${ENV_FILE}" \
    | grep -v '^\s*#' \
    | grep -E '^(VOLTTRON_|HISTORIAN_DB_|HISTORIAN_DATABASE_PASSWORD=)' \
    | while IFS= read -r line; do
        key="${line%%=*}"
        raw="${line#*=}"
        printf '%s=%s\n' "${key}" "$(unquote "${raw}")"
      done \
    | sort
}

sha_file() {
  [ -f "$1" ] || return 0
  sha256sum "$1" | awk '{print $1}'
}

compute_fingerprint() {
  (
    env_pairs
    gen_sha="$(sha_file "${GEN_PY}")"
    [ -n "${gen_sha}" ] && printf 'generate_configs=%s\n' "${gen_sha}"
    reg_path="$(env_value VOLTTRON_REGISTRY_FILE_PATH)"
    if [ -n "${reg_path}" ]; then
      reg_sha="$(sha_file "${reg_path}")"
      [ -n "${reg_sha}" ] && printf 'registry=%s\n' "${reg_sha}"
    fi
  ) | sha256sum | awk '{print $1}'
}

PROJECT="${COMPOSE_PROJECT_NAME:-$(env_value COMPOSE_PROJECT_NAME)}"
PROJECT="${PROJECT:-skeleton}"
VOLUME="${PROJECT}_volttron-setup"

NEW_FP="$(compute_fingerprint)"
OLD_FP="$(cat "${STATE_FILE}" 2>/dev/null || true)"

if [ "${NEW_FP}" = "${OLD_FP}" ] && [ -n "${OLD_FP}" ]; then
  info "volttron-setup inputs unchanged — no re-render needed."
  exit 0
fi

# Invalidate the completion lock inside the volume so setup-volttron.sh re-renders. A missing
# volume is first-run, in which case there is nothing to invalidate -- compose creates the volume
# empty and setup-volttron.sh runs anyway.
if docker volume inspect "${VOLUME}" >/dev/null 2>&1; then
  info "volttron-setup inputs changed — invalidating ${VOLUME} completion lock."
  if ! docker run --rm -v "${VOLUME}:/data" busybox sh -c 'rm -f /data/.setup_complete /data/.setup_complete.fingerprint' >/dev/null 2>&1; then
    error "could not invalidate ${VOLUME} completion lock."
    exit 1
  fi
fi

mkdir -p "${STATE_DIR}"
printf '%s\n' "${NEW_FP}" > "${STATE_FILE}"
ok "volttron-setup render fingerprint updated."
