#!/bin/sh
#
# Manage .env.secrets and apply rotations to live containers.
#
# Secrets live as plain KEY=VALUE lines in the gitignored `.env.secrets`
# file. The root docker-compose.yml loads that file as an env_file, so
# every ${VAR} interpolation and every service's `env_file: .env.<svc>`
# forwarding picks the values up automatically. No /run/secrets, no _FILE
# indirection, no docker/secrets/*.txt.
#
# What this script does:
#
#   1. BOOTSTRAP (no .env.secrets): create a stub .env.secrets seeded with
#      every key marked in .env with the sentinel placeholder. Exits so the
#      user can fill in real values.
#
#   2. MISPLACED (real values found in .env): migrate them into
#      .env.secrets and warn.
#
#   3. ROTATION (a key's value in .env.secrets differs from the value
#      currently live in the deployed container): run the credential-change
#      handler (ALTER ROLE / ALTER USER / kcadm.sh / grafana-cli) against
#      the running container BEFORE the new env is picked up, then
#      `docker compose up -d --no-deps <service>` so the container inherits
#      the new value from .env.secrets. Container must be running — abort
#      otherwise; pass --force to skip the live-rotation step (the operator
#      is then responsible for wiping the affected data volume, if any).
#
#   4. NO-OP: silent skip when the running container's env already matches.
#
# Note on restart mode: `docker compose restart` reuses the cached env
# vars in the existing container — it does NOT re-read env_file. We use
# `docker compose up -d --no-deps <svc>` instead, which recreates the
# container with fresh env.
#
# Usage:
#   ./secrets.sh                # process every key in .env.secrets
#   ./secrets.sh KEY1 KEY2 ...  # limit to named keys
#   ./secrets.sh --dry-run      # print the plan without executing
#   ./secrets.sh --force        # skip the live-rotation step
#
# Must be run from the repo root.

set -e

ENV_FILE=".env"
SECRETS_FILE=".env.secrets"
PLACEHOLDER="SeT_tHiS_iN_0x3A-.env.secrets-"

# ── arg parsing ────────────────────────────────────────────────────────────────
DRY_RUN=0
FORCE=0
YES=0
EXPLICIT_KEYS=""

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --force)   FORCE=1 ;;
    --yes|-y)  YES=1 ;;
    --*)       printf "Unknown flag: %s\n" "$arg" >&2; exit 1 ;;
    *)         EXPLICIT_KEYS="$EXPLICIT_KEYS $arg" ;;
  esac
done

# ── color helpers ──────────────────────────────────────────────────────────────
if [ -t 1 ]; then
  RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'
  BOLD='\033[1m'; RESET='\033[0m'
else
  RED=''; YELLOW=''; GREEN=''; BLUE=''; BOLD=''; RESET=''
fi

info()   { printf "${BLUE}  →${RESET}  %s\n" "$1"; }
ok()     { printf "${GREEN}  ✓${RESET}  %s\n" "$1"; }
warn()   { printf "${YELLOW}  !${RESET}  %s\n" "$1"; }
error()  { printf "${RED}  ✗${RESET}  %s\n" "$1" >&2; }
header() { printf "\n${BOLD}%s${RESET}\n" "$1"; }
dry()    { printf "${YELLOW}  [dry-run]${RESET} %s\n" "$1"; }

WARNINGS=0
mark_warn() { WARNINGS=$((WARNINGS + 1)); }

# ── helpers ────────────────────────────────────────────────────────────────────

get_value() {
  file="$1"; key="$2"
  grep -v '^\s*#' "$file" | grep "^${key}=" | head -1 | sed 's/^[^=]*=//'
}

# Derive the authoritative secret key list from .env by grepping for
# the placeholder marker. Any line in .env of the form KEY=<placeholder>
# is a declared secret.
env_secret_keys() {
  grep -F "=$PLACEHOLDER" "$ENV_FILE" | sed 's/=.*//'
}

# Returns key names for every variable in .env whose name ends in
# _PASSWORD, _SECRET, _TOKEN, or _KEY and whose value is non-empty and
# not the placeholder. These belong in .env.secrets.
env_misplaced_keys() {
  grep -v '^\s*#' "$ENV_FILE" \
    | grep -iE '^[A-Za-z_][A-Za-z0-9_]*_(PASSWORD|SECRET|TOKEN|KEY)=' \
    | while read -r line; do
        key="${line%%=*}"
        val="${line#*=}"
        if [ -n "$val" ] && [ "$val" != "$PLACEHOLDER" ]; then
          echo "$key"
        fi
      done
}

# Write KEY=VALUE into FILE, replacing an existing entry or appending a
# new one.
update_secrets_entry() {
  file="$1"; key="$2"; value="$3"
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    tmp="${file}.tmp$$"
    while IFS= read -r line || [ -n "$line" ]; do
      case "$line" in
        "${key}="*) printf '%s=%s\n' "$key" "$value" ;;
        *)          printf '%s\n' "$line" ;;
      esac
    done < "$file" > "$tmp"
    mv "$tmp" "$file"
  else
    printf '%s=%s\n' "$key" "$value" >> "$file"
  fi
}

project_name() {
  val=$(get_value "$ENV_FILE" "COMPOSE_PROJECT_NAME")
  printf '%s' "${val:-skeleton}"
}

container_running() {
  docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^$1$"
}

# Which container's env holds each key's currently-deployed value. Used
# by deployed_secret() to detect drift between .env.secrets and the live
# stack.
key_deployed_container() {
  proj="$1"; key="$2"
  case "$key" in
    DATABASE_PASSWORD)                echo "${proj}-database" ;;
    KEYCLOAK_ADMIN_PASSWORD)          echo "${proj}-keycloak" ;;
    KEYCLOAK_DATABASE_PASSWORD)       echo "${proj}-keycloak-db" ;;
    KEYCLOAK_CLIENT_SECRET)           echo "${proj}-server" ;;
    KEYCLOAK_GRAFANA_CLIENT_SECRET)   echo "${proj}-grafana" ;;
    BOOKSTACK_KEYCLOAK_CLIENT_SECRET) echo "${proj}-wiki" ;;
    NOMINATIM_DATABASE_PASSWORD)      echo "${proj}-nominatim" ;;
    BOOKSTACK_ROOT_PASSWORD)          echo "${proj}-wiki-db" ;;
    BOOKSTACK_DATABASE_PASSWORD)      echo "${proj}-wiki-db" ;;
    HISTORIAN_DATABASE_PASSWORD)      echo "${proj}-historian" ;;
    HISTORIAN_REPLICATOR_PASSWORD)    echo "${proj}-historian" ;;
    GRAFANA_ADMIN_PASSWORD)           echo "${proj}-grafana" ;;
    GRAFANA_DATABASE_PASSWORD)        echo "${proj}-grafana-db" ;;
    SESSION_SECRET|JWT_SECRET|WORKER_TOKEN)
                                      echo "${proj}-server" ;;
    REDIS_PASSWORD)                   echo "${proj}-redis" ;;
    BOOKSTACK_SESSION_SECRET)         echo "${proj}-wiki" ;;
    *)                                echo "" ;;
  esac
}

# Read the value of $key from the running container's env. Empty string
# if the container isn't running or the var isn't set. For DB services,
# the env var name in the container is POSTGRES_PASSWORD / MYSQL_PASSWORD;
# we look those up by pattern.
container_env_key() {
  case "$1" in
    DATABASE_PASSWORD|KEYCLOAK_DATABASE_PASSWORD|NOMINATIM_DATABASE_PASSWORD|HISTORIAN_DATABASE_PASSWORD|GRAFANA_DATABASE_PASSWORD)
      echo "POSTGRES_PASSWORD" ;;
    BOOKSTACK_DATABASE_PASSWORD)       echo "MYSQL_PASSWORD" ;;
    BOOKSTACK_ROOT_PASSWORD)           echo "MYSQL_ROOT_PASSWORD" ;;
    GRAFANA_ADMIN_PASSWORD)            echo "GF_SECURITY_ADMIN_PASSWORD" ;;
    KEYCLOAK_GRAFANA_CLIENT_SECRET)    echo "GF_AUTH_GENERIC_OAUTH_CLIENT_SECRET" ;;
    BOOKSTACK_SESSION_SECRET)          echo "APP_KEY" ;;
    BOOKSTACK_KEYCLOAK_CLIENT_SECRET)  echo "OIDC_CLIENT_SECRET" ;;
    KEYCLOAK_ADMIN_PASSWORD)           echo "KEYCLOAK_ADMIN_PASSWORD" ;;
    KEYCLOAK_CLIENT_SECRET)            echo "KEYCLOAK_CLIENT_SECRET" ;;
    HISTORIAN_REPLICATOR_PASSWORD)     echo "HISTORIAN_REPLICATOR_PASSWORD" ;;
    *)                                 echo "$1" ;;
  esac
}

deployed_secret() {
  key="$1"
  container=$(key_deployed_container "$PROJECT" "$key")
  [ -z "$container" ] && return 0
  container_running "$container" || return 0
  env_key=$(container_env_key "$key")
  val=$(docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "$container" 2>/dev/null \
    | grep "^${env_key}=" | head -1 | sed 's/^[^=]*=//')
  # Filter noise: an unfilled sentinel means compose interpolation produced
  # a placeholder (old .env-only-with-placeholders deploys), not a real
  # deployed value. Treat as "not deployed" so classification falls to FRESH.
  [ "$val" = "$PLACEHOLDER" ] && val=""
  printf '%s' "$val"
}

run_or_dry() {
  if [ "$DRY_RUN" = 1 ]; then
    dry "$*"
  else
    eval "$@"
  fi
}

# ── pre-flight ─────────────────────────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  error "$ENV_FILE not found. Run from the repo root."
  exit 1
fi

# Point docker compose at both .env and .env.secrets for interpolation so
# `docker compose up -d --no-deps <svc>` in the restart pass below picks up
# real secret values. Compose's `include: env_file:` doesn't cascade.
if [ -f "$SECRETS_FILE" ]; then
  export COMPOSE_ENV_FILES="${ENV_FILE},${SECRETS_FILE}"
else
  export COMPOSE_ENV_FILES="${ENV_FILE}"
fi

# ══════════════════════════════════════════════════════════════════════════════
# BOOTSTRAP PATH — .env.secrets doesn't exist
# ══════════════════════════════════════════════════════════════════════════════
if [ ! -f "$SECRETS_FILE" ]; then
  echo "No $SECRETS_FILE found — bootstrapping from $ENV_FILE."

  secret_keys=$(env_secret_keys)
  misplaced_keys=$(env_misplaced_keys)

  if [ -n "$misplaced_keys" ]; then
    header "WARNING: Secret values found in $ENV_FILE"
    for key in $misplaced_keys; do
      warn "  $key has a real value in $ENV_FILE — it belongs in $SECRETS_FILE"
    done
    warn "Migrating those values into $SECRETS_FILE."
    warn "Reset them to the placeholder in $ENV_FILE when possible."
    mark_warn
    for key in $misplaced_keys; do
      case " $secret_keys " in *" $key "*) ;; *) secret_keys="${secret_keys} ${key}" ;; esac
    done
  fi

  if [ -z "$(printf '%s' "$secret_keys" | tr -d ' ')" ]; then
    error "No secret keys found in $ENV_FILE (expected values of '$PLACEHOLDER' or credential-named keys with real values)."
    exit 1
  fi

  {
    printf '# %s\n'                                                             "$SECRETS_FILE"
    printf '#\n'
    printf "# Real values for every secret marked in .env with the placeholder\n"
    printf "# '%s'.\n" "$PLACEHOLDER"
    printf '# This file is gitignored — never commit real values.\n'
    printf '#\n'
    printf '# Workflow:\n'
    printf '#   1. Edit the values below.\n'
    printf '#   2. Bring the stack up: docker compose up -d\n'
    printf '#\n'
    printf '# To rotate a credential after deploy:\n'
    printf '#   1. Edit the value here.\n'
    printf '#   2. Re-run ./secrets.sh — it will apply the change against the\n'
    printf '#      running container and then `docker compose up -d --no-deps`\n'
    printf '#      to reload env into affected services.\n'
    printf '\n'
    for key in $secret_keys; do
      env_val=$(get_value "$ENV_FILE" "$key")
      if [ -n "$env_val" ] && [ "$env_val" != "$PLACEHOLDER" ]; then
        printf '%s=%s\n' "$key" "$env_val"
      else
        printf '%s=\n' "$key"
      fi
    done
  } > "$SECRETS_FILE"

  chmod 600 "$SECRETS_FILE"

  blank_count=$(grep -E '^[A-Za-z_][A-Za-z0-9_]*=$' "$SECRETS_FILE" | wc -l | tr -d ' ')
  count=$(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$SECRETS_FILE" | wc -l | tr -d ' ')

  echo
  echo "Wrote $count stub entries to $SECRETS_FILE."
  [ -n "$misplaced_keys" ] && echo "Some entries were pre-populated from $ENV_FILE values."
  if [ "$blank_count" -gt 0 ]; then
    echo
    echo "Next steps:"
    echo "  1. Edit $SECRETS_FILE and fill in the $blank_count remaining blank entries."
    echo "  2. docker compose up -d"
    echo
  fi
  exit 0
fi

# ══════════════════════════════════════════════════════════════════════════════
# ROTATE PATH — .env.secrets exists
# ══════════════════════════════════════════════════════════════════════════════

printf "\n${BOLD}Secret Rotate${RESET}"
[ "$DRY_RUN" = 1 ] && printf " ${YELLOW}(dry-run)${RESET}"
[ "$FORCE"   = 1 ] && printf " ${YELLOW}(--force: skipping live rotation)${RESET}"
printf "\nRunning from: %s\n" "$(pwd)"

PROJECT=$(project_name)

# Build the list of keys to process.
if [ -n "$EXPLICIT_KEYS" ]; then
  KEYS_TO_CHECK="$EXPLICIT_KEYS"
else
  KEYS_TO_CHECK=$(env_secret_keys)
fi

# ── misplaced-secret migration ─────────────────────────────────────────────────
if [ -z "$EXPLICIT_KEYS" ]; then
  _misplaced=$(env_misplaced_keys)
  if [ -n "$_misplaced" ]; then
    _migrated=0
    for key in $_misplaced; do
      secrets_val=$(get_value "$SECRETS_FILE" "$key")
      if [ -z "$secrets_val" ] || [ "$secrets_val" = "$PLACEHOLDER" ]; then
        env_val=$(get_value "$ENV_FILE" "$key")
        warn "$key: real value found in $ENV_FILE but missing from $SECRETS_FILE — migrating"
        warn "  Reset $key in $ENV_FILE to the placeholder when convenient."
        mark_warn
        if [ "$DRY_RUN" = 0 ]; then
          update_secrets_entry "$SECRETS_FILE" "$key" "$env_val"
        else
          dry "Would migrate $key from $ENV_FILE into $SECRETS_FILE"
        fi
        _migrated=$((_migrated + 1))
      fi
      case " $KEYS_TO_CHECK " in *" $key "*) ;; *) KEYS_TO_CHECK="$KEYS_TO_CHECK $key" ;; esac
    done
    if [ "$_migrated" -gt 0 ] && [ "$DRY_RUN" = 0 ]; then
      info "Migrated $_migrated key(s) into $SECRETS_FILE"
    fi
  fi
fi

# ── classify ──────────────────────────────────────────────────────────────────
#
# For each key, compare the value in .env.secrets against what's live in
# the running container:
#   FRESH       — no container is running with this key, or the container
#                 lookup returns empty. Nothing to rotate; the new value
#                 will take effect on next `docker compose up -d`.
#   ROTATIONS   — container is running with a different value; need to
#                 apply the credential-change handler live.
#   NOOPS       — container's env already matches .env.secrets.
#   MISSING     — .env.secrets has no value for this key.

header "Classifying secrets"

FRESH=""
ROTATIONS=""
MISSING=""

for key in $KEYS_TO_CHECK; do
  new_val=$(get_value "$SECRETS_FILE" "$key")

  if [ -z "$new_val" ] || [ "$new_val" = "$PLACEHOLDER" ]; then
    MISSING="$MISSING $key"
    warn "$key: no value in $SECRETS_FILE — skipping"
    continue
  fi

  old_val=$(deployed_secret "$key")

  if [ -z "$old_val" ]; then
    FRESH="$FRESH $key"
    info "$key: fresh (no running container to rotate against)"
  elif [ "$new_val" = "$old_val" ]; then
    ok "$key: unchanged"
  else
    ROTATIONS="$ROTATIONS $key"
    info "$key: changed — will rotate live"
  fi
done

# Nothing to do — .env.secrets matches every running container's env.
if [ -z "$(printf '%s%s' "$FRESH" "$ROTATIONS" | tr -d ' ')" ]; then
  printf "\n${GREEN}${BOLD}All secrets are up to date.${RESET}\n\n"
  if [ "$DRY_RUN" = 0 ] && [ -x ./check-env.sh ]; then
    ./check-env.sh || warn "check-env.sh reported issues — review the output above."
  fi
  exit 0
fi

# ══════════════════════════════════════════════════════════════════════════════
# ROTATION PASS — SQL/kcadm handlers for changed keys
# ══════════════════════════════════════════════════════════════════════════════

RESTART_SERVICES=""
queue_restart() { RESTART_SERVICES="$RESTART_SERVICES $1"; }

# Postgres ALTER ROLE. When old_pw is provided, authenticates via
# PGPASSWORD; otherwise assumes socket auth works without a password.
rotate_pg() {
  container="$1"; db_user="$2"; new_pw="$3"; caller_key="$4"; old_pw="${5:-}"
  if ! container_running "$container"; then
    error "$caller_key: container $container is not running"
    return 1
  fi
  escaped_new=$(printf '%s' "$new_pw" | sed "s/'/''/g")
  info "ALTER ROLE $db_user in $container"
  if [ -n "$old_pw" ]; then
    escaped_old=$(printf '%s' "$old_pw" | sed "s/'/'\\\\''/g")
    run_or_dry "docker exec -e PGPASSWORD='${escaped_old}' '$container' psql -U '$db_user' -c \"ALTER ROLE \\\"${db_user}\\\" WITH PASSWORD '${escaped_new}';\""
  else
    run_or_dry "docker exec '$container' psql -U '$db_user' -c \"ALTER ROLE \\\"${db_user}\\\" WITH PASSWORD '${escaped_new}';\""
  fi
}

rotate_mysql_user() {
  container="$1"; db_user="$2"; old_root_pw="$3"; new_pw="$4"; caller_key="$5"
  if ! container_running "$container"; then
    error "$caller_key: container $container is not running"
    return 1
  fi
  escaped_new=$(printf '%s' "$new_pw" | sed "s/'/\\\\'/g")
  escaped_root=$(printf '%s' "$old_root_pw" | sed "s/'/\\\\'/g")
  info "ALTER USER '$db_user' in $container"
  run_or_dry "docker exec '$container' mysql -u root -p'${escaped_root}' \
    -e \"ALTER USER '${db_user}'@'%' IDENTIFIED BY '${escaped_new}'; FLUSH PRIVILEGES;\""
}

rotate_mysql_root() {
  container="$1"; old_root_pw="$2"; new_pw="$3"; caller_key="$4"
  if ! container_running "$container"; then
    error "$caller_key: container $container is not running"
    return 1
  fi
  escaped_new=$(printf '%s' "$new_pw" | sed "s/'/\\\\'/g")
  escaped_old=$(printf '%s' "$old_root_pw" | sed "s/'/\\\\'/g")
  info "ALTER USER root in $container"
  run_or_dry "docker exec '$container' mysql -u root -p'${escaped_old}' \
    -e \"ALTER USER 'root'@'%' IDENTIFIED BY '${escaped_new}'; FLUSH PRIVILEGES;\""
}

if [ "$FORCE" = 1 ] && [ -n "$(printf '%s' "$ROTATIONS" | tr -d ' ')" ]; then
  header "Skipping live rotation (--force)"
  warn "The following keys changed but will NOT be rotated live:"
  for key in $ROTATIONS; do
    warn "  $key"
  done
  warn "You must wipe the affected data volumes or apply the credential"
  warn "change manually, otherwise services will fail authentication."
  mark_warn
elif [ -n "$(printf '%s' "$ROTATIONS" | tr -d ' ')" ]; then
  header "Applying credential changes"

  KC_CONTAINER="${PROJECT}-keycloak"
  KC_ADMIN=$(get_value "$ENV_FILE" "KEYCLOAK_ADMIN")
  KC_AUTHED=0

  ROTATION_ERRORS=0

  for key in $ROTATIONS; do
    new_val=$(get_value "$SECRETS_FILE" "$key")
    old_val=$(deployed_secret "$key")

    case "$key" in

      DATABASE_PASSWORD)
        DB_USER=$(get_value "$ENV_FILE" "DATABASE_USERNAME")
        rotate_pg "${PROJECT}-database" "$DB_USER" "$new_val" "$key" || ROTATION_ERRORS=$((ROTATION_ERRORS + 1))
        # Recreate the DB container too so its POSTGRES_PASSWORD env reflects the
        # new value. Postgres only reads POSTGRES_PASSWORD on initdb, so a recreate
        # against a seeded volume is a no-op auth-wise — but it keeps
        # `docker inspect` in sync with .env.secrets so future runs classify correctly.
        queue_restart "database"
        queue_restart "server"
        queue_restart "client"
        ;;

      KEYCLOAK_DATABASE_PASSWORD)
        KC_DB_USER=$(get_value "$ENV_FILE" "KEYCLOAK_DATABASE_USERNAME")
        rotate_pg "${PROJECT}-keycloak-db" "$KC_DB_USER" "$new_val" "$key" || ROTATION_ERRORS=$((ROTATION_ERRORS + 1))
        queue_restart "keycloak-db"
        queue_restart "keycloak"
        ;;

      NOMINATIM_DATABASE_PASSWORD)
        rotate_pg "${PROJECT}-nominatim" "nominatim" "$new_val" "$key" || ROTATION_ERRORS=$((ROTATION_ERRORS + 1))
        queue_restart "nominatim"
        ;;

      BOOKSTACK_DATABASE_PASSWORD)
        WIKI_DB_CONTAINER="${PROJECT}-wiki-db"
        ROOT_PW=$(deployed_secret "BOOKSTACK_ROOT_PASSWORD")
        [ -z "$ROOT_PW" ] && ROOT_PW=$(get_value "$SECRETS_FILE" "BOOKSTACK_ROOT_PASSWORD")
        WIKI_DB_USER=$(get_value "$ENV_FILE" "BOOKSTACK_DATABASE_USERNAME")
        rotate_mysql_user "$WIKI_DB_CONTAINER" "$WIKI_DB_USER" "$ROOT_PW" "$new_val" "$key" \
          || ROTATION_ERRORS=$((ROTATION_ERRORS + 1))
        queue_restart "wiki"
        ;;

      BOOKSTACK_ROOT_PASSWORD)
        rotate_mysql_root "${PROJECT}-wiki-db" "$old_val" "$new_val" "$key" \
          || ROTATION_ERRORS=$((ROTATION_ERRORS + 1))
        queue_restart "wiki-db"
        queue_restart "wiki"
        ;;

      REDIS_PASSWORD)
        # Redis reads the password from its startup command — restart is enough.
        info "$key: rotation via restart"
        queue_restart "redis"
        queue_restart "server"
        ;;

      KEYCLOAK_ADMIN_PASSWORD)
        if ! container_running "$KC_CONTAINER"; then
          error "$key: container $KC_CONTAINER is not running"
          ROTATION_ERRORS=$((ROTATION_ERRORS + 1))
        else
          if [ "$KC_AUTHED" = 0 ]; then
            run_or_dry "docker exec '$KC_CONTAINER' /opt/keycloak/bin/kcadm.sh config credentials \
              --server http://localhost:8080/auth/sso \
              --realm master \
              --user '${KC_ADMIN}' \
              --password '${old_val}'"
            KC_AUTHED=1
          fi
          escaped=$(printf '%s' "$new_val" | sed "s/'/\\\\'/g")
          info "Updating Keycloak admin password"
          run_or_dry "docker exec '$KC_CONTAINER' /opt/keycloak/bin/kcadm.sh set-password \
            -r master --username '${KC_ADMIN}' --new-password '${escaped}'"
          KC_AUTHED=0
        fi
        queue_restart "keycloak"
        ;;

      KEYCLOAK_CLIENT_SECRET)
        if ! container_running "$KC_CONTAINER"; then
          error "$key: container $KC_CONTAINER is not running"
          ROTATION_ERRORS=$((ROTATION_ERRORS + 1))
        else
          if [ "$KC_AUTHED" = 0 ]; then
            KC_ADMIN_PW=$(deployed_secret "KEYCLOAK_ADMIN_PASSWORD")
            [ -z "$KC_ADMIN_PW" ] && KC_ADMIN_PW=$(get_value "$SECRETS_FILE" "KEYCLOAK_ADMIN_PASSWORD")
            run_or_dry "docker exec '$KC_CONTAINER' /opt/keycloak/bin/kcadm.sh config credentials \
              --server http://localhost:8080/auth/sso \
              --realm master \
              --user '${KC_ADMIN}' \
              --password '${KC_ADMIN_PW}'"
            KC_AUTHED=1
          fi
          escaped=$(printf '%s' "$new_val" | sed "s/'/\\\\'/g")
          info "Updating Keycloak app client secret"
          run_or_dry "docker exec '$KC_CONTAINER' sh -c \
            \"/opt/keycloak/bin/kcadm.sh get clients -r default --fields id,clientId \
              | grep -B1 '\\\"clientId\\\" : \\\"app\\\"' \
              | grep id \
              | sed 's/.*: \\\"//;s/\\\".*//' \
              | xargs -I{} /opt/keycloak/bin/kcadm.sh update clients/{} -r default -s secret='${escaped}'\""
        fi
        queue_restart "server"
        ;;

      BOOKSTACK_KEYCLOAK_CLIENT_SECRET)
        if ! container_running "$KC_CONTAINER"; then
          error "$key: container $KC_CONTAINER is not running"
          ROTATION_ERRORS=$((ROTATION_ERRORS + 1))
        else
          if [ "$KC_AUTHED" = 0 ]; then
            KC_ADMIN_PW=$(deployed_secret "KEYCLOAK_ADMIN_PASSWORD")
            [ -z "$KC_ADMIN_PW" ] && KC_ADMIN_PW=$(get_value "$SECRETS_FILE" "KEYCLOAK_ADMIN_PASSWORD")
            run_or_dry "docker exec '$KC_CONTAINER' /opt/keycloak/bin/kcadm.sh config credentials \
              --server http://localhost:8080/auth/sso \
              --realm master \
              --user '${KC_ADMIN}' \
              --password '${KC_ADMIN_PW}'"
            KC_AUTHED=1
          fi
          WIKI_CLIENT_ID=$(get_value "$ENV_FILE" "BOOKSTACK_KEYCLOAK_CLIENT_ID")
          escaped=$(printf '%s' "$new_val" | sed "s/'/\\\\'/g")
          info "Updating Keycloak wiki client secret"
          run_or_dry "docker exec '$KC_CONTAINER' sh -c \
            \"/opt/keycloak/bin/kcadm.sh get clients -r default --fields id,clientId \
              | grep -B1 '\\\"clientId\\\" : \\\"${WIKI_CLIENT_ID}\\\"' \
              | grep id \
              | sed 's/.*: \\\"//;s/\\\".*//' \
              | xargs -I{} /opt/keycloak/bin/kcadm.sh update clients/{} -r default -s secret='${escaped}'\""
        fi
        queue_restart "wiki"
        ;;

      SESSION_SECRET|JWT_SECRET|WORKER_TOKEN|BOOKSTACK_SESSION_SECRET)
        info "$key: app-only — rotation via restart"
        queue_restart "server"
        [ "$key" = "WORKER_TOKEN" ] && queue_restart "backup"
        [ "$key" = "BOOKSTACK_SESSION_SECRET" ] && queue_restart "wiki"
        ;;

      HISTORIAN_DATABASE_PASSWORD)
        rotate_pg "${PROJECT}-historian" "historian" "$new_val" "$key" "$old_val" \
          || ROTATION_ERRORS=$((ROTATION_ERRORS + 1))
        queue_restart "historian"
        queue_restart "volttron-setup"
        queue_restart "volttron"
        queue_restart "server"
        queue_restart "services"
        queue_restart "synth-worker"
        ;;

      HISTORIAN_REPLICATOR_PASSWORD)
        rotate_pg "${PROJECT}-historian" "replicator" "$new_val" "$key" "$old_val" \
          || ROTATION_ERRORS=$((ROTATION_ERRORS + 1))
        queue_restart "historian"
        ;;

      GRAFANA_DATABASE_PASSWORD)
        rotate_pg "${PROJECT}-grafana-db" "grafana" "$new_val" "$key" \
          || ROTATION_ERRORS=$((ROTATION_ERRORS + 1))
        queue_restart "grafana-db"
        queue_restart "grafana"
        ;;

      GRAFANA_ADMIN_PASSWORD)
        GRAFANA_CONTAINER="${PROJECT}-grafana"
        if ! container_running "$GRAFANA_CONTAINER"; then
          error "$key: container $GRAFANA_CONTAINER is not running"
          ROTATION_ERRORS=$((ROTATION_ERRORS + 1))
        else
          escaped=$(printf '%s' "$new_val" | sed "s/'/'\\\\''/g")
          info "Resetting Grafana admin password"
          run_or_dry "docker exec '$GRAFANA_CONTAINER' grafana-cli admin reset-admin-password '${escaped}'"
        fi
        queue_restart "grafana"
        ;;

      KEYCLOAK_GRAFANA_CLIENT_SECRET)
        if ! container_running "$KC_CONTAINER"; then
          error "$key: container $KC_CONTAINER is not running"
          ROTATION_ERRORS=$((ROTATION_ERRORS + 1))
        else
          if [ "$KC_AUTHED" = 0 ]; then
            KC_ADMIN_PW=$(deployed_secret "KEYCLOAK_ADMIN_PASSWORD")
            [ -z "$KC_ADMIN_PW" ] && KC_ADMIN_PW=$(get_value "$SECRETS_FILE" "KEYCLOAK_ADMIN_PASSWORD")
            run_or_dry "docker exec '$KC_CONTAINER' /opt/keycloak/bin/kcadm.sh config credentials \
              --server http://localhost:8080/auth/sso \
              --realm master \
              --user '${KC_ADMIN}' \
              --password '${KC_ADMIN_PW}'"
            KC_AUTHED=1
          fi
          escaped=$(printf '%s' "$new_val" | sed "s/'/\\\\'/g")
          info "Updating Keycloak grafana-oauth client secret"
          run_or_dry "docker exec '$KC_CONTAINER' sh -c \
            \"/opt/keycloak/bin/kcadm.sh get clients -r default --fields id,clientId \
              | grep -B1 '\\\"clientId\\\" : \\\"grafana-oauth\\\"' \
              | grep id \
              | sed 's/.*: \\\"//;s/\\\".*//' \
              | xargs -I{} /opt/keycloak/bin/kcadm.sh update clients/{} -r default -s secret='${escaped}'\""
        fi
        queue_restart "grafana"
        ;;

      *)
        warn "$key: no rotation handler defined — new value will be picked up on next \`docker compose up -d\`, but you may need to reconcile services manually"
        mark_warn
        ;;

    esac
  done

  if [ "$ROTATION_ERRORS" -gt 0 ] && [ "$DRY_RUN" = 0 ]; then
    header "Cannot rotate $ROTATION_ERRORS credential(s) live"
    printf "\n"
    printf "The containers for those keys are not running. Bringing the stack\n"
    printf "up now with the new .env.secrets would leave the seeded data\n"
    printf "volumes unable to authenticate.\n\n"
    error "Start the affected containers (docker compose up -d) and re-run."
    printf "Or pass --force to skip live rotation (data volumes must then be\n"
    printf "wiped or credentials reconciled manually).\n\n"
    exit 1
  fi
fi

# For FRESH keys, we did nothing live — but the new value still needs to
# reach the service on next start. If any service is currently running,
# it will pick up the new value only after `up -d --no-deps` recreates it.
for key in $FRESH; do
  container=$(key_deployed_container "$PROJECT" "$key")
  if [ -n "$container" ] && container_running "$container"; then
    # Only reached when the container is up but env_key returned empty.
    # Rare — most likely a missing case in container_env_key. Queue a
    # restart so the new env applies.
    svc=${container#${PROJECT}-}
    queue_restart "$svc"
  fi
done

# ══════════════════════════════════════════════════════════════════════════════
# RESTART PASS
# ══════════════════════════════════════════════════════════════════════════════
#
# Use `docker compose up -d --no-deps <svc>` — NOT `docker compose restart`.
# `restart` reuses the cached env in the existing container and would keep
# the OLD .env.secrets value. `up -d --no-deps` recreates the container so
# it re-reads env_file.

RESTART_SERVICES=$(printf '%s' "$RESTART_SERVICES" | tr ' ' '\n' | grep -v '^$' | sort -u | tr '\n' ' ')

if [ -n "$(printf '%s' "$RESTART_SERVICES" | tr -d ' ')" ]; then
  header "Recreating affected services: $RESTART_SERVICES"
  for svc in $RESTART_SERVICES; do
    container="${PROJECT}-${svc}"
    case "$svc" in
      volttron)
        info "Recreating $svc (--force-recreate)"
        run_or_dry "docker compose up -d --force-recreate $svc"
        ok "$svc recreated"
        ;;
      volttron-setup)
        info "Re-running $svc"
        run_or_dry "docker compose up -d $svc"
        ok "$svc re-run"
        ;;
      *)
        if container_running "$container"; then
          info "Recreating $svc"
          run_or_dry "docker compose up -d --no-deps $svc"
          ok "$svc recreated"
        else
          warn "$svc is not running — skipping"
        fi
        ;;
    esac
  done
fi

# ── post-check ─────────────────────────────────────────────────────────────────
if [ "$DRY_RUN" = 0 ] && [ -x ./check-env.sh ]; then
  ./check-env.sh || warn "check-env.sh reported issues — review the output above."
fi

# ── summary ────────────────────────────────────────────────────────────────────
printf "\n"
if [ "$WARNINGS" -gt 0 ]; then
  printf "${YELLOW}${BOLD}Done with %d warning(s).${RESET}\n" "$WARNINGS"
  printf "Review warnings above.\n\n"
else
  printf "${GREEN}${BOLD}Done.${RESET}\n\n"
fi
