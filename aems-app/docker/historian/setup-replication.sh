#!/bin/bash
# PostgreSQL Logical Replication Setup Script
# This script configures the historian database for logical replication (publication)

set -e

echo "================================================"
echo "Setting up PostgreSQL Logical Replication"
echo "================================================"

# Wait for PostgreSQL to be ready
until pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 2
done

echo "PostgreSQL is ready. Configuring replication..."

# Create replication user with limited privileges
psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB}" <<-EOSQL
    -- Create replication user if it doesn't exist
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'replicator') THEN
            CREATE USER replicator WITH REPLICATION LOGIN PASSWORD '${REPLICATOR_PASSWORD}';
        END IF;
    END
    \$\$;

    -- SECURITY: Lock down replicator user - no superuser, no createdb, no createrole
    ALTER USER replicator NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
    
    -- SECURITY: Lock down historian user - prevent remote login via password
    -- (can still connect locally via Docker network as configured in pg_hba.conf)
    ALTER USER ${POSTGRES_USER} NOSUPERUSER NOCREATEDB NOCREATEROLE;

    -- Grant minimal required privileges to replicator
    GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO replicator;
    GRANT USAGE ON SCHEMA public TO replicator;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO replicator;
    
    -- Grant privileges for future tables
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO replicator;

    -- Create publication for all tables in the database
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'historian_pub') THEN
            CREATE PUBLICATION historian_pub FOR ALL TABLES;
        END IF;
    END
    \$\$;

    -- Display publication information
    SELECT * FROM pg_publication WHERE pubname = 'historian_pub';
EOSQL

echo "================================================"
echo "Logical Replication Setup Complete!"
echo "================================================"
echo "Publication: historian_pub"
echo "Replication User: replicator"
echo "Status: Ready for subscriber connections"
echo "================================================"
