#!/bin/sh
set -e

echo "Setting up CA certificates for Node.js..."

# Create combined CA bundle
if [ -f "/certs/mkcert-ca.crt" ]; then
    echo "Found mkcert CA certificate, combining with system CAs..."
    cat /etc/ssl/certs/ca-certificates.crt /certs/mkcert-ca.crt > /tmp/combined-ca-bundle.crt
    export NODE_EXTRA_CA_CERTS=/tmp/combined-ca-bundle.crt
    echo "Using combined CA bundle: mkcert + system CAs"
else
    echo "No mkcert CA found, using system CAs (includes Let's Encrypt)..."
    export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
    echo "Using system CA bundle"
fi

echo "NODE_EXTRA_CA_CERTS set to: $NODE_EXTRA_CA_CERTS"
echo "Starting application..."

# Execute the main command
exec "$@"
