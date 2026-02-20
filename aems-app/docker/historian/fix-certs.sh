#!/bin/bash
# PostgreSQL requires strict permissions on SSL key file
# Copy certificates to a location where postgres user has access

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
fi
