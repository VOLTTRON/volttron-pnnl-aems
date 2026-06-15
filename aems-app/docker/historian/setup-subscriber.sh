#!/bin/bash
# PostgreSQL Logical Replication Subscriber Setup Script
# This script configures the local historian database as a subscriber to a remote historian

set -e

echo "================================================"
echo "Historian Replication Subscriber Setup"
echo "================================================"

# Validate required environment variables
if [ -z "${TEST_HISTORIAN_HOST}" ]; then
    echo "ERROR: TEST_HISTORIAN_HOST is not set"
    echo "Please configure .env or docker/.env.historian"
    exit 1
fi

if [ -z "${TEST_HISTORIAN_PORT}" ]; then
    echo "ERROR: TEST_HISTORIAN_PORT is not set"
    echo "Please configure .env or docker/.env.historian"
    exit 1
fi

if [ -z "${TEST_HISTORIAN_USER}" ]; then
    echo "ERROR: TEST_HISTORIAN_USER is not set"
    echo "Please configure .env or docker/.env.historian"
    exit 1
fi

if [ -z "${TEST_HISTORIAN_PASSWORD}" ]; then
    echo "ERROR: TEST_HISTORIAN_PASSWORD is not set"
    echo "Please configure .env or docker/.env.historian"
    exit 1
fi

# Set defaults
TEST_HISTORIAN_DB="${TEST_HISTORIAN_DB:-historian}"
POSTGRES_DB="${POSTGRES_DB:-historian}"
POSTGRES_USER="${POSTGRES_USER:-historian}"

# Get username and sanitize for PostgreSQL identifier use
USERNAME_RAW="${USER:-${USERNAME:-unknown}}"
USERNAME_CLEAN=$(echo "${USERNAME_RAW}" | tr '[:upper:]' '[:lower:]' | tr -cd '[:alnum:]_')

# Create unique subscription and slot names based on username
TEST_SUBSCRIPTION_NAME="aems_${USERNAME_CLEAN}_sub"
TEST_SLOT_NAME="aems_${USERNAME_CLEAN}_slot"

echo "Configuration:"
echo "  Source Host: ${TEST_HISTORIAN_HOST}"
echo "  Source Port: ${TEST_HISTORIAN_PORT}"
echo "  Source DB: ${TEST_HISTORIAN_DB}"
echo "  Source User: ${TEST_HISTORIAN_USER}"
echo "  Subscription Name: ${TEST_SUBSCRIPTION_NAME}"
echo "  Slot Name: ${TEST_SLOT_NAME}"
echo "  Username: ${USERNAME_CLEAN}"
echo ""

# Wait for local PostgreSQL to be ready
echo "Waiting for local PostgreSQL to be ready..."
until pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"; do
  echo "  Waiting..."
  sleep 2
done
echo "Local PostgreSQL is ready."
echo ""

# Test connection to source historian
echo "Testing connection to source historian..."
export PGPASSWORD="${TEST_HISTORIAN_PASSWORD}"

MAX_RETRIES=5
RETRY_COUNT=0
CONNECTION_SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if psql -h "${TEST_HISTORIAN_HOST}" \
           -p "${TEST_HISTORIAN_PORT}" \
           -U "${TEST_HISTORIAN_USER}" \
           -d "${TEST_HISTORIAN_DB}" \
           -c "SELECT 1;" > /dev/null 2>&1; then
        CONNECTION_SUCCESS=true
        echo "✓ Successfully connected to source historian"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "  Connection attempt ${RETRY_COUNT}/${MAX_RETRIES} failed..."
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "  Retrying in 5 seconds..."
            sleep 5
        fi
    fi
done

if [ "${CONNECTION_SUCCESS}" != "true" ]; then
    echo ""
    echo "ERROR: Cannot connect to source historian after ${MAX_RETRIES} attempts"
    echo ""
    echo "Please verify:"
    echo "  1. Source historian is running and accessible"
    echo "  2. TEST_HISTORIAN_HOST is correct: ${TEST_HISTORIAN_HOST}"
    echo "  3. TEST_HISTORIAN_PORT is correct: ${TEST_HISTORIAN_PORT}"
    echo "  4. Network allows connection between containers"
    echo "  5. Credentials are correct (user: ${TEST_HISTORIAN_USER})"
    echo ""
    exit 1
fi
echo ""

# Set password for local database operations
export PGPASSWORD="${POSTGRES_PASSWORD}"

# Verify publication exists on source
echo "Verifying publication exists on source historian..."
PUB_EXISTS=$(PGPASSWORD="${TEST_HISTORIAN_PASSWORD}" psql \
    -h "${TEST_HISTORIAN_HOST}" \
    -p "${TEST_HISTORIAN_PORT}" \
    -U "${TEST_HISTORIAN_USER}" \
    -d "${TEST_HISTORIAN_DB}" \
    -t -c "SELECT COUNT(*) FROM pg_publication WHERE pubname = 'historian_pub';" 2>/dev/null | xargs)

if [ "${PUB_EXISTS}" != "1" ]; then
    echo ""
    echo "ERROR: Publication 'historian_pub' does not exist on source historian"
    echo ""
    echo "The source historian must have logical replication configured."
    echo "Please ensure the source historian was set up with replication enabled."
    echo ""
    exit 1
fi
echo "✓ Publication 'historian_pub' exists on source"
echo ""

# Check if replication slot already exists on source and drop it
echo "Checking for existing replication slot on source..."
SLOT_EXISTS=$(PGPASSWORD="${TEST_HISTORIAN_PASSWORD}" psql \
    -h "${TEST_HISTORIAN_HOST}" \
    -p "${TEST_HISTORIAN_PORT}" \
    -U "${TEST_HISTORIAN_USER}" \
    -d "${TEST_HISTORIAN_DB}" \
    -t -c "SELECT COUNT(*) FROM pg_replication_slots WHERE slot_name = '${TEST_SLOT_NAME}';" 2>/dev/null | xargs)

if [ "${SLOT_EXISTS}" = "1" ]; then
    echo "Found existing replication slot '${TEST_SLOT_NAME}', dropping it..."
    PGPASSWORD="${TEST_HISTORIAN_PASSWORD}" psql \
        -h "${TEST_HISTORIAN_HOST}" \
        -p "${TEST_HISTORIAN_PORT}" \
        -U "${TEST_HISTORIAN_USER}" \
        -d "${TEST_HISTORIAN_DB}" \
        -c "SELECT pg_drop_replication_slot('${TEST_SLOT_NAME}');" 2>/dev/null || true
    echo "✓ Old replication slot dropped"
else
    echo "✓ No existing replication slot found"
fi
echo ""

# Get table schema from source historian
echo "Fetching table schema from source historian..."

# Query schema for data table
DATA_SCHEMA=$(PGPASSWORD="${TEST_HISTORIAN_PASSWORD}" psql \
    -h "${TEST_HISTORIAN_HOST}" \
    -p "${TEST_HISTORIAN_PORT}" \
    -U "${TEST_HISTORIAN_USER}" \
    -d "${TEST_HISTORIAN_DB}" \
    -t -A -c "
    SELECT 
      'CREATE TABLE IF NOT EXISTS data (' || E'\\n' ||
      string_agg(
        '    ' || column_name || ' ' || 
        UPPER(data_type) || 
        CASE 
          WHEN character_maximum_length IS NOT NULL 
          THEN '(' || character_maximum_length || ')'
          WHEN data_type = 'timestamp without time zone' THEN ''
          ELSE ''
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE 
          WHEN column_default IS NOT NULL 
          THEN ' DEFAULT ' || column_default 
          ELSE '' 
        END,
        ',' || E'\\n'
        ORDER BY ordinal_position
      ) || E'\\n);'
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'data';
" )

# Query schema for topics table
TOPICS_SCHEMA=$(PGPASSWORD="${TEST_HISTORIAN_PASSWORD}" psql \
    -h "${TEST_HISTORIAN_HOST}" \
    -p "${TEST_HISTORIAN_PORT}" \
    -U "${TEST_HISTORIAN_USER}" \
    -d "${TEST_HISTORIAN_DB}" \
    -t -A -c "
    SELECT 
      'CREATE TABLE IF NOT EXISTS topics (' || E'\\n' ||
      string_agg(
        '    ' || column_name || ' ' || 
        UPPER(data_type) || 
        CASE 
          WHEN character_maximum_length IS NOT NULL 
          THEN '(' || character_maximum_length || ')'
          WHEN data_type = 'timestamp without time zone' THEN ''
          ELSE ''
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE 
          WHEN column_default IS NOT NULL 
          THEN ' DEFAULT ' || column_default 
          ELSE '' 
        END,
        ',' || E'\\n'
        ORDER BY ordinal_position
      ) || E'\\n);'
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'topics';
" )

if [ -z "${DATA_SCHEMA}" ] || [ -z "${TOPICS_SCHEMA}" ]; then
    echo ""
    echo "ERROR: Failed to fetch table schemas from source historian"
    echo "Please verify the source historian has the 'data' and 'topics' tables"
    exit 1
fi

# Combine schemas
SCHEMA_SQL="${DATA_SCHEMA}

${TOPICS_SCHEMA}"

echo "✓ Fetched table schema"
echo "DEBUG: Schema SQL length: ${#SCHEMA_SQL} characters"
echo ""

# Get sequences from source historian
echo "Fetching sequences from source historian..."
SEQUENCES_SQL=$(PGPASSWORD="${TEST_HISTORIAN_PASSWORD}" psql \
    -h "${TEST_HISTORIAN_HOST}" \
    -p "${TEST_HISTORIAN_PORT}" \
    -U "${TEST_HISTORIAN_USER}" \
    -d "${TEST_HISTORIAN_DB}" \
    -t -A -c "
    SELECT string_agg(
      'CREATE SEQUENCE IF NOT EXISTS ' || sequence_name || ';',
      E'\\n'
      ORDER BY sequence_name
    )
    FROM information_schema.sequences
    WHERE sequence_schema = 'public';
" )

if [ -n "${SEQUENCES_SQL}" ]; then
    echo "✓ Fetched sequences"
    echo "DEBUG: Sequences SQL length: ${#SEQUENCES_SQL} characters"
else
    echo "✓ No sequences found (or not needed)"
    SEQUENCES_SQL=""
fi
echo ""

# Get primary key definitions from source
echo "Fetching primary key definitions from source historian..."

# Use CTE to avoid nested aggregates
PK_SQL=$(PGPASSWORD="${TEST_HISTORIAN_PASSWORD}" psql \
    -h "${TEST_HISTORIAN_HOST}" \
    -p "${TEST_HISTORIAN_PORT}" \
    -U "${TEST_HISTORIAN_USER}" \
    -d "${TEST_HISTORIAN_DB}" \
    -t -A -c "
    WITH pk_columns AS (
      SELECT 
        tc.table_name,
        string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY' 
        AND tc.table_schema = 'public'
        AND tc.table_name IN ('data', 'topics')
      GROUP BY tc.table_name
    )
    SELECT string_agg(
      'ALTER TABLE ' || table_name || ' ADD PRIMARY KEY (' || columns || ');',
      E'\\n'
      ORDER BY table_name
    )
    FROM pk_columns;
" )

PK_EXIT_CODE=$?
if [ ${PK_EXIT_CODE} -ne 0 ]; then
    echo "WARNING: Primary key query failed with exit code ${PK_EXIT_CODE}"
    PK_SQL=""
fi

echo "✓ Fetched primary key definitions"
echo "DEBUG: PK SQL length: ${#PK_SQL} characters"
echo ""

# Get index definitions from source
echo "Fetching index definitions from source historian..."
echo "DEBUG: Running index query..."
INDEX_SQL=$(PGPASSWORD="${TEST_HISTORIAN_PASSWORD}" psql \
    -h "${TEST_HISTORIAN_HOST}" \
    -p "${TEST_HISTORIAN_PORT}" \
    -U "${TEST_HISTORIAN_USER}" \
    -d "${TEST_HISTORIAN_DB}" \
    -t -A -c "
    SELECT string_agg(indexdef || ';', E'\\n' ORDER BY tablename, indexname)
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename IN ('data', 'topics')
      AND indexname NOT LIKE '%_pkey';
" )

INDEX_EXIT_CODE=$?
if [ ${INDEX_EXIT_CODE} -ne 0 ]; then
    echo "WARNING: Index query failed with exit code ${INDEX_EXIT_CODE}"
    INDEX_SQL=""
fi

echo "✓ Fetched index definitions"
echo "DEBUG: Index SQL length: ${#INDEX_SQL} characters"
echo ""

# Configure local database with schema from source
echo "Configuring local historian database with source schema..."

# Create sequences first (if any)
if [ -n "${SEQUENCES_SQL}" ]; then
    psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB}" <<-EOSQL
        -- Create sequences from source
        ${SEQUENCES_SQL}
EOSQL
    echo "✓ Sequences created"
fi

# Create tables
psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB}" <<-EOSQL
    -- Create tables with schema from source
    ${SCHEMA_SQL}
    
    -- Drop existing subscription if it exists (for clean re-runs)
    DO \$\$
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_subscription WHERE subname = '${TEST_SUBSCRIPTION_NAME}') THEN
            DROP SUBSCRIPTION ${TEST_SUBSCRIPTION_NAME};
            RAISE NOTICE 'Dropped existing subscription: ${TEST_SUBSCRIPTION_NAME}';
        END IF;
    END
    \$\$;
EOSQL

echo "✓ Tables created"

# Add primary keys (ignore errors if they already exist)
if [ -n "${PK_SQL}" ]; then
    psql --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB}" <<-EOSQL 2>/dev/null || true
        ${PK_SQL}
EOSQL
    echo "✓ Primary keys configured"
fi

# Create indexes (ignore errors if they already exist)
if [ -n "${INDEX_SQL}" ]; then
    psql --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB}" <<-EOSQL 2>/dev/null || true
        ${INDEX_SQL}
EOSQL
    echo "✓ Indexes created"
fi

echo "✓ Local database configured with source schema"
echo ""

# Create subscription
echo "Creating subscription to source historian..."
echo "This may take a few minutes for initial data sync..."
echo ""

# Build connection string
CONN_STRING="host=${TEST_HISTORIAN_HOST} port=${TEST_HISTORIAN_PORT} dbname=${TEST_HISTORIAN_DB} user=${TEST_HISTORIAN_USER} password=${TEST_HISTORIAN_PASSWORD}"

psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB}" <<-EOSQL
    -- Create subscription
    CREATE SUBSCRIPTION ${TEST_SUBSCRIPTION_NAME}
        CONNECTION '${CONN_STRING}'
        PUBLICATION historian_pub
        WITH (
            copy_data = true,           -- Copy existing data from source
            create_slot = true,         -- Create replication slot on source
            enabled = true,             -- Start replication immediately
            slot_name = '${TEST_SLOT_NAME}'
        );

    -- Display subscription info
    SELECT 
        subname as subscription,
        subenabled as enabled,
        subpublications as publication
    FROM pg_subscription 
    WHERE subname = '${TEST_SUBSCRIPTION_NAME}';
EOSQL

echo ""
echo "✓ Subscription created successfully"
echo ""

# Wait a moment for initial sync to start
sleep 3

# Check subscription status
echo "Checking replication status..."
psql --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB}" <<-EOSQL
    -- Display detailed subscription statistics
    SELECT 
        subname as subscription,
        pid as worker_pid,
        received_lsn as received,
        latest_end_lsn as latest,
        latest_end_time as last_sync
    FROM pg_stat_subscription
    WHERE subname = '${TEST_SUBSCRIPTION_NAME}';
EOSQL

echo ""

# Display data counts
echo "Current data statistics:"
TOPICS_COUNT=$(psql -t -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "SELECT COUNT(*) FROM topics;" | xargs)
DATA_COUNT=$(psql -t -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "SELECT COUNT(*) FROM data;" | xargs)
echo "  Topics: ${TOPICS_COUNT}"
echo "  Data records: ${DATA_COUNT}"

if [ "${DATA_COUNT}" -eq 0 ]; then
    echo ""
    echo "Note: Initial data sync may still be in progress."
    echo "Check again in a few moments using:"
    echo "  docker exec ${COMPOSE_PROJECT_NAME}-historian psql -U historian -d historian -c 'SELECT COUNT(*) FROM data;'"
fi

echo ""
echo "================================================"
echo "Replication Setup Complete!"
echo "================================================"
echo ""
echo "Your local historian is now subscribing to:"
echo "  ${TEST_HISTORIAN_HOST}:${TEST_HISTORIAN_PORT}"
echo ""
echo "Data will automatically sync from the source historian."
echo "The subscription will remain active and continue to receive updates."
echo ""
echo "To monitor replication status:"
echo "  docker exec ${COMPOSE_PROJECT_NAME}-historian psql -U historian -d historian \\"
echo "    -c 'SELECT * FROM pg_stat_subscription;'"
echo ""
echo "To view data:"
echo "  docker exec ${COMPOSE_PROJECT_NAME}-historian psql -U historian -d historian \\"
echo "    -c 'SELECT COUNT(*) FROM data;'"
echo ""
echo "================================================"

exit 0
