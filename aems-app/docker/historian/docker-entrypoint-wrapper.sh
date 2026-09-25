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
# POSTGRES_PASSWORD is only read on initdb (empty PGDATA). If the env value
# is later mutated (e.g. `.env.secrets` rotation) without going through
# secrets.sh's ALTER ROLE flow, pg_shadow keeps the previous value and
# Volttron auth fails. Reconcile using postgres single-user mode, which
# bypasses auth entirely.
TARGET_PW="${HISTORIAN_DATABASE_PASSWORD:-${POSTGRES_PASSWORD:-}}"

PW_FP_FILE="${PGDATA}/.historian_pw_fp"
if [ -f "${PGDATA}/PG_VERSION" ] && [ -n "${TARGET_PW}" ]; then
    # Tagged `env:` so fingerprints written under the old
    # (secret/env-hist/env-postgres) tags trigger exactly one reconcile on
    # first boot after the docker-secrets removal.
    current_fp="env:$(printf '%s' "${TARGET_PW}" | sha256sum | awk '{print $1}')"
    stored_fp="$(cat "${PW_FP_FILE}" 2>/dev/null || true)"
    if [ "${current_fp}" != "${stored_fp}" ]; then
        echo "Historian password source changed — reconciling pg_shadow via single-user mode..."
        escaped="$(printf '%s' "${TARGET_PW}" | sed "s/'/''/g")"
        gosu postgres postgres --single -D "${PGDATA}" "${POSTGRES_DB}" <<EOF
ALTER USER "${POSTGRES_USER}" WITH ENCRYPTED PASSWORD '${escaped}';
EOF
        printf '%s\n' "${current_fp}" | gosu postgres tee "${PW_FP_FILE}" >/dev/null
        echo "Historian pg_shadow reconciled."
    fi
elif [ -f "${PGDATA}/PG_VERSION" ]; then
    echo "WARN: no historian password source resolved (checked HISTORIAN_DATABASE_PASSWORD, POSTGRES_PASSWORD) — skipping reconcile"
fi
unset TARGET_PW escaped

# Execute the original docker-entrypoint.sh with all arguments
exec /usr/local/bin/docker-entrypoint.sh "$@"
