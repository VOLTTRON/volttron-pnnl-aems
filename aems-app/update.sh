#!/bin/sh
#
# Bring an existing deployment to the current release.
#
#   1. Carry every .env value differing from the tracked version into
#      .env.secrets, so the next sync restores it. This captures operator
#      edits made directly to .env that never reached .env.secrets.
#   2. Scrub .env (restore the tracked sentinel version, clear
#      skip-worktree) so git pull is never refused over .env.
#   3. git pull --ff-only. On failure for any reason, put .env back in
#      sync from .env.secrets, name the reason, and exit non-zero.
#   4. Run ./start-services, which calls secrets.sh and brings the stack up.

set -e
cd "$(dirname "$0")"

ENV_FILE=".env"
SECRETS_FILE=".env.secrets"
PLACEHOLDER="SeT_tHiS_iN_0x3A-.env.secrets-"

if [ -t 1 ]; then
  RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'
  BOLD='\033[1m'; RESET='\033[0m'
else
  RED=''; YELLOW=''; GREEN=''; BLUE=''; BOLD=''; RESET=''
fi
info()  { printf "${BLUE}  →${RESET}  %s\n" "$1"; }
ok()    { printf "${GREEN}  ✓${RESET}  %s\n" "$1"; }
warn()  { printf "${YELLOW}  !${RESET}  %s\n" "$1"; }
error() { printf "${RED}  ✗${RESET}  %s\n" "$1" >&2; }

unquote() {
  case "$1" in
    \'*\') v=${1#\'}; printf '%s' "${v%\'}" ;;
    \"*\') v=${1#\"}; v=${v%\"}; printf '%s' "$v" | sed 's/\\"/"/g; s/\$\$/$/g' ;;
    *)     printf '%s' "$1" ;;
  esac
}

get_value_from_text() {
  text="$1"; key="$2"
  raw=$(printf '%s\n' "$text" | sed '1s/^\xEF\xBB\xBF//; s/\r$//' | grep -v '^\s*#' | grep "^${key}=" | head -1 | sed 's/^[^=]*=//')
  unquote "$raw"
}

get_value() {
  file="$1"; key="$2"
  [ -f "$file" ] || return 0
  get_value_from_text "$(cat "$file")" "$key"
}

env_keys() {
  grep -v '^\s*#' "$ENV_FILE" | tr -d '\r' \
    | grep -E '^[A-Za-z_][A-Za-z0-9_]*=' | sed 's/=.*//'
}

# Append or replace KEY='VALUE' in FILE (upsert).
upsert_secret() {
  file="$1"; key="$2"; value="$3"
  case "$value" in
    *"'"*) warn "$key: value contains a literal single quote; skipped"; return 0 ;;
  esac
  line="${key}='${value}'"
  tmp="${file}.tmp$$"
  : > "$tmp"
  found=0
  if [ -f "$file" ]; then
    while IFS= read -r l || [ -n "$l" ]; do
      case "$l" in
        "${key}="*) printf '%s\n' "$line" >> "$tmp"; found=1 ;;
        *)          printf '%s\n' "$l" >> "$tmp" ;;
      esac
    done < "$file"
  fi
  [ "$found" = 1 ] || printf '%s\n' "$line" >> "$tmp"
  cat "$tmp" > "$file"
  rm -f "$tmp"
}

capture_env_overrides() {
  git ls-files --error-unmatch "$ENV_FILE" >/dev/null 2>&1 || return 0
  tracked=$(git show "HEAD:./$ENV_FILE" 2>/dev/null || true)
  [ -n "$tracked" ] || return 0
  captured=0
  for k in $(env_keys); do
    cur=$(get_value "$ENV_FILE" "$k")
    [ -z "$cur" ] && continue
    [ "$cur" = "$PLACEHOLDER" ] && continue
    tracked_val=$(get_value_from_text "$tracked" "$k")
    if [ "$cur" != "$tracked_val" ]; then
      upsert_secret "$SECRETS_FILE" "$k" "$cur"
      captured=$((captured + 1))
    fi
  done
  if [ "$captured" -gt 0 ]; then
    info "Captured $captured .env override(s) into $SECRETS_FILE"
  fi
}

scrub_env() {
  git ls-files --error-unmatch "$ENV_FILE" >/dev/null 2>&1 || return 0
  git update-index --no-skip-worktree "$ENV_FILE" 2>/dev/null || true
  git checkout HEAD -- "$ENV_FILE"
}

resync_env() {
  [ -x ./secrets.sh ] || return 0
  [ -f "$SECRETS_FILE" ] || return 0
  ./secrets.sh || warn "secrets.sh reported issues (see above)"
}

printf "${BOLD}Update${RESET}\n"

info "Capturing .env overrides into $SECRETS_FILE"
capture_env_overrides

info "Scrubbing $ENV_FILE to the tracked baseline"
scrub_env

info "git pull --ff-only"
set +e
PULL_OUT=$(git pull --ff-only 2>&1)
PULL_EXIT=$?
set -e
printf '%s\n' "$PULL_OUT"

if [ "$PULL_EXIT" -ne 0 ]; then
  error "pull refused"
  printf '%s\n' "$PULL_OUT" >&2
  warn "Putting $ENV_FILE back in sync from $SECRETS_FILE; nothing started."
  resync_env
  exit 1
fi

ok "pull succeeded"
info "Running ./start-services.sh"
./start-services.sh "$@"
