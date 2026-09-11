#!/bin/bash

# This script builds all modules in the monorepo, including Prisma, Common, Server, and Client.
# It handles cleaning up previous builds if requested, installs dependencies, and builds each module in sequence

# Display help if -h or --help is present in arguments
for arg in "$@"; do
    if [[ "$arg" == "-h" || "$arg" == "--help" ]]; then
        echo -e "\033[1;33mUsage: build.sh [-c|--clean-build] [-d|--skip-dependencies] [-m|--skip-migrations] [-h|--help]\033[0m"
        echo "Environment Variables:"
        echo "  CLEAN_BUILD=true      Remove node_modules for each module before building."
        echo "  SKIP_DEPENDENCIES=true Skip installing dependencies for each module."
        echo "  SKIP_MIGRATIONS=true  Skip applying Prisma migrations."
        echo "Options:"
        echo "  -c, --clean-build      Remove node_modules for each module before building."
        echo "  -d, --skip-dependencies Skip installing dependencies for each module."
        echo "  -m, --skip-migrations  Skip applying Prisma migrations."
        echo "  -h, --help         Show this help message."
        exit 0
    fi
done

# Store the starting path
STARTING_PATH=$(pwd)

# Determine if clean build is requested
CLEAN_BUILD="$CLEAN_BUILD"
for arg in "$@"; do
    if [[ "$arg" == "-c" || "$arg" == "--clean-build" ]]; then
        CLEAN_BUILD=true
        break
    fi
done

# Determine if dependencies should be skipped
SKIP_DEPENDENCIES="$SKIP_DEPENDENCIES"
for arg in "$@"; do
    if [[ "$arg" == "-d" || "$arg" == "--skip-dependencies" ]]; then
        SKIP_DEPENDENCIES=true
        break
    fi
done

# Skip prisma migrations if requested
SKIP_MIGRATIONS="$SKIP_MIGRATIONS"
for arg in "$@"; do
    if [[ "$arg" == "-m" || "$arg" == "--skip-migrations" ]]; then
        SKIP_MIGRATIONS=true
        break
    fi
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
    print_red "Build failed with error in $(pwd)"
    cd "$STARTING_PATH"
    print_cyan "Restored starting directory: $STARTING_PATH"
    exit 1
}

# Remove portal: symlinks before `yarn install` in the current working directory.
# Yarn 4 fails with EEXIST when re-linking a portal dep whose symlink already
# exists (e.g. after a CI cache restore). Deleting them lets yarn recreate them
# cleanly. Safe to run when node_modules doesn't exist yet — the globs just no-op.
clean_portal_links() {
    if [[ -d "./node_modules/@local" ]]; then
        rm -rf ./node_modules/@local
    fi
    if [[ -L "./node_modules/@prisma/client" || -e "./node_modules/@prisma/client" ]]; then
        rm -rf ./node_modules/@prisma/client
    fi
}

# Refresh ./node_modules/.prisma/client from the prisma workspace's freshly
# generated copy. Node runs each downstream workspace with
# --preserve-symlinks (set via NODE_OPTIONS in that workspace's .env), which
# means `require('.prisma/client/default')` from the portalled @prisma/client
# entry resolves against THIS workspace's node_modules rather than following
# the portal back to prisma/. Without this refresh, a stale local copy shadows
# the freshly generated one and downstream code crashes on symbols added since
# it was last generated — e.g. `Object.values(BackupDestinationType)` throws
# "Cannot convert undefined or null to object" during schema compile.
sync_prisma_client() {
    local target="./node_modules/.prisma"
    local source="${STARTING_PATH}/prisma/node_modules/.prisma/client"
    if [[ -d "$source" ]]; then
        rm -rf "$target/client"
        mkdir -p "$target"
        cp -R "$source" "$target/client"
    fi
}

# Set up error handling
set -e
trap on_failure ERR

print_blue "Updating dependencies and building all modules in the monorepo..."

# Build Prisma
print_blue "Prisma: Starting build process..."
print_cyan "Prisma: Cleaning output directories..."
cd ./prisma

if [[ "$CLEAN_BUILD" == "true" && -d "./node_modules" ]]; then
    rm -rf ./node_modules
fi

if [[ -d "./dist" ]]; then
    rm -rf ./dist
fi

if [[ "$SKIP_DEPENDENCIES" != "true" ]]; then
    print_cyan "Prisma: Installing dependencies..."
    yarn install
fi

print_cyan "Prisma: Building module..."
yarn build

print_green "Prisma: Build completed successfully!"

# Applying Prisma Migrations
if [[ "$SKIP_MIGRATIONS" == "true" ]]; then
    print_yellow "Prisma: Skipping migrations as requested."
else
    print_blue "Prisma: Applying migrations..."
    # Prisma reads DATABASE_URL from process.env first and only falls back to
    # prisma/.env if that variable is unset. If the caller's shell has
    # DATABASE_URL set to anything else (a leftover from docker compose, a
    # previous script, or a system-wide env), prisma fails validation with
    # P1012 "URL must start with the protocol postgresql://" before ever
    # reading .env. Run migrate:deploy in a subshell with DATABASE_URL /
    # DIRECT_URL unset so it always reads the workspace .env authoritatively;
    # the caller's environment is untouched.
    if (unset DATABASE_URL DIRECT_URL && yarn migrate:deploy); then
        print_green "Prisma: Migrations applied successfully!"
    else
        print_yellow "Prisma: Migration failed, but continuing with build process..."
    fi
fi

# Build Common
print_blue "Common: Starting build process..."
print_cyan "Common: Cleaning output directories..."
cd ../common

if [[ "$CLEAN_BUILD" == "true" && -d "./node_modules" ]]; then
    rm -rf ./node_modules
fi

if [[ -d "./dist" ]]; then
    rm -rf ./dist
fi

if [[ "$SKIP_DEPENDENCIES" != "true" ]]; then
    print_cyan "Common: Installing dependencies..."
    clean_portal_links
    yarn install
fi

sync_prisma_client

print_cyan "Common: Building module..."
yarn build

print_green "Common: Build completed successfully!"

# Build Server
print_blue "Server: Starting build process..."
print_cyan "Server: Cleaning output directories..."
cd ../server

if [[ "$CLEAN_BUILD" == "true" && -d "./node_modules" ]]; then
    rm -rf ./node_modules
fi

if [[ -d "./dist" ]]; then
    rm -rf ./dist
fi

if [[ "$SKIP_DEPENDENCIES" != "true" ]]; then
    print_cyan "Server: Installing dependencies..."
    clean_portal_links
    yarn install
fi

sync_prisma_client

print_cyan "Server: Building module..."
yarn build

print_green "Server: Build completed successfully!"

# Build Client
print_blue "Client: Starting build process..."
print_cyan "Client: Cleaning output directories..."
cd ../client

if [[ "$CLEAN_BUILD" == "true" && -d "./node_modules" ]]; then
    rm -rf ./node_modules
fi

if [[ -d "./.next" ]]; then
    rm -rf ./.next
fi

if [[ "$SKIP_DEPENDENCIES" != "true" ]]; then
    print_cyan "Client: Installing dependencies..."
    clean_portal_links
    yarn install
fi

sync_prisma_client

print_cyan "Client: Building module..."
yarn build

print_green "Client: Build completed successfully!"

print_green "All builds completed successfully!"

# Always restore the starting path
cd "$STARTING_PATH"
print_cyan "Restored starting directory: $STARTING_PATH"

# Clear the error trap since we completed successfully
trap - ERR
