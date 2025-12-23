#!/bin/bash

# Combined entrypoint that starts Keycloak and configures client secret
set -e

echo "Starting Keycloak with client secret configuration..."

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

# Additional wait to ensure admin interface is fully ready
echo "Waiting for admin interface to be ready..."
sleep 15

# Configure client secret if KEYCLOAK_CLIENT_SECRET is set
if [ -n "$KEYCLOAK_CLIENT_SECRET" ] && [ "$KEYCLOAK_CLIENT_SECRET" != "SeT_tHiS_iN_0x3A-.env.secrets-" ]; then
    echo "Configuring app client secret..."
    
    # Authenticate with admin credentials
    echo "Authenticating with Keycloak admin..."
    echo "Admin user: ${KEYCLOAK_ADMIN}"
    echo "Using server: http://localhost:8080/auth/sso"
    
    # Try authentication with error handling  
    if ! /opt/keycloak/bin/kcadm.sh config credentials \
        --server http://localhost:8080/auth/sso \
        --realm master \
        --user "${KEYCLOAK_ADMIN}" \
        --password "${KEYCLOAK_ADMIN_PASSWORD}"; then
        echo "Authentication failed."
        echo "This might be because:"
        echo "1. Admin credentials are not set correctly"
        echo "2. Keycloak admin API is not ready yet"
        echo "3. The admin path has changed"
        echo "Admin user: '${KEYCLOAK_ADMIN}'"
        echo "Admin password length: ${#KEYCLOAK_ADMIN_PASSWORD}"
        
        echo "Exiting due to authentication failure"
        exit 1
    fi
    
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
    echo "KEYCLOAK_CLIENT_SECRET not set or is default value, skipping client secret update"
fi

# Wait for Keycloak process to exit and show logs
echo "Keycloak configuration complete. Server is running..."
# Tail the log file to show output and wait for the process
tail -f /tmp/keycloak.log &
wait $KEYCLOAK_PID