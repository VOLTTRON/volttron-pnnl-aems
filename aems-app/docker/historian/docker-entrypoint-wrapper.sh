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

# ── Historian pg_shadow reconciler ─────────────────────────────────────────
# POSTGRES_PASSWORD is only read on initdb (empty PGDATA), so the role's
# password in the volume can drift from the env by any route: a rotation
# that went around secrets.sh, a restore, a hand edit. Every boot re-asserts
# the env value using postgres single-user mode, which bypasses auth
# entirely; this is the one way in that needs no password, and
# scripts/reconcile-historian-logins.sh restarts the container to use it.
TARGET_PW="${HISTORIAN_DATABASE_PASSWORD:-${POSTGRES_PASSWORD:-}}"

if [ -f "${PGDATA}/PG_VERSION" ] && [ -n "${TARGET_PW}" ]; then
    echo "Re-asserting the historian role's password via single-user mode..."
    escaped="$(printf '%s' "${TARGET_PW}" | sed "s/'/''/g")"
    gosu postgres postgres --single -D "${PGDATA}" "${POSTGRES_DB}" >/dev/null <<EOF
ALTER USER "${POSTGRES_USER}" WITH ENCRYPTED PASSWORD '${escaped}';
EOF
    echo "Historian role password re-asserted."
elif [ -f "${PGDATA}/PG_VERSION" ]; then
    echo "WARN: no historian password source resolved (checked HISTORIAN_DATABASE_PASSWORD, POSTGRES_PASSWORD) — skipping reconcile"
fi
unset TARGET_PW escaped

# Execute the original docker-entrypoint.sh with all arguments
exec /usr/local/bin/docker-entrypoint.sh "$@"
