#!/bin/bash
# repair-historian-replication.sh
# Repair historian PostgreSQL logical-replication configuration in-place.
# Run from aems-app directory: ./repair-historian-replication.sh
#
# Fixes deployments where either:
#   * historian_pub was created FOR ALL TABLES and has picked up stray schemas
#     (e.g. migration_stage from migrate-historian-data.sh), which breaks
#     subscriber initial-sync with "schema does not exist" errors;
#   * historian_pub exists but covers zero tables (or is missing entirely).
#
# Idempotent — safe to run against a deployment that is already correctly
# configured. Actions inside the container: drop migration_stage if present,
# rebuild historian_pub as FOR TABLES IN SCHEMA public if scope is wrong,
# re-apply replicator grants and primary-key constraints.

show_help() {
    echo -e "\033[1;33mUsage: repair-historian-replication.sh [-n|--dry-run] [-y|--yes] [-h|--help]\033[0m"
    echo ""
    echo "Repair historian logical-replication configuration on the publisher."
    echo ""
    echo "Options:"
    echo "  -n, --dry-run    Report current state and planned actions without writing"
    echo "  -y, --yes        Skip the interactive confirmation prompt"
    echo "  -h, --help       Show this help message"
    echo ""
    echo "This script must be run against a running historian container."
    echo "Downstream subscribers will need to drop and recreate their subscriptions"
    echo "after a repair that rebuilds the publication."
    exit 0
}

for arg in "$@"; do
    if [[ "$arg" == "-h" || "$arg" == "--help" ]]; then
        show_help
    fi
done

set -e

# Parse arguments
DRY_RUN=false
FORCE=false
for arg in "$@"; do
    case $arg in
        -n|--dry-run) DRY_RUN=true ;;
        -y|--yes)     FORCE=true ;;
        -h|--help)    show_help ;;
        *)
            echo -e "\033[1;31mError: Unknown option: $arg\033[0m"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

# Colors
print_blue()   { echo -e "\033[1;34m$1\033[0m"; }
print_cyan()   { echo -e "\033[1;36m$1\033[0m"; }
print_green()  { echo -e "\033[1;32m$1\033[0m"; }
print_yellow() { echo -e "\033[1;33m$1\033[0m"; }
print_red()    { echo -e "\033[1;31m$1\033[0m"; }

# Load .env if present (same shape as migrate-historian-data.sh)
if [ -f ".env" ]; then
    while IFS= read -r line || [ -n "$line" ]; do
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "$line" ]] && continue
        if [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)= ]]; then
            export "$line"
        fi
    done < .env
fi

COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-aems-app}"
TARGET_CONTAINER="${TARGET_CONTAINER:-${COMPOSE_PROJECT_NAME}-historian}"

print_blue "Historian replication repair"
print_cyan "Target container: $TARGET_CONTAINER"
if [[ "$DRY_RUN" == "true" ]]; then
    print_yellow "[DRY RUN — no writes]"
fi

# Verify container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${TARGET_CONTAINER}$"; then
    print_red "Error: container '${TARGET_CONTAINER}' is not running."
    print_yellow "Bring the stack up first, e.g. from the repo root: docker compose --profile historian up -d"
    exit 1
fi

# Confirmation (skipped for --dry-run or --yes)
if [[ "$DRY_RUN" != "true" && "$FORCE" != "true" ]]; then
    echo ""
    print_yellow "This may DROP and recreate the historian_pub publication."
    print_yellow "Any downstream subscribers will need to drop and recreate their subscriptions after this runs."
    read -p "Continue? (yes/no): " confirmation
    if [[ "$confirmation" != "yes" ]]; then
        print_yellow "Cancelled by user"
        exit 0
    fi
fi

# Invoke the image-baked repair script
DOCKER_ARGS=(exec -i "$TARGET_CONTAINER" /usr/local/bin/repair-replication.sh)
if [[ "$DRY_RUN" == "true" ]]; then
    DOCKER_ARGS+=(--dry-run)
fi

# Fall back to a helpful message if the image predates the baked-in script.
if ! docker exec "$TARGET_CONTAINER" test -x /usr/local/bin/repair-replication.sh 2>/dev/null; then
    print_red "Error: /usr/local/bin/repair-replication.sh is not present in the historian container."
    print_yellow "Rebuild the historian image so it picks up the baked-in repair script:"
    echo "    docker compose build historian && docker compose up -d historian"
    exit 1
fi

docker "${DOCKER_ARGS[@]}"

print_green "Done."
