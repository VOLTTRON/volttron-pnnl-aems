#!/bin/bash

# Script to install the mkcert CA certificate into Grafana's trust store
set -e

echo "Installing CA certificate for Grafana..."

# Check if the CA certificate exists
if [ ! -f /etc/certs/mkcert-ca.crt ]; then
    echo "ERROR: CA certificate not found at /etc/certs/mkcert-ca.crt"
    exit 1
fi

# Install ca-certificates package if not present
if ! command -v update-ca-certificates &> /dev/null; then
    echo "Installing ca-certificates package..."
    apt-get update -qq
    apt-get install -y ca-certificates
fi

# Copy the CA certificate to the system trust store
echo "Copying CA certificate to system trust store..."
cp /etc/certs/mkcert-ca.crt /usr/local/share/ca-certificates/mkcert-ca.crt

# Update the CA certificate trust store
echo "Updating CA certificate trust store..."
update-ca-certificates

echo "CA certificate installed successfully!"
echo "Grafana will now trust HTTPS connections to Keycloak."
