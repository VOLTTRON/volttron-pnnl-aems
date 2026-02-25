#!/bin/bash
# migrate-historian-data.sh
# Manual migration script for historian time-series data
# Run from aems-app directory: ./migrate-historian-data.sh
#
# Migrates data from legacy grafana-db to historian database
# Provides full visibility and control over the migration process
#
# PREREQUISITES:
# 1. Start the temporary grafana-db service:
#    docker compose -f docker-compose.grafana-db.yml up -d
# 2. Ensure historian service is running:
#    cd docker && docker compose up -d historian
# 3. Run this script from the aems-app directory

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
SOURCE_USER="${SOURCE_USER:-postgres}"
TARGET_USER="${TARGET_USER:-historian}"
LOG_FILE="migration-$(date +%Y%m%d-%H%M%S).log"
DRY_RUN=false
VERIFY_ONLY=false

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

Migrates historian time-series data from legacy grafana-db to historian database.

PREREQUISITES:
  Before running this script, you must start the temporary grafana-db service:
    docker compose -f docker-compose.grafana-db.yml up -d

  Ensure the historian service is also running in the main docker-compose.yml.

Options:
    --source CONTAINER      Source container name (default: ${COMPOSE_PROJECT_NAME}-grafana-db)
    --target CONTAINER      Target container name (default: ${COMPOSE_PROJECT_NAME}-historian)
    --source-db NAME        Source database name (default: historian)
    --target-db NAME        Target database name (default: historian)
    --dry-run               Show what would be done without making changes
    --verify-only           Only verify current state, don't migrate
    --help                  Show this help message

Examples:
    # Full migration workflow
    docker compose -f docker-compose.grafana-db.yml up -d
    ./migrate-historian-data.sh
    docker compose -f docker-compose.grafana-db.yml down

    # Verify state without migrating
    ./migrate-historian-data.sh --verify-only

    # Dry run to see what would happen
    ./migrate-historian-data.sh --dry-run

    # Custom container names (if needed)
    ./migrate-historian-data.sh --source my-old-db --target my-new-db

AFTER MIGRATION:
  Once migration is complete and verified, stop the temporary service:
    docker compose -f docker-compose.grafana-db.yml down

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
if [ "$DRY_RUN" = true ]; then
    log_warning "  Mode: DRY RUN (no changes will be made)"
fi
if [ "$VERIFY_ONLY" = true ]; then
    log_info "  Mode: VERIFY ONLY"
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
SOURCE_TOPICS_COUNT=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$SOURCE_CONTAINER" psql -U "$SOURCE_USER" -d "$SOURCE_DB" -t -c "SELECT COUNT(*) FROM topics;" 2>/dev/null | xargs)
SOURCE_DATA_COUNT=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$SOURCE_CONTAINER" psql -U "$SOURCE_USER" -d "$SOURCE_DB" -t -c "SELECT COUNT(*) FROM data;" 2>/dev/null | xargs)

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
    
    # Backup the original file
    docker exec "$SOURCE_CONTAINER" sh -c "cp '$HBA_FILE' '${HBA_FILE}.backup' 2>/dev/null || true"
    
    # Prepend md5 authentication rules to the TOP of the file (takes precedence over existing rules)
    log_info "Adding md5 authentication rules to pg_hba.conf..."
    docker exec "$SOURCE_CONTAINER" sh -c "sed -i '1i# ==== Added by migration script for database access ====' '$HBA_FILE'"
    docker exec "$SOURCE_CONTAINER" sh -c "sed -i '2ilocal all all md5' '$HBA_FILE'"
    docker exec "$SOURCE_CONTAINER" sh -c "sed -i '3ihost all all all md5' '$HBA_FILE'"
    docker exec "$SOURCE_CONTAINER" sh -c "sed -i '4i# ====================================================' '$HBA_FILE'"
    
    # Restart the container to apply changes (more reliable than reload)
    log_info "Restarting container to apply pg_hba.conf changes..."
    docker compose -f docker-compose.grafana-db.yml restart grafana-db >> "$LOG_FILE" 2>&1
    
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
    SOURCE_TOPICS_COUNT=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$SOURCE_CONTAINER" psql -U "$SOURCE_USER" -d "$SOURCE_DB" -t -c "SELECT COUNT(*) FROM topics;" 2>/dev/null | xargs)
    SOURCE_DATA_COUNT=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$SOURCE_CONTAINER" psql -U "$SOURCE_USER" -d "$SOURCE_DB" -t -c "SELECT COUNT(*) FROM data;" 2>/dev/null | xargs)
    
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
SOURCE_MIN_TS=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$SOURCE_CONTAINER" psql -U "$SOURCE_USER" -d "$SOURCE_DB" -t -c "SELECT MIN(ts) FROM data;" 2>/dev/null | xargs)
SOURCE_MAX_TS=$(docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$SOURCE_CONTAINER" psql -U "$SOURCE_USER" -d "$SOURCE_DB" -t -c "SELECT MAX(ts) FROM data;" 2>/dev/null | xargs)

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
    log_info "  Strategy: Using pg_dump and pg_restore"
    exit 0
fi

# Confirm with user
echo ""
log_warning "Ready to migrate data from $SOURCE_CONTAINER to $TARGET_CONTAINER"
log_info "This will:"
log_info "  1. Export data from source database"
log_info "  2. Import data to target database"
log_info "  3. Skip duplicate records (existing data preserved)"
read -p "Proceed with migration? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Migration cancelled by user"
    exit 0
fi

# Perform migration
echo ""
log_info "Starting migration process..."
log_info "This may take several minutes for large datasets..."
echo ""

# Create temporary directory for dump files
TEMP_DIR=$(mktemp -d)
DUMP_FILE="$TEMP_DIR/historian_dump.sql"

cleanup() {
    log_info "Cleaning up temporary files..."
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

# Step 1: Export from source
log_info "Step 1/3: Exporting data from source database..."
if docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$SOURCE_CONTAINER" pg_dump -U "$SOURCE_USER" -d "$SOURCE_DB" \
    --table=topics --table=data \
    --data-only \
    --inserts \
    --on-conflict-do-nothing \
    > "$DUMP_FILE" 2>> "$LOG_FILE"; then
    log_success "Export completed"
    DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
    log_info "Dump file size: $DUMP_SIZE"
else
    log_error "Export failed - check log file for details"
    exit 1
fi

# Step 2: Prepare target database
log_info "Step 2/3: Preparing target database..."

# Create tables if they don't exist
docker exec -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" psql -U "$TARGET_USER" -d "$TARGET_DB" > /dev/null 2>> "$LOG_FILE" << 'EOF'
-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS topics (
    topic_id SERIAL PRIMARY KEY,
    topic_name VARCHAR(512) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS data (
    ts TIMESTAMP NOT NULL,
    topic_id INTEGER REFERENCES topics(topic_id),
    value_string TEXT,
    UNIQUE(ts, topic_id)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_data_ts ON data(ts);
CREATE INDEX IF NOT EXISTS idx_data_topic_id ON data(topic_id);
CREATE INDEX IF NOT EXISTS idx_topics_name ON topics(topic_name);
EOF

if [ $? -eq 0 ]; then
    log_success "Target database prepared"
else
    log_error "Failed to prepare target database"
    exit 1
fi

# Step 3: Import to target
log_info "Step 3/3: Importing data to target database..."
log_info "This may take a while for large datasets..."

# Modify dump file to use ON CONFLICT DO NOTHING
sed -i 's/INSERT INTO topics/INSERT INTO topics ON CONFLICT (topic_name) DO NOTHING /g' "$DUMP_FILE" 2>/dev/null || \
    sed -i '' 's/INSERT INTO topics/INSERT INTO topics ON CONFLICT (topic_name) DO NOTHING /g' "$DUMP_FILE"

sed -i 's/INSERT INTO data VALUES/INSERT INTO data VALUES ON CONFLICT (ts, topic_id) DO NOTHING /g' "$DUMP_FILE" 2>/dev/null || \
    sed -i '' 's/INSERT INTO data VALUES/INSERT INTO data VALUES ON CONFLICT (ts, topic_id) DO NOTHING /g' "$DUMP_FILE"

# Import data
if cat "$DUMP_FILE" | docker exec -i -e PGPASSWORD="${HISTORIAN_DATABASE_PASSWORD}" "$TARGET_CONTAINER" psql -U "$TARGET_USER" -d "$TARGET_DB" > /dev/null 2>> "$LOG_FILE"; then
    log_success "Import completed"
else
    log_error "Import failed - check log file for details"
    exit 1
fi

# Verify migration
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
echo ""
log_info "Log file: $LOG_FILE"
echo ""

exit 0
