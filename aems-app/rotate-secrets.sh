#!/bin/sh
#
# Apply changed secrets to running services.
#
# Detects which secrets differ between .env.secrets (or .env in env-only mode)
# and the currently-deployed docker/secrets/ files, then:
#   1. Runs ALTER ROLE / kcadm commands inside running containers to update credentials
#   2. Writes new values to docker/secrets/ via secrets.sh
#   3. Restarts affected services
#
# Usage:
#   ./rotate-secrets.sh                   # auto-detect all changed secrets
#   ./rotate-secrets.sh KEY1 KEY2 ...     # rotate specific secrets only
#   ./rotate-secrets.sh --dry-run         # print plan without executing
#
# Must be run from the repo root.

set -e

ENV_FILE=".env"
SECRETS_FILE=".env.secrets"
SECRETS_EXAMPLE=".env.secrets.example"
SECRETS_DIR="docker/secrets"
PLACEHOLDER="SeT_tHiS_iN_0x3A-.env.secrets-"

DRY_RUN=0
EXPLICIT_KEYS=""

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --*)       printf "Unknown flag: %s\n" "$arg"; exit 1 ;;
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
error()  { printf "${RED}  ✗${RESET}  %s\n" "$1"; }
header() { printf "\n${BOLD}%s${RESET}\n" "$1"; }
dry()    { printf "${YELLOW}  [dry-run]${RESET} %s\n" "$1"; }

WARNINGS=0
mark_warn() { WARNINGS=$((WARNINGS + 1)); }

# ── helpers ────────────────────────────────────────────────────────────────────

get_value() {
  file="$1"; key="$2"
  grep -v '^\s*#' "$file" | grep "^${key}=" | head -1 | sed 's/^[^=]*=//'
}

example_keys() {
  grep -v '^\s*#' "$SECRETS_EXAMPLE" | grep -v '^\s*$' | grep '=' | sed 's/=.*//'
}

project_name() {
  val=$(get_value "$ENV_FILE" "COMPOSE_PROJECT_NAME")
  printf '%s' "${val:-skeleton}"
}

container_running() {
  docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^$1$"
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
  printf "${RED}ERROR:${RESET} $ENV_FILE not found. Run from the repo root.\n"
  exit 1
fi
if [ ! -f "$SECRETS_EXAMPLE" ]; then
  printf "${RED}ERROR:${RESET} $SECRETS_EXAMPLE not found. Run from the repo root.\n"
  exit 1
fi

printf "\n${BOLD}Secret Rotation${RESET}"
[ "$DRY_RUN" = 1 ] && printf " ${YELLOW}(dry-run)${RESET}"
printf "\nRunning from: %s\n" "$(pwd)"

PROJECT=$(project_name)

# ── mode detection ─────────────────────────────────────────────────────────────
ENV_ONLY=0
if [ ! -f "$SECRETS_FILE" ]; then
  ENV_ONLY=1
fi

# ══════════════════════════════════════════════════════════════════════════════
# ENV-ONLY MODE
# ══════════════════════════════════════════════════════════════════════════════
if [ "$ENV_ONLY" = 1 ]; then
  header "Mode: env-only"
  warn "No .env.secrets found — operating in env-only mode."
  warn "No SQL credential changes will be performed."
  warn "If you changed a DB password in .env, you must also run ALTER ROLE"
  warn "inside the running container manually, or wipe and recreate its volume."
  printf "\n"

  # Determine which services to restart
  if [ -n "$EXPLICIT_KEYS" ]; then
    # Restart only services associated with the named keys
    RESTART_SERVICES=""
    for key in $EXPLICIT_KEYS; do
      RESTART_SERVICES="$RESTART_SERVICES $(services_for_key "$key")"
    done
  else
    # Restart all credential-bearing services
    RESTART_SERVICES="server client"
  fi

  RESTART_SERVICES=$(printf '%s' "$RESTART_SERVICES" | tr ' ' '\n' | sort -u | tr '\n' ' ')

  if [ -z "$(printf '%s' "$RESTART_SERVICES" | tr -d ' ')" ]; then
    ok "Nothing to restart."
    exit 0
  fi

  header "Restarting services"
  for svc in $RESTART_SERVICES; do
    container="${PROJECT}-${svc}"
    if container_running "$container"; then
      info "Restarting $svc"
      run_or_dry "docker compose restart $svc"
      ok "$svc restarted"
    else
      warn "$svc is not running — skipping"
    fi
  done

  printf "\n${GREEN}${BOLD}Done.${RESET} Env-only rotation complete.\n\n"
  exit 0
fi

# ══════════════════════════════════════════════════════════════════════════════
# SECRETS MODE
# ══════════════════════════════════════════════════════════════════════════════

# Build the list of keys to process
if [ -n "$EXPLICIT_KEYS" ]; then
  KEYS_TO_CHECK="$EXPLICIT_KEYS"
else
  KEYS_TO_CHECK=$(example_keys)
fi

# Identify changed keys (new value in .env.secrets differs from deployed .txt)
header "Detecting changes"
CHANGED_KEYS=""
for key in $KEYS_TO_CHECK; do
  new_val=$(get_value "$SECRETS_FILE" "$key")
  if [ -z "$new_val" ]; then
    warn "$key: not found in $SECRETS_FILE — skipping"
    continue
  fi
  secret_name=$(printf '%s' "$key" | tr '[:upper:]' '[:lower:]')
  secret_file="${SECRETS_DIR}/${secret_name}.txt"
  if [ ! -f "$secret_file" ]; then
    info "$key: no deployed secret file found — will create"
    CHANGED_KEYS="$CHANGED_KEYS $key"
  else
    deployed_val=$(tr -d '\n' < "$secret_file")
    if [ "$new_val" != "$deployed_val" ]; then
      info "$key: changed"
      CHANGED_KEYS="$CHANGED_KEYS $key"
    else
      ok "$key: unchanged"
    fi
  fi
done

if [ -z "$(printf '%s' "$CHANGED_KEYS" | tr -d ' ')" ]; then
  printf "\n${GREEN}${BOLD}All secrets are current. No rotation needed.${RESET}\n\n"
  exit 0
fi

# ── per-key rotation ───────────────────────────────────────────────────────────

# Track services to restart after all credential changes are applied
RESTART_SERVICES=""
queue_restart() {
  RESTART_SERVICES="$RESTART_SERVICES $1"
}

# Read old value from the currently-deployed secret file (before overwriting)
old_secret() {
  key="$1"
  secret_name=$(printf '%s' "$key" | tr '[:upper:]' '[:lower:]')
  secret_file="${SECRETS_DIR}/${secret_name}.txt"
  if [ -f "$secret_file" ]; then
    tr -d '\n' < "$secret_file"
  fi
}

# ── postgres ALTER ROLE helper ─────────────────────────────────────────────────
rotate_pg() {
  container="$1"; db_user="$2"; new_pw="$3"
  if container_running "$container"; then
    info "Running ALTER ROLE $db_user in $container"
    run_or_dry "docker compose exec -T \
      $(docker ps --format '{{.Names}} {{.Labels}}' | grep "$container" | awk '{print $1}' | sed 's/^.*-//') \
      sh -c \"psql -U '$db_user' -c \\\"ALTER ROLE \\\\\\\"${db_user}\\\\\\\" WITH PASSWORD '$(printf '%s' "$new_pw" | sed "s/'/''/g")';\\\"\""
    # Simpler approach: use container name directly via docker exec
    run_or_dry "docker exec '$container' sh -c \"psql -U '${db_user}' -c \\\"ALTER ROLE \\\\\\\"${db_user}\\\\\\\" WITH PASSWORD '\$(cat /run/secrets/$(printf '%s' "$3" | tr '[:upper:]' '[:lower:]'))';\\\"\""
  else
    warn "$container is not running — secret file will be updated but the database credential was NOT changed."
    warn "Start the stack and re-run ./rotate-secrets.sh, or wipe and recreate the DB volume."
    mark_warn
  fi
}

# ── mariadb ALTER USER helper ──────────────────────────────────────────────────
rotate_mysql() {
  container="$1"; db_user="$2"; old_root_pw="$3"; new_pw="$4"
  if container_running "$container"; then
    info "Running ALTER USER '$db_user' in $container"
    escaped_new=$(printf '%s' "$new_pw" | sed "s/'/\\\\'/g")
    escaped_root=$(printf '%s' "$old_root_pw" | sed "s/'/\\\\'/g")
    run_or_dry "docker exec '$container' sh -c \
      \"mysql -u root -p'${escaped_root}' -e \\\"ALTER USER '${db_user}'@'%' IDENTIFIED BY '${escaped_new}'; FLUSH PRIVILEGES;\\\"\""
  else
    warn "$container is not running — secret file will be updated but the DB credential was NOT changed."
    mark_warn
  fi
}

# ── keycloak kcadm helper ──────────────────────────────────────────────────────
kcadm_auth() {
  container="$1"; admin_user="$2"; admin_pw="$3"
  run_or_dry "docker exec '$container' /opt/keycloak/bin/kcadm.sh config credentials \
    --server http://localhost:8080/auth/sso \
    --realm master \
    --user '$admin_user' \
    --password '$admin_pw'"
}

kcadm_client_secret() {
  container="$1"; realm="$2"; client_id_name="$3"; new_secret="$4"
  escaped=$(printf '%s' "$new_secret" | sed "s/'/\\\\'/g")
  run_or_dry "docker exec '$container' sh -c \
    \"/opt/keycloak/bin/kcadm.sh get clients -r '$realm' --fields id,clientId \
      | grep -B1 '\\\"clientId\\\" : \\\"${client_id_name}\\\"' \
      | grep '\\\"id\\\"' \
      | sed 's/.*: \\\"//;s/\\\".*//' \
      | xargs -I{} /opt/keycloak/bin/kcadm.sh update clients/{} -r '$realm' -s secret='${escaped}'\""
}

# ── process each changed key ───────────────────────────────────────────────────
header "Applying credential changes"

KC_CONTAINER="${PROJECT}-keycloak"
KC_ADMIN=$(get_value "$ENV_FILE" "KEYCLOAK_ADMIN")
KC_AUTHED=0  # authenticate once per run, not once per key

for key in $CHANGED_KEYS; do
  new_val=$(get_value "$SECRETS_FILE" "$key")
  old_val=$(old_secret "$key")

  case "$key" in

    DATABASE_PASSWORD)
      DB_USER=$(get_value "$ENV_FILE" "DATABASE_USERNAME")
      DB_CONTAINER="${PROJECT}-database"
      info "Rotating DATABASE_PASSWORD (Postgres user: $DB_USER)"
      if container_running "$DB_CONTAINER"; then
        escaped=$(printf '%s' "$new_val" | sed "s/'/''/g")
        run_or_dry "docker exec '$DB_CONTAINER' psql -U '$DB_USER' -c \"ALTER ROLE \\\"${DB_USER}\\\" WITH PASSWORD '${escaped}';\""
        ok "ALTER ROLE executed"
      else
        warn "$DB_CONTAINER not running — file updated, DB credential NOT changed"
        mark_warn
      fi
      queue_restart "server"
      queue_restart "client"
      ;;

    KEYCLOAK_DATABASE_PASSWORD)
      KC_DB_USER=$(get_value "$ENV_FILE" "KEYCLOAK_DATABASE_USERNAME")
      KC_DB_CONTAINER="${PROJECT}-keycloak-db"
      info "Rotating KEYCLOAK_DATABASE_PASSWORD (Postgres user: $KC_DB_USER)"
      if container_running "$KC_DB_CONTAINER"; then
        escaped=$(printf '%s' "$new_val" | sed "s/'/''/g")
        run_or_dry "docker exec '$KC_DB_CONTAINER' psql -U '$KC_DB_USER' -c \"ALTER ROLE \\\"${KC_DB_USER}\\\" WITH PASSWORD '${escaped}';\""
        ok "ALTER ROLE executed"
      else
        warn "$KC_DB_CONTAINER not running — file updated, DB credential NOT changed"
        mark_warn
      fi
      queue_restart "keycloak"
      ;;

    NOMINATIM_DATABASE_PASSWORD)
      NOM_CONTAINER="${PROJECT}-nominatim"
      info "Rotating NOMINATIM_DATABASE_PASSWORD"
      if container_running "$NOM_CONTAINER"; then
        escaped=$(printf '%s' "$new_val" | sed "s/'/''/g")
        run_or_dry "docker exec '$NOM_CONTAINER' psql -U nominatim -c \"ALTER ROLE nominatim WITH PASSWORD '${escaped}';\""
        ok "ALTER ROLE executed"
      else
        warn "$NOM_CONTAINER not running — file updated, DB credential NOT changed"
        mark_warn
      fi
      queue_restart "nominatim"
      ;;

    BOOKSTACK_DATABASE_PASSWORD)
      WIKI_DB_CONTAINER="${PROJECT}-wiki-db"
      ROOT_PW=$(old_secret "BOOKSTACK_ROOT_PASSWORD")
      if [ -z "$ROOT_PW" ]; then
        ROOT_PW=$(get_value "$SECRETS_FILE" "BOOKSTACK_ROOT_PASSWORD")
      fi
      WIKI_DB_USER=$(get_value "$ENV_FILE" "BOOKSTACK_DATABASE_USERNAME")
      info "Rotating BOOKSTACK_DATABASE_PASSWORD (MariaDB user: $WIKI_DB_USER)"
      if container_running "$WIKI_DB_CONTAINER"; then
        escaped_new=$(printf '%s' "$new_val" | sed "s/'/\\\\'/g")
        escaped_root=$(printf '%s' "$ROOT_PW" | sed "s/'/\\\\'/g")
        run_or_dry "docker exec '$WIKI_DB_CONTAINER' mysql -u root -p'${escaped_root}' \
          -e \"ALTER USER '${WIKI_DB_USER}'@'%' IDENTIFIED BY '${escaped_new}'; FLUSH PRIVILEGES;\""
        ok "ALTER USER executed"
      else
        warn "$WIKI_DB_CONTAINER not running — file updated, DB credential NOT changed"
        mark_warn
      fi
      queue_restart "wiki"
      ;;

    BOOKSTACK_ROOT_PASSWORD)
      WIKI_DB_CONTAINER="${PROJECT}-wiki-db"
      info "Rotating BOOKSTACK_ROOT_PASSWORD (MariaDB root)"
      if container_running "$WIKI_DB_CONTAINER"; then
        escaped_new=$(printf '%s' "$new_val" | sed "s/'/\\\\'/g")
        escaped_old=$(printf '%s' "$old_val" | sed "s/'/\\\\'/g")
        run_or_dry "docker exec '$WIKI_DB_CONTAINER' mysql -u root -p'${escaped_old}' \
          -e \"ALTER USER 'root'@'%' IDENTIFIED BY '${escaped_new}'; FLUSH PRIVILEGES;\""
        ok "ALTER USER root executed"
      else
        warn "$WIKI_DB_CONTAINER not running — file updated, DB credential NOT changed"
        mark_warn
      fi
      queue_restart "wiki-db"
      queue_restart "wiki"
      ;;

    REDIS_PASSWORD)
      info "Rotating REDIS_PASSWORD (restart required to re-read startup command)"
      queue_restart "redis"
      queue_restart "server"
      ;;

    KEYCLOAK_ADMIN_PASSWORD)
      info "Rotating KEYCLOAK_ADMIN_PASSWORD"
      if container_running "$KC_CONTAINER"; then
        if [ "$KC_AUTHED" = 0 ]; then
          run_or_dry "docker exec '$KC_CONTAINER' /opt/keycloak/bin/kcadm.sh config credentials \
            --server http://localhost:8080/auth/sso \
            --realm master \
            --user '${KC_ADMIN}' \
            --password '${old_val}'"
          KC_AUTHED=1
        fi
        escaped=$(printf '%s' "$new_val" | sed "s/'/\\\\'/g")
        run_or_dry "docker exec '$KC_CONTAINER' /opt/keycloak/bin/kcadm.sh set-password \
          -r master --username '${KC_ADMIN}' --new-password '${escaped}'"
        ok "Keycloak admin password updated"
        # kcadm auth token is now stale; force re-auth next call with new password
        KC_AUTHED=0
      else
        warn "$KC_CONTAINER not running — file updated, Keycloak admin password NOT changed"
        mark_warn
      fi
      queue_restart "keycloak"
      ;;

    KEYCLOAK_CLIENT_SECRET)
      info "Rotating KEYCLOAK_CLIENT_SECRET"
      if container_running "$KC_CONTAINER"; then
        if [ "$KC_AUTHED" = 0 ]; then
          KC_ADMIN_PW=$(old_secret "KEYCLOAK_ADMIN_PASSWORD")
          [ -z "$KC_ADMIN_PW" ] && KC_ADMIN_PW=$(get_value "$SECRETS_FILE" "KEYCLOAK_ADMIN_PASSWORD")
          run_or_dry "docker exec '$KC_CONTAINER' /opt/keycloak/bin/kcadm.sh config credentials \
            --server http://localhost:8080/auth/sso \
            --realm master \
            --user '${KC_ADMIN}' \
            --password '${KC_ADMIN_PW}'"
          KC_AUTHED=1
        fi
        escaped=$(printf '%s' "$new_val" | sed "s/'/\\\\'/g")
        run_or_dry "docker exec '$KC_CONTAINER' sh -c \
          \"/opt/keycloak/bin/kcadm.sh get clients -r default --fields id,clientId \
            | grep -B1 '\\\"clientId\\\" : \\\"app\\\"' \
            | grep id \
            | sed 's/.*: \\\"//;s/\\\".*//' \
            | xargs -I{} /opt/keycloak/bin/kcadm.sh update clients/{} -r default -s secret='${escaped}'\""
        ok "Keycloak app client secret updated"
      else
        warn "$KC_CONTAINER not running — file updated, Keycloak client secret NOT changed"
        mark_warn
      fi
      queue_restart "server"
      ;;

    BOOKSTACK_KEYCLOAK_CLIENT_SECRET)
      info "Rotating BOOKSTACK_KEYCLOAK_CLIENT_SECRET"
      if container_running "$KC_CONTAINER"; then
        if [ "$KC_AUTHED" = 0 ]; then
          KC_ADMIN_PW=$(old_secret "KEYCLOAK_ADMIN_PASSWORD")
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
        run_or_dry "docker exec '$KC_CONTAINER' sh -c \
          \"/opt/keycloak/bin/kcadm.sh get clients -r default --fields id,clientId \
            | grep -B1 '\\\"clientId\\\" : \\\"${WIKI_CLIENT_ID}\\\"' \
            | grep id \
            | sed 's/.*: \\\"//;s/\\\".*//' \
            | xargs -I{} /opt/keycloak/bin/kcadm.sh update clients/{} -r default -s secret='${escaped}'\""
        ok "Keycloak wiki client secret updated"
      else
        warn "$KC_CONTAINER not running — file updated, Keycloak wiki client secret NOT changed"
        mark_warn
      fi
      queue_restart "wiki"
      ;;

    SESSION_SECRET|JWT_SECRET|WORKER_TOKEN|BOOKSTACK_SESSION_SECRET)
      info "Rotating $key (app-only — no DB action needed)"
      queue_restart "server"
      [ "$key" = "WORKER_TOKEN" ] && queue_restart "backup"
      [ "$key" = "BOOKSTACK_SESSION_SECRET" ] && queue_restart "wiki"
      ;;

    KEYCLOAK_ADMIN|KEYCLOAK_DATABASE_NAME|BOOKSTACK_DATABASE_NAME)
      warn "$key: this is not a password/secret — changing it requires a full stack reset, not rotation. Skipping."
      ;;

    *)
      warn "$key: no rotation handler defined — file will be updated but no live action taken"
      ;;

  esac
done

# ── update secret files ────────────────────────────────────────────────────────
header "Updating docker/secrets/"
if [ "$DRY_RUN" = 1 ]; then
  dry "Would run: ./secrets.sh"
else
  ./secrets.sh
  ok "Secret files updated"
fi

# ── restart affected services ──────────────────────────────────────────────────
RESTART_SERVICES=$(printf '%s' "$RESTART_SERVICES" | tr ' ' '\n' | grep -v '^$' | sort -u | tr '\n' ' ')

if [ -n "$(printf '%s' "$RESTART_SERVICES" | tr -d ' ')" ]; then
  header "Restarting affected services: $RESTART_SERVICES"
  for svc in $RESTART_SERVICES; do
    container="${PROJECT}-${svc}"
    if container_running "$container"; then
      info "Restarting $svc"
      run_or_dry "docker compose restart $svc"
      ok "$svc restarted"
    else
      warn "$svc is not running — skipping restart"
    fi
  done
fi

# ── summary ────────────────────────────────────────────────────────────────────
printf "\n"
if [ "$WARNINGS" -gt 0 ]; then
  printf "${YELLOW}${BOLD}Rotation complete with %d warning(s).${RESET}\n" "$WARNINGS"
  printf "Review warnings above — some credential changes may require manual follow-up.\n\n"
else
  printf "${GREEN}${BOLD}Rotation complete.${RESET}\n\n"
fi
