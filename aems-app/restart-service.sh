#!/bin/bash

# This script restarts one or more Docker Compose services in place.
# It preserves persistent volumes and every other running service.
# Use reset-service.sh instead when the intent is to wipe volumes.

# Display help if -h or --help is present in arguments
show_help() {
    echo -e "\033[1;33mUsage: restart-service.sh [service-name...] [-n|--dry-run] [-h|--help]\033[0m"
    echo ""
    echo "Restart one or more Docker Compose services in place. Preserves volumes,"
    echo "config, and every other service. This is the safe, non-destructive"
    echo "counterpart to reset-service.sh."
    echo ""
    echo "Arguments:"
    echo "  service-name...        Name(s) of the service(s) to restart (optional - lists services if omitted)"
    echo ""
    echo "Options:"
    echo "  -n, --dry-run         Show what would be done without actually doing it"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./restart-service.sh                        # List all services"
    echo "  ./restart-service.sh volttron               # Restart volttron"
    echo "  ./restart-service.sh historian server       # Restart two services"
    echo "  ./restart-service.sh volttron --dry-run     # Preview"
    echo ""
    echo "Note: Restart is non-destructive - no data is lost. To wipe persistent"
    echo "volumes and reinitialize a service, use reset-service.sh instead."
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
SERVICE_NAMES=()
DRY_RUN=false

for arg in "$@"; do
    case $arg in
        -n|--dry-run)
            DRY_RUN=true
            ;;
        -h|--help)
            show_help
            ;;
        -*)
            echo -e "\033[1;31mError: Unknown option: $arg\033[0m"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
        *)
            SERVICE_NAMES+=("$arg")
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

# Function to list all services (restart is non-destructive; volume classification is not needed)
list_services() {
    print_blue "Available services (restart is non-destructive):"
    echo ""

    local all_services
    all_services=$(docker compose config --services 2>/dev/null)

    while IFS= read -r svc; do
        if [[ -n "$svc" ]]; then
            echo "  - $svc"
        fi
    done <<< "$all_services"

    echo ""
    print_cyan "To restart a service, run:"
    echo "  ./restart-service.sh <service-name> [options]"
    echo ""
    echo "Options:"
    echo "  -n, --dry-run  Preview changes without applying them"
    echo "  -h, --help     Show detailed help message"
    echo ""
    echo "Example:"
    echo "  ./restart-service.sh volttron"

    exit 0
}

# Check if service names were provided - if not, list services
if [[ ${#SERVICE_NAMES[@]} -eq 0 ]]; then
    list_services
fi

# Error handling function
on_failure() {
    print_red "Restart failed with error in $(pwd)"
    cd "$STARTING_PATH"
    print_cyan "Restored starting directory: $STARTING_PATH"
    exit 1
}

# Set up error handling
set -e
trap on_failure ERR

print_blue "Docker Compose Restart for service(s): ${SERVICE_NAMES[*]}"
if [[ "$DRY_RUN" == "true" ]]; then
    print_yellow "[DRY RUN MODE - No changes will be made]"
fi

# Verify all services exist
print_cyan "Verifying services exist..."
ALL_SERVICES=$(docker compose config --services 2>/dev/null)
for SERVICE_NAME in "${SERVICE_NAMES[@]}"; do
    if ! echo "$ALL_SERVICES" | grep -q "^${SERVICE_NAME}$"; then
        print_red "Error: Service '$SERVICE_NAME' not found in docker-compose.yml"
        exit 1
    fi
done
print_green "All services found"

# Restart each service
for SERVICE_NAME in "${SERVICE_NAMES[@]}"; do
    if [[ "$DRY_RUN" == "true" ]]; then
        print_blue "[DRY RUN] Would restart: $SERVICE_NAME"
    else
        print_blue "Restarting service: $SERVICE_NAME"
        docker compose restart "$SERVICE_NAME"
        print_green "Restarted: $SERVICE_NAME"
    fi
done

# Show final status for restarted services
if [[ "$DRY_RUN" != "true" ]]; then
    echo ""
    print_cyan "Current status:"
    docker compose ps --format "table {{.Name}}\t{{.Status}}" "${SERVICE_NAMES[@]}"
fi

if [[ "$DRY_RUN" == "true" ]]; then
    print_green "Dry run completed - no changes were made"
else
    print_green "Restart completed successfully for service(s): ${SERVICE_NAMES[*]}"
fi

# Clear the error trap since we completed successfully
trap - ERR
