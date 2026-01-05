#!/bin/bash

# This script resets a Docker Compose service by stopping it, deleting its persistent volumes, and restarting it.
# It dynamically discovers volumes associated with the specified service and handles dependencies automatically.

# Display help if -h or --help is present in arguments or no service is specified
show_help() {
    echo -e "\033[1;33mUsage: reset-service.sh [service-name] [-f|--force] [-n|--dry-run] [-h|--help]\033[0m"
    echo ""
    echo "Reset a Docker Compose service by deleting its persistent volumes."
    echo ""
    echo "Arguments:"
    echo "  service-name           Name of the service to reset (optional - lists services if omitted)"
    echo ""
    echo "Options:"
    echo "  -f, --force           Skip confirmation prompt"
    echo "  -n, --dry-run         Show what would be done without actually doing it"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./reset-service.sh                       # List all services with volumes"
    echo "  ./reset-service.sh database              # Reset the database service"
    echo "  ./reset-service.sh grafana --force       # Reset grafana without confirmation"
    echo "  ./reset-service.sh keycloak-db --dry-run # Preview what would be reset"
    echo ""
    echo "Warning: This will permanently delete all data in the service's volumes!"
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
SERVICE_NAME=""
FORCE=false
DRY_RUN=false

for arg in "$@"; do
    case $arg in
        -f|--force)
            FORCE=true
            ;;
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
            if [[ -z "$SERVICE_NAME" ]]; then
                SERVICE_NAME="$arg"
            else
                echo -e "\033[1;31mError: Multiple service names specified\033[0m"
                echo "Use -h or --help for usage information"
                exit 1
            fi
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

# Function to list all services with volumes
list_services() {
    print_blue "Available services in docker-compose.yml:"
    echo ""
    
    # Get all services and their volumes
    local services_with_volumes=()
    local services_without_volumes=()
    
    # Get list of all services
    local all_services=$(docker compose config --services 2>/dev/null)
    
    # Check each service for volumes
    while IFS= read -r svc; do
        if [[ -n "$svc" ]]; then
            local volumes=$(docker compose config --format json 2>/dev/null | \
                python3 -c "
import sys, json
data = json.load(sys.stdin)
service = data.get('services', {}).get('$svc', {})
volumes = service.get('volumes', [])
volume_names = []
for vol in volumes:
    if isinstance(vol, dict):
        source = vol.get('source', '')
    else:
        parts = vol.split(':')
        source = parts[0] if len(parts) > 0 else ''
    if source and not source.startswith('.') and not source.startswith('/'):
        volume_names.append(source)
print('\n'.join(volume_names))
" 2>/dev/null || echo "")
            
            if [[ -n "$volumes" ]]; then
                services_with_volumes+=("$svc:$volumes")
            else
                services_without_volumes+=("$svc")
            fi
        fi
    done <<< "$all_services"
    
    # Display services with volumes
    print_green "Services with persistent volumes:"
    echo ""
    for entry in "${services_with_volumes[@]}"; do
        local svc="${entry%%:*}"
        local vols="${entry#*:}"
        echo "  $svc"
        echo "$vols" | while IFS= read -r vol; do
            if [[ -n "$vol" ]]; then
                echo "    - $vol"
            fi
        done
        echo ""
    done
    
    # Display services without volumes
    if [[ ${#services_without_volumes[@]} -gt 0 ]]; then
        print_yellow "Services without persistent volumes:"
        for svc in "${services_without_volumes[@]}"; do
            echo "  - $svc"
        done
    fi
    
    # Display usage instructions
    echo ""
    print_cyan "To reset a service, run:"
    echo "  ./reset-service.sh <service-name> [options]"
    echo ""
    echo "Options:"
    echo "  -f, --force    Skip confirmation prompt"
    echo "  -n, --dry-run  Preview changes without applying them"
    echo "  -h, --help     Show detailed help message"
    echo ""
    echo "Example:"
    echo "  ./reset-service.sh database -n"
    
    exit 0
}

# Check if service name was provided - if not, list services
if [[ -z "$SERVICE_NAME" ]]; then
    list_services
fi

# Error handling function
on_failure() {
    print_red "Reset failed with error in $(pwd)"
    cd "$STARTING_PATH"
    print_cyan "Restored starting directory: $STARTING_PATH"
    exit 1
}

# Set up error handling
set -e
trap on_failure ERR

print_blue "Docker Compose Volume Reset for service: $SERVICE_NAME"
if [[ "$DRY_RUN" == "true" ]]; then
    print_yellow "[DRY RUN MODE - No changes will be made]"
fi

# Verify the service exists
print_cyan "Verifying service exists..."
if ! docker compose config --services 2>/dev/null | grep -q "^${SERVICE_NAME}$"; then
    print_red "Error: Service '$SERVICE_NAME' not found in docker-compose.yml"
    exit 1
fi
print_green "Service '$SERVICE_NAME' found"

# Get the list of volumes used by this service
print_cyan "Discovering volumes for service '$SERVICE_NAME'..."
VOLUMES=$(docker compose config --format json 2>/dev/null | \
    python3 -c "
import sys, json
data = json.load(sys.stdin)
service = data.get('services', {}).get('$SERVICE_NAME', {})
volumes = service.get('volumes', [])
volume_names = []
for vol in volumes:
    if isinstance(vol, dict):
        source = vol.get('source', '')
    else:
        # Handle short syntax: 'source:target' or 'source:target:mode'
        parts = vol.split(':')
        source = parts[0] if len(parts) > 0 else ''
    # Only include named volumes (not bind mounts with paths)
    if source and not source.startswith('.') and not source.startswith('/'):
        volume_names.append(source)
print('\n'.join(volume_names))
" 2>/dev/null || echo "")

# Check if any volumes were found
if [[ -z "$VOLUMES" ]]; then
    print_yellow "No persistent volumes found for service '$SERVICE_NAME'"
    print_yellow "This service may only use bind mounts or no volumes at all"
    exit 0
fi

# Display volumes that will be deleted
print_blue "The following volumes will be deleted:"
echo "$VOLUMES" | while read -r vol; do
    if [[ -n "$vol" ]]; then
        echo "  - $vol"
    fi
done

# Get dependent services
print_cyan "Checking for dependent services..."
DEPENDENT_SERVICES=$(docker compose config --format json 2>/dev/null | \
    python3 -c "
import sys, json
data = json.load(sys.stdin)
services = data.get('services', {})
target = '$SERVICE_NAME'
dependents = []
for name, config in services.items():
    depends_on = config.get('depends_on', {})
    if isinstance(depends_on, dict):
        if target in depends_on:
            dependents.append(name)
    elif isinstance(depends_on, list):
        if target in depends_on:
            dependents.append(name)
print('\n'.join(dependents))
" 2>/dev/null || echo "")

if [[ -n "$DEPENDENT_SERVICES" && "$DEPENDENT_SERVICES" != "" ]]; then
    print_yellow "Warning: The following services depend on '$SERVICE_NAME' and will be stopped:"
    echo "$DEPENDENT_SERVICES" | while read -r svc; do
        if [[ -n "$svc" ]]; then
            echo "  - $svc"
        fi
    done
fi

# Confirmation prompt (unless --force or --dry-run)
if [[ "$FORCE" != "true" && "$DRY_RUN" != "true" ]]; then
    echo ""
    print_yellow "WARNING: This will permanently delete all data in these volumes!"
    read -p "Are you sure you want to continue? (yes/no): " confirmation
    if [[ "$confirmation" != "yes" ]]; then
        print_yellow "Reset cancelled by user"
        exit 0
    fi
fi

# Stop the service and its dependents
if [[ "$DRY_RUN" == "true" ]]; then
    print_blue "[DRY RUN] Would stop service: $SERVICE_NAME"
    print_blue "[DRY RUN] Would remove container: $SERVICE_NAME"
    if [[ -n "$DEPENDENT_SERVICES" && "$DEPENDENT_SERVICES" != "" ]]; then
        echo "$DEPENDENT_SERVICES" | while read -r svc; do
            if [[ -n "$svc" ]]; then
                print_blue "[DRY RUN] Would stop dependent service: $svc"
                print_blue "[DRY RUN] Would remove container: $svc"
            fi
        done
    fi
else
    print_blue "Stopping service: $SERVICE_NAME"
    docker compose stop "$SERVICE_NAME"
    print_blue "Removing container: $SERVICE_NAME"
    docker compose rm -f "$SERVICE_NAME"
    
    if [[ -n "$DEPENDENT_SERVICES" && "$DEPENDENT_SERVICES" != "" ]]; then
        echo "$DEPENDENT_SERVICES" | while read -r svc; do
            if [[ -n "$svc" ]]; then
                print_blue "Stopping dependent service: $svc"
                docker compose stop "$svc" 2>/dev/null || true
                print_blue "Removing container: $svc"
                docker compose rm -f "$svc" 2>/dev/null || true
            fi
        done
    fi
fi

# Get the Docker Compose project name
PROJECT_NAME=$(docker compose config --format json 2>/dev/null | python3 -c "import sys, json; print(json.load(sys.stdin).get('name', 'docker'))" 2>/dev/null || echo "docker")
print_cyan "Using Docker Compose project name: $PROJECT_NAME"

# Remove the volumes
echo "$VOLUMES" | while read -r vol; do
    if [[ -n "$vol" ]]; then
        FULL_VOLUME_NAME="${PROJECT_NAME}_${vol}"
        if [[ "$DRY_RUN" == "true" ]]; then
            print_blue "[DRY RUN] Would remove volume: $FULL_VOLUME_NAME"
        else
            print_blue "Removing volume: $FULL_VOLUME_NAME"
            if docker volume inspect "$FULL_VOLUME_NAME" >/dev/null 2>&1; then
                docker volume rm "$FULL_VOLUME_NAME"
                print_green "Volume removed: $FULL_VOLUME_NAME"
            else
                print_yellow "Volume not found: $FULL_VOLUME_NAME"
                print_yellow "Attempting to find volume with different naming..."
                # Try to find the actual volume name
                ACTUAL_VOLUME=$(docker volume ls --format "{{.Name}}" | grep -E ".*[_-]${vol}$" | head -n 1)
                if [[ -n "$ACTUAL_VOLUME" ]]; then
                    print_cyan "Found volume: $ACTUAL_VOLUME"
                    docker volume rm "$ACTUAL_VOLUME"
                    print_green "Volume removed: $ACTUAL_VOLUME"
                else
                    print_yellow "Could not find volume matching: $vol"
                fi
            fi
        fi
    fi
done

# Restart the service
if [[ "$DRY_RUN" == "true" ]]; then
    print_blue "[DRY RUN] Would restart service: $SERVICE_NAME"
    if [[ -n "$DEPENDENT_SERVICES" && "$DEPENDENT_SERVICES" != "" ]]; then
        echo "$DEPENDENT_SERVICES" | while read -r svc; do
            if [[ -n "$svc" ]]; then
                print_blue "[DRY RUN] Would restart dependent service: $svc"
            fi
        done
    fi
else
    print_blue "Restarting service: $SERVICE_NAME"
    docker compose up -d "$SERVICE_NAME"
    print_green "Service restarted successfully"
    
    # Restart dependent services that were stopped
    if [[ -n "$DEPENDENT_SERVICES" && "$DEPENDENT_SERVICES" != "" ]]; then
        echo "$DEPENDENT_SERVICES" | while read -r svc; do
            if [[ -n "$svc" ]]; then
                print_blue "Restarting dependent service: $svc"
                docker compose up -d "$svc" 2>/dev/null || print_yellow "Failed to restart $svc"
            fi
        done
        print_green "Dependent services restarted"
    fi
fi

if [[ "$DRY_RUN" == "true" ]]; then
    print_green "Dry run completed - no changes were made"
else
    print_green "Volume reset completed successfully for service: $SERVICE_NAME"
fi

# Clear the error trap since we completed successfully
trap - ERR
