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
    
    -- Note: historian user is already created without SUPERUSER privileges by PostgreSQL
    -- initialization, so no ALTER USER command is needed. Remote access is controlled
    -- via pg_hba.conf which restricts the historian user to Docker internal network only.

    -- Grant minimal required privileges to replicator
    GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO replicator;
    GRANT USAGE ON SCHEMA public TO replicator;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO replicator;
    
    -- Grant privileges for future tables created by ANY role
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO replicator;
    
    -- CRITICAL: Grant privileges for tables created by historian user (VOLTTRON creates tables at runtime)
    -- This ensures tables created after initialization automatically get replicated
    ALTER DEFAULT PRIVILEGES FOR ROLE ${POSTGRES_USER} IN SCHEMA public GRANT SELECT ON TABLES TO replicator;

    -- CRITICAL: Ensure data table has PRIMARY KEY for replication
    -- Without a primary key, logical replication cannot replicate UPDATE operations
    -- Check if data table exists and add primary key if missing
    DO \$\$
    BEGIN
        -- Check if data table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data') THEN
            -- Check if primary key already exists
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'data_pkey' AND contype = 'p'
            ) THEN
                -- Add primary key on (topic_id, ts)
                ALTER TABLE data ADD PRIMARY KEY (topic_id, ts);
                RAISE NOTICE 'Added PRIMARY KEY to data table for replication';
            END IF;
        END IF;
    END
    \$\$;

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
    
    -- Display replica identity settings for verification
    SELECT 
        c.relname AS table_name,
        CASE c.relreplident
            WHEN 'd' THEN 'DEFAULT (primary key)'
            WHEN 'n' THEN 'NOTHING'
            WHEN 'f' THEN 'FULL'
            WHEN 'i' THEN 'INDEX'
        END AS replica_identity
    FROM pg_class c
    WHERE c.relname IN ('data', 'topics')
    ORDER BY c.relname;
EOSQL

echo "================================================"
echo "Logical Replication Setup Complete!"
echo "================================================"
echo "Publication: historian_pub"
echo "Replication User: replicator"
echo "Status: Ready for subscriber connections"
echo "================================================"
