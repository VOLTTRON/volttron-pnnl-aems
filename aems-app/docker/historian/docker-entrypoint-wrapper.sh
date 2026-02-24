#!/bin/bash
# Wrapper script that sets up SSL certificates before starting PostgreSQL

echo "Setting up SSL certificates..."

# Copy certificates if they exist, otherwise create dummy certificates for initialization
if [ -f /etc/certs/mkcert-local.key ]; then
    echo "Copying SSL certificates and fixing permissions..."
    cp /etc/certs/mkcert-local.key /tmp/server.key
    cp /etc/certs/mkcert-local.crt /tmp/server.crt
    
    if [ -f /etc/certs/mkcert-ca.crt ]; then
        cp /etc/certs/mkcert-ca.crt /tmp/ca.crt
        chmod 644 /tmp/ca.crt
        chown postgres:postgres /tmp/ca.crt
    fi
    
    chmod 600 /tmp/server.key
    chmod 644 /tmp/server.crt
    chown postgres:postgres /tmp/server.key /tmp/server.crt
    
    echo "SSL certificates ready for PostgreSQL"
else
    echo "Warning: SSL certificates not found at /etc/certs/"
    echo "Creating temporary self-signed certificates for initialization..."
    
    # Create temporary self-signed certificate for initialization
    openssl req -new -x509 -days 365 -nodes -text \
        -out /tmp/server.crt \
        -keyout /tmp/server.key \
        -subj "/CN=postgres"
    
    chmod 600 /tmp/server.key
    chmod 644 /tmp/server.crt
    chown postgres:postgres /tmp/server.key /tmp/server.crt
    
    echo "Temporary certificates created"
fi

# Execute the original docker-entrypoint.sh with all arguments
exec /usr/local/bin/docker-entrypoint.sh "$@"
