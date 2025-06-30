#!/bin/bash

# This script builds all modules in the monorepo, including Prisma, Common, Server, and Client.
# It handles cleaning up previous builds if requested, installs dependencies, and builds each module in sequence

# Display help if -h or --help is present in arguments
for arg in "$@"; do
    if [[ "$arg" == "-h" || "$arg" == "--help" ]]; then
        echo -e "\033[1;33mUsage: build.sh [--clean-build] [--skip-migrations] [-h|--help]\033[0m"
        echo "Environment Variables:"
        echo "  CLEAN_BUILD=true      Remove node_modules for each module before building."
        echo "  SKIP_MIGRATIONS=true  Skip applying Prisma migrations."
        echo "Options:"
        echo "  --clean-build      Remove node_modules for each module before building."
        echo "  --skip-migrations  Skip applying Prisma migrations."
        echo "  -h, --help         Show this help message."
        exit 0
    fi
done

# Store the starting path
STARTING_PATH=$(pwd)

# Determine if clean build is requested
CLEAN_BUILD="$CLEAN_BUILD"
for arg in "$@"; do
    if [[ "$arg" == "--clean-build" ]]; then
        CLEAN_BUILD=true
        break
    fi
done

# Skip prisma migrations if requested
SKIP_MIGRATIONS="$SKIP_MIGRATIONS"
for arg in "$@"; do
    if [[ "$arg" == "--skip-migrations" ]]; then
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

print_cyan "Prisma: Installing dependencies..."
yarn install

print_cyan "Prisma: Building module..."
yarn build

print_green "Prisma: Build completed successfully!"

# Applying Prisma Migrations
if [[ "$SKIP_MIGRATIONS" == "true" ]]; then
    print_yellow "Prisma: Skipping migrations as requested."
else
    print_blue "Prisma: Applying migrations..."
    if yarn migrate:deploy; then
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

print_cyan "Common: Installing dependencies..."
yarn install

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

print_cyan "Server: Installing dependencies..."
yarn install

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

print_cyan "Client: Installing dependencies..."
yarn install

print_cyan "Client: Building module..."
yarn build

print_green "Client: Build completed successfully!"

print_green "All builds completed successfully!"

# Always restore the starting path
cd "$STARTING_PATH"
print_cyan "Restored starting directory: $STARTING_PATH"

# Clear the error trap since we completed successfully
trap - ERR
