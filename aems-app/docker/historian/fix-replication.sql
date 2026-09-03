-- ================================================
-- Fix PostgreSQL Logical Replication Issues (SUBSCRIBER-side)
-- ================================================
-- This script fixes subscriber-side replication issues by ensuring topics
-- and data have PRIMARY KEYs and cleaning up failed subscriptions.
--
-- SCOPE: Run this on the SUBSCRIBER database. It does NOT touch the
-- publisher's PUBLICATION — despite older docs that said otherwise, this
-- script never issues DROP/CREATE PUBLICATION.
--
-- For PUBLISHER-side issues (missing / empty / FOR ALL TABLES publication,
-- leaked migration_stage schema) run the publisher-side repair instead:
--     ./aems-app/repair-historian-replication.sh
-- which invokes /usr/local/bin/repair-replication.sh inside the historian
-- container.
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
-- Matches both the canonical name (historian_sub) AND legacy per-user names
-- (aems_<username>_sub) so this file cleans up subscribers deployed under
-- either naming convention.
DO $$
DECLARE
    sub_name TEXT;
BEGIN
    FOR sub_name IN
        SELECT subname
        FROM pg_subscription
        WHERE subname = 'historian_sub'
           OR subname LIKE 'aems_%_sub'
    LOOP
        RAISE NOTICE 'Dropping subscription: %', sub_name;
        EXECUTE format('DROP SUBSCRIPTION IF EXISTS %I', sub_name);
    END LOOP;

    IF NOT FOUND THEN
        RAISE NOTICE 'No historian subscriptions found (historian_sub or aems_%%_sub).';
    END IF;
END
$$;

-- Step 5: Display remaining subscription status (should be empty after dropping)
SELECT
    subname AS subscription_name,
    subenabled AS enabled,
    subpublications AS publications
FROM pg_subscription
WHERE subname = 'historian_sub'
   OR subname LIKE 'aems_%_sub';

-- Step 6: Instructions for recreating subscription
--
-- ⚠️  RECOMMENDED: run the resumable wrapper on the subscriber host:
--     ./aems-app/subscribe-historian.sh --publisher-host <host>
-- It creates the subscription with copy_data=false (streams from now) and
-- backfills historical data in resumable chunked transactions — safe over
-- unreliable / cellular links, where copy_data=true single-transaction
-- initial COPY cannot complete.
--
-- FALLBACK (only for lab / broadband deployments that can complete a
-- multi-GB initial COPY in one transaction):
--
-- CREATE SUBSCRIPTION historian_sub
-- CONNECTION 'host=<publisher_host> port=<port> dbname=historian user=replicator password=<password> sslmode=require'
-- PUBLICATION historian_pub
-- WITH (
--     copy_data   = false,
--     create_slot = true,
--     enabled     = true,
--     slot_name   = 'historian_sub_slot'
-- );
-- Then run aems-app/subscribe-historian.sh to backfill historical rows.

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
