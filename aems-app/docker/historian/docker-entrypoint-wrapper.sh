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
# POSTGRES_PASSWORD_FILE is only read on initdb (empty PGDATA). If the
# password source is later mutated by any path other than secrets.sh's
# ALTER ROLE flow (or the source is an env var that changes between
# deploys), pg_shadow keeps the previous value and Volttron auth fails.
# Reconcile using postgres single-user mode, which bypasses auth entirely.
#
# Source resolution matches repair-replication.sh so sites that keep their
# secret in .env (env-var path) work identically to sites that use the
# docker/secrets/*.txt mount.
TARGET_PW=""
SOURCE_TAG=""
if [ -s "/run/secrets/historian_database_password" ]; then
    TARGET_PW="$(cat /run/secrets/historian_database_password)"
    SOURCE_TAG="secret"
elif [ -n "${HISTORIAN_DATABASE_PASSWORD:-}" ]; then
    TARGET_PW="${HISTORIAN_DATABASE_PASSWORD}"
    SOURCE_TAG="env-hist"
elif [ -n "${POSTGRES_PASSWORD:-}" ]; then
    TARGET_PW="${POSTGRES_PASSWORD}"
    SOURCE_TAG="env-postgres"
fi

PW_FP_FILE="${PGDATA}/.historian_pw_fp"
if [ -f "${PGDATA}/PG_VERSION" ] && [ -n "${TARGET_PW}" ]; then
    # Fingerprint includes the source tag so a site migrating from env-var
    # mode to docker-secret mode (or vice versa) triggers a reconcile even
    # if the value is textually the same.
    current_fp="${SOURCE_TAG}:$(printf '%s' "${TARGET_PW}" | sha256sum | awk '{print $1}')"
    stored_fp="$(cat "${PW_FP_FILE}" 2>/dev/null || true)"
    if [ "${current_fp}" != "${stored_fp}" ]; then
        echo "Historian password source changed (${SOURCE_TAG}) — reconciling pg_shadow via single-user mode..."
        escaped="$(printf '%s' "${TARGET_PW}" | sed "s/'/''/g")"
        gosu postgres postgres --single -D "${PGDATA}" "${POSTGRES_DB}" <<EOF
ALTER USER "${POSTGRES_USER}" WITH ENCRYPTED PASSWORD '${escaped}';
EOF
        printf '%s\n' "${current_fp}" | gosu postgres tee "${PW_FP_FILE}" >/dev/null
        echo "Historian pg_shadow reconciled."
    fi
elif [ -f "${PGDATA}/PG_VERSION" ]; then
    echo "WARN: no historian password source resolved (checked /run/secrets/historian_database_password, HISTORIAN_DATABASE_PASSWORD, POSTGRES_PASSWORD) — skipping reconcile"
fi
unset TARGET_PW escaped

# Execute the original docker-entrypoint.sh with all arguments
exec /usr/local/bin/docker-entrypoint.sh "$@"
