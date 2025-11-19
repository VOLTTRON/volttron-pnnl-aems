#!/bin/bash

# Keycloak initialization script to set client secret from environment variable
# This script runs after Keycloak starts and configures the app client secret

set -e

echo "Starting Keycloak client configuration..."

# Wait for Keycloak to be ready
echo "Waiting for Keycloak to be ready..."
timeout=300
elapsed=0
interval=5

while [ $elapsed -lt $timeout ]; do
    # Try multiple endpoints to check if Keycloak is ready
    if curl -f -s http://localhost:8080/health/ready > /dev/null 2>&1 || \
       curl -f -s http://localhost:8080/auth/sso/realms/default/.well-known/openid_configuration > /dev/null 2>&1 || \
       curl -f -s http://localhost:8080/realms/default/.well-known/openid_configuration > /dev/null 2>&1; then
        echo "Keycloak is ready!"
        break
    fi
    echo "Keycloak not ready yet, waiting..."
    sleep $interval
    elapsed=$((elapsed + interval))
done

if [ $elapsed -ge $timeout ]; then
    echo "Timeout waiting for Keycloak to be ready"
    exit 1
fi

# Additional wait to ensure admin interface is ready
sleep 10

echo "Authenticating with Keycloak admin..."
# Authenticate with admin credentials
/opt/keycloak/bin/kcadm.sh config credentials \
    --server http://localhost:8080 \
    --realm master \
    --user "${KEYCLOAK_ADMIN}" \
    --password "${KEYCLOAK_ADMIN_PASSWORD}"

# Find the app client ID dynamically
echo "Finding app client ID..."
CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh get clients -r default --fields id,clientId | grep -B1 '"clientId" : "app"' | grep '"id"' | sed 's/.*"id" : "\([^"]*\)".*/\1/')

if [ -z "$CLIENT_ID" ]; then
    echo "Could not find app client ID, trying fallback method..."
    CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh get clients -r default -q clientId=app --fields id | sed -n 's/.*"id" : "\([^"]*\)".*/\1/p' | head -1)
fi

if [ -n "$CLIENT_ID" ]; then
    echo "Found app client ID: $CLIENT_ID"
    echo "Updating app client secret..."
    /opt/keycloak/bin/kcadm.sh update clients/$CLIENT_ID \
        -r default \
        -s secret="${KEYCLOAK_CLIENT_SECRET}"
    echo "Client secret updated successfully!"
else
    echo "Error: Could not find app client ID"
    exit 1
fi