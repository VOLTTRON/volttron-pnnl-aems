#!/bin/bash

# Keycloak initialization script to configure client secrets and redirect URIs
# This script runs after Keycloak starts and configures OAuth clients

set -e

echo "Starting Keycloak client configuration..."

# Check for default/placeholder secrets and warn
if [ "$KEYCLOAK_CLIENT_SECRET" = "SeT_tHiS_iN_0x3A-.env.secrets-" ]; then
    echo "⚠️  WARNING: KEYCLOAK_CLIENT_SECRET is using the default placeholder value!"
    echo "⚠️  This is INSECURE for production environments."
    echo "⚠️  Please generate proper secrets for production use."
fi

if [ "$KEYCLOAK_GRAFANA_CLIENT_SECRET" = "SeT_tHiS_iN_0x3A-.env.secrets-" ]; then
    echo "⚠️  WARNING: KEYCLOAK_GRAFANA_CLIENT_SECRET is using the default placeholder value!"
    echo "⚠️  This is INSECURE for production environments."
    echo "⚠️  Please generate proper secrets for production use."
fi

# Keycloak should already be ready (called from entrypoint after startup)
echo "Verifying Keycloak is accessible..."
if ! curl -f -s http://localhost:8080/health/ready > /dev/null 2>&1; then
    echo "Warning: Keycloak health check failed, but proceeding anyway..."
fi

echo "Authenticating with Keycloak admin..."
# Authenticate with admin credentials - try both URL formats
if ! /opt/keycloak/bin/kcadm.sh config credentials \
    --server http://localhost:8080 \
    --realm master \
    --user "${KEYCLOAK_ADMIN}" \
    --password "${KEYCLOAK_ADMIN_PASSWORD}" 2>/dev/null; then
    
    echo "First authentication attempt failed, trying alternate server URL..."
    if ! /opt/keycloak/bin/kcadm.sh config credentials \
        --server http://localhost:8080/auth/sso \
        --realm master \
        --user "${KEYCLOAK_ADMIN}" \
        --password "${KEYCLOAK_ADMIN_PASSWORD}"; then
        echo "ERROR: Failed to authenticate with Keycloak admin API"
        echo "Please check admin credentials and Keycloak startup logs"
        exit 1
    fi
fi

echo "Authentication successful!"

# Find the app client ID dynamically
echo "Finding app client ID..."
CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh get clients -r default --fields id,clientId | grep -B1 '"clientId" : "app"' | grep '"id"' | sed 's/.*"id" : "\([^"]*\)".*/\1/')

if [ -z "$CLIENT_ID" ]; then
    echo "Could not find app client ID, trying fallback method..."
    CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh get clients -r default -q clientId=app --fields id | sed -n 's/.*"id" : "\([^"]*\)".*/\1/p' | head -1)
fi

if [ -n "$CLIENT_ID" ]; then
    echo "Found app client ID: $CLIENT_ID"
    echo "Updating app client secret and redirect URIs..."
    /opt/keycloak/bin/kcadm.sh update clients/$CLIENT_ID \
        -r default \
        -s secret="${KEYCLOAK_CLIENT_SECRET}" \
        -s 'redirectUris=["/*"]' \
        -s 'webOrigins=["*"]'
    echo "App client secret and redirect URIs updated successfully!"
else
    echo "Error: Could not find app client ID"
    exit 1
fi

# Configure Grafana OAuth client
echo "Finding grafana-oauth client ID..."
GRAFANA_CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh get clients -r default --fields id,clientId | grep -B1 '"clientId" : "grafana-oauth"' | grep '"id"' | sed 's/.*"id" : "\([^"]*\)".*/\1/')

if [ -z "$GRAFANA_CLIENT_ID" ]; then
    echo "Could not find grafana-oauth client ID, trying fallback method..."
    GRAFANA_CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh get clients -r default -q clientId=grafana-oauth --fields id | sed -n 's/.*"id" : "\([^"]*\)".*/\1/p' | head -1)
fi

if [ -n "$GRAFANA_CLIENT_ID" ]; then
    echo "Found grafana-oauth client ID: $GRAFANA_CLIENT_ID"
    echo "Updating grafana-oauth client secret and redirect URIs..."
    # Use KC_HOSTNAME if available, otherwise fall back to HOSTNAME
    ACTUAL_HOSTNAME="${KC_HOSTNAME:-${HOSTNAME}}"
    echo "Using hostname: $ACTUAL_HOSTNAME"
    /opt/keycloak/bin/kcadm.sh update clients/$GRAFANA_CLIENT_ID \
        -r default \
        -s secret="${KEYCLOAK_GRAFANA_CLIENT_SECRET}" \
        -s 'redirectUris=["https://'"${ACTUAL_HOSTNAME}"'/grafana/login/generic_oauth"]' \
        -s 'webOrigins=["https://'"${ACTUAL_HOSTNAME}"'"]' \
        -s 'attributes."post.logout.redirect.uris"=https://'"${ACTUAL_HOSTNAME}"'/grafana'
    echo "Grafana OAuth client secret and redirect URIs updated successfully!"
else
    echo "Warning: Could not find grafana-oauth client ID"
fi
