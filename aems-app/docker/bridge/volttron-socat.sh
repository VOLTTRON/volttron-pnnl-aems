#!/bin/sh

# Install socat if not present
if ! command -v socat >/dev/null 2>&1; then
    apk add --no-cache socat
fi

# Get VOLTTRON host address from environment variable or use Docker host gateway
VOLTTRON_HOST=${VOLTTRON_HOST:-host.docker.internal}
VOLTTRON_PORT=${VOLTTRON_PORT:-8443}

echo "Starting socat TCP proxy to VOLTTRON at ${VOLTTRON_HOST}:${VOLTTRON_PORT}"

# Start socat TCP proxy to VOLTTRON
# This creates a transparent TCP tunnel from port 8443 to VOLTTRON
exec socat TCP-LISTEN:8443,fork,reuseaddr SSL:${VOLTTRON_HOST}:${VOLTTRON_PORT},verify=0
