#!/bin/sh

# Install socat if not present
if ! command -v socat >/dev/null 2>&1; then
    apk add --no-cache socat
fi

# Start socat TCP proxy to VOLTTRON
# This creates a transparent TCP tunnel from port 8443 to VOLTTRON at 172.22.0.1:8443
exec socat TCP-LISTEN:8443,fork,reuseaddr SSL:172.22.0.1:8443,verify=0
