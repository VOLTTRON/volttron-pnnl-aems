#!/bin/bash

# This script performs code analysis and testing for all modules in the monorepo, including Prisma, Common, Server, and Client.
# It runs linting, type checking, and test coverage for each module in sequence.

# Display help if -h or --help is present in arguments
for arg in "$@"; do
    if [[ "$arg" == "-h" || "$arg" == "--help" ]]; then
        echo -e "\033[1;33mUsage: test.sh [--skip-coverage] [-h|--help]\033[0m"
        echo "This script performs code analysis and testing for all modules in the monorepo."
        echo "Environment Variables:"
        echo "  SKIP_COVERAGE=true   Skip running tests with coverage (run tests without coverage)."
        echo "  NODE_OPTIONS         Node.js options (automatically set to increase memory limit)"
        echo "Options:"
        echo "  --skip-coverage      Skip running tests with coverage (run tests without coverage)."
        echo "  -h, --help           Show this help message."
        echo ""
        echo "The script will run the following for each module (prisma, common, server, client):"
        echo "  - yarn lint          Run ESLint to check code quality"
        echo "  - yarn check         Run TypeScript type checking"
        echo "  - yarn test:cov      Run tests with coverage reporting (or yarn test if --skip-coverage)"
        exit 0
    fi
done

# Store the starting path
STARTING_PATH=$(pwd)

# Set NODE_OPTIONS for increased memory allocation
export NODE_OPTIONS="$NODE_OPTIONS --max-old-space-size=8192"

# Determine if coverage should be skipped
SKIP_COVERAGE=false
for arg in "$@"; do
    if [[ "$arg" == "--skip-coverage" ]]; then
        SKIP_COVERAGE=true
        break
    fi
done

# Check environment variable as well
if [[ "$SKIP_COVERAGE" == "true" ]]; then
    SKIP_COVERAGE=true
fi

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
    print_red "Code analysis and testing failed with error in $(pwd)"
    print_yellow "Did you forget to run 'build.sh'?"
    cd "$STARTING_PATH"
    print_cyan "Restored to starting directory: $STARTING_PATH"
    exit 1
}

# Set up error handling
set -e
trap on_failure ERR

print_blue "Performing code analysis and testing for all modules in the monorepo..."

# Analyze and test Prisma
print_blue "Prisma: Starting analysis and testing..."
cd ./prisma
print_cyan "Prisma: Running linter..."
yarn lint
print_cyan "Prisma: Running type checks..."
yarn check
if [[ "$SKIP_COVERAGE" == "true" ]]; then
    print_cyan "Prisma: Running tests (without coverage)..."
    yarn test
else
    print_cyan "Prisma: Running tests with coverage..."
    yarn test:cov
fi
print_green "Prisma: Analysis and testing completed successfully!"

# Analyze and test Common
print_blue "Common: Starting analysis and testing..."
cd ../common
print_cyan "Common: Running linter..."
yarn lint
print_cyan "Common: Running type checks..."
yarn check
if [[ "$SKIP_COVERAGE" == "true" ]]; then
    print_cyan "Common: Running tests (without coverage)..."
    yarn test
else
    print_cyan "Common: Running tests with coverage..."
    yarn test:cov
fi
print_green "Common: Analysis and testing completed successfully!"

# Analyze and test Server
print_blue "Server: Starting analysis and testing..."
cd ../server
print_cyan "Server: Running linter..."
yarn lint
print_cyan "Server: Running type checks..."
yarn check
if [[ "$SKIP_COVERAGE" == "true" ]]; then
    print_cyan "Server: Running tests (without coverage)..."
    yarn test
else
    print_cyan "Server: Running tests with coverage..."
    yarn test:cov
fi
print_green "Server: Analysis and testing completed successfully!"

# Analyze and test Client
print_blue "Client: Starting analysis and testing..."
cd ../client
print_cyan "Client: Running linter..."
yarn lint
print_cyan "Client: Running type checks..."
yarn check
if [[ "$SKIP_COVERAGE" == "true" ]]; then
    print_cyan "Client: Running tests (without coverage)..."
    yarn test
else
    print_cyan "Client: Running tests with coverage..."
    yarn test:cov
fi
print_green "Client: Analysis and testing completed successfully!"

print_green "All analysis and testing completed successfully!"

# Always restore the starting path
cd "$STARTING_PATH"
print_cyan "Restored to starting directory: $STARTING_PATH"

# Clear the error trap since we completed successfully
trap - ERR
