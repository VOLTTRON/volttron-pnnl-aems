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

# Run the init-keycloak script to configure clients
if [ -f /docker-entrypoint-scripts.d/init-keycloak.sh ]; then
    echo "Running Keycloak client configuration..."
    /bin/bash /docker-entrypoint-scripts.d/init-keycloak.sh
else
    echo "Warning: init-keycloak.sh not found, skipping client configuration"
fi

# Wait for Keycloak process to exit and show logs
echo "Keycloak configuration complete. Server is running..."
# Tail the log file to show output and wait for the process
tail -f /tmp/keycloak.log &
wait $KEYCLOAK_PID
