#!/bin/bash

# This script builds and starts all Docker Compose services.
# It runs 'docker compose build' followed by 'docker compose up -d' to start services in detached mode.

NO_BUILD=false

for arg in "$@"; do
    case "$arg" in
        -h|--help)
            echo -e "\033[1;33mUsage: start-services.sh [OPTIONS]\033[0m"
            echo ""
            echo "Build and start all Docker Compose services in detached mode."
            echo ""
            echo "This script performs the following actions:"
            echo "  1. Builds Docker images using 'docker compose build'"
            echo "  2. Starts services in detached mode using 'docker compose up -d'"
            echo ""
            echo "Options:"
            echo "  --no-build            Skip 'docker compose build' (use existing images)"
            echo "  -h, --help            Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./start-services.sh              # Build and start all services"
            echo "  ./start-services.sh --no-build   # Start without rebuilding images"
            echo ""
            echo "Note: This script must be run from the aems-app directory."
            exit 0
            ;;
        --no-build) NO_BUILD=true ;;
        *) echo -e "\033[1;31mUnknown option: $arg\033[0m"; echo "Use -h for help"; exit 1 ;;
    esac
done

# Store the starting path
STARTING_PATH=$(pwd)

# Anchor to this script's directory so relative paths (./check-env.sh,
# ./secrets.sh, ./scripts/...) resolve regardless of the caller's cwd.
# `docker compose` also picks up `.env` from cwd, so this ensures compose
# reads THIS project's env files, not whatever was next to the caller.
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$SCRIPT_DIR"

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

# Ensure .env is aligned with .env.secrets before check-env judges it and
# before compose reads it. secrets.sh syncs any changed values from
# .env.secrets into .env in place and rotates the live credentials if the
# stack is already up. Idempotent: no-op when .env already matches.
if [ -x ./secrets.sh ] && [ -f ".env.secrets" ]; then
    print_cyan "Syncing .env from .env.secrets..."
    if ! ./secrets.sh; then
        print_yellow "secrets.sh reported issues (see above); continuing."
    fi
fi

print_blue "Checking environment/secrets configuration..."

if ! ./check-env.sh; then
    print_red "Environment check failed — fix the issues above before starting services."
    exit 1
fi

print_blue "Building and starting Docker Compose services..."

# Build Docker images
if [ "$NO_BUILD" = false ]; then
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
else
    print_cyan "Skipping image build (--no-build)."
fi

# Start services in detached mode. Do NOT exit on failure here — if
# `init` (or another dependency) fails, the safety-net ./secrets.sh
# call below runs the pg_shadow probe and can recover pre-existing
# volume drift.
print_cyan "Starting services in detached mode..."
COMPOSE_EXIT=0
docker compose up -d || COMPOSE_EXIT=$?

if [ "$COMPOSE_EXIT" -ne 0 ]; then
    print_yellow "docker compose up -d exited $COMPOSE_EXIT — will attempt self-heal via secrets.sh..."
else
    print_green "Services started successfully!"
fi

# Temporarily disable the ERR trap around the safety-net so a
# secrets.sh non-zero exit doesn't jump into on_failure.
trap - ERR
set +e

# ── Safety net: reconcile pg_shadow / volttron install-time config ────────────
# Runs regardless of the compose exit code. Covers stateful-volume drift
# where env is correct but the persisted credential (postgres pg_shadow,
# volttron agent install-time config) is stale from a prior deploy.
if [ -x ./secrets.sh ]; then
    print_cyan "Reconciling stateful credentials..."
    ./secrets.sh
    SECRETS_EXIT=$?
    if [ "$SECRETS_EXIT" -ne 0 ]; then
        print_yellow "secrets.sh reported issues (see above)."
    fi
fi
# The historian role keeps its password in the volume, so a login is checked, and repaired, on
# every start. The SQLHistorian sync below logs in with it.
if [ -x ./scripts/reconcile-historian-logins.sh ]; then
    print_cyan "Checking historian logins..."
    ./scripts/reconcile-historian-logins.sh || \
        print_yellow "reconcile-historian-logins.sh reported issues."
fi
# The SQLHistorian agent keeps its install-time config across every recreate, so it is
# reconciled on every start, not only after a rotation.
if [ -x ./scripts/sync-volttron-historian-config.sh ]; then
    print_cyan "Reconciling SQLHistorian install-time config..."
    ./scripts/sync-volttron-historian-config.sh || \
        print_yellow "sync-volttron-historian-config.sh reported issues."
fi

# If compose up failed, re-verify: did the safety-net actually recover?
# secrets.sh's recreate of init runs `docker compose up -d --no-deps init`,
# which returns before init finishes running. Poll for it to exit 0 for
# up to 60s.
if [ "$COMPOSE_EXIT" -ne 0 ]; then
    print_cyan "Waiting up to 60s for init to complete post self-heal..."
    INIT_CONTAINER=$(docker compose ps -a -q init 2>/dev/null | head -1)
    HEALED=0
    for _ in $(seq 1 60); do
        if [ -n "$INIT_CONTAINER" ]; then
            INIT_STATE=$(docker inspect --format '{{.State.Status}}' "$INIT_CONTAINER" 2>/dev/null)
            INIT_EXIT=$(docker inspect --format '{{.State.ExitCode}}' "$INIT_CONTAINER" 2>/dev/null)
            if [ "$INIT_STATE" = "exited" ] && [ "$INIT_EXIT" = "0" ]; then
                HEALED=1
                break
            fi
        fi
        sleep 1
    done
    if [ "$HEALED" = 0 ]; then
        print_red "docker compose up exited $COMPOSE_EXIT and self-heal did not recover the stack."
        print_yellow "Possible causes:"
        print_yellow "  - Ports already in use by other services"
        print_yellow "  - Missing or invalid environment variables in .env.secrets"
        print_yellow "  - Insufficient system resources"
        print_yellow "  - Volume mount issues or permission errors"
        cd "$STARTING_PATH"
        exit 1
    fi
    print_green "Self-heal recovered the stack."
fi

echo ""
print_green "All Docker Compose services are now running in detached mode."
print_cyan "Use 'docker compose ps' to view running services."
print_cyan "Use 'docker compose logs -f' to view logs."

# Always restore the starting path
cd "$STARTING_PATH"
print_cyan "Restored starting directory: $STARTING_PATH"

# Clear the error trap since we completed successfully
trap - ERR
