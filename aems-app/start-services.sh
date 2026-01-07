#!/bin/bash

# This script builds and starts all Docker Compose services.
# It runs 'docker compose build' followed by 'docker compose up -d' to start services in detached mode.

# Display help if -h or --help is present in arguments
for arg in "$@"; do
    if [[ "$arg" == "-h" || "$arg" == "--help" ]]; then
        echo -e "\033[1;33mUsage: start-services.sh [-h|--help]\033[0m"
        echo ""
        echo "Build and start all Docker Compose services in detached mode."
        echo ""
        echo "This script performs the following actions:"
        echo "  1. Builds Docker images using 'docker compose build'"
        echo "  2. Starts services in detached mode using 'docker compose up -d'"
        echo ""
        echo "Options:"
        echo "  -h, --help            Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./start-services.sh              # Build and start all services"
        echo ""
        echo "Note: This script must be run from the aems-app directory."
        exit 0
    fi
done

# Store the starting path
STARTING_PATH=$(pwd)

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
    print_red "Failed to start services in $(pwd)"
    cd "$STARTING_PATH"
    print_cyan "Restored starting directory: $STARTING_PATH"
    exit 1
}

# Set up error handling
set -e
trap on_failure ERR

print_blue "Building and starting Docker Compose services..."

# Build Docker images
print_cyan "Building Docker images..."
if ! docker compose build; then
    print_red "Docker build failed"
    print_yellow "Possible causes:"
    print_yellow "  - Invalid docker-compose.yml syntax"
    print_yellow "  - Missing Dockerfile in service directory"
    print_yellow "  - Build context issues or missing files"
    print_yellow "  - Docker daemon not running"
    exit 1
fi

print_green "Docker images built successfully!"

# Start services in detached mode
print_cyan "Starting services in detached mode..."
if ! docker compose up -d; then
    print_red "Failed to start services"
    print_yellow "Possible causes:"
    print_yellow "  - Ports already in use by other services"
    print_yellow "  - Missing or invalid environment variables"
    print_yellow "  - Insufficient system resources"
    print_yellow "  - Volume mount issues or permission errors"
    exit 1
fi

print_green "Services started successfully!"
echo ""
print_green "All Docker Compose services are now running in detached mode."
print_cyan "Use 'docker compose ps' to view running services."
print_cyan "Use 'docker compose logs -f' to view logs."

# Always restore the starting path
cd "$STARTING_PATH"
print_cyan "Restored starting directory: $STARTING_PATH"

# Clear the error trap since we completed successfully
trap - ERR
