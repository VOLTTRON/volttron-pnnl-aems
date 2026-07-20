#!/bin/bash

# Combined entrypoint that starts Keycloak and configures client secret
set -e

echo "Starting Keycloak with client secret configuration..."

# Read secrets BEFORE starting Keycloak so they're available during initialization
# Trim newlines/carriage returns from secrets to avoid authentication issues
if [ -s "/run/secrets/keycloak_admin_password" ]; then
    if [ ! -r "/run/secrets/keycloak_admin_password" ]; then
        echo "ERROR: /run/secrets/keycloak_admin_password exists but is not readable. Check container user and secret file ownership."
        exit 1
    fi
    export KEYCLOAK_ADMIN_PASSWORD=$(cat /run/secrets/keycloak_admin_password | tr -d '\n\r')
    export KC_BOOTSTRAP_ADMIN_PASSWORD=$(cat /run/secrets/keycloak_admin_password | tr -d '\n\r')
    echo "Using admin password from Docker secret"
fi

if [ -s "/run/secrets/keycloak_client_secret" ]; then
    if [ ! -r "/run/secrets/keycloak_client_secret" ]; then
        echo "ERROR: /run/secrets/keycloak_client_secret exists but is not readable. Check container user and secret file ownership."
        exit 1
    fi
    export KEYCLOAK_CLIENT_SECRET=$(cat /run/secrets/keycloak_client_secret | tr -d '\n\r')
    echo "Using client secret from Docker secret"
fi

if [ -s "/run/secrets/keycloak_database_password" ]; then
    if [ ! -r "/run/secrets/keycloak_database_password" ]; then
        echo "ERROR: /run/secrets/keycloak_database_password exists but is not readable. Check container user and secret file ownership."
        exit 1
    fi
    export KC_DB_PASSWORD=$(cat /run/secrets/keycloak_database_password | tr -d '\n\r')
    echo "Using database password from Docker secret"
fi

# Start Keycloak in the background and capture output (standalone mode)
echo "Starting Keycloak server in standalone mode..."
KC_CACHE=local /opt/keycloak/bin/kc.sh start --import-realm > /tmp/keycloak.log 2>&1 &
KEYCLOAK_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "Shutting down..."
    kill $KEYCLOAK_PID 2>/dev/null || true
    wait $KEYCLOAK_PID 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Wait for Keycloak to be ready by monitoring the log output
echo "Waiting for Keycloak to be ready..."
timeout=300
elapsed=0
interval=2

# Wait for the "started in" message which indicates Keycloak is fully ready
while [ $elapsed -lt $timeout ]; do
    if [ -f /tmp/keycloak.log ]; then
        # Look for the startup completion message
        if grep -q "Keycloak.*started in" /tmp/keycloak.log; then
            echo "Keycloak startup completed!"
            # Show the last few lines of the log
            tail -5 /tmp/keycloak.log
            break
        fi
        
        # Also check if there are any errors
        if grep -q "ERROR" /tmp/keycloak.log; then
            echo "Error detected in Keycloak startup:"
            tail -10 /tmp/keycloak.log
        fi
    fi
    
    echo "Waiting for Keycloak startup completion... (${elapsed}s/${timeout}s)"
    sleep $interval
    elapsed=$((elapsed + interval))
done

if [ $elapsed -ge $timeout ]; then
    echo "Timeout waiting for Keycloak to be ready"
    exit 1
fi

# Poll until kcadm can authenticate — this confirms the admin API is truly ready
echo "Waiting for admin interface to be ready..."
ready_timeout=120
ready_elapsed=0
until /opt/keycloak/bin/kcadm.sh config credentials \
    --server http://localhost:8080/auth/sso \
    --realm master \
    --user "${KEYCLOAK_ADMIN}" \
    --password "${KEYCLOAK_ADMIN_PASSWORD}" > /dev/null 2>&1; do
    if [ $ready_elapsed -ge $ready_timeout ]; then
        echo "Timeout waiting for Keycloak admin interface"
        exit 1
    fi
    sleep 5
    ready_elapsed=$((ready_elapsed + 5))
done
echo "Admin interface is ready."

# Configure client secret if KEYCLOAK_CLIENT_SECRET is set
if [ -n "$KEYCLOAK_CLIENT_SECRET" ] && [ "$KEYCLOAK_CLIENT_SECRET" != "SeT_tHiS_iN_0x3A-.env.secrets-" ]; then
    echo "Configuring app client secret..."

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
    else
        echo "Error: Could not find app client ID"
        exit 1
    fi
    
    echo "Client secret updated successfully!"
else
    echo "Warning: init-keycloak.sh not found, skipping client configuration"
fi

# Wait for Keycloak process to exit and show logs
echo "Keycloak configuration complete. Server is running..."
# Tail the log file to show output and wait for the process
tail -f /tmp/keycloak.log &
wait $KEYCLOAK_PID
