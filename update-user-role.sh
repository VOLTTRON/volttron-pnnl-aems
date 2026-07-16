#!/bin/bash

# This script connects to the database docker container and modifies a single user's role.
# It takes two arguments: email and role. The role is trimmed, lowercased, and may contain spaces.
# When KEYCLOAK_ADMIN and KEYCLOAK_ADMIN_PASSWORD are configured it also syncs the
# realm-management 'realm-admin' client role via kcadm.sh inside the Keycloak container.

for arg in "$@"; do
    if [[ "$arg" == "-h" || "$arg" == "--help" ]]; then
        echo -e "\033[1;33mUsage: update-user-role.sh <email> <role>\033[0m"
        echo "Arguments:"
        echo "  email              The email address of the user to update"
        echo "  role               The new role for the user (will be trimmed and lowercased)"
        echo "                     Use empty string \"\" to remove user's role"
        echo "Options:"
        echo "  -h, --help         Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./update-user-role.sh user@example.com admin"
        echo "  ./update-user-role.sh user@example.com \"project manager\""
        echo "  ./update-user-role.sh user@example.com \"\"  # Remove role"
        exit 0
    fi
done

print_blue()   { echo -e "\033[1;34m$1\033[0m"; }
print_cyan()   { echo -e "\033[1;36m$1\033[0m"; }
print_green()  { echo -e "\033[1;32m$1\033[0m"; }
print_yellow() { echo -e "\033[1;33m$1\033[0m"; }
print_red()    { echo -e "\033[1;31m$1\033[0m"; }

if [ $# -ne 2 ]; then
    print_red "Error: Exactly 2 arguments required"
    print_yellow "Usage: update-user-role.sh <email> <role>"
    print_yellow "Use -h or --help for more information"
    exit 1
fi

USER_EMAIL="$1"
USER_ROLE="$2"

if [[ ! "$USER_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    print_red "Error: Invalid email format: $USER_EMAIL"
    exit 1
fi

USER_ROLE=$(echo "$USER_ROLE" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr '[:upper:]' '[:lower:]')

print_blue "Updating user role in database..."
print_cyan "Email: $USER_EMAIL"
print_cyan "New Role: $USER_ROLE"

# Load environment variables — root .env first, then server/.env (server values win)
read_env() {
    local file="$1"
    [ -f "$file" ] || return
    local val
    val=$(grep "^COMPOSE_PROJECT_NAME=" "$file" 2>/dev/null | cut -d'=' -f2 | tr -d '"')
    [ -n "$val" ] && COMPOSE_PROJECT_NAME="$val"
    val=$(grep "^DATABASE_NAME=" "$file" 2>/dev/null | cut -d'=' -f2 | tr -d '"')
    [ -n "$val" ] && DATABASE_NAME="$val"
    val=$(grep "^DATABASE_USERNAME=" "$file" 2>/dev/null | cut -d'=' -f2 | tr -d '"')
    [ -n "$val" ] && DATABASE_USERNAME="$val"
    val=$(grep "^KEYCLOAK_ISSUER_URL=" "$file" 2>/dev/null | cut -d'=' -f2 | tr -d '"')
    [ -n "$val" ] && KEYCLOAK_ISSUER_URL="$val"
    val=$(grep "^KEYCLOAK_ADMIN=" "$file" 2>/dev/null | cut -d'=' -f2 | tr -d '"')
    [ -n "$val" ] && KEYCLOAK_ADMIN="$val"
    val=$(grep "^KEYCLOAK_ADMIN_ROLE=" "$file" 2>/dev/null | cut -d'=' -f2 | tr -d '"')
    [ -n "$val" ] && KEYCLOAK_ADMIN_ROLE="$val"
}

COMPOSE_PROJECT_NAME="skeleton"
DATABASE_NAME="skeleton"
DATABASE_USERNAME="skeleton"
KEYCLOAK_ISSUER_URL=""
KEYCLOAK_ADMIN="admin"
KEYCLOAK_ADMIN_ROLE="realm-admin"

# Load server/.env first, then root .env — root wins.
# server/.env holds local-dev DB overrides; root .env is authoritative for Docker Compose
# container config (COMPOSE_PROJECT_NAME, DATABASE_USERNAME, etc.).
# Keycloak-specific vars (KEYCLOAK_ISSUER_URL, KEYCLOAK_ADMIN_ROLE) only exist in
# server/.env, so they survive the root .env pass unmodified.
read_env "server/.env"
read_env ".env"

# Admin password: prefer secrets files (avoid .env placeholder values)
KEYCLOAK_ADMIN_PASSWORD=""
for secrets_file in ".env.secrets" "server/.env.secrets"; do
    if [ -f "$secrets_file" ]; then
        local_pw=$(grep "^KEYCLOAK_ADMIN_PASSWORD=" "$secrets_file" 2>/dev/null | cut -d'=' -f2 | tr -d '"')
        [ -n "$local_pw" ] && KEYCLOAK_ADMIN_PASSWORD="$local_pw"
    fi
done
if [ -z "$KEYCLOAK_ADMIN_PASSWORD" ]; then
    env_pw=$(grep "^KEYCLOAK_ADMIN_PASSWORD=" .env 2>/dev/null | cut -d'=' -f2 | tr -d '"' || true)
    case "$env_pw" in SeT_tHiS_iN*) ;; *) KEYCLOAK_ADMIN_PASSWORD="$env_pw" ;; esac
fi

# Derive Keycloak realm from issuer URL (e.g. .../realms/default -> default)
KEYCLOAK_REALM=$(echo "$KEYCLOAK_ISSUER_URL" | sed 's|.*/realms/||')
[ -z "$KEYCLOAK_REALM" ] && KEYCLOAK_REALM="default"

# Check database container
CONTAINER_NAME="${COMPOSE_PROJECT_NAME}-database"
if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    print_red "Error: Database container '${CONTAINER_NAME}' is not running"
    print_yellow "Please start the database container first with: docker compose up -d database"
    exit 1
fi

on_failure() { print_red "Failed to update user role"; exit 1; }
set -e
trap on_failure ERR

ESCAPED_EMAIL="${USER_EMAIL//\'/\'\'}"
ESCAPED_ROLE="${USER_ROLE//\'/\'\'}"

print_cyan "Connecting to database container..."
QUERY="WITH updated AS (UPDATE \"User\" SET role = '${ESCAPED_ROLE}' WHERE email = '${ESCAPED_EMAIL}' RETURNING id) SELECT u.id FROM updated u LIMIT 1;"

RAW_RESULT=$(docker exec -i "$CONTAINER_NAME" psql -U "$DATABASE_USERNAME" -d "$DATABASE_NAME" -t -A -c "$QUERY" 2>/dev/null)

if [ -z "$RAW_RESULT" ]; then
    print_yellow "No user found with email: $USER_EMAIL"
    print_yellow "Please verify the email address is correct and the user exists in the database"
    print_yellow "No changes were made to the database"
    exit 0
fi

print_green "Successfully updated role for user: $USER_EMAIL"
print_green "New role: $USER_ROLE"

trap - ERR

# Keycloak sync via kcadm.sh inside the Keycloak container
ROLE_HAS_KEYCLOAK=false
if echo "$USER_ROLE" | grep -qw "keycloak"; then
    ROLE_HAS_KEYCLOAK=true
fi

KC_CONTAINER="${COMPOSE_PROJECT_NAME}-keycloak"
KC_RUNNING=false
if docker ps --format "{{.Names}}" | grep -q "^${KC_CONTAINER}$"; then
    KC_RUNNING=true
fi

if $KC_RUNNING && [ -n "$KEYCLOAK_ADMIN_PASSWORD" ]; then
    print_cyan "Syncing Keycloak admin role..."
    KCADM="/opt/keycloak/bin/kcadm.sh"
    KC_SERVER="http://localhost:8080/auth/sso"

    if ! docker exec "$KC_CONTAINER" sh -c "$KCADM config credentials --server $KC_SERVER --realm master --user $KEYCLOAK_ADMIN --password $KEYCLOAK_ADMIN_PASSWORD" 2>&1; then
        print_yellow "Warning: Could not authenticate with Keycloak kcadm -- role sync skipped"
    else
        if $ROLE_HAS_KEYCLOAK; then
            if docker exec "$KC_CONTAINER" sh -c "$KCADM add-roles -r $KEYCLOAK_REALM --uusername $USER_EMAIL --cclientid realm-management --rolename $KEYCLOAK_ADMIN_ROLE" 2>&1; then
                print_green "Granted Keycloak '$KEYCLOAK_ADMIN_ROLE' role to user"
            else
                print_yellow "Warning: Failed to grant Keycloak role (check kcadm output above)"
            fi
        else
            if docker exec "$KC_CONTAINER" sh -c "$KCADM remove-roles -r $KEYCLOAK_REALM --uusername $USER_EMAIL --cclientid realm-management --rolename $KEYCLOAK_ADMIN_ROLE" 2>&1; then
                print_green "Revoked Keycloak '$KEYCLOAK_ADMIN_ROLE' role from user"
            else
                print_yellow "Warning: Failed to revoke Keycloak role (may not have been assigned)"
            fi
        fi
    fi
elif ! $KC_RUNNING; then
    print_yellow "Note: Keycloak container '$KC_CONTAINER' not running -- role sync skipped"
fi

print_green "Role update operation completed!"
