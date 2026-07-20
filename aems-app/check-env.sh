#!/bin/sh
#
# Validate consistency of .env, .env.secrets, and docker/secrets/ before deploying.
#
# Exit 0: all warnings only (raw dev state, env-only, or secrets mode fully in sync)
# Exit 1: secrets chain is broken (docker compose will fail or services will use wrong credentials)
#
# Usage: ./check-env.sh

ENV_FILE=".env"
SECRETS_FILE=".env.secrets"
SECRETS_DIR="docker/secrets"
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

# Derive the authoritative secret key list from .env by grepping for
# the placeholder marker. Any line in .env of the form KEY=<placeholder>
# is treated as a declared secret; this is the same signal `secrets.sh`
# uses when bootstrapping .env.secrets.
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

# ── No .env.secrets: warn-only paths ──────────────────────────────────────────
#
# Without .env.secrets the user is in dev/env-only mode. Docker will start
# using whatever is in .env. We warn about the security posture but never
# block — a fresh clone with all placeholders is a legitimate starting point.

if [ ! -f "$SECRETS_FILE" ]; then
  if env_has_placeholders; then
    header "Mode: raw dev (no secrets configured)"
    warn "Secret variables in .env still have placeholder values."
    warn "Services that depend on secrets (auth, database passwords, etc.) will not work"
    warn "until you either:"
    warn "  a) Edit .env directly with real values (simple dev setup), or"
    warn "  b) Run ./secrets.sh — it bootstraps $SECRETS_FILE from .env, then re-run it"
    warn "     after filling in real values to generate docker/secrets/*.txt"
  else
    header "Mode: env-only"
    warn "Running without docker secrets — secret values are set directly in .env."
    warn "This works for development. For production, consider using secrets.sh."
  fi
  printf "\n${GREEN}Check complete (warnings only).${RESET}\n\n"
  exit 0
fi

# ── .env.secrets exists: validate the full chain ──────────────────────────────
#
# Once .env.secrets is present the operator has committed to the secrets path.
# Broken links in the chain (missing/stale docker/secrets/ files) will cause
# docker compose to refuse to start or services to authenticate with wrong creds.
# These are hard errors.

# Mixed-state advisory: .env also has real values alongside .env.secrets
if env_has_real_values; then
  header "Advisory: mixed configuration detected"
  warn ".env has real secret values AND .env.secrets also exists."
  warn "Docker Compose loads .env first; docker/secrets/ takes effect only when"
  warn "compose is invoked with --env-file docker/.env.secrets.docker."
  warn "Reconcile to one approach to avoid confusion:"
  warn "  - env-only: remove .env.secrets and docker/secrets/*.txt"
  warn "  - secrets:  restore .env placeholder sentinels, keep .env.secrets"
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

header "Checking docker/secrets/ is populated and in sync"

if [ ! -d "$SECRETS_DIR" ]; then
  error "docker/secrets/ directory does not exist — run ./secrets.sh to generate and apply secrets"
  mark_error
else
  for key in $(env_secret_keys); do
    secret_name=$(printf '%s' "$key" | tr '[:upper:]' '[:lower:]')
    secret_file="${SECRETS_DIR}/${secret_name}.txt"
    if [ ! -f "$secret_file" ]; then
      error "$secret_file missing — run ./secrets.sh to generate and apply secrets"
      mark_error
    else
      env_val=$(get_value "$SECRETS_FILE" "$key")
      file_val=$(tr -d '\n' < "$secret_file")
      if [ "$env_val" != "$file_val" ]; then
        error "$key: $secret_file is stale (out of sync with .env.secrets) — run ./secrets.sh to apply changes to running services"
        mark_error
      else
        ok "$key → $secret_file"
      fi
    fi
  done
fi

# ── summary ────────────────────────────────────────────────────────────────────
printf "\n"
if [ "$ERRORS" -gt 0 ]; then
  printf "${RED}${BOLD}%d error(s) found.${RESET}" "$ERRORS"
  printf " The secrets chain is broken — docker compose will fail or services will use wrong credentials.\n"
  printf " Fix the issues above and re-run ./check-env.sh\n\n"
  exit 1
else
  printf "${GREEN}${BOLD}All checks passed.${RESET}\n\n"
  exit 0
fi
