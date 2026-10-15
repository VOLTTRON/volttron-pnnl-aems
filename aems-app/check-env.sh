#!/bin/sh
#
# Report the state of .env and .env.secrets before deploying.
#
# Exit 0: OK, with or without warnings. A blank or placeholder entry in .env.secrets means the
#         .env sentinel, which is a valid runtime default; a sentinel .env beside a real
#         .env.secrets means secrets.sh has not run yet. Both are reported, neither blocks.
# Exit 1: the compose shim cannot be run from a fresh clone, or an env file has lost a newline.
#
# check-env.ps1 reports the same findings in the same words.
#
# Usage: ./check-env.sh

ENV_FILE=".env"
SECRETS_FILE=".env.secrets"
PLACEHOLDER="SeT_tHiS_iN_0x3A-.env.secrets-"

# ── color helpers ──────────────────────────────────────────────────────────────
if [ -t 1 ]; then
  RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; BOLD='\033[1m'; RESET='\033[0m'
else
  RED=''; YELLOW=''; GREEN=''; BOLD=''; RESET=''
fi

ok()    { printf "${GREEN}  [OK]${RESET}    %s\n" "$1"; }
warn()  { printf "${YELLOW}  [WARN]${RESET}  %s\n" "$1"; }
error() { printf "${RED}  [ERROR]${RESET} %s\n" "$1"; }
header(){ printf "\n${BOLD}%s${RESET}\n" "$1"; }

ERRORS=0
mark_error() { ERRORS=$((ERRORS + 1)); }

# ── helpers ────────────────────────────────────────────────────────────────────

# File content without a BOM or CRs, comments dropped.
entries() {
  [ -f "$1" ] || return 0
  sed '1s/^\xEF\xBB\xBF//; s/\r$//' "$1" | grep -v '^\s*#'
}

env_secret_keys() {
  entries "$ENV_FILE" | grep -E "^[A-Za-z_][A-Za-z0-9_]*=['\"]?${PLACEHOLDER}['\"]?$" | sed 's/=.*//'
}

secrets_keys() {
  entries "$SECRETS_FILE" | grep -E '^[A-Za-z_][A-Za-z0-9_]*=' | sed 's/=.*//'
}

# A value as compose reads it: '...' is literal, "..." takes \" and $$ escapes.
get_value() {
  raw=$(entries "$1" | grep "^$2=" | head -1 | sed 's/^[^=]*=//')
  case "$raw" in
    \'*\') v=${raw#\'}; printf '%s' "${v%\'}" ;;
    \"*\") v=${raw#\"}; v=${v%\"}; printf '%s' "$v" | sed 's/\\"/"/g; s/\$\$/$/g' ;;
    *)     printf '%s' "$raw" ;;
  esac
}

# ── pre-flight ─────────────────────────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  printf "${RED}ERROR:${RESET} $ENV_FILE not found. Run from the repo root.\n"
  exit 1
fi

printf "\n${BOLD}Environment/Secrets Check${RESET}\n"
printf "Running from: %s\n" "$(pwd)"

# ── compose-shim include: env_file: sanity ────────────────────────────────────
# A gitignored file under the root shim's `include: env_file:` cannot exist in a fresh clone, and
# compose refuses to run at all without it.
shim="docker-compose.yml"
gi=".gitignore"
if [ -f "$shim" ] && [ -f "$gi" ]; then
  paths=$(awk '
    /^[[:space:]]*env_file:[[:space:]]*$/ { in_block=1; next }
    in_block && /^[[:space:]]*-[[:space:]]*/ { sub(/^[[:space:]]*-[[:space:]]*/,""); sub(/^\.\//,""); print; next }
    in_block { in_block=0 }
  ' "$shim" | tr -d '\r')
  for path in $paths; do
    base=$(basename "$path")
    if entries "$gi" | grep -q -x -F -e "$path" -e "/$path" -e "$base"; then
      error "$shim lists '$path' under 'include: env_file:', but that path is gitignored; a fresh clone cannot run compose"
      mark_error
    fi
  done
fi

# ── env-file line integrity ────────────────────────────────────────────────────
# KEY=VALUEKEY=VALUE: a dropped newline corrupts the first value and loses the second key.
for file in "$ENV_FILE" "$SECRETS_FILE"; do
  bad=$(entries "$file" | grep -nE '^[A-Z][A-Z0-9_]*=.*[a-zA-Z0-9][A-Z][A-Z0-9]{2,}(_[A-Z0-9]+)+=' | cut -d: -f1)
  for n in $bad; do
    error "$file line $n holds two entries; insert the missing newline"
  done
  [ -z "$bad" ] || mark_error
done

# ── secrets ────────────────────────────────────────────────────────────────────
if [ ! -f "$SECRETS_FILE" ]; then
  header "No $SECRETS_FILE"
  if [ -n "$(env_secret_keys)" ]; then
    warn "no $SECRETS_FILE: the $ENV_FILE sentinels are the running credentials"
  else
    warn "no $SECRETS_FILE: $ENV_FILE holds real values directly"
  fi
else
  header "Checking $SECRETS_FILE"
  for key in $( { env_secret_keys; secrets_keys; } | LC_ALL=C sort -u); do
    secrets_val=$(get_value "$SECRETS_FILE" "$key")
    env_val=$(get_value "$ENV_FILE" "$key")
    if [ -z "$secrets_val" ] || [ "$secrets_val" = "$PLACEHOLDER" ]; then
      warn "$key: blank in $SECRETS_FILE, so the $ENV_FILE sentinel is used"
    elif [ "$env_val" = "$PLACEHOLDER" ]; then
      warn "$key: $ENV_FILE holds the sentinel while $SECRETS_FILE has a value; run secrets before docker compose"
    elif [ "$env_val" != "$secrets_val" ]; then
      warn "$key: $ENV_FILE differs from $SECRETS_FILE; run secrets before docker compose"
    else
      ok "$key"
    fi
  done
fi

# ── summary ────────────────────────────────────────────────────────────────────
printf "\n"
if [ "$ERRORS" -gt 0 ]; then
  printf "${RED}${BOLD}%d error(s) found.${RESET} Fix the issues above and re-run ./check-env.sh\n\n" "$ERRORS"
  exit 1
fi
printf "${GREEN}${BOLD}Check complete.${RESET}\n\n"
exit 0
