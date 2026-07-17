#!/bin/sh
#
# Manage the secret pipeline: .env → .env.secrets → docker/secrets/*.txt.
#
# One entry point for every secret operation:
#
#   1. FIRST RUN (no .env.secrets): bootstrap it from .env's placeholder-
#      marked keys. Exits after writing the stub so you can fill in real
#      values. Nothing under docker/secrets/ is touched.
#
#   2. FRESH DEPLOY (no docker/secrets/<key>.txt yet): write each secret
#      file. No rotation is needed — nothing is running with the old
#      credential yet.
#
#   3. ROTATION (docker/secrets/<key>.txt exists with a value that differs
#      from .env.secrets): run the credential-change SQL/kcadm command
#      against the running container BEFORE overwriting the file, then
#      restart the affected services. If the container isn't running,
#      REFUSE — writing the file without rotating would leave the next
#      boot unable to authenticate against the seeded data volume. Pass
#      --force to override.
#
#   4. NO-OP (values already match): silent skip.
#
# Usage:
#   ./secrets.sh                # process every key in .env.secrets
#   ./secrets.sh KEY1 KEY2 ...  # limit to named keys
#   ./secrets.sh --dry-run      # print the plan without executing
#   ./secrets.sh --force        # skip the rotation stage; just write files
#
# Must be run from the repo root.

set -e

ENV_FILE=".env"
SECRETS_FILE=".env.secrets"
SECRETS_DIR="docker/secrets"
SECRETS_ENV_FILE="docker/.env.secrets.docker"
# Marker value in .env that flags a key as "needs a real secret before
# deployment." Kept in one place — helpers grep on this exact string.
PLACEHOLDER="SeT_tHiS_iN_0x3A-.env.secrets-"

# ── arg parsing ────────────────────────────────────────────────────────────────
DRY_RUN=0
FORCE=0
EXPLICIT_KEYS=""

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --force)   FORCE=1 ;;
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
# is treated as a declared secret.
env_secret_keys() {
  grep -F "=$PLACEHOLDER" "$ENV_FILE" | sed 's/=.*//'
}

project_name() {
  val=$(get_value "$ENV_FILE" "COMPOSE_PROJECT_NAME")
  printf '%s' "${val:-skeleton}"
}

container_running() {
  docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^$1$"
}

# Read the currently-deployed value from disk (empty string if the file
# doesn't exist).
deployed_secret() {
  key="$1"
  secret_name=$(printf '%s' "$key" | tr '[:upper:]' '[:lower:]')
  secret_file="${SECRETS_DIR}/${secret_name}.txt"
  if [ -f "$secret_file" ]; then
    tr -d '\n' < "$secret_file"
  fi
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

# ══════════════════════════════════════════════════════════════════════════════
# BOOTSTRAP PATH — .env.secrets doesn't exist
# ══════════════════════════════════════════════════════════════════════════════
# Derive the secret key list from .env, write a stub .env.secrets seeded
# with those keys, then exit and ask the user to edit values before
# re-running. Nothing under docker/secrets/ or docker/.env.secrets.docker
# is touched — the user still has a working "no secrets" dev stack
# (compose falls through to `.env` values via the `secrets:` placeholder
# indirection).
if [ ! -f "$SECRETS_FILE" ]; then
  echo "No $SECRETS_FILE found — bootstrapping from $ENV_FILE."

  secret_keys=$(env_secret_keys)

  if [ -z "$secret_keys" ]; then
    error "No secret keys found in $ENV_FILE (expected values of '$PLACEHOLDER')."
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
    printf '#   2. Re-run ./secrets.sh to write docker/secrets/*.txt and\n'
    printf '#      docker/.env.secrets.docker.\n'
    printf '#   3. Bring the stack up with docker secrets enabled:\n'
    printf '#        docker compose --env-file docker/.env.secrets.docker up -d\n'
    printf '#\n'
    printf '# Add a new secret? Add it to .env with the placeholder value and\n'
    printf '# re-run ./secrets.sh — this file will be regenerated with the new\n'
    printf '# key preserved alongside any existing values.\n'
    printf '\n'
    for key in $secret_keys; do
      printf '%s=\n' "$key"
    done
  } > "$SECRETS_FILE"

  chmod 600 "$SECRETS_FILE"

  count=$(printf '%s\n' "$secret_keys" | wc -l | tr -d ' ')
  echo
  echo "Wrote $count stub entries to $SECRETS_FILE."
  echo
  echo "Next steps:"
  echo "  1. Edit $SECRETS_FILE and fill in real values for each key."
  echo "  2. Re-run ./secrets.sh to generate docker/secrets/*.txt and"
  echo "     docker/.env.secrets.docker."
  echo
  exit 0
fi

# ══════════════════════════════════════════════════════════════════════════════
# DEPLOY / ROTATE PATH — .env.secrets exists
# ══════════════════════════════════════════════════════════════════════════════

printf "\n${BOLD}Secret Deploy${RESET}"
[ "$DRY_RUN" = 1 ] && printf " ${YELLOW}(dry-run)${RESET}"
[ "$FORCE"   = 1 ] && printf " ${YELLOW}(--force: skipping rotation)${RESET}"
printf "\nRunning from: %s\n" "$(pwd)"

PROJECT=$(project_name)

mkdir -p "$SECRETS_DIR"

# Build the list of keys to process.
if [ -n "$EXPLICIT_KEYS" ]; then
  KEYS_TO_CHECK="$EXPLICIT_KEYS"
else
  KEYS_TO_CHECK=$(env_secret_keys)
fi

# ── classify ──────────────────────────────────────────────────────────────────
#
# For each key, decide the lane:
#   FRESH_WRITES  — no deployed file yet, .env.secrets has a real value.
#   ROTATIONS     — deployed file exists with a different value; need to
#                   run the credential-change handler before overwriting.
#   NOOPS         — deployed file matches .env.secrets. Silent skip.
#   CONFLICTS     — deployed file exists but .env.secrets is empty or
#                   still holds the placeholder marker. Refuse — the user
#                   almost certainly forgot to fill in the value; writing
#                   would blank a live secret.
#   MISSING       — no deployed file AND no real value. Warn and skip.

header "Classifying secrets"

FRESH_WRITES=""
ROTATIONS=""
CONFLICTS=""
MISSING=""

for key in $KEYS_TO_CHECK; do
  new_val=$(get_value "$SECRETS_FILE" "$key")
  old_val=$(deployed_secret "$key")

  secret_name=$(printf '%s' "$key" | tr '[:upper:]' '[:lower:]')
  secret_file="${SECRETS_DIR}/${secret_name}.txt"

  new_is_empty=0
  if [ -z "$new_val" ] || [ "$new_val" = "$PLACEHOLDER" ]; then
    new_is_empty=1
  fi

  if [ -f "$secret_file" ]; then
    # Something is deployed.
    if [ "$new_is_empty" = 1 ]; then
      CONFLICTS="$CONFLICTS $key"
    elif [ "$new_val" = "$old_val" ]; then
      NOOPS="$NOOPS $key"
      ok "$key: unchanged"
    else
      ROTATIONS="$ROTATIONS $key"
      info "$key: changed — will rotate"
    fi
  else
    # No deployed file.
    if [ "$new_is_empty" = 1 ]; then
      MISSING="$MISSING $key"
      warn "$key: no value in $SECRETS_FILE — skipping"
    else
      FRESH_WRITES="$FRESH_WRITES $key"
      info "$key: fresh write"
    fi
  fi
done

# ── bail on conflicts ─────────────────────────────────────────────────────────
if [ -n "$(printf '%s' "$CONFLICTS" | tr -d ' ')" ]; then
  header "Refusing to overwrite deployed secrets with empty values"
  for key in $CONFLICTS; do
    error "$key: $SECRETS_FILE has no value, but docker/secrets/ has one deployed"
  done
  printf "\n"
  printf "Edit %s and fill in real values, then re-run.\n" "$SECRETS_FILE"
  printf "If you want to intentionally clear these secrets, delete the\n"
  printf "corresponding docker/secrets/*.txt files first.\n\n"
  exit 1
fi

# Early exit if nothing to do.
if [ -z "$(printf '%s%s' "$FRESH_WRITES" "$ROTATIONS" | tr -d ' ')" ]; then
  printf "\n${GREEN}${BOLD}All secrets are up to date.${RESET}\n\n"
  exit 0
fi

# ══════════════════════════════════════════════════════════════════════════════
# ROTATION PASS — SQL/kcadm handlers for changed keys
# ══════════════════════════════════════════════════════════════════════════════
# Skipped entirely under --force. Otherwise: for each key in ROTATIONS,
# check the target container is running and dispatch to the handler. If
# any target container is down, abort BEFORE writing any files — the
# whole point of this stage is to avoid the "overwrote file, container
# can't auth" footgun.

RESTART_SERVICES=""
queue_restart() {
  RESTART_SERVICES="$RESTART_SERVICES $1"
}

# Postgres ALTER ROLE — usable via socket auth (POSIX peer inside the
# container), so we don't need the current password.
rotate_pg() {
  container="$1"; db_user="$2"; new_pw="$3"; caller_key="$4"
  if ! container_running "$container"; then
    error "$caller_key: container $container is not running"
    return 1
  fi
  escaped=$(printf '%s' "$new_pw" | sed "s/'/''/g")
  info "ALTER ROLE $db_user in $container"
  run_or_dry "docker exec '$container' psql -U '$db_user' -c \"ALTER ROLE \\\"${db_user}\\\" WITH PASSWORD '${escaped}';\""
}

# MariaDB ALTER USER — needs the current root password (from deployed file).
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

# Rotate the MariaDB root password (needs old root password).
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
  header "Skipping rotation (--force)"
  warn "The following keys changed but their credentials will NOT be"
  warn "rotated against the running containers:"
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
  KC_AUTHED=0  # authenticate to kcadm once per run

  ROTATION_ERRORS=0

  for key in $ROTATIONS; do
    new_val=$(get_value "$SECRETS_FILE" "$key")
    old_val=$(deployed_secret "$key")

    case "$key" in

      DATABASE_PASSWORD)
        DB_USER=$(get_value "$ENV_FILE" "DATABASE_USERNAME")
        DB_CONTAINER="${PROJECT}-database"
        rotate_pg "$DB_CONTAINER" "$DB_USER" "$new_val" "$key" || ROTATION_ERRORS=$((ROTATION_ERRORS + 1))
        queue_restart "server"
        queue_restart "client"
        ;;

      KEYCLOAK_DATABASE_PASSWORD)
        KC_DB_USER=$(get_value "$ENV_FILE" "KEYCLOAK_DATABASE_USERNAME")
        KC_DB_CONTAINER="${PROJECT}-keycloak-db"
        rotate_pg "$KC_DB_CONTAINER" "$KC_DB_USER" "$new_val" "$key" || ROTATION_ERRORS=$((ROTATION_ERRORS + 1))
        queue_restart "keycloak"
        ;;

      NOMINATIM_DATABASE_PASSWORD)
        NOM_CONTAINER="${PROJECT}-nominatim"
        rotate_pg "$NOM_CONTAINER" "nominatim" "$new_val" "$key" || ROTATION_ERRORS=$((ROTATION_ERRORS + 1))
        queue_restart "nominatim"
        ;;

      BOOKSTACK_DATABASE_PASSWORD)
        WIKI_DB_CONTAINER="${PROJECT}-wiki-db"
        # ALTER USER needs the CURRENT root password. Prefer the deployed
        # value; fall back to .env.secrets in case this is a first-time
        # deploy sequence.
        ROOT_PW=$(deployed_secret "BOOKSTACK_ROOT_PASSWORD")
        [ -z "$ROOT_PW" ] && ROOT_PW=$(get_value "$SECRETS_FILE" "BOOKSTACK_ROOT_PASSWORD")
        WIKI_DB_USER=$(get_value "$ENV_FILE" "BOOKSTACK_DATABASE_USERNAME")
        rotate_mysql_user "$WIKI_DB_CONTAINER" "$WIKI_DB_USER" "$ROOT_PW" "$new_val" "$key" \
          || ROTATION_ERRORS=$((ROTATION_ERRORS + 1))
        queue_restart "wiki"
        ;;

      BOOKSTACK_ROOT_PASSWORD)
        WIKI_DB_CONTAINER="${PROJECT}-wiki-db"
        rotate_mysql_root "$WIKI_DB_CONTAINER" "$old_val" "$new_val" "$key" \
          || ROTATION_ERRORS=$((ROTATION_ERRORS + 1))
        queue_restart "wiki-db"
        queue_restart "wiki"
        ;;

      REDIS_PASSWORD)
        # Redis reads the password from the startup command (see the
        # redis service in docker-compose.yml), so a restart is enough.
        info "$key: rotation via restart (no live command needed)"
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
          # kcadm token is now stale — force re-auth on the next kcadm call.
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

      *)
        # Unknown key — write the file but flag it so the operator knows
        # no live rotation ran. Preserves back-compat for keys added to
        # .env without a matching handler in this script.
        warn "$key: no rotation handler defined — file will be updated, but you may need to restart or reconcile services manually"
        mark_warn
        ;;

    esac
  done

  # Any handler that couldn't reach its container aborts the whole run.
  # This is the anti-footgun: we don't overwrite files unless every
  # rotation succeeded.
  if [ "$ROTATION_ERRORS" -gt 0 ] && [ "$DRY_RUN" = 0 ]; then
    header "Aborting"
    error "$ROTATION_ERRORS rotation(s) could not be applied — nothing has been written."
    printf "\n"
    printf "Start the affected containers (docker compose up -d) and re-run,\n"
    printf "OR pass --force to write the files anyway (you will need to wipe\n"
    printf "the affected data volumes or apply the credential change manually\n"
    printf "before the services can authenticate).\n\n"
    exit 1
  fi
fi

# ══════════════════════════════════════════════════════════════════════════════
# WRITE PASS — the actual file updates
# ══════════════════════════════════════════════════════════════════════════════

header "Writing docker/secrets/"

# Accumulator for the `<KEY>_SOURCE=./secrets/<key>.txt` lines emitted
# into $SECRETS_ENV_FILE below. Populated in the same loop that creates
# the per-secret files so the two lists stay in sync automatically.
SOURCE_LINES=""

# FRESH_WRITES + ROTATIONS need the actual write. NOOPS are already on
# disk with the current value — skip them. CONFLICTS are already gone
# (we exited above). MISSING keys have no value to write.
for key in $FRESH_WRITES $ROTATIONS; do
  value=$(get_value "$SECRETS_FILE" "$key")
  secret_name=$(printf '%s' "$key" | tr '[:upper:]' '[:lower:]')
  secret_file="${SECRETS_DIR}/${secret_name}.txt"

  # `docker compose up` will auto-create the mount source as a directory
  # when the declared secret file is missing, leaving a broken
  # `./secrets/foo.txt/` directory that later blocks `echo ... > $secret_file`.
  # Recover from that state here: remove an empty directory at the target,
  # refuse on a non-empty one so we never destroy user data.
  if [ -d "$secret_file" ]; then
    if [ -z "$(ls -A "$secret_file" 2>/dev/null)" ]; then
      rmdir "$secret_file"
    else
      error "$secret_file exists as a non-empty directory."
      error "Refusing to overwrite. Move or delete it manually, then re-run."
      exit 1
    fi
  fi

  if [ "$DRY_RUN" = 1 ]; then
    dry "Would write $secret_file"
  else
    echo "$value" > "$secret_file"
    chmod 600 "$secret_file"
  fi

  # Accumulate the `_SOURCE` line for docker/.env.secrets.docker. Paths
  # are relative to docker/ (where the compose file lives), so drop the
  # `docker/` prefix.
  SOURCE_LINES="${SOURCE_LINES}${key}_SOURCE=./${secret_file#docker/}
"
done

# Also emit _SOURCE lines for keys the first loop didn't touch — NOOPS
# (unchanged, no rewrite needed) and any key excluded by positional
# args. .env.secrets.docker must always list every declared secret so
# compose interpolation resolves them to the real files.
for key in $(env_secret_keys); do
  case " $FRESH_WRITES $ROTATIONS " in
    *" $key "*) ;;  # already emitted in the write loop above
    *)
      secret_name=$(printf '%s' "$key" | tr '[:upper:]' '[:lower:]')
      SOURCE_LINES="${SOURCE_LINES}${key}_SOURCE=./secrets/${secret_name}.txt
"
      ;;
  esac
done

if [ "$DRY_RUN" = 1 ]; then
  dry "Would regenerate $SECRETS_ENV_FILE"
else
  # Header + image-specific `_FILE` env vars. These aren't a mechanical
  # transform of the .env.secrets key list — they're image-defined names
  # (POSTGRES_PASSWORD_FILE, MYSQL_ROOT_PASSWORD_FILE, ...) with a
  # bespoke 1-to-many mapping onto secret files.
  cat > "$SECRETS_ENV_FILE" << 'EOF'
# Auto-generated file - DO NOT EDIT MANUALLY
# Generated by secrets.sh script
#
# These environment variables tell database containers to read passwords
# from Docker secret files instead of direct environment variables.
# This file is only used when Docker secrets are enabled.

# Main application database
POSTGRES_PASSWORD_FILE=/run/secrets/database_password

# Keycloak SSO service
KEYCLOAK_ADMIN_PASSWORD_FILE=/run/secrets/keycloak_admin_password
KC_DB_PASSWORD_FILE=/run/secrets/keycloak_database_password

# Keycloak database
KC_DB_POSTGRES_PASSWORD_FILE=/run/secrets/keycloak_database_password

# Nominatim geocoding service
NOMINATIM_POSTGRES_PASSWORD_FILE=/run/secrets/nominatim_database_password

# BookStack wiki database
MYSQL_ROOT_PASSWORD_FILE=/run/secrets/bookstack_root_password
MYSQL_PASSWORD_FILE=/run/secrets/bookstack_database_password

# Compose top-level `secrets:` entries interpolate <KEY>_SOURCE to pick
# the host-side file. When unset, compose falls back to the tracked
# empty `docker/secrets/.placeholder`. The lines below (one per key in
# .env.secrets) override that so real secret files get mounted.
EOF

  # `<KEY>_SOURCE=./secrets/<key>.txt`, one per secret.
  printf '%s' "$SOURCE_LINES" >> "$SECRETS_ENV_FILE"

  # Blank the plain-env counterparts. The postgres official image's
  # `file_env` helper errors out if BOTH `POSTGRES_PASSWORD` and
  # `POSTGRES_PASSWORD_FILE` are set; blanking here lets the `_FILE`
  # variables win cleanly.
  cat >> "$SECRETS_ENV_FILE" << 'EOF'

POSTGRES_PASSWORD=
KEYCLOAK_ADMIN_PASSWORD=
KC_DB_PASSWORD=
EOF

  chmod 600 "$SECRETS_ENV_FILE"
  ok "Updated docker/secrets/*.txt and $SECRETS_ENV_FILE"
fi

# ══════════════════════════════════════════════════════════════════════════════
# RESTART PASS
# ══════════════════════════════════════════════════════════════════════════════

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
  printf "${YELLOW}${BOLD}Done with %d warning(s).${RESET}\n" "$WARNINGS"
  printf "Review warnings above.\n\n"
else
  printf "${GREEN}${BOLD}Done.${RESET}\n\n"
fi
