#!/bin/bash
# migrate-historian-data.sh
# Manual migration script for historian time-series data
# Run from aems-app directory: ./migrate-historian-data.sh
#
# Migrates data from grafana-db to historian database. Uses a compact COPY
# dump (gzip-compressed), an unlogged staging schema on the target, and a
# chunked merge with per-chunk progress checkpointing so the operator can
# Ctrl-C and resume.
#
# PREREQUISITES:
# 1. Ensure both grafana-db and historian services are running:
#    cd docker && docker compose --profile grafana --profile historian up -d
# 2. Run this script from the aems-app directory

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables from .env file if it exists
if [ -f ".env" ]; then
    # Read .env file line by line to properly handle spaces and special characters
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip comments and blank lines
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "$line" ]] && continue
        # Export valid variable assignments (VAR=value format)
        if [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)= ]]; then
            export "$line"
        fi
    done < .env
fi

# Configuration
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-aems-app}"
SOURCE_CONTAINER="${SOURCE_CONTAINER:-${COMPOSE_PROJECT_NAME}-grafana-db}"
TARGET_CONTAINER="${TARGET_CONTAINER:-${COMPOSE_PROJECT_NAME}-historian}"
SOURCE_DB="${SOURCE_DB:-grafana}"
TARGET_DB="${TARGET_DB:-historian}"
SOURCE_USER="${SOURCE_USER:-grafana}"
TARGET_USER="${TARGET_USER:-historian}"
SOURCE_PASSWORD="${GRAFANA_DATABASE_PASSWORD}"
TARGET_PASSWORD="${HISTORIAN_DATABASE_PASSWORD}"
LOG_FILE="migration-$(date +%Y%m%d-%H%M%S).log"
DRY_RUN=false
VERIFY_ONLY=false
SKIP_EXPORT=false
KEEP_DUMP=false
KEEP_STAGING=false
DUMP_FILE_OVERRIDE=""
CHUNK_INTERVAL="1 month"
WATCHDOG_PID=""
HBA_MUTATED=false
HBA_MUTATED_FILE=""
MIGRATION_OK=false

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# Help function
show_help() {
    cat << EOF
Historian Data Migration Script

Usage: ./migrate-historian-data.sh [OPTIONS]

Migrates historian time-series data from grafana-db to historian database.

PREREQUISITES:
  Before running this script, ensure both services are running:
    cd docker && docker compose --profile grafana --profile historian up -d

Options:
    --source CONTAINER        Source container name (default: ${COMPOSE_PROJECT_NAME}-grafana-db)
    --target CONTAINER        Target container name (default: ${COMPOSE_PROJECT_NAME}-historian)
    --source-db NAME          Source database name (default: grafana)
    --target-db NAME          Target database name (default: historian)
    --dry-run                 Show what would be done without making changes
    --verify-only             Only verify current state, don't migrate
    --skip-export             Reuse an existing dump file instead of running pg_dump again.
                              Combined with --dump-file, lets you resume after an aborted load
                              without re-dumping the source.
    --dump-file PATH          Override the dump file location (default: a gzipped COPY dump
                              under a mktemp'd directory named historian_dump.copy.gz).
    --chunk-interval INTERVAL Postgres interval string for the per-chunk merge window
                              (default: '1 month'). Smaller = more chunks, finer resume
                              granularity, slightly more overhead. Larger = fewer chunks,
                              less resume granularity.
    --keep-dump               Do not delete the dump file when the script exits. Useful for
                              multi-GB dumps you may want to archive or reuse.
    --keep-staging            Do not print the staging-cleanup instruction at the end.
    --help                    Show this help message

Examples:
    # Full migration workflow
    cd docker && docker compose --profile grafana --profile historian up -d
    cd ..
    ./migrate-historian-data.sh

    # Resume after Ctrl-C: reuse the dump file, resume from the first incomplete chunk
    ./migrate-historian-data.sh --keep-dump --skip-export --dump-file /tmp/prior/historian_dump.copy.gz

    # Verify state without migrating
    ./migrate-historian-data.sh --verify-only

    # Dry run to see what would happen
    ./migrate-historian-data.sh --dry-run

    # Custom container names (if needed)
    ./migrate-historian-data.sh --source my-old-db --target my-new-db

    # Smaller chunks for finer resume granularity on very large loads
    ./migrate-historian-data.sh --chunk-interval '1 week'

RESUMABILITY:
  Progress is checkpointed per chunk in migration_stage.progress on the target.
  Ctrl-C at any time is safe; re-run the script (with --skip-export --dump-file to
  avoid re-dumping) to pick up from the first incomplete chunk. The staging schema
  is intentionally NOT dropped on exit; drop it manually once you're happy with
  the migration (the script prints the command at the end).

AFTER MIGRATION:
  Once migration is complete and verified, both services can continue running.
  The grafana-db retains historical data for reference.
  New data from VOLTTRON continues to be written to historian.

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --source)
            SOURCE_CONTAINER="$2"
            shift 2
            ;;
        --target)
            TARGET_CONTAINER="$2"
            shift 2
            ;;
        --source-db)
            SOURCE_DB="$2"
            shift 2
            ;;
        --target-db)
            TARGET_DB="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --verify-only)
            VERIFY_ONLY=true
            shift
            ;;
        --skip-export)
            SKIP_EXPORT=true
            shift
            ;;
        --dump-file)
            DUMP_FILE_OVERRIDE="$2"
            shift 2
            ;;
        --chunk-interval)
            CHUNK_INTERVAL="$2"
            shift 2
            ;;
        --keep-dump)
            KEEP_DUMP=true
            shift
            ;;
        --keep-staging)
            KEEP_STAGING=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Basic validation of --chunk-interval to make its use in SQL string interpolation predictable.
# Accepts patterns like "1 month", "2 weeks", "7 days", "12 hours".
if ! [[ "$CHUNK_INTERVAL" =~ ^[0-9]+\ (year|years|month|months|week|weeks|day|days|hour|hours|minute|minutes)$ ]]; then
    log_error "Invalid --chunk-interval '$CHUNK_INTERVAL'. Expected 'N unit', e.g. '1 month' or '2 weeks'."
    exit 1
fi

# Banner
echo ""
echo "=============================================="
echo "  Historian Data Migration Tool"
echo "=============================================="
echo ""

# Initialize log
echo "Migration started at $(date)" > "$LOG_FILE"
log_info "Log file: $LOG_FILE"
echo ""

# Check if running from correct directory
if [ ! -f "docker-compose.yml" ]; then
    log_error "Must run from aems-app directory (docker-compose.yml not found)"
    exit 1
fi

log_info "Configuration:"
log_info "  Source container: $SOURCE_CONTAINER"
log_info "  Target container: $TARGET_CONTAINER"
log_info "  Source database: $SOURCE_DB"
log_info "  Target database: $TARGET_DB"
log_info "  Chunk interval: $CHUNK_INTERVAL"
if [ "$DRY_RUN" = true ]; then
    log_warning "  Mode: DRY RUN (no changes will be made)"
fi
if [ "$VERIFY_ONLY" = true ]; then
    log_info "  Mode: VERIFY ONLY"
fi
if [ "$SKIP_EXPORT" = true ]; then
    log_info "  Skip export: yes"
fi
if [ -n "$DUMP_FILE_OVERRIDE" ]; then
    log_info "  Dump file override: $DUMP_FILE_OVERRIDE"
fi
if [ "$KEEP_DUMP" = true ]; then
    log_info "  Keep dump on exit: yes"
fi
echo ""

# Pre-flight checks
log_info "Running pre-flight checks..."

# Check if source container exists and is running
if ! docker ps --format '{{.Names}}' | grep -q "^${SOURCE_CONTAINER}$"; then
    log_error "Source container '$SOURCE_CONTAINER' is not running"
    log_info "Available containers:"
    docker ps --format '  - {{.Names}}'
    exit 1
fi
log_success "Source container is running"

# Check if target container exists and is running
if ! docker ps --format '{{.Names}}' | grep -q "^${TARGET_CONTAINER}$"; then
    log_error "Target container '$TARGET_CONTAINER' is not running"
    log_info "Available containers:"
    docker ps --format '  - {{.Names}}'
    exit 1
fi
log_success "Target container is running"

# Check source database connectivity
log_info "Testing source database connectivity..."
if ! docker exec "$SOURCE_CONTAINER" pg_isready -U "$SOURCE_USER" -d "$SOURCE_DB" > /dev/null 2>&1; then
    log_error "Cannot connect to source database"
    exit 1
fi
log_success "Source database is accessible"

# Check target database connectivity
log_info "Testing target database connectivity..."
if ! docker exec "$TARGET_CONTAINER" pg_isready -U "$TARGET_USER" -d "$TARGET_DB" > /dev/null 2>&1; then
    log_error "Cannot connect to target database"
    exit 1
fi
log_success "Target database is accessible"

echo ""
log_info "Getting source database statistics..."

# Get source record counts
SOURCE_TOPICS_COUNT=$(docker exec -e PGPASSWORD="${GRAFANA_DATABASE_PASSWORD}" "$SOURCE_CONTAINER" psql -U "$SOURCE_USER" -d "$SOURCE_DB" -t -c "SELECT COUNT(*) FROM topics;" 2>/dev/null | xargs)
SOURCE_DATA_COUNT=$(docker exec -e PGPASSWORD="${GRAFANA_DATABASE_PASSWORD}" "$SOURCE_CONTAINER" psql -U "$SOURCE_USER" -d "$SOURCE_DB" -t -c "SELECT COUNT(*) FROM data;" 2>/dev/null | xargs)

# If query failed, try to fix pg_hba.conf
if [ -z "$SOURCE_TOPICS_COUNT" ] || [ -z "$SOURCE_DATA_COUNT" ]; then
    log_warning "Cannot query source database - attempting to fix pg_hba.conf authentication..."

    # Detect the actual pg_hba.conf location used by PostgreSQL
    log_info "Detecting pg_hba.conf location..."
    HBA_FILE=$(docker exec "$SOURCE_CONTAINER" sh -c "ps aux | grep postgres | grep 'hba_file=' | sed 's/.*hba_file=\([^ ]*\).*/\1/' | head -1")

    if [ -z "$HBA_FILE" ]; then
        # Fallback to default location
        HBA_FILE="/var/lib/postgresql/data/pg_hba.conf"
        log_info "Using default location: $HBA_FILE"
    else
        log_info "Detected location: $HBA_FILE"
    fi

    # Backup the original file ONLY if a backup doesn't already exist.
    # Overwriting an existing .backup with the already-mutated file would make
    # the pristine original unrecoverable across script re-runs.
    docker exec "$SOURCE_CONTAINER" sh -c "[ -f '${HBA_FILE}.backup' ] || cp '$HBA_FILE' '${HBA_FILE}.backup'"

    # Track for cleanup(). Also remember HBA_FILE for the restore command.
    HBA_MUTATED=true
    HBA_MUTATED_FILE="$HBA_FILE"

    # Prepend md5 authentication rules to the TOP of the file ONLY if not already
    # present. Without the guard, re-running the script would stack duplicate
    # blocks at the top of the file.
    if ! docker exec "$SOURCE_CONTAINER" grep -q "==== Added by migration script for database access ====" "$HBA_FILE"; then
        log_info "Adding md5 authentication rules to pg_hba.conf..."
        docker exec "$SOURCE_CONTAINER" sh -c "sed -i '1i# ==== Added by migration script for database access ====' '$HBA_FILE'"
        docker exec "$SOURCE_CONTAINER" sh -c "sed -i '2ilocal all all md5' '$HBA_FILE'"
        docker exec "$SOURCE_CONTAINER" sh -c "sed -i '3ihost all all all md5' '$HBA_FILE'"
        docker exec "$SOURCE_CONTAINER" sh -c "sed -i '4i# ====================================================' '$HBA_FILE'"
    else
        log_info "pg_hba.conf already patched by a prior run — leaving as-is."
    fi

    # Restart the container to apply changes (more reliable than reload)
    log_info "Restarting container to apply pg_hba.conf changes..."
    (cd docker && docker compose restart grafana-db) >> "$LOG_FILE" 2>&1

    # Wait for PostgreSQL to be ready
    log_info "Waiting for PostgreSQL to be ready..."
    sleep 5

    # Wait for the database to accept connections
    for i in {1..30}; do
        if docker exec "$SOURCE_CONTAINER" pg_isready -U "$SOURCE_USER" -d "$SOURCE_DB" > /dev/null 2>&1; then
            break
        fi
        sleep 1
    done

    # Retry the query
    log_info "Retrying database query..."
    SOURCE_TOPICS_COUNT=$(docker exec -e PGPASSWORD="${GRAFANA_DATABASE_PASSWORD}" "$SOURCE_CONTAINER" psql -U "$SOURCE_USER" -d "$SOURCE_DB" -t -c "SELECT COUNT(*) FROM topics;" 2>/dev/null | xargs)
    SOURCE_DATA_COUNT=$(docker exec -e PGPASSWORD="${GRAFANA_DATABASE_PASSWORD}" "$SOURCE_CONTAINER" psql -U "$SOURCE_USER" -d "$SOURCE_DB" -t -c "SELECT COUNT(*) FROM data;" 2>/dev/null | xargs)

    if [ -z "$SOURCE_TOPICS_COUNT" ] || [ -z "$SOURCE_DATA_COUNT" ]; then
        log_error "Still cannot query source database after pg_hba.conf fix"
        log_error "Please check the log file for details: $LOG_FILE"
        exit 1
    fi

    log_success "pg_hba.conf fixed - database is now accessible"
fi

log_info "Source database:"
log_info "  Topics: $SOURCE_TOPICS_COUNT"
log_info "  Data records: $SOURCE_DATA_COUNT"

if [ "$SOURCE_TOPICS_COUNT" -eq 0 ] || [ "$SOURCE_DATA_COUNT" -eq 0 ]; then
    log_warning "Source database appears to be empty!"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Migration cancelled by user"
        exit 0
    fi
fi

# Get source data time range
SOURCE_MIN_TS=$(docker exec -e PGPASSWORD="${GRAFANA_DATABASE_PASSWORD}" "$SOURCE_CONTAINER" psql -U "$SOURCE_USER" -d "$SOURCE_DB" -t -c "SELECT MIN(ts) FROM data;" 2>/dev/null | xargs)
SOURCE_MAX_TS=$(docker exec -e PGPASSWORD="${GRAFANA_DATABASE_PASSWORD}" "$SOURCE_CONTAINER" psql -U "$SOURCE_USER" -d "$SOURCE_DB" -t -c "SELECT MAX(ts) FROM data;" 2>/dev/null | xargs)

if [ -n "$SOURCE_MIN_TS" ] && [ -n "$SOURCE_MAX_TS" ]; then
    log_info "  Time range: $SOURCE_MIN_TS to $SOURCE_MAX_TS"
fi

echo ""
log_info "Getting target database statistics..."

# Get target record counts
TARGET_TOPICS_COUNT=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" psql -U "$TARGET_USER" -d "$TARGET_DB" -t -c "SELECT COUNT(*) FROM topics;" 2>/dev/null | xargs || echo "0")
TARGET_DATA_COUNT=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" psql -U "$TARGET_USER" -d "$TARGET_DB" -t -c "SELECT COUNT(*) FROM data;" 2>/dev/null | xargs || echo "0")

log_info "Target database:"
log_info "  Topics: $TARGET_TOPICS_COUNT"
log_info "  Data records: $TARGET_DATA_COUNT"

# If verify-only mode, exit here
if [ "$VERIFY_ONLY" = true ]; then
    echo ""
    log_success "Verification complete"
    exit 0
fi

# If dry-run mode, show what would happen
if [ "$DRY_RUN" = true ]; then
    echo ""
    log_info "DRY RUN: Would migrate:"
    log_info "  Topics: $SOURCE_TOPICS_COUNT records"
    log_info "  Data: $SOURCE_DATA_COUNT records"
    log_info "  Strategy: pg_dump (COPY format, gzipped) -> unlogged staging -> chunked merge"
    log_info "  Chunk interval: $CHUNK_INTERVAL"
    exit 0
fi

# Confirm with user
echo ""
log_warning "Ready to migrate data from $SOURCE_CONTAINER to $TARGET_CONTAINER"
log_info "This will:"
log_info "  1. Export data from source (COPY format, gzip-compressed)"
log_info "  2. Prepare target: ensure schema, primary keys, staging tables"
log_info "  3. Load into staging, then merge in $CHUNK_INTERVAL chunks with resumable progress"
log_info "  Duplicate rows on (topic_id, ts) are skipped; existing target data is preserved."
read -p "Proceed with migration? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Migration cancelled by user"
    exit 0
fi

# Perform migration
echo ""
log_info "Starting migration process..."
log_info "This may take a while for large datasets. You can Ctrl-C and resume."
echo ""

# Create temporary directory for dump files
TEMP_DIR=$(mktemp -d)
if [ -n "$DUMP_FILE_OVERRIDE" ]; then
    DUMP_FILE="$DUMP_FILE_OVERRIDE"
else
    DUMP_FILE="$TEMP_DIR/historian_dump.copy.gz"
fi

cleanup() {
    # Stop watchdog if running
    if [ -n "$WATCHDOG_PID" ] && kill -0 "$WATCHDOG_PID" 2>/dev/null; then
        kill "$WATCHDOG_PID" 2>/dev/null || true
        wait "$WATCHDOG_PID" 2>/dev/null || true
    fi

    # Restore pg_hba.conf if we mutated it AND the migration completed cleanly.
    # On an error / SIGINT exit, leave it in place so the operator can inspect —
    # they can restore manually from ${HBA_FILE}.backup.
    if [ "$HBA_MUTATED" = true ] && [ "$MIGRATION_OK" = true ] && [ -n "$HBA_MUTATED_FILE" ]; then
        if docker exec "$SOURCE_CONTAINER" test -f "${HBA_MUTATED_FILE}.backup" 2>/dev/null; then
            log_info "Restoring pg_hba.conf on source from backup..."
            docker exec "$SOURCE_CONTAINER" sh -c "cp '${HBA_MUTATED_FILE}.backup' '$HBA_MUTATED_FILE'"
            (cd docker && docker compose restart grafana-db) >> "$LOG_FILE" 2>&1 || true
            log_success "pg_hba.conf restored"
        fi
    fi

    if [ "$KEEP_DUMP" = false ] && [ -z "$DUMP_FILE_OVERRIDE" ]; then
        log_info "Cleaning up temporary files..."
        rm -rf "$TEMP_DIR"
    else
        log_info "Preserving dump file at: $DUMP_FILE"
    fi

    # If exiting with a preserved dump (--keep-dump or --dump-file) and NOT after
    # a successful migration, tell the operator the exact resume incantation.
    if [ "$MIGRATION_OK" != true ] && [ -f "${DUMP_FILE:-/nonexistent}" ]; then
        log_info "Staging schema 'migration_stage' is retained on the target."
        log_info "To resume without re-dumping, run:"
        log_info "  ./migrate-historian-data.sh --skip-export --dump-file $DUMP_FILE"
    else
        log_info "Staging schema 'migration_stage' is retained on the target. Re-run this script to resume from the first incomplete chunk."
    fi
}
trap cleanup EXIT

# ---------------------------------------------------------------------------
# Step 1: Export
# ---------------------------------------------------------------------------
log_info "Step 1/3: Exporting data from source database..."
if [ "$SKIP_EXPORT" = true ] && [ -f "$DUMP_FILE" ]; then
    DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
    log_info "Skipping export (--skip-export). Reusing $DUMP_FILE ($DUMP_SIZE)"
else
    STEP1_START=$(date +%s)
    # Default COPY format (NO --inserts) is 5-20x smaller than --inserts and
    # dramatically faster to replay. Gzip on the way to disk cuts another 3-5x.
    # No --on-conflict-do-nothing here; idempotency is handled downstream via
    # ON CONFLICT DO NOTHING in the merge into public.data.
    # Use pipefail locally so a pg_dump failure isn't masked by a successful gzip.
    set -o pipefail
    if ! docker exec -e PGPASSWORD="${GRAFANA_DATABASE_PASSWORD}" "$SOURCE_CONTAINER" \
            pg_dump -U "$SOURCE_USER" -d "$SOURCE_DB" \
                --table=topics --table=data \
                --data-only --no-owner --no-privileges \
            2>> "$LOG_FILE" \
        | gzip -c > "$DUMP_FILE"; then
        set +o pipefail
        log_error "Export failed - check log file for details"
        exit 1
    fi
    set +o pipefail

    # Belt-and-suspenders: verify the dump is a valid, non-empty gzip archive.
    if [ ! -s "$DUMP_FILE" ]; then
        log_error "Dump file is empty ($DUMP_FILE) - pg_dump likely failed"
        exit 1
    fi
    if ! gzip -t "$DUMP_FILE" 2>> "$LOG_FILE"; then
        log_error "Dump file is not a valid gzip archive - pg_dump likely failed mid-write"
        exit 1
    fi

    DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
    STEP1_ELAPSED=$(( $(date +%s) - STEP1_START ))
    log_success "Export completed in ${STEP1_ELAPSED}s"
    log_info "Dump file: $DUMP_FILE ($DUMP_SIZE, gzip-compressed COPY format)"
fi

# Regardless of whether we exported or reused, validate the dump file before
# feeding it into psql. Catches a corrupted/truncated file left by an earlier run.
if [ ! -f "$DUMP_FILE" ] || [ ! -s "$DUMP_FILE" ]; then
    log_error "Dump file missing or empty: $DUMP_FILE"
    exit 1
fi
if ! gzip -t "$DUMP_FILE" 2>> "$LOG_FILE"; then
    log_error "Dump file failed gzip integrity check: $DUMP_FILE"
    exit 1
fi

# Fingerprint the dump — used later to detect resumes against a different source.
DUMP_FP=$(sha256sum "$DUMP_FILE" | awk '{print $1}')
log_info "Dump fingerprint: ${DUMP_FP:0:16}..."

# ---------------------------------------------------------------------------
# Step 2: Prepare target database (schema, PKs, staging)
# ---------------------------------------------------------------------------
log_info "Step 2/3: Preparing target database..."

# Create temporary file for SQL output
TEMP_SQL_OUTPUT="$TEMP_DIR/sql_output.txt"

# Create tables if they don't exist. Secondary indexes on public.data are
# deferred to post-merge (creating them here would slow every chunk INSERT
# by maintaining index entries on the write path).
log_info "Creating tables if needed..."
# Heredoc must attach to psql (before the pipe), otherwise the SQL is
# swallowed by tee and psql runs with empty stdin (no-op). ON_ERROR_STOP=1
# so SQL errors are visible in psql's exit status.
docker exec -i -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" psql -U "$TARGET_USER" -d "$TARGET_DB" -v ON_ERROR_STOP=1 <<'EOF' 2>&1 | tee -a "$LOG_FILE" > "$TEMP_SQL_OUTPUT"
-- Create tables if they don't exist. PKs are declared inline so a fresh
-- target (no prior VOLTTRON SQLHistorian activity) can create the data
-- FK reference to topics(topic_id) at CREATE time. On a target that already
-- has these tables (from VOLTTRON auto-create), IF NOT EXISTS is a no-op
-- and the PK-verification blocks below add any missing PKs.
CREATE TABLE IF NOT EXISTS topics (
    topic_id SERIAL PRIMARY KEY,
    topic_name VARCHAR(512) UNIQUE NOT NULL,
    metadata TEXT
);

CREATE TABLE IF NOT EXISTS data (
    ts TIMESTAMP NOT NULL,
    topic_id INTEGER NOT NULL REFERENCES topics(topic_id),
    value_string TEXT,
    PRIMARY KEY (topic_id, ts)
);

-- Create indexes on topics (small, cheap). Secondary indexes on data are
-- deferred to post-merge.
CREATE INDEX IF NOT EXISTS idx_topics_name ON topics(topic_name);
-- Functional index so case-insensitive topic_name lookups (the server's
-- resolveTopicId path) can use an index instead of falling back to a
-- seq scan on topics. Keeps the hot path fast at scale.
CREATE INDEX IF NOT EXISTS idx_topics_name_lower ON topics(lower(topic_name));
EOF
CREATE_STATUS=${PIPESTATUS[0]}

if [ "$CREATE_STATUS" -ne 0 ]; then
    log_error "Failed to create tables"
    cat "$TEMP_SQL_OUTPUT" >> "$LOG_FILE"
    exit 1
fi

# Check and fix PRIMARY KEY on topics table
log_info "Checking PRIMARY KEY on 'topics' table..."
TOPICS_PK_EXISTS=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" psql -U "$TARGET_USER" -d "$TARGET_DB" -t -c "SELECT COUNT(*) FROM pg_constraint WHERE conname = 'topics_pkey' AND contype = 'p';" 2>/dev/null | xargs)

if [ "$TOPICS_PK_EXISTS" = "0" ]; then
    log_warning "No PRIMARY KEY found on 'topics' - adding PRIMARY KEY (topic_id)"

    # First ensure the column is NOT NULL (prerequisite for PRIMARY KEY)
    log_info "Ensuring topic_id column is NOT NULL..."
    docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" psql -U "$TARGET_USER" -d "$TARGET_DB" -c "ALTER TABLE topics ALTER COLUMN topic_id SET NOT NULL;" 2>&1 | tee -a "$LOG_FILE" > "$TEMP_SQL_OUTPUT"

    if [ $? -ne 0 ]; then
        log_error "Failed to set topic_id to NOT NULL"
        cat "$TEMP_SQL_OUTPUT" | tee -a "$LOG_FILE"
        exit 1
    fi

    log_info "Adding PRIMARY KEY to topics table..."
    docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" psql -U "$TARGET_USER" -d "$TARGET_DB" -c "ALTER TABLE topics ADD PRIMARY KEY (topic_id);" 2>&1 | tee -a "$LOG_FILE" > "$TEMP_SQL_OUTPUT"

    if [ $? -ne 0 ]; then
        log_error "Failed to add PRIMARY KEY to 'topics' table"
        cat "$TEMP_SQL_OUTPUT" | tee -a "$LOG_FILE"
        exit 1
    fi

    # Verify it was created
    TOPICS_PK_EXISTS=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" psql -U "$TARGET_USER" -d "$TARGET_DB" -t -c "SELECT COUNT(*) FROM pg_constraint WHERE conname = 'topics_pkey' AND contype = 'p';" 2>/dev/null | xargs)
    if [ "$TOPICS_PK_EXISTS" = "1" ]; then
        log_success "PRIMARY KEY 'topics_pkey' created successfully"
    else
        log_error "Failed to verify PRIMARY KEY creation on 'topics' table"
        log_error "SQL output:"
        cat "$TEMP_SQL_OUTPUT" | tee -a "$LOG_FILE"
        exit 1
    fi
else
    log_success "PRIMARY KEY 'topics_pkey' already exists"
fi

# Check and fix PRIMARY KEY on data table
log_info "Checking PRIMARY KEY on 'data' table..."
DATA_PK_EXISTS=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" psql -U "$TARGET_USER" -d "$TARGET_DB" -t -c "SELECT COUNT(*) FROM pg_constraint WHERE conname = 'data_pkey' AND contype = 'p';" 2>/dev/null | xargs)

if [ "$DATA_PK_EXISTS" = "0" ]; then
    log_warning "No PRIMARY KEY found on 'data' - adding PRIMARY KEY (topic_id, ts)"

    log_info "Ensuring topic_id and ts columns are NOT NULL..."
    docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" psql -U "$TARGET_USER" -d "$TARGET_DB" -c "ALTER TABLE data ALTER COLUMN topic_id SET NOT NULL;" 2>&1 | tee -a "$LOG_FILE" > "$TEMP_SQL_OUTPUT"

    if [ $? -ne 0 ]; then
        log_error "Failed to set topic_id to NOT NULL on data table"
        cat "$TEMP_SQL_OUTPUT" | tee -a "$LOG_FILE"
        exit 1
    fi

    docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" psql -U "$TARGET_USER" -d "$TARGET_DB" -c "ALTER TABLE data ALTER COLUMN ts SET NOT NULL;" 2>&1 | tee -a "$LOG_FILE" > "$TEMP_SQL_OUTPUT"

    if [ $? -ne 0 ]; then
        log_error "Failed to set ts to NOT NULL on data table"
        cat "$TEMP_SQL_OUTPUT" | tee -a "$LOG_FILE"
        exit 1
    fi

    log_info "Adding PRIMARY KEY to data table..."
    docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" psql -U "$TARGET_USER" -d "$TARGET_DB" -c "ALTER TABLE data ADD PRIMARY KEY (topic_id, ts);" 2>&1 | tee -a "$LOG_FILE" > "$TEMP_SQL_OUTPUT"

    if [ $? -ne 0 ]; then
        log_error "Failed to add PRIMARY KEY to 'data' table"
        cat "$TEMP_SQL_OUTPUT" | tee -a "$LOG_FILE"
        exit 1
    fi

    # Verify it was created
    DATA_PK_EXISTS=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" psql -U "$TARGET_USER" -d "$TARGET_DB" -t -c "SELECT COUNT(*) FROM pg_constraint WHERE conname = 'data_pkey' AND contype = 'p';" 2>/dev/null | xargs)
    if [ "$DATA_PK_EXISTS" = "1" ]; then
        log_success "PRIMARY KEY 'data_pkey' created successfully"
    else
        log_error "Failed to verify PRIMARY KEY creation on 'data' table"
        log_error "SQL output:"
        cat "$TEMP_SQL_OUTPUT" | tee -a "$LOG_FILE"
        exit 1
    fi
else
    log_success "PRIMARY KEY 'data_pkey' already exists"
fi

# Verify replica identity settings
log_info "Verifying replica identity settings..."
docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" psql -U "$TARGET_USER" -d "$TARGET_DB" -t -c "
SELECT
    '  ' || c.relname || ': ' ||
    CASE c.relreplident
        WHEN 'd' THEN 'DEFAULT (primary key) ✓'
        WHEN 'n' THEN 'NOTHING ✗'
        WHEN 'f' THEN 'FULL'
        WHEN 'i' THEN 'INDEX'
    END
FROM pg_class c
WHERE c.relname IN ('data', 'topics')
ORDER BY c.relname;
" 2>&1 | while IFS= read -r line; do
    if [[ "$line" =~ ✓ ]]; then
        log_success "$line"
    elif [[ "$line" =~ ✗ ]]; then
        log_error "$line"
    else
        log_info "$line"
    fi
done

log_success "Target database prepared with all PRIMARY KEYs verified"

# --- Step 2a: Pre-flight target integrity check ---
# Reports current sequence state and existing row counts. Detects damage a
# prior broken run of this script may have caused (topics_topic_id_seq reset
# backward by a setval landmine in the old dump-and-replay path). No mutations.
log_info "Step 2a: Pre-flight target integrity check..."
# Only report the topics_topic_id_seq state if there IS an owned sequence.
# VOLTTRON's SQLHistorian always uses SERIAL, but a manually-created schema
# with INTEGER PK has no sequence — in that case there's nothing to repair.
docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" psql -U "$TARGET_USER" -d "$TARGET_DB" -t -c "
DO \$\$
DECLARE
    seq_name text;
    seq_val  bigint;
    max_id   bigint;
BEGIN
    seq_name := pg_get_serial_sequence('public.topics', 'topic_id');
    IF seq_name IS NULL THEN
        RAISE NOTICE '  topics.topic_id has no owned sequence — sequence repair will be skipped.';
    ELSE
        EXECUTE format('SELECT last_value FROM %s', seq_name) INTO seq_val;
        SELECT COALESCE(MAX(topic_id), 0) INTO max_id FROM public.topics;
        IF seq_val < max_id THEN
            RAISE NOTICE '  topics_topic_id_seq: current=% max(topic_id)=% -> BEHIND max(topic_id) — will be repaired in Step 2c', seq_val, max_id;
        ELSE
            RAISE NOTICE '  topics_topic_id_seq: current=% max(topic_id)=% -> ok', seq_val, max_id;
        END IF;
    END IF;
END
\$\$;
" 2>&1 | while IFS= read -r line; do
    if [[ "$line" =~ BEHIND ]]; then
        log_warning "$line"
    elif [ -n "${line// }" ]; then
        log_info "$line"
    fi
done

# --- Step 2b: Create migration staging schema ---
log_info "Step 2b: Creating staging schema (unlogged, safe to re-run)..."
docker exec -i -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" \
    psql -U "$TARGET_USER" -d "$TARGET_DB" -v ON_ERROR_STOP=1 <<'EOF' 2>&1 | tee -a "$LOG_FILE" > /dev/null
CREATE SCHEMA IF NOT EXISTS migration_stage;

-- EXCLUDING DEFAULTS so a COPY into migration_stage.topics does not consume
-- from public.topics_topic_id_seq (LIKE ... INCLUDING DEFAULTS would carry
-- over the nextval(...) default from public.topics).
CREATE UNLOGGED TABLE IF NOT EXISTS migration_stage.topics (LIKE public.topics EXCLUDING DEFAULTS);
CREATE UNLOGGED TABLE IF NOT EXISTS migration_stage.data   (LIKE public.data   EXCLUDING DEFAULTS);

-- Progress table: one row per completed chunk. Ctrl-C-safe resume relies on it.
CREATE TABLE IF NOT EXISTS migration_stage.progress (
    chunk_start  TIMESTAMP PRIMARY KEY,
    chunk_end    TIMESTAMP NOT NULL,
    inserted     BIGINT,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Maps source-side topic_id -> target-side topic_id via topic_name.
CREATE TABLE IF NOT EXISTS migration_stage.topic_id_map (
    src_topic_id INTEGER PRIMARY KEY,
    dst_topic_id INTEGER NOT NULL
);

-- Metadata: dump fingerprint is stored here so a second run against a
-- different source doesn't silently reuse stale `progress` rows (which would
-- skip chunks whose chunk_start happens to match, dropping the new source's
-- data for that window).
CREATE TABLE IF NOT EXISTS migration_stage.metadata (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
EOF
STAGE_STATUS=${PIPESTATUS[0]}

if [ "$STAGE_STATUS" -ne 0 ]; then
    log_error "Failed to create staging schema - check log file for details"
    exit 1
fi
log_success "Staging schema ready"

# --- Fingerprint check: refuse to reuse progress rows from a different source. ---
# If migration_stage.progress has rows AND migration_stage.metadata has a stored
# dump_fingerprint that differs from the current dump's, this is an operator error
# (pointing the script at a different source without dropping migration_stage).
# Silently reusing the old progress would skip chunks whose chunk_start matches,
# dropping the new source's data for that window. Refuse and exit.
STORED_FP=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" \
    psql -U "$TARGET_USER" -d "$TARGET_DB" -tA -c \
    "SELECT value FROM migration_stage.metadata WHERE key = 'dump_fingerprint';" 2>/dev/null | xargs)
PROGRESS_COUNT=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" \
    psql -U "$TARGET_USER" -d "$TARGET_DB" -tA -c \
    "SELECT count(*) FROM migration_stage.progress;" 2>/dev/null | xargs)

if [ -n "$STORED_FP" ] && [ "$STORED_FP" != "$DUMP_FP" ] && [ "${PROGRESS_COUNT:-0}" -gt 0 ]; then
    log_error "Fingerprint mismatch — this staging schema was populated from a different dump."
    log_error "  Stored dump fingerprint: ${STORED_FP:0:16}..."
    log_error "  Current dump fingerprint: ${DUMP_FP:0:16}..."
    log_error "  Progress table has ${PROGRESS_COUNT} completed chunk(s) recorded for the OLD dump."
    log_error ""
    log_error "Continuing would silently skip chunks whose chunk_start happens to match, dropping"
    log_error "data from the new source. To start fresh against this new source, drop the staging"
    log_error "schema and re-run:"
    log_error "  docker exec ${TARGET_CONTAINER} psql -U ${TARGET_USER} -d ${TARGET_DB} \\"
    log_error "    -c 'DROP SCHEMA migration_stage CASCADE;'"
    exit 1
fi

# Record (or refresh) the fingerprint for future re-runs against the same dump.
docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" \
    psql -U "$TARGET_USER" -d "$TARGET_DB" -v ON_ERROR_STOP=1 -c "
    INSERT INTO migration_stage.metadata (key, value)
    VALUES ('dump_fingerprint', '$DUMP_FP')
    ON CONFLICT (key) DO UPDATE
        SET value      = EXCLUDED.value,
            updated_at = now();" >> "$LOG_FILE" 2>&1

# --- Step 2c: Pre-emptively advance topics_topic_id_seq past max(topic_id). ---
# If a prior broken run's setval reset the sequence BEHIND max(topic_id), any
# INSERT into public.topics in Step 3b would fail with a topic_id PK violation
# (nextval() would return an already-in-use ID). Our ON CONFLICT (topic_name)
# only catches topic_name collisions, not topic_id collisions, so we MUST fix
# the sequence before any INSERT runs. GREATEST(current, max, 1) never winds
# backward — safe alongside live VOLTTRON writers.
log_info "Step 2c: Ensuring topics_topic_id_seq is ahead of max(topic_id)..."
# Wrapped in a DO block so if the target has no owned sequence on topics.topic_id
# (e.g. manually-created schema with INTEGER PK, not SERIAL), we log-and-skip
# rather than aborting. Topics-merge in Step 3b assumes SERIAL-driven default —
# if there's no sequence, the merge will fail loudly with a clearer error there.
docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" \
    psql -U "$TARGET_USER" -d "$TARGET_DB" -v ON_ERROR_STOP=1 -c "
    DO \$\$
    DECLARE
        seq_name text := pg_get_serial_sequence('public.topics', 'topic_id');
    BEGIN
        IF seq_name IS NULL THEN
            RAISE NOTICE 'No owned sequence on topics.topic_id — skipping repair. Step 3b topics-merge may need explicit topic_id values or a manually-attached sequence.';
        ELSE
            PERFORM setval(
                seq_name,
                GREATEST(
                    (SELECT last_value FROM public.topics_topic_id_seq),
                    (SELECT COALESCE(MAX(topic_id), 0) FROM public.topics),
                    1
                ),
                true
            );
        END IF;
    END
    \$\$;" >> "$LOG_FILE" 2>&1
log_success "Sequence ready"

# ---------------------------------------------------------------------------
# Step 3: Load staging, then merge in chunks
# ---------------------------------------------------------------------------
log_info "Step 3/3: Loading staging and merging into target..."

# --- Step 3a: Stream the gzipped dump into staging in one transaction. ---
# The sed pipeline rewrites the two COPY header lines to redirect into the
# migration_stage schema, and DELETES any 'SELECT pg_catalog.setval(...)'
# line pg_dump appends after the data blocks — that is the exact statement
# that corrupted topics_topic_id_seq on the previous broken script.
# Data rows never match ^COPY  or ^SELECT pg_catalog\.setval\( , so multi-GB
# payloads stream through untouched at line-buffer speed.
log_info "Truncating staging and streaming dump into it (single transaction)..."

docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" \
    psql -U "$TARGET_USER" -d "$TARGET_DB" -v ON_ERROR_STOP=1 \
    -c "TRUNCATE migration_stage.topics, migration_stage.data;" >> "$LOG_FILE" 2>&1

STEP3A_START=$(date +%s)
set -o pipefail
if ! gzip -dc "$DUMP_FILE" \
    | sed -E '
        s/^COPY public\.data /COPY migration_stage.data /
        s/^COPY public\.topics /COPY migration_stage.topics /
        s/^COPY data /COPY migration_stage.data /
        s/^COPY topics /COPY migration_stage.topics /
        /^SELECT pg_catalog\.setval\(/d
    ' \
    | docker exec -i -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" \
        psql -U "$TARGET_USER" -d "$TARGET_DB" -v ON_ERROR_STOP=1 --single-transaction --quiet 2>> "$LOG_FILE"; then
    set +o pipefail
    log_error "Staging load failed - check log file for details"
    exit 1
fi
set +o pipefail
STEP3A_ELAPSED=$(( $(date +%s) - STEP3A_START ))
log_success "Staging load completed in ${STEP3A_ELAPSED}s"

# Index staging.data on ts to speed the per-chunk range scans, and analyze
# so the planner picks index scans over seq scans on the chunked merge.
log_info "Indexing and analyzing staging..."
docker exec -i -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" \
    psql -U "$TARGET_USER" -d "$TARGET_DB" -v ON_ERROR_STOP=1 <<'EOF' >> "$LOG_FILE" 2>&1
CREATE INDEX IF NOT EXISTS migration_stage_data_ts_idx ON migration_stage.data (ts);
ANALYZE migration_stage.topics;
ANALYZE migration_stage.data;
EOF

STAGING_TOPICS_COUNT=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" \
    psql -U "$TARGET_USER" -d "$TARGET_DB" -tA -c "SELECT count(*) FROM migration_stage.topics;" 2>/dev/null | xargs)
STAGING_DATA_COUNT=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" \
    psql -U "$TARGET_USER" -d "$TARGET_DB" -tA -c "SELECT count(*) FROM migration_stage.data;" 2>/dev/null | xargs)
log_info "Staging: $STAGING_TOPICS_COUNT topics, $STAGING_DATA_COUNT data rows"

# --- Step 3b: Merge topics with topic_id remapping via topic_name. ---
# topic_id is SERIAL on both sides; source-side IDs must NOT be copied blindly
# because a target that already has topics (from live VOLTTRON ingest, prior
# partial runs, etc.) can have divergent name->id assignments. The natural key
# is topic_name (UNIQUE); everything downstream uses topic_id_map to translate.
log_info "Merging topics via topic_name..."
docker exec -i -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" \
    psql -U "$TARGET_USER" -d "$TARGET_DB" -v ON_ERROR_STOP=1 <<'EOF' >> "$LOG_FILE" 2>&1
BEGIN;

-- 1. Insert brand-new topic_names; let target's SERIAL assign IDs.
INSERT INTO public.topics (topic_name, metadata)
SELECT s.topic_name, s.metadata
FROM migration_stage.topics s
ON CONFLICT (topic_name) DO NOTHING;

-- 2. Rebuild the source-id -> target-id map for every topic in the dump.
TRUNCATE migration_stage.topic_id_map;
INSERT INTO migration_stage.topic_id_map (src_topic_id, dst_topic_id)
SELECT s.topic_id, t.topic_id
FROM migration_stage.topics s
JOIN public.topics t USING (topic_name);

COMMIT;
EOF

if [ $? -ne 0 ]; then
    log_error "Topics merge failed - check log file for details"
    exit 1
fi
log_success "Topics merged"

# --- Step 3c: Chunked merge of data with progress checkpointing. ---
log_info "Merging data in chunks of interval '$CHUNK_INTERVAL' (resumable)..."

if [ -z "$STAGING_DATA_COUNT" ] || [ "$STAGING_DATA_COUNT" = "0" ]; then
    log_info "No data rows in staging - skipping chunked merge."
else
    # Generate one chunk-start row per period. hi = date_trunc('month', MAX(ts))+1month
    # so the final chunk always covers the tail. We subtract 1 microsecond from hi
    # in generate_series so we don't emit an extra empty chunk at the boundary.
    CHUNK_BOUNDS=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" \
        psql -U "$TARGET_USER" -d "$TARGET_DB" -tA -c "
        WITH bounds AS (
            SELECT date_trunc('month', MIN(ts)) AS lo,
                   date_trunc('month', MAX(ts)) + interval '1 month' AS hi
            FROM migration_stage.data
        )
        SELECT generate_series(lo, hi - interval '1 microsecond', interval '$CHUNK_INTERVAL')::text
        FROM bounds
        WHERE lo IS NOT NULL AND hi IS NOT NULL;
    " 2>> "$LOG_FILE")

    NUM_CHUNKS=$(printf '%s\n' "$CHUNK_BOUNDS" | grep -c . || true)
    log_info "Chunk plan: $NUM_CHUNKS chunk(s) of interval '$CHUNK_INTERVAL'"

    # Background watchdog: prints forward-motion stats every 60s during the merge.
    # Prevents "is it hung?" panic during a single long chunk.
    watchdog() {
        while sleep 60; do
            local stats
            stats=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" \
                psql -U "$TARGET_USER" -d "$TARGET_DB" -tA -F ' ' -c \
                "SELECT count(*), pg_size_pretty(pg_total_relation_size('public.data'))
                 FROM public.data;" 2>/dev/null || echo "unknown unknown")
            log_info "[WATCHDOG] public.data now: $stats"
        done
    }
    watchdog &
    WATCHDOG_PID=$!

    CHUNK_INDEX=0
    CUMULATIVE_INSERTED=0
    while IFS= read -r CHUNK_START; do
        [ -z "$CHUNK_START" ] && continue
        CHUNK_INDEX=$((CHUNK_INDEX + 1))

        # Compute end boundary via psql so date arithmetic matches server-side semantics.
        CHUNK_END=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" \
            psql -U "$TARGET_USER" -d "$TARGET_DB" -tA -c \
            "SELECT ('$CHUNK_START'::timestamp + interval '$CHUNK_INTERVAL')::text;" 2>/dev/null | xargs)

        # Resume: skip if this chunk_start is already recorded with inserted > 0.
        # We deliberately do NOT skip chunks with inserted=0 — a legitimate empty
        # chunk (source has no rows in that window) will still be a fast no-op
        # (ON CONFLICT DO NOTHING against 0 rows), and re-running it defensively
        # covers the rare edge case where a prior SIGINT / crash left a
        # partially-completed chunk marked with inserted=0 despite source having
        # rows there. The re-run's second-INSERT-into-progress ON CONFLICT DO
        # UPDATE will overwrite the stale count with the correct value.
        PRIOR_INSERTED=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" \
            psql -U "$TARGET_USER" -d "$TARGET_DB" -tA -c \
            "SELECT inserted FROM migration_stage.progress WHERE chunk_start = '$CHUNK_START';" 2>/dev/null | xargs)

        if [ -n "$PRIOR_INSERTED" ] && [ "$PRIOR_INSERTED" -gt 0 ]; then
            CUMULATIVE_INSERTED=$((CUMULATIVE_INSERTED + PRIOR_INSERTED))
            log_info "  [$CHUNK_INDEX/$NUM_CHUNKS] Skip $CHUNK_START -> $CHUNK_END (already merged: $PRIOR_INSERTED rows)"
            continue
        fi

        CHUNK_TS_START=$(date +%s)

        # One transaction: merge remapped rows AND record chunk completion.
        # ON CONFLICT DO NOTHING on (topic_id, ts) makes this safe alongside
        # live VOLTTRON writes and safe to re-run.
        docker exec -i -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" \
            psql -U "$TARGET_USER" -d "$TARGET_DB" -v ON_ERROR_STOP=1 <<SQL >> "$LOG_FILE" 2>&1
BEGIN;
WITH ins AS (
    INSERT INTO public.data (ts, topic_id, value_string)
    SELECT d.ts, m.dst_topic_id, d.value_string
    FROM migration_stage.data d
    JOIN migration_stage.topic_id_map m ON m.src_topic_id = d.topic_id
    WHERE d.ts >= '$CHUNK_START' AND d.ts < '$CHUNK_END'
    ON CONFLICT (topic_id, ts) DO NOTHING
    RETURNING 1
)
INSERT INTO migration_stage.progress (chunk_start, chunk_end, inserted)
SELECT '$CHUNK_START'::timestamp, '$CHUNK_END'::timestamp, count(*) FROM ins
ON CONFLICT (chunk_start) DO UPDATE
    SET chunk_end    = EXCLUDED.chunk_end,
        inserted     = EXCLUDED.inserted,
        completed_at = now();
COMMIT;
SQL

        CHUNK_ELAPSED=$(( $(date +%s) - CHUNK_TS_START ))
        CHUNK_INSERTED=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" \
            psql -U "$TARGET_USER" -d "$TARGET_DB" -tA -c \
            "SELECT inserted FROM migration_stage.progress WHERE chunk_start = '$CHUNK_START';" 2>/dev/null | xargs)
        CUMULATIVE_INSERTED=$((CUMULATIVE_INSERTED + ${CHUNK_INSERTED:-0}))

        PCT="?"
        if [ -n "$SOURCE_DATA_COUNT" ] && [ "$SOURCE_DATA_COUNT" -gt 0 ]; then
            PCT=$(( CUMULATIVE_INSERTED * 100 / SOURCE_DATA_COUNT ))
        fi
        log_info "  [$CHUNK_INDEX/$NUM_CHUNKS] $CHUNK_START -> $CHUNK_END : $CHUNK_INSERTED rows in ${CHUNK_ELAPSED}s (cumulative $CUMULATIVE_INSERTED, ${PCT}%)"
    done <<< "$CHUNK_BOUNDS"

    # Stop watchdog
    if [ -n "$WATCHDOG_PID" ] && kill -0 "$WATCHDOG_PID" 2>/dev/null; then
        kill "$WATCHDOG_PID" 2>/dev/null || true
        wait "$WATCHDOG_PID" 2>/dev/null || true
        WATCHDOG_PID=""
    fi
fi

log_success "Chunked merge completed"

# ---------------------------------------------------------------------------
# Post-merge: repair sequence, create deferred indexes, analyze
# ---------------------------------------------------------------------------

# Repair topics_topic_id_seq if a prior broken run reset it BELOW max(topic_id).
# Never wind the sequence backward — that would race with concurrent VOLTTRON
# writers. GREATEST(current, max) leaves an already-ahead sequence alone and
# advances a behind sequence forward.
log_info "Repairing topics_topic_id_seq if needed..."
# Only run the repair if topics.topic_id has an owned sequence. Manually-created
# schemas with INTEGER PK don't have one and don't need a repair.
SEQ_NAME=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" \
    psql -U "$TARGET_USER" -d "$TARGET_DB" -tA -c \
    "SELECT pg_get_serial_sequence('public.topics', 'topic_id');" 2>/dev/null | xargs)

if [ -z "$SEQ_NAME" ]; then
    log_info "topics.topic_id has no owned sequence — skipping sequence repair."
else
    SEQ_BEFORE=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" \
        psql -U "$TARGET_USER" -d "$TARGET_DB" -tA -c \
        "SELECT last_value FROM $SEQ_NAME;" 2>/dev/null | xargs)

    docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" \
        psql -U "$TARGET_USER" -d "$TARGET_DB" -v ON_ERROR_STOP=1 -c "
        SELECT setval(
            '$SEQ_NAME',
            GREATEST(
                (SELECT last_value FROM $SEQ_NAME),
                (SELECT COALESCE(MAX(topic_id), 0) FROM public.topics),
                1
            ),
            true
        );" >> "$LOG_FILE" 2>&1

    SEQ_AFTER=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" \
        psql -U "$TARGET_USER" -d "$TARGET_DB" -tA -c \
        "SELECT last_value FROM $SEQ_NAME;" 2>/dev/null | xargs)

    if [ "$SEQ_BEFORE" != "$SEQ_AFTER" ]; then
        log_warning "Repaired topics_topic_id_seq from $SEQ_BEFORE to $SEQ_AFTER — VOLTTRON's next topic insert would have collided before this fix."
    else
        log_success "topics_topic_id_seq unchanged (at $SEQ_AFTER, ahead of max(topic_id) — safe)"
    fi
fi

# Create deferred secondary indexes on public.data now that the bulk load is done.
log_info "Creating deferred secondary indexes on public.data..."
docker exec -i -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" \
    psql -U "$TARGET_USER" -d "$TARGET_DB" -v ON_ERROR_STOP=1 <<'EOF' >> "$LOG_FILE" 2>&1
CREATE INDEX IF NOT EXISTS idx_data_ts       ON public.data(ts);
CREATE INDEX IF NOT EXISTS idx_data_topic_id ON public.data(topic_id);
EOF
log_success "Indexes ensured"

# ---------------------------------------------------------------------------
# Verify migration
# ---------------------------------------------------------------------------
echo ""
log_info "Verifying migration..."

# Get final target counts
FINAL_TOPICS_COUNT=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" psql -U "$TARGET_USER" -d "$TARGET_DB" -t -c "SELECT COUNT(*) FROM topics;" 2>/dev/null | xargs)
FINAL_DATA_COUNT=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" psql -U "$TARGET_USER" -d "$TARGET_DB" -t -c "SELECT COUNT(*) FROM data;" 2>/dev/null | xargs)

TOPICS_INSERTED=$((FINAL_TOPICS_COUNT - TARGET_TOPICS_COUNT))
DATA_INSERTED=$((FINAL_DATA_COUNT - TARGET_DATA_COUNT))

log_info "Migration results:"
log_info "  Topics inserted: $TOPICS_INSERTED (total: $FINAL_TOPICS_COUNT)"
log_info "  Data inserted: $DATA_INSERTED (total: $FINAL_DATA_COUNT)"

# Validation
if [ "$FINAL_DATA_COUNT" -lt "$TARGET_DATA_COUNT" ]; then
    log_error "Target has fewer records after migration! Something went wrong."
    exit 1
fi

if [ "$DATA_INSERTED" -eq 0 ] && [ "$SOURCE_DATA_COUNT" -gt 0 ]; then
    log_warning "No new records inserted - data may already exist in target"
fi

# Optimize target database
log_info "Optimizing target database..."
docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" psql -U "$TARGET_USER" -d "$TARGET_DB" -c "ANALYZE topics; ANALYZE data;" > /dev/null 2>> "$LOG_FILE"
log_success "Database optimized"

# Mark migration as successful so cleanup() knows to restore pg_hba and to
# suppress the "resume with --skip-export" hint.
MIGRATION_OK=true

# Final summary
echo ""
echo "=============================================="
log_success "Migration completed successfully!"
echo "=============================================="
echo ""
log_info "Summary:"
log_info "  Source: $SOURCE_DATA_COUNT data records, $SOURCE_TOPICS_COUNT topics"
log_info "  Target before: $TARGET_DATA_COUNT data records, $TARGET_TOPICS_COUNT topics"
log_info "  Target after: $FINAL_DATA_COUNT data records, $FINAL_TOPICS_COUNT topics"
log_info "  Records migrated: $DATA_INSERTED data records, $TOPICS_INSERTED topics"

if [ "$KEEP_STAGING" = false ]; then
    echo ""
    log_info "To reclaim staging space (only after you've verified the migration):"
    log_info "  docker exec ${TARGET_CONTAINER} psql -U ${TARGET_USER} -d ${TARGET_DB} \\"
    log_info "    -c 'DROP SCHEMA migration_stage CASCADE;'"
fi

echo ""
log_info "Log file: $LOG_FILE"
echo ""

exit 0
