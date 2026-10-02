#!/bin/sh
#
# Manage .env.secrets and apply rotations to live containers.
#
# ARCHITECTURE
# ────────────
# .env is the single input docker compose reads. It contains real
# values in a running deployment. .env.secrets (optional, gitignored)
# is an operator's editable secret store. This script overlays the
# values from .env.secrets onto .env before compose runs, so compose's
# natural `.env` auto-load resolves every ${VAR} to the real value —
# no --env-file flag, no COMPOSE_ENV_FILES, no service-level env_file
# mount of .env.secrets.
#
# Deployments that don't want a separate .env.secrets file can leave
# it absent and edit .env directly. This script is then a no-op after
# bootstrap.
#
# What this script does:
#
#   1. BOOTSTRAP (no .env.secrets): create a stub .env.secrets seeded
#      from every key marked in .env with the sentinel placeholder
#      (or whose current value is a real credential misplaced in .env).
#      Exits so the operator can fill in real values.
#
#   2. SYNC + ROTATION (every subsequent run): compare each secret key's
#      value between .env.secrets (desired) and .env (currently
#      deployed). If they differ:
#        - Run the live credential-change handler (ALTER ROLE / kcadm /
#          grafana-cli) against the running container using the old
#          value from .env.
#        - Overlay the new value into .env in place.
#        - Queue affected services for `docker compose up -d --no-deps`
#          so they pick up the fresh .env on next boot.
#
#   3. NO-OP: silent skip when .env and .env.secrets already match.
#
# Note on restart mode: `docker compose restart` reuses the cached env
# vars in the existing container — it does NOT re-read the .env at
# compose parse time. Use `docker compose up -d --no-deps <svc>`.
#
# WARNING: after this script runs, .env contains real secret values.
# The file is tracked in git with the sentinel baseline. DO NOT commit
# the modified .env.
#
# Usage:
#   ./secrets.sh                # process every key in .env.secrets
#   ./secrets.sh KEY1 KEY2 ...  # limit to named keys
#   ./secrets.sh --dry-run      # print the plan without executing
#   ./secrets.sh --force        # skip the live-rotation step
#
# Must be run from the repo root.

set -e

# Anchor to this script's directory so relative paths and docker compose's
# cwd-based `.env` auto-load resolve regardless of the caller's location.
cd "$(dirname "$0")"

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

# A value as compose reads it: '...' is literal, "..." takes \" and $$ escapes.
unquote() {
  case "$1" in
    \'*\') v=${1#\'}; printf '%s' "${v%\'}" ;;
    \"*\") v=${1#\"}; v=${v%\"}; printf '%s' "$v" | sed 's/\\"/"/g; s/\$\$/$/g' ;;
    *)     printf '%s' "$1" ;;
  esac
}

get_value() {
  file="$1"; key="$2"
  [ -f "$file" ] || return 0
  raw=$(sed '1s/^\xEF\xBB\xBF//; s/\r$//' "$file" | grep -v '^\s*#' | grep "^${key}=" | head -1 | sed 's/^[^=]*=//')
  unquote "$raw"
}

# Derive the authoritative secret key list from .env by grepping for
# the placeholder marker. Any line in .env of the form KEY=<placeholder>
# is a declared secret.
env_secret_keys() {
  grep -F "=$PLACEHOLDER" "$ENV_FILE" | sed 's/=.*//'
}

# Returns key names for every variable in .env whose name ends in
# _PASSWORD, _SECRET, _TOKEN, or _KEY and whose value is a real
# credential NOT already in .env.secrets. These belong in .env.secrets
# but aren't there yet — candidates for migration.
#
# In the sync model, .env normally holds the same real values as
# .env.secrets (via `sync_env_from_secrets`), so we filter those out:
# a value that matches .env.secrets is a synced entry, not a misplaced
# one.
env_misplaced_keys() {
  grep -v '^\s*#' "$ENV_FILE" | tr -d '\r' \
    | grep -iE '^[A-Za-z_][A-Za-z0-9_]*_(PASSWORD|SECRET|TOKEN|KEY)=' \
    | while read -r line; do
        key="${line%%=*}"
        val=$(unquote "${line#*=}")
        [ -z "$val" ] && continue
        [ "$val" = "$PLACEHOLDER" ] && continue
        # If .env.secrets already has the same value, it's synced — skip.
        if [ -f "$SECRETS_FILE" ]; then
          secrets_val=$(get_value "$SECRETS_FILE" "$key")
          [ "$secrets_val" = "$val" ] && continue
        fi
        echo "$key"
      done
}

# Write KEY='VALUE' into FILE, replacing an existing entry or appending a new one. The file comes
# out UTF-8 without a BOM, LF-terminated, and keeps its mode. Single quotes are compose's literal
# form, so `$`, `#` and spaces reach the container unchanged; a value holding a single quote has
# no literal form and is refused.
update_secrets_entry() {
  file="$1"; key="$2"; value="$3"
  case "$value" in
    *"'"*) error "$key: the value contains a single quote, which $file cannot carry literally — choose another"; return 1 ;;
  esac
  line="${key}='${value}'"
  tmp="${file}.tmp$$"
  found=0
  sed '1s/^\xEF\xBB\xBF//; s/\r$//' "$file" 2>/dev/null > "$tmp.in" || : > "$tmp.in"
  while IFS= read -r l || [ -n "$l" ]; do
    case "$l" in
      "${key}="*) printf '%s\n' "$line"; found=1 ;;
      *)          printf '%s\n' "$l" ;;
    esac
  done < "$tmp.in" > "$tmp"
  [ "$found" = 1 ] || printf '%s\n' "$line" >> "$tmp"
  cat "$tmp" > "$file"
  rm -f "$tmp" "$tmp.in"
}

# The shell outranks .env, as it does for compose itself.
project_name() {
  val=${COMPOSE_PROJECT_NAME:-$(get_value "$ENV_FILE" "COMPOSE_PROJECT_NAME")}
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

# The "currently deployed" value for a secret key is the value in .env —
# that's what docker compose reads when interpolating ${KEY} and what the
# service containers see in their runtime env. A sentinel in .env means
# nothing real is deployed for this key yet; return empty so classification
# falls to FRESH.
deployed_secret() {
  key="$1"
  val=$(get_value "$ENV_FILE" "$key")
  [ "$val" = "$PLACEHOLDER" ] && val=""
  printf '%s' "$val"
}

# Every KEY=VALUE line in .env.secrets (skipping comments, blanks).
secrets_file_keys() {
  grep -v '^\s*#' "$SECRETS_FILE" 2>/dev/null \
    | grep -E '^[A-Za-z_][A-Za-z0-9_]*=' \
    | sed 's/=.*//'
}

# Overlay every non-blank non-placeholder value from .env.secrets onto
# .env. Prints the count of keys whose value changed.
sync_env_from_secrets() {
  changed=0
  for k in $(secrets_file_keys); do
    new_val=$(get_value "$SECRETS_FILE" "$k")
    [ -z "$new_val" ] && continue
    [ "$new_val" = "$PLACEHOLDER" ] && continue
    old_val=$(get_value "$ENV_FILE" "$k")
    if [ "$new_val" != "$old_val" ]; then
      if [ "$DRY_RUN" = 0 ]; then
        update_secrets_entry "$ENV_FILE" "$k" "$new_val" || continue
      fi
      changed=$((changed + 1))
    fi
  done
  echo "$changed"
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

# Compose auto-loads .env from cwd. No --env-file discipline needed —
# this script's job is to make .env correct, and compose reads it
# unconditionally.

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
        printf "%s='%s'\n" "$key" "$env_val"
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

# Build the list of keys to process. Prefer .env.secrets as the
# authoritative list — after the first sync, .env no longer has
# sentinel-marked entries, so env_secret_keys() would return empty.
if [ -n "$EXPLICIT_KEYS" ]; then
  KEYS_TO_CHECK="$EXPLICIT_KEYS"
else
  KEYS_TO_CHECK=$(secrets_file_keys)
  # Fall back to sentinel-marked entries in .env if .env.secrets is
  # empty (freshly bootstrapped and nothing filled in).
  [ -z "$(printf '%s' "$KEYS_TO_CHECK" | tr -d ' \n\t')" ] && KEYS_TO_CHECK=$(env_secret_keys)
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
          update_secrets_entry "$SECRETS_FILE" "$key" "$env_val" || mark_warn
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

# ══════════════════════════════════════════════════════════════════════════════
# SENTINEL SCAN — a container created before .env was synced (a hand-typed
# `docker compose up`) carries the sentinel for a key .env.secrets now sets.
# Recreate it with the synced value. Scoped to full runs (skipped when the
# user passed explicit keys).
# ══════════════════════════════════════════════════════════════════════════════

POISONED_SERVICES=""
if [ -z "$EXPLICIT_KEYS" ]; then
  header "Scanning for sentinel-poisoned containers"
  # The sentinel is a valid runtime default: a container holding it is poisoned only for a key
  # .env.secrets gives a real value.
  for c in $(docker ps -a --format '{{.Names}}' 2>/dev/null | grep "^${PROJECT}-" || true); do
    for k in $(docker inspect "$c" --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null \
                 | tr -d '\r' | grep "=${PLACEHOLDER}$" | sed 's/=.*//' || true); do
      want=$(get_value "$SECRETS_FILE" "$k")
      if [ -n "$want" ] && [ "$want" != "$PLACEHOLDER" ]; then
        svc=${c#${PROJECT}-}
        POISONED_SERVICES="$POISONED_SERVICES $svc"
        warn "$c: env holds the sentinel for $k, which $SECRETS_FILE sets"
        break
      fi
    done
  done
  if [ -n "$(printf '%s' "$POISONED_SERVICES" | tr -d ' ')" ]; then
    warn "Those containers were created before secrets.sh synced .env."
    warn "Recreating with real values from ${SECRETS_FILE}..."
    mark_warn
  else
    ok "No sentinel-poisoned containers detected."
  fi
fi

# Nothing to do — .env.secrets matches every running container's env
# AND no poisoned containers to repair.
if [ -z "$(printf '%s%s%s' "$FRESH" "$ROTATIONS" "$POISONED_SERVICES" | tr -d ' ')" ]; then
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

# ── pg_shadow-drift probe ──────────────────────────────────────────────────────
# Runs UNCONDITIONALLY on full-runs. For each postgres role, verify
# `pg_shadow` accepts the `.env.secrets` value. If it doesn't but
# ACCEPTS the sentinel, the volume was seeded with the sentinel and we
# rotate to realign. Covers the case where compose up -d has already
# fixed container envs to real values but `pg_shadow` was poisoned in
# the volume by a prior bad boot.
_pg_auth_ok() {
  docker exec -e PGPASSWORD="$1" "$2" psql -U "$3" -h "$4" -d "$5" -tAc 'SELECT 1;' >/dev/null 2>&1
}
if [ -z "$EXPLICIT_KEYS" ] && [ "$DRY_RUN" = 0 ]; then
  for spec in \
      "DATABASE_PASSWORD:database:aems" \
      "KEYCLOAK_DATABASE_PASSWORD:keycloak-db:keycloak" \
      "NOMINATIM_DATABASE_PASSWORD:nominatim:nominatim" \
      "HISTORIAN_DATABASE_PASSWORD:historian:historian" \
      "HISTORIAN_REPLICATOR_PASSWORD:historian:replicator" \
      "GRAFANA_DATABASE_PASSWORD:grafana-db:grafana"; do
    key=${spec%%:*}
    rest=${spec#*:}
    svc=${rest%%:*}
    db_user=${rest#*:}
    container="${PROJECT}-${svc}"
    container_running "$container" || continue
    new_val=$(get_value "$SECRETS_FILE" "$key")
    [ -z "$new_val" ] || [ "$new_val" = "$PLACEHOLDER" ] && continue
    # If pg_shadow already accepts the desired value, nothing to do.
    if _pg_auth_ok "$new_val" "$container" "$db_user" "$svc" "$db_user"; then
      continue
    fi
    # It doesn't. Try the sentinel — if that works, pg_shadow is stuck
    # on the sentinel and needs rotation to align with .env.secrets.
    if _pg_auth_ok "$PLACEHOLDER" "$container" "$db_user" "$svc" "$db_user"; then
      warn "$container: pg_shadow accepts the sentinel — aligning role $db_user to $SECRETS_FILE value"
      rotate_pg "$container" "$db_user" "$new_val" "$key (pg_shadow repair)" "$PLACEHOLDER" \
        || warn "  rotate_pg failed — pg_shadow may still be drifted; check manually"
      # Force downstream recreates so app envs pick up the freshly
      # rotated password.
      case "$svc" in
        database)    for s in init server services seeders synth-worker client backup; do queue_restart "$s"; done ;;
        keycloak-db) queue_restart "keycloak" ;;
        historian)   for s in volttron volttron-setup server services synth-worker; do queue_restart "$s"; done ;;
        grafana-db)  queue_restart "grafana" ;;
        nominatim)   queue_restart "nominatim" ;;
      esac
    else
      warn "$container: pg_shadow does not accept either the sentinel or the $SECRETS_FILE value for $db_user — manual reconciliation required"
    fi
  done
fi

# Merge POISONED_SERVICES into RESTART_SERVICES so the existing RESTART
# pass recreates them with real env values from .env.secrets.
for svc in $POISONED_SERVICES; do
  queue_restart "$svc"
done

# ══════════════════════════════════════════════════════════════════════════════
# SYNC .env FROM .env.secrets
# ══════════════════════════════════════════════════════════════════════════════
#
# Live rotations above ran against the OLD .env values. Now that the
# rotation handlers have made the live containers accept the new values,
# overlay .env.secrets onto .env so:
#   (a) `docker compose up -d --no-deps <svc>` below recreates each
#       service with the new value in its runtime env
#   (b) future compose invocations (from any shell) resolve ${VAR}
#       against the real value in .env
#
# .env is the single input compose reads. This script's job is to keep
# it aligned with .env.secrets.
if [ -f "$SECRETS_FILE" ]; then
  SYNCED=$(sync_env_from_secrets)
  if [ "$SYNCED" -gt 0 ] && [ "$DRY_RUN" = 0 ]; then
    header "Synced $SYNCED secret(s) from $SECRETS_FILE into $ENV_FILE"
    warn "$ENV_FILE now contains real secret values — DO NOT commit."
    mark_warn
  fi
fi

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
        # Always try to recreate — compose will skip services whose
        # profile isn't active. Services in Exited/Created state (e.g.,
        # a failed init) still need to come up with fresh env.
        info "Recreating $svc"
        run_or_dry "docker compose up -d --no-deps $svc"
        ok "$svc recreated"
        ;;
    esac
  done
fi

# ── Volttron historian config sync ────────────────────────────────────────────
# The SQLHistorian agent reads its DB connection from its install-time
# config file (dist-info/config), NOT the dynamic config store, and
# --force-recreate of the volttron container doesn't guarantee the agent
# picks up the current historian.config on disk (setup-platform.py's
# install-if-missing behavior). Run the sync helper explicitly whenever
# any rotation touched the historian password OR volttron was in the
# poisoned recreate set (sentinel-poisoning of the volttron container's
# env means historian.config was written with placeholder values and
# the agent got installed with them).
NEED_VOLTTRON_SYNC=0
case " $ROTATIONS " in
  *" HISTORIAN_DATABASE_PASSWORD "*|*" HISTORIAN_REPLICATOR_PASSWORD "*)
    NEED_VOLTTRON_SYNC=1 ;;
esac
case " $POISONED_SERVICES " in
  *" volttron "*|*" volttron-setup "*) NEED_VOLTTRON_SYNC=1 ;;
esac
if [ "$NEED_VOLTTRON_SYNC" = 1 ] && [ "$DRY_RUN" = 0 ] && [ -x ./scripts/sync-volttron-historian-config.sh ]; then
  header "Syncing SQLHistorian install-time config"
  ./scripts/sync-volttron-historian-config.sh \
    || warn "sync-volttron-historian-config.sh reported issues (see above). Dashboards may not show new data until the sync succeeds."
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
