-- ================================================
-- Fix PostgreSQL Logical Replication Issues
-- ================================================
-- This script fixes the replication error by ensuring the topics table
-- has a PRIMARY KEY and cleaning up the failed subscription.
--
-- Run this script on the SUBSCRIBER database where the error is occurring.
-- ================================================

-- Step 1: Add PRIMARY KEY to topics table if it doesn't exist
-- This is critical for logical replication to handle UPDATE operations
DO $$
BEGIN
    -- Check if primary key already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'topics_pkey' AND contype = 'p'
    ) THEN
        -- Add primary key on topic_id
        ALTER TABLE topics ADD PRIMARY KEY (topic_id);
        RAISE NOTICE 'Added PRIMARY KEY to topics table for replication';
    ELSE
        RAISE NOTICE 'PRIMARY KEY already exists on topics table';
    END IF;
END
$$;

-- Step 2: Verify the data table also has PRIMARY KEY
DO $$
BEGIN
    -- Check if primary key already exists on data table
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'data_pkey' AND contype = 'p'
    ) THEN
        -- Add primary key on (topic_id, ts)
        ALTER TABLE data ADD PRIMARY KEY (topic_id, ts);
        RAISE NOTICE 'Added PRIMARY KEY to data table for replication';
    ELSE
        RAISE NOTICE 'PRIMARY KEY already exists on data table';
    END IF;
END
$$;

-- Step 3: Display replica identity settings for verification
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

-- Step 4: Drop the failed subscription
-- The subscription name pattern is 'aems_<username>_sub' or 'aems_unknown_sub' as fallback
DO $$
DECLARE
    sub_name TEXT;
BEGIN
    -- Find all subscriptions matching the pattern
    FOR sub_name IN 
        SELECT subname 
        FROM pg_subscription 
        WHERE subname LIKE 'aems_%_sub'
    LOOP
        RAISE NOTICE 'Dropping subscription: %', sub_name;
        EXECUTE format('DROP SUBSCRIPTION IF EXISTS %I', sub_name);
    END LOOP;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'No subscriptions found matching pattern aems_%_sub';
    END IF;
END
$$;

-- Step 5: Display subscription status (should be empty after dropping)
SELECT 
    subname AS subscription_name,
    subenabled AS enabled,
    subpublications AS publications
FROM pg_subscription
WHERE subname LIKE 'aems_%_sub';

-- Step 6: Instructions for recreating subscription
-- After running this script, you need to recreate the subscription.
-- Run the setup-subscriber.sh script or manually create the subscription:
--
-- CREATE SUBSCRIPTION aems_<username>_sub
-- CONNECTION 'host=<publisher_host> port=<port> dbname=historian user=replicator password=<password> sslmode=prefer'
-- PUBLICATION historian_pub
-- WITH (
--     copy_data = true,
--     create_slot = true,
--     enabled = true,
--     slot_name = 'aems_<username>_slot'
-- );

-- ================================================
-- Verification Queries
-- ================================================

-- Check table structures
\echo '\n=== Table Structures ==='
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN ('data', 'topics')
ORDER BY table_name, ordinal_position;

-- Check primary keys
\echo '\n=== Primary Keys ==='
SELECT 
    tc.table_name,
    string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as primary_key_columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY' 
    AND tc.table_name IN ('data', 'topics')
GROUP BY tc.table_name
ORDER BY tc.table_name;

-- Check replication slots on source (if this is the publisher)
\echo '\n=== Replication Slots (if publisher) ==='
SELECT 
    slot_name,
    plugin,
    slot_type,
    active,
    restart_lsn,
    confirmed_flush_lsn
FROM pg_replication_slots
WHERE slot_name LIKE 'aems_%_slot'
ORDER BY slot_name;

\echo '\n=== Fix Complete ==='
\echo 'Next steps:'
\echo '1. Verify PRIMARY KEYs are in place (see output above)'
\echo '2. Re-run setup-subscriber.sh to recreate the subscription'
\echo '3. Monitor logs to ensure replication is working'
