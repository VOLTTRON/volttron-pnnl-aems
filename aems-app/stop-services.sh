#!/bin/bash

# This script stops all Docker Compose services.
# By default it preserves persistent volumes. Use --volumes to also delete every
# named volume in the compose project (fully destructive - every service's data
# is wiped in one call). This is the counterpart to start-services.sh.

# Display help if -h or --help is present in arguments
show_help() {
    echo -e "\033[1;33mUsage: stop-services.sh [-v|--volumes] [-f|--force] [-n|--dry-run] [-h|--help]\033[0m"
    echo ""
    echo "Stop all Docker Compose services. Preserves persistent volumes by default."
    echo ""
    echo "Options:"
    echo "  -v, --volumes         Also delete every named volume in the compose project."
    echo "                        THIS IS DESTRUCTIVE and wipes every service's data."
    echo "  -f, --force           Skip confirmation prompt (only meaningful with --volumes)"
    echo "  -n, --dry-run         Show what would be done without actually doing it"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./stop-services.sh                       # Stop all services, keep volumes"
    echo "  ./stop-services.sh --volumes             # Stop and wipe every volume (prompts)"
    echo "  ./stop-services.sh --volumes --force     # Wipe without confirmation"
    echo "  ./stop-services.sh --dry-run             # Preview"
    echo ""
    echo "Note: To wipe a single service's volume(s) rather than the whole stack,"
    echo "use ./reset-service.sh <service> instead. To restart in place without"
    echo "stopping, use ./restart-service.sh <service>."
    echo -e "\033[1;31mWith --volumes, THIS CHANGE IS UNRECOVERABLE!\033[0m"
    exit 0
}

# Check for help flag first
for arg in "$@"; do
    if [[ "$arg" == "-h" || "$arg" == "--help" ]]; then
        show_help
    fi
done

# Store the starting path
STARTING_PATH=$(pwd)

# Parse arguments
WIPE_VOLUMES=false
FORCE=false
DRY_RUN=false

for arg in "$@"; do
    case $arg in
        -v|--volumes)
            WIPE_VOLUMES=true
            ;;
        -f|--force)
            FORCE=true
            ;;
        -n|--dry-run)
            DRY_RUN=true
            ;;
        -h|--help)
            show_help
            ;;
        *)
            echo -e "\033[1;31mError: Unknown option: $arg\033[0m"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done


# Color functions for output
print_blue() {
    echo -e "\033[1;34m$1\033[0m"
}

print_cyan() {
    echo -e "\033[1;36m$1\033[0m"
}

print_green() {
    echo -e "\033[1;32m$1\033[0m"
}

print_yellow() {
    echo -e "\033[1;33m$1\033[0m"
}

print_red() {
    echo -e "\033[1;31m$1\033[0m"
}

# Error handling function
on_failure() {
    print_red "Stop failed with error in $(pwd)"
    cd "$STARTING_PATH"
    print_cyan "Restored starting directory: $STARTING_PATH"
    exit 1
}

# Set up error handling
set -e
trap on_failure ERR

if [[ "$WIPE_VOLUMES" == "true" ]]; then
    print_blue "Docker Compose Stop with volume wipe (docker compose down -v)"
else
    print_blue "Docker Compose Stop (docker compose down)"
fi

if [[ "$DRY_RUN" == "true" ]]; then
    print_yellow "[DRY RUN MODE - No changes will be made]"
fi

# Confirmation prompt when wiping volumes (unless --force or --dry-run)
if [[ "$WIPE_VOLUMES" == "true" && "$FORCE" != "true" && "$DRY_RUN" != "true" ]]; then
    echo ""
    print_yellow "WARNING: --volumes will delete EVERY named volume in the compose project."
    print_yellow "Every service's persistent data (databases, historian, keycloak realm, backups, etc.)"
    print_yellow "will be permanently lost."
    print_red "THIS CHANGE IS UNRECOVERABLE!"
    read -p "Are you sure you want to continue? (yes/no): " confirmation
    if [[ "$confirmation" != "yes" ]]; then
        print_yellow "Stop cancelled by user"
        exit 0
    fi
fi

if [[ "$WIPE_VOLUMES" == "true" ]]; then
    if [[ "$DRY_RUN" == "true" ]]; then
        print_blue "[DRY RUN] Would run: docker compose down -v"
    else
        print_cyan "Stopping services and deleting volumes..."
        docker compose down -v
        print_green "All services stopped and every named volume deleted"
    fi
else
    if [[ "$DRY_RUN" == "true" ]]; then
        print_blue "[DRY RUN] Would run: docker compose down"
    else
        print_cyan "Stopping services (volumes preserved)..."
        docker compose down
        print_green "All services stopped. Volumes preserved."
        print_cyan "Use ./start-services.sh to bring the stack back up."
    fi
fi

if [[ "$DRY_RUN" == "true" ]]; then
    print_green "Dry run completed - no changes were made"
fi

# Always restore the starting path
cd "$STARTING_PATH"

# Clear the error trap since we completed successfully
trap - ERR
