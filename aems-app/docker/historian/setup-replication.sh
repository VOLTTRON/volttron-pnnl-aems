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

    -- CRITICAL: Ensure topics table has PRIMARY KEY for replication
    -- Without a primary key, logical replication cannot replicate UPDATE operations
    -- Check if topics table exists and add primary key if missing
    DO \$\$
    BEGIN
        -- Check if topics table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'topics') THEN
            -- Check if primary key already exists
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'topics_pkey' AND contype = 'p'
            ) THEN
                -- Add primary key on topic_id
                ALTER TABLE topics ADD PRIMARY KEY (topic_id);
                RAISE NOTICE 'Added PRIMARY KEY to topics table for replication';
            END IF;
        END IF;
    END
    \$\$;

    -- CRITICAL: Auto-fix replica identity on tables created AFTER this init script.
    -- This init script runs once at first DB boot, BEFORE VOLTTRON's SQLHistorian
    -- creates the 'data' table at runtime. VOLTTRON creates 'data' with only a
    -- UNIQUE(topic_id, ts) constraint (no PRIMARY KEY), so with historian_pub
    -- (FOR ALL TABLES, publishes UPDATE) the historian's INSERT ... ON CONFLICT DO
    -- UPDATE upserts are rejected: "cannot update table ... does not have a replica
    -- identity and publishes updates". A DDL event trigger fixes any new table that
    -- lacks a PRIMARY KEY the moment it is created, with no ordering dependency.
    CREATE OR REPLACE FUNCTION aems_ensure_replica_identity()
    RETURNS event_trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS \$fn\$
    DECLARE
        obj record;
        idx_name text;
    BEGIN
        FOR obj IN
            SELECT * FROM pg_event_trigger_ddl_commands()
            WHERE command_tag = 'CREATE TABLE' AND object_type = 'table'
        LOOP
            -- Tables with a PRIMARY KEY already have a usable default replica identity.
            IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = obj.objid AND contype = 'p') THEN
                CONTINUE;
            END IF;

            -- Prefer a unique, non-partial, all-NOT-NULL index (efficient: logs only key cols).
            SELECT i.relname INTO idx_name
            FROM pg_index x
            JOIN pg_class i ON i.oid = x.indexrelid
            WHERE x.indrelid = obj.objid
              AND x.indisunique
              AND x.indpred IS NULL
              AND x.indexprs IS NULL
              AND NOT EXISTS (
                  SELECT 1 FROM unnest(x.indkey) AS k(attnum)
                  JOIN pg_attribute a ON a.attrelid = obj.objid AND a.attnum = k.attnum
                  WHERE NOT a.attnotnull
              )
            ORDER BY x.indnatts
            LIMIT 1;

            IF idx_name IS NOT NULL THEN
                EXECUTE format('ALTER TABLE %s REPLICA IDENTITY USING INDEX %I', obj.object_identity, idx_name);
                RAISE NOTICE 'Set REPLICA IDENTITY USING INDEX % on %', idx_name, obj.object_identity;
            ELSE
                -- Fallback: log the full old row so UPDATE/DELETE can replicate.
                EXECUTE format('ALTER TABLE %s REPLICA IDENTITY FULL', obj.object_identity);
                RAISE NOTICE 'Set REPLICA IDENTITY FULL on %', obj.object_identity;
            END IF;
        END LOOP;
    END
    \$fn\$;

    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_event_trigger WHERE evtname = 'aems_replica_identity_trg') THEN
            CREATE EVENT TRIGGER aems_replica_identity_trg
                ON ddl_command_end WHEN TAG IN ('CREATE TABLE')
                EXECUTE FUNCTION aems_ensure_replica_identity();
            RAISE NOTICE 'Created event trigger aems_replica_identity_trg';
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
