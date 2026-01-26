#!/bin/bash
set -e

echo "=== Grafana Custom Entrypoint ==="

# Install CA certificate if it exists
if [ -f /etc/certs/mkcert-ca.crt ]; then
    echo "Installing CA certificate..."
    cp /etc/certs/mkcert-ca.crt /usr/local/share/ca-certificates/keycloak-ca.crt
    update-ca-certificates
    
    # Export SSL_CERT_FILE so Go's HTTP client trusts the certificate
    export SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
    
    echo "CA certificate installed successfully!"
else
    echo "Warning: CA certificate not found at /etc/certs/mkcert-ca.crt"
fi

echo "Starting Grafana..."
# Execute the original Grafana entrypoint
exec /run.sh "$@"
