#!/bin/bash

# This script connects to the database docker container and modifies a single user's role.
# It takes two arguments: email and role. The role is trimmed, lowercased, and may contain spaces.

# Display help if -h or --help is present in arguments
for arg in "$@"; do
    if [[ "$arg" == "-h" || "$arg" == "--help" ]]; then
        echo -e "\033[1;33mUsage: update-user-role.sh <email> <role>\033[0m"
        echo "Arguments:"
        echo "  email              The email address of the user to update"
        echo "  role               The new role for the user (will be trimmed and lowercased)"
        echo "                     Use empty string \"\" to remove user's role"
        echo "Options:"
        echo "  -h, --help         Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./update-user-role.sh user@example.com admin"
        echo "  ./update-user-role.sh user@example.com \"project manager\""
        echo "  ./update-user-role.sh user@example.com \"\"  # Remove role"
        exit 0
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

# Check if correct number of arguments provided
if [ $# -ne 2 ]; then
    print_red "Error: Exactly 2 arguments required"
    print_yellow "Usage: update-user-role.sh <email> <role>"
    print_yellow "Use -h or --help for more information"
    exit 1
fi

# Get arguments
USER_EMAIL="$1"
USER_ROLE="$2"

# Validate email format (basic check)
if [[ ! "$USER_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    print_red "Error: Invalid email format: $USER_EMAIL"
    exit 1
fi

# Process role: trim whitespace and convert to lowercase
USER_ROLE=$(echo "$USER_ROLE" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr '[:upper:]' '[:lower:]')

# Note: Empty role is allowed (removes user's role)

print_blue "Updating user role in database..."
print_cyan "Email: $USER_EMAIL"
print_cyan "New Role: $USER_ROLE"

# Load environment variables from .env file
if [ -f ".env" ]; then
    # Extract specific variables we need
    COMPOSE_PROJECT_NAME=$(grep "^COMPOSE_PROJECT_NAME=" .env 2>/dev/null | cut -d'=' -f2 | tr -d '"' || echo "skeleton")
    DATABASE_NAME=$(grep "^DATABASE_NAME=" .env 2>/dev/null | cut -d'=' -f2 | tr -d '"' || echo "skeleton")
    DATABASE_USERNAME=$(grep "^DATABASE_USERNAME=" .env 2>/dev/null | cut -d'=' -f2 | tr -d '"' || echo "skeleton")
else
    # Set default values if .env file doesn't exist
    COMPOSE_PROJECT_NAME="skeleton"
    DATABASE_NAME="skeleton"
    DATABASE_USERNAME="skeleton"
fi

# Check if database container is running
CONTAINER_NAME="${COMPOSE_PROJECT_NAME}-database"
if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    print_red "Error: Database container '${CONTAINER_NAME}' is not running"
    print_yellow "Please start the database container first with: docker compose up -d database"
    exit 1
fi

# Error handling function
on_failure() {
    print_red "Failed to update user role"
    exit 1
}

# Set up error handling
set -e
trap on_failure ERR

# Execute the SQL update
print_cyan "Connecting to database container..."
RESULT=$(docker exec -i "$CONTAINER_NAME" psql -U "$DATABASE_USERNAME" -d "$DATABASE_NAME" -t -c "
WITH updated AS (UPDATE \"User\" SET role = '$USER_ROLE' WHERE email = '$USER_EMAIL' RETURNING 1) SELECT COUNT(*) FROM updated;
" 2>/dev/null | tr -d ' ')

# Check if user was found and updated
if [ "$RESULT" = "1" ]; then
    print_green "Successfully updated role for user: $USER_EMAIL"
    print_green "New role: $USER_ROLE"
elif [ "$RESULT" = "0" ]; then
    print_yellow "No user found with email: $USER_EMAIL"
    print_yellow "Please verify the email address is correct and the user exists in the database"
    print_yellow "No changes were made to the database"
    exit 0  # Exit successfully since this is not an error condition
else
    print_red "Unexpected result from database update"
    exit 1
fi

# Clear the error trap since we completed successfully
trap - ERR

print_green "Role update operation completed!"
