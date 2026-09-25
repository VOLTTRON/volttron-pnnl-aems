#!/bin/sh
#
# Validate consistency of .env and .env.secrets before deploying.
#
# Exit 0: OK (with or without warnings)
# Exit 1: a required secret is missing or still holds the placeholder
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

env_secret_keys() {
  grep -F "=$PLACEHOLDER" "$ENV_FILE" | sed 's/=.*//'
}

get_value() {
  file="$1"; key="$2"
  grep -v '^\s*#' "$file" | grep "^${key}=" | head -1 | sed 's/^[^=]*=//'
}

env_has_placeholders() {
  for key in $(env_secret_keys); do
    val=$(get_value "$ENV_FILE" "$key")
    if [ "$val" = "$PLACEHOLDER" ]; then
      return 0
    fi
  done
  return 1
}

env_has_real_values() {
  for key in $(env_secret_keys); do
    val=$(get_value "$ENV_FILE" "$key")
    if [ -z "$val" ] || [ "$val" = "$PLACEHOLDER" ]; then
      return 1
    fi
  done
  return 0
}

# ── pre-flight ─────────────────────────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  printf "${RED}ERROR:${RESET} $ENV_FILE not found. Run from the repo root.\n"
  exit 1
fi

printf "\n${BOLD}Environment/Secrets Check${RESET}\n"
printf "Running from: %s\n" "$(pwd)"

# ── env-file line-integrity check ──────────────────────────────────────────────
# Detects the concatenation-bug class where a hand-edit or a tool drops the
# newline between two entries, producing something like:
#     HISTORIAN_REPLICATOR_PASSWORD=passwordVOLTTRON_PASSWORD=admin
# The first value is corrupted and the second key vanishes.
check_line_integrity() {
  file="$1"
  [ -f "$file" ] || return 0
  bad_lines=$(grep -nE '^[A-Z][A-Z0-9_]*=.*[a-zA-Z0-9][A-Z][A-Z0-9]{2,}(_[A-Z0-9]+)+=' "$file" || true)
  if [ -n "$bad_lines" ]; then
    header "Line-integrity check FAILED for $file"
    error "One or more lines look like KEY=VALUEKEY=VALUE (missing newline between entries):"
    printf '%s\n' "$bad_lines" | while IFS= read -r line; do
      printf "    %s\n" "$line"
    done
    error "Fix the file (insert the missing newline) and re-run ./check-env.sh"
    mark_error
  fi
}
check_line_integrity "$ENV_FILE"
check_line_integrity "$SECRETS_FILE"

# ── No .env.secrets: env-only path ──────────────────────────────────────────
#
# Without .env.secrets, docker will start using whatever is in .env. Warn
# but don't block — a fresh clone with placeholders is a legitimate
# starting point, and putting real values directly in .env is a supported
# simple-dev setup.

if [ ! -f "$SECRETS_FILE" ]; then
  if env_has_placeholders; then
    header "Mode: raw dev (no secrets configured)"
    warn "Secret variables in .env still have placeholder values."
    warn "Services that depend on secrets (auth, database passwords, etc.) will not work"
    warn "until you either:"
    warn "  a) Edit .env directly with real values (simple dev setup), or"
    warn "  b) Run ./secrets.sh — it bootstraps $SECRETS_FILE from .env; edit real values"
    warn "     and re-run docker compose up -d."
  else
    header "Mode: env-only (real values in .env)"
    warn "Running with real secret values in .env directly."
    warn "This works but is less secure — .env is typically committed. Consider"
    warn "moving secrets to $SECRETS_FILE (gitignored) via ./secrets.sh."
  fi
  printf "\n${GREEN}Check complete (warnings only).${RESET}\n\n"
  exit 0
fi

# ── .env.secrets exists: validate completeness ────────────────────────────────

if env_has_real_values; then
  header "Advisory: mixed configuration detected"
  warn ".env has real secret values AND .env.secrets also exists."
  warn "Both are loaded by compose; .env.secrets wins on collisions."
  warn "Reset .env placeholders back to the sentinel to avoid confusion."
fi

header "Checking .env.secrets completeness"

for key in $(env_secret_keys); do
  val=$(get_value "$SECRETS_FILE" "$key")
  if [ -z "$val" ]; then
    error "$key is missing from $SECRETS_FILE"
    mark_error
  elif [ "$val" = "$PLACEHOLDER" ]; then
    error "$key still has a placeholder value in $SECRETS_FILE"
    mark_error
  else
    ok "$key"
  fi
done

# ── summary ────────────────────────────────────────────────────────────────────
printf "\n"
if [ "$ERRORS" -gt 0 ]; then
  printf "${RED}${BOLD}%d error(s) found.${RESET}" "$ERRORS"
  printf " Fix the issues above and re-run ./check-env.sh\n\n"
  exit 1
else
  printf "${GREEN}${BOLD}All checks passed.${RESET}\n\n"
  exit 0
fi
