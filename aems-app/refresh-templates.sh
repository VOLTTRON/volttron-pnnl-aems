#!/bin/bash

# This script refreshes the ILC configuration templates that aems-server
# reads for the Admin -> Templates preview and that aems-services pushes
# to the ILC agent on its 10s cron.
#
# Source of truth is aems-edge/configurations/templates/*.json. Those files
# are baked into the volttron-setup image at build time and copied into the
# shared ./docker/volttron/setup/templates/ directory when that container
# runs. After editing a template on the host, this script rebuilds the
# image and re-runs the setup container so both the image and the on-disk
# copy match what's in aems-edge/configurations/templates/.

# Display help if -h or --help is present in arguments
show_help() {
    echo -e "\033[1;33mUsage: refresh-templates.sh [-n|--dry-run] [-h|--help]\033[0m"
    echo ""
    echo "Refresh the ILC configuration templates the server and services read."
    echo ""
    echo "This script performs the following actions:"
    echo "  1. Rebuilds the 'volttron-setup' image so its baked-in templates"
    echo "     match the current contents of aems-edge/configurations/templates/."
    echo "  2. Recreates and re-runs the 'volttron-setup' container. That"
    echo "     container's setup-volttron.sh drops the fresh templates into"
    echo "     ./docker/volttron/setup/templates/, which the 'server' and"
    echo "     'services' containers read via a bind mount."
    echo ""
    echo "No other services are stopped. 'server' picks up the new files on"
    echo "the next 'previewControlTemplates' call; 'services' picks them up"
    echo "on the next 10s cron tick. The running 'volttron' platform does"
    echo "not read templates, so it is not restarted."
    echo ""
    echo "Options:"
    echo "  -n, --dry-run         Show what would be done without making changes"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./refresh-templates.sh              # Rebuild and refresh"
    echo "  ./refresh-templates.sh --dry-run    # Preview commands only"
    echo ""
    echo "Note: This script must be run from the aems-app directory."
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
            echo -e "\033[1;31mError: Unexpected argument: $arg\033[0m"
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
    print_red "Refresh failed with error in $(pwd)"
    cd "$STARTING_PATH"
    print_cyan "Restored starting directory: $STARTING_PATH"
    exit 1
}

# Set up error handling
set -e
trap on_failure ERR

SERVICE_NAME="volttron-setup"

print_blue "Refreshing ILC configuration templates via '$SERVICE_NAME'..."
if [[ "$DRY_RUN" == "true" ]]; then
    print_yellow "[DRY RUN MODE - No changes will be made]"
fi

# Verify volttron-setup exists in the compose config
print_cyan "Verifying '$SERVICE_NAME' service is defined..."
ALL_SERVICES=$(docker compose config --services 2>/dev/null)
if ! echo "$ALL_SERVICES" | grep -q "^${SERVICE_NAME}$"; then
    print_red "Error: Service '$SERVICE_NAME' not found in docker-compose.yml"
    print_yellow "Are you running this from the aems-app directory?"
    exit 1
fi
print_green "Service found"

# Rebuild the image so baked-in templates match the host
if [[ "$DRY_RUN" == "true" ]]; then
    print_blue "[DRY RUN] Would run: docker compose build $SERVICE_NAME"
else
    print_blue "Rebuilding '$SERVICE_NAME' image..."
    if ! docker compose build "$SERVICE_NAME"; then
        print_red "Failed to build '$SERVICE_NAME' image"
        exit 1
    fi
    print_green "Image rebuilt"
fi

# Recreate and re-run the setup container so setup-volttron.sh refreshes
# ./volttron/setup/templates/ from the newly rebuilt image.
if [[ "$DRY_RUN" == "true" ]]; then
    print_blue "[DRY RUN] Would run: docker compose up -d --no-deps --force-recreate $SERVICE_NAME"
else
    print_blue "Re-running '$SERVICE_NAME' to refresh templates..."
    if ! docker compose up -d --no-deps --force-recreate "$SERVICE_NAME"; then
        print_red "Failed to start '$SERVICE_NAME'"
        exit 1
    fi
fi

# Wait for the one-shot container to finish
if [[ "$DRY_RUN" != "true" ]]; then
    print_cyan "Waiting for '$SERVICE_NAME' to complete..."
    PROJECT_NAME=$(docker compose config --format json 2>/dev/null | python3 -c "import sys, json; print(json.load(sys.stdin).get('name', 'docker'))" 2>/dev/null || echo "docker")
    CONTAINER_NAME="${PROJECT_NAME}-${SERVICE_NAME}"

    # Poll for exit; setup should finish in seconds but allow up to 5 min
    ATTEMPTS=0
    MAX_ATTEMPTS=150
    while [[ $ATTEMPTS -lt $MAX_ATTEMPTS ]]; do
        STATE=$(docker inspect --format '{{.State.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "missing")
        if [[ "$STATE" == "exited" ]]; then
            break
        fi
        if [[ "$STATE" == "missing" ]]; then
            print_red "Container '$CONTAINER_NAME' disappeared before completing"
            exit 1
        fi
        sleep 2
        ATTEMPTS=$((ATTEMPTS + 1))
    done

    EXIT_CODE=$(docker inspect --format '{{.State.ExitCode}}' "$CONTAINER_NAME" 2>/dev/null || echo "1")
    if [[ "$EXIT_CODE" != "0" ]]; then
        print_red "'$SERVICE_NAME' exited with code $EXIT_CODE"
        print_yellow "Check logs with: docker compose logs $SERVICE_NAME"
        exit 1
    fi
    print_green "'$SERVICE_NAME' completed successfully"
fi

# List the refreshed templates so the admin can confirm
TEMPLATES_DIR="./docker/volttron/setup/templates"
if [[ "$DRY_RUN" == "true" ]]; then
    print_blue "[DRY RUN] Would list: $TEMPLATES_DIR"
else
    if [[ -d "$TEMPLATES_DIR" ]]; then
        print_cyan "Refreshed templates in $TEMPLATES_DIR:"
        ls -la "$TEMPLATES_DIR" | grep -E '\.json$' || print_yellow "  (no .json files found)"
    else
        print_yellow "Warning: $TEMPLATES_DIR not found on host"
    fi
fi

echo ""
if [[ "$DRY_RUN" == "true" ]]; then
    print_green "Dry run completed - no changes were made"
else
    print_green "Templates refreshed. The Admin -> Templates preview and the"
    print_green "ILC config cron will pick up the new files on their next read."
fi

# Always restore the starting path
cd "$STARTING_PATH"
print_cyan "Restored starting directory: $STARTING_PATH"

# Clear the error trap since we completed successfully
trap - ERR
