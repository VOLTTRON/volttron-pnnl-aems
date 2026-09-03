#!/bin/bash
# subscribe-historian.sh
# Resumable subscriber provisioning + historical-data backfill.
# Run from anywhere with psql on PATH and network access to both endpoints.
#
# Solves two structural problems with PG native subscription initial-COPY:
#   1. copy_data=true is a single transaction on the subscriber; any
#      interruption rolls back to zero rows and starts over. Unreliable
#      cellular links never complete a multi-GB initial sync.
#   2. If a subscription is offline long enough for the publisher to
#      invalidate the slot (wal_status='lost'), a copy_data=true re-init
#      hits the same problem.
#
# Instead: CREATE SUBSCRIPTION WITH (copy_data=false) so streaming starts
# from now, then backfill historical data in chunked, checkpointed
# INSERT...ON CONFLICT DO NOTHING transactions that are resumable across
# arbitrary network drops. Same code path handles first-time provisioning
# and re-init after slot invalidation.

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[1;36m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[OK]${NC} $*"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }
log_dry()     { echo -e "${YELLOW}[DRY-RUN]${NC} $*"; }

show_help() {
    cat <<'HELP'
Usage: subscribe-historian.sh [OPTIONS]

Resumable subscriber provisioning + backfill. Creates the subscription with
copy_data=false so streaming begins immediately from the publisher's current
LSN, then fills historical data in resumable chunked transactions.

Publisher connection:
  --publisher-host HOST         Publisher hostname (required)
  --publisher-port PORT         Default: 6543 (HISTORIAN_REPLICATION_PORT)
  --publisher-db NAME           Default: historian
  --publisher-user USER         Default: replicator
  --publisher-password PW       Publisher replicator password (or use env
                                PGPASSWORD_PUBLISHER, or --publisher-password-file)
  --publisher-password-file F   Read publisher password from a file
  --publisher-sslmode MODE      Default: require

Subscriber connection:
  --subscriber-host HOST        Subscriber hostname (default: localhost)
  --subscriber-port PORT        Default: 5432
  --subscriber-db NAME          Default: historian
  --subscriber-user USER        Default: postgres
  --subscriber-password PW      Subscriber password (or env PGPASSWORD_SUBSCRIBER,
                                or --subscriber-password-file)
  --subscriber-password-file F  Read subscriber password from a file
  --subscriber-sslmode MODE     Default: prefer

Behavior:
  --subscription-name NAME      Default: historian_sub
  --slot-name NAME              Default: historian_sub_slot
                                Use different names when a publisher hosts
                                multiple subscribers.
  --chunk-interval INTERVAL     Backfill chunk width. Default: '1 week'.
                                Shrink on unreliable links.
  --start-ts TIMESTAMP          Override backfill window start
                                (default: MIN(ts) on publisher).
  --skip-schema                 Assume public.data/topics already exist.
  --skip-subscription           Do not create the subscription (backfill only).
  --verify-only                 Skip DDL/subscription/backfill, only compare counts.
  --dry-run                     Report actions without executing.
  -y, --yes                     Skip interactive confirmation.
  -h, --help                    Show this message.

The script is idempotent: safe to interrupt and re-run. Progress is tracked
in public.backfill_progress on the subscriber; each chunk is retried
independently if it fails.
HELP
    exit 0
}

# Defaults
PUB_HOST=""
PUB_PORT="${HISTORIAN_REPLICATION_PORT:-6543}"
PUB_DB="historian"
PUB_USER="replicator"
PUB_PW=""
PUB_PW_FILE=""
PUB_SSLMODE="require"

SUB_HOST="localhost"
SUB_PORT="5432"
SUB_DB="historian"
SUB_USER="postgres"
SUB_PW=""
SUB_PW_FILE=""
SUB_SSLMODE="prefer"

SUB_NAME="historian_sub"
SLOT_NAME="historian_sub_slot"
CHUNK_INTERVAL="1 week"
START_TS=""
SKIP_SCHEMA=false
SKIP_SUBSCRIPTION=false
VERIFY_ONLY=false
DRY_RUN=false
FORCE=false

# Parse args
while [[ $# -gt 0 ]]; do
    case "$1" in
        --publisher-host)          PUB_HOST="$2"; shift 2 ;;
        --publisher-port)          PUB_PORT="$2"; shift 2 ;;
        --publisher-db)            PUB_DB="$2"; shift 2 ;;
        --publisher-user)          PUB_USER="$2"; shift 2 ;;
        --publisher-password)      PUB_PW="$2"; shift 2 ;;
        --publisher-password-file) PUB_PW_FILE="$2"; shift 2 ;;
        --publisher-sslmode)       PUB_SSLMODE="$2"; shift 2 ;;
        --subscriber-host)          SUB_HOST="$2"; shift 2 ;;
        --subscriber-port)          SUB_PORT="$2"; shift 2 ;;
        --subscriber-db)            SUB_DB="$2"; shift 2 ;;
        --subscriber-user)          SUB_USER="$2"; shift 2 ;;
        --subscriber-password)      SUB_PW="$2"; shift 2 ;;
        --subscriber-password-file) SUB_PW_FILE="$2"; shift 2 ;;
        --subscriber-sslmode)       SUB_SSLMODE="$2"; shift 2 ;;
        --subscription-name) SUB_NAME="$2"; shift 2 ;;
        --slot-name)         SLOT_NAME="$2"; shift 2 ;;
        --chunk-interval)  CHUNK_INTERVAL="$2"; shift 2 ;;
        --start-ts)        START_TS="$2"; shift 2 ;;
        --skip-schema)     SKIP_SCHEMA=true; shift ;;
        --skip-subscription) SKIP_SUBSCRIPTION=true; shift ;;
        --verify-only)     VERIFY_ONLY=true; shift ;;
        --dry-run)         DRY_RUN=true; shift ;;
        -y|--yes)          FORCE=true; shift ;;
        -h|--help)         show_help ;;
        *)
            log_error "Unknown argument: $1"
            echo "Use -h for help."
            exit 2
            ;;
    esac
done

# Load .env if present (allows COMPOSE_PROJECT_NAME etc. defaults)
if [ -f ".env" ]; then
    while IFS= read -r line || [ -n "$line" ]; do
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "$line" ]] && continue
        if [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)= ]]; then
            export "$line"
        fi
    done < .env
fi

# Resolve password sources
[ -z "$PUB_PW" ] && [ -n "${PGPASSWORD_PUBLISHER:-}" ] && PUB_PW="$PGPASSWORD_PUBLISHER"
[ -z "$PUB_PW" ] && [ -n "$PUB_PW_FILE" ] && [ -s "$PUB_PW_FILE" ] && PUB_PW="$(cat "$PUB_PW_FILE")"
[ -z "$SUB_PW" ] && [ -n "${PGPASSWORD_SUBSCRIBER:-}" ] && SUB_PW="$PGPASSWORD_SUBSCRIBER"
[ -z "$SUB_PW" ] && [ -n "$SUB_PW_FILE" ] && [ -s "$SUB_PW_FILE" ] && SUB_PW="$(cat "$SUB_PW_FILE")"

# Validate required args
if [ -z "$PUB_HOST" ]; then
    log_error "--publisher-host is required"
    exit 2
fi

# Verify psql available
if ! command -v psql >/dev/null 2>&1; then
    log_error "psql not found on PATH. Install PostgreSQL client tools."
    exit 1
fi

# Helper functions for psql invocation
publisher_psql() {
    PGPASSWORD="$PUB_PW" psql \
        -h "$PUB_HOST" -p "$PUB_PORT" -U "$PUB_USER" -d "$PUB_DB" \
        -v ON_ERROR_STOP=1 \
        --set=sslmode="$PUB_SSLMODE" \
        "$@"
}
subscriber_psql() {
    PGPASSWORD="$SUB_PW" psql \
        -h "$SUB_HOST" -p "$SUB_PORT" -U "$SUB_USER" -d "$SUB_DB" \
        -v ON_ERROR_STOP=1 \
        --set=sslmode="$SUB_SSLMODE" \
        "$@"
}

run_or_dry_pub() {
    if [ "$DRY_RUN" = true ]; then
        log_dry "publisher: $*"
    else
        publisher_psql "$@"
    fi
}
run_or_dry_sub() {
    if [ "$DRY_RUN" = true ]; then
        log_dry "subscriber: $*"
    else
        subscriber_psql "$@"
    fi
}

# Banner
echo "================================================"
echo "Historian Subscriber Provisioning"
[ "$DRY_RUN" = true ] && echo "MODE: DRY RUN (no writes)"
echo "================================================"
log_info "Publisher:  $PUB_USER@$PUB_HOST:$PUB_PORT/$PUB_DB (sslmode=$PUB_SSLMODE)"
log_info "Subscriber: $SUB_USER@$SUB_HOST:$SUB_PORT/$SUB_DB (sslmode=$SUB_SSLMODE)"
log_info "Chunk interval: $CHUNK_INTERVAL"

# Connectivity checks
log_info "Verifying connectivity..."
if ! publisher_psql -tA -c "SELECT 1" >/dev/null 2>&1; then
    log_error "Cannot connect to publisher."
    exit 1
fi
log_success "Publisher reachable"
if ! subscriber_psql -tA -c "SELECT 1" >/dev/null 2>&1; then
    log_error "Cannot connect to subscriber."
    exit 1
fi
log_success "Subscriber reachable"

# Verify publication exists on publisher
PUB_EXISTS=$(publisher_psql -tA -c "SELECT count(*) FROM pg_publication WHERE pubname='historian_pub';")
if [ "$PUB_EXISTS" != "1" ]; then
    log_error "Publication 'historian_pub' does not exist on publisher."
    log_error "Run repair-historian-replication.sh on the publisher first."
    exit 1
fi
log_success "Publication historian_pub present on publisher"

# ------- VERIFY-ONLY MODE --------
if [ "$VERIFY_ONLY" = true ]; then
    log_info "Verify-only mode: comparing row counts..."
    PUB_TOPICS=$(publisher_psql -tA -c "SELECT count(*) FROM public.topics" | xargs)
    PUB_DATA=$(publisher_psql -tA -c "SELECT count(*) FROM public.data" | xargs)
    SUB_TOPICS=$(subscriber_psql -tA -c "SELECT count(*) FROM public.topics" | xargs)
    SUB_DATA=$(subscriber_psql -tA -c "SELECT count(*) FROM public.data" | xargs)
    log_info "  topics: publisher=$PUB_TOPICS subscriber=$SUB_TOPICS"
    log_info "  data:   publisher=$PUB_DATA subscriber=$SUB_DATA"
    if [ "$SUB_DATA" -ge "$PUB_DATA" ] && [ "$SUB_TOPICS" -ge "$PUB_TOPICS" ]; then
        log_success "Subscriber is converged with publisher (or ahead due to late writes)"
        exit 0
    else
        log_warning "Subscriber is behind. Re-run without --verify-only to backfill."
        exit 2
    fi
fi

# Confirmation prompt
if [ "$DRY_RUN" = false ] && [ "$FORCE" = false ]; then
    echo ""
    log_warning "This will create (or reuse) the historian_sub subscription and backfill data."
    read -p "Continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log_warning "Cancelled by user."
        exit 0
    fi
fi

# ------- STEP 1: SCHEMA --------
if [ "$SKIP_SCHEMA" = false ]; then
    log_info "Step 1: ensuring subscriber schema matches publisher..."
    SUB_HAS_DATA=$(subscriber_psql -tA -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('data','topics')" | xargs)
    if [ "$SUB_HAS_DATA" = "2" ]; then
        log_info "Both tables exist on subscriber; skipping DDL. Use the UI's Card 1-3 SQL to verify schema alignment."
    else
        log_info "Cloning DDL from publisher..."
        if ! command -v pg_dump >/dev/null 2>&1; then
            log_error "pg_dump not found on PATH — needed for schema clone."
            log_error "Alternatively, run the DDL from the /historian UI's Cards 1-3 manually, then re-run with --skip-schema."
            exit 1
        fi
        if [ "$DRY_RUN" = true ]; then
            log_dry "pg_dump --schema-only -t public.data -t public.topics ... | subscriber psql"
        else
            # --no-owner / --no-privileges: the subscriber typically doesn't
            # have the publisher's roles (e.g. 'historian'), so strip
            # ownership / GRANT statements from the dumped DDL.
            PGPASSWORD="$PUB_PW" pg_dump \
                -h "$PUB_HOST" -p "$PUB_PORT" -U "$PUB_USER" -d "$PUB_DB" \
                --schema-only --no-owner --no-privileges \
                -t public.data -t public.topics -t public.topics_topic_id_seq \
                | PGPASSWORD="$SUB_PW" psql \
                    -h "$SUB_HOST" -p "$SUB_PORT" -U "$SUB_USER" -d "$SUB_DB" \
                    -v ON_ERROR_STOP=1
        fi
        log_success "Schema cloned"
    fi
else
    log_info "Step 1: --skip-schema, assuming subscriber DDL exists"
fi

# ------- STEP 2: TOPICS COPY (small, one-shot) --------
log_info "Step 2: copying public.topics..."
if [ "$DRY_RUN" = true ]; then
    log_dry "COPY public.topics FROM publisher (small, one-shot)"
else
    # Stage-and-merge so ON CONFLICT works and we don't need the sequence to align
    subscriber_psql <<'SQL'
CREATE TABLE IF NOT EXISTS public.topics_stage (LIKE public.topics INCLUDING DEFAULTS);
TRUNCATE public.topics_stage;
SQL
    PGPASSWORD="$PUB_PW" psql \
        -h "$PUB_HOST" -p "$PUB_PORT" -U "$PUB_USER" -d "$PUB_DB" \
        -v ON_ERROR_STOP=1 \
        -c "\copy (SELECT topic_id, topic_name, metadata FROM public.topics ORDER BY topic_id) TO STDOUT" \
    | PGPASSWORD="$SUB_PW" psql \
        -h "$SUB_HOST" -p "$SUB_PORT" -U "$SUB_USER" -d "$SUB_DB" \
        -v ON_ERROR_STOP=1 \
        -c "\copy public.topics_stage (topic_id, topic_name, metadata) FROM STDIN"
    subscriber_psql <<'SQL'
INSERT INTO public.topics (topic_id, topic_name, metadata)
SELECT topic_id, topic_name, metadata FROM public.topics_stage
ON CONFLICT (topic_id) DO UPDATE
  SET topic_name = EXCLUDED.topic_name,
      metadata   = EXCLUDED.metadata;
-- Advance the sequence so future local inserts (if any) don't collide.
SELECT setval('public.topics_topic_id_seq', COALESCE((SELECT max(topic_id) FROM public.topics), 1));
DROP TABLE public.topics_stage;
SQL
fi
log_success "topics copied"

# ------- STEP 3: SUBSCRIPTION (copy_data=false) --------
if [ "$SKIP_SUBSCRIPTION" = true ]; then
    log_info "Step 3: --skip-subscription, not touching pg_subscription"
else
    log_info "Step 3: creating/verifying subscription '$SUB_NAME' with copy_data=false..."
    SUB_EXISTS=$(subscriber_psql -tA -c "SELECT count(*) FROM pg_subscription WHERE subname='$SUB_NAME'")
    if [ "$SUB_EXISTS" = "1" ]; then
        # Check the publisher-side slot: healthy ('reserved'/'extended'), lost
        # ('unreserved'/'lost'), or missing (empty result). A subscription
        # whose slot is either lost or missing cannot make progress; re-init.
        SLOT_STATUS=$(publisher_psql -tA -c "SELECT wal_status FROM pg_replication_slots WHERE slot_name='$SLOT_NAME'" | xargs)
        case "$SLOT_STATUS" in
            reserved|extended)
                log_info "Subscription '$SUB_NAME' already exists and slot is healthy — leaving in place."
                ;;
            lost|unreserved)
                log_warning "Publisher slot $SLOT_NAME is invalidated (wal_status=$SLOT_STATUS)."
                log_warning "Dropping and recreating the subscription. Historical rows are preserved on the subscriber."
                if [ "$DRY_RUN" = false ]; then
                    subscriber_psql <<SQL
ALTER SUBSCRIPTION $SUB_NAME DISABLE;
ALTER SUBSCRIPTION $SUB_NAME SET (slot_name = NONE);
DROP SUBSCRIPTION $SUB_NAME;
SQL
                    publisher_psql -c "SELECT pg_drop_replication_slot('$SLOT_NAME');" || true
                    SUB_EXISTS=0
                fi
                ;;
            "")
                log_warning "Subscription '$SUB_NAME' exists on subscriber but slot $SLOT_NAME is missing on publisher."
                log_warning "Dropping and recreating the subscription. Historical rows are preserved."
                if [ "$DRY_RUN" = false ]; then
                    subscriber_psql <<SQL
ALTER SUBSCRIPTION $SUB_NAME DISABLE;
ALTER SUBSCRIPTION $SUB_NAME SET (slot_name = NONE);
DROP SUBSCRIPTION $SUB_NAME;
SQL
                    SUB_EXISTS=0
                fi
                ;;
            *)
                log_info "Subscription '$SUB_NAME' already exists; slot state '$SLOT_STATUS' — leaving in place."
                ;;
        esac
    fi

    if [ "$SUB_EXISTS" != "1" ]; then
        CONN_STR="host=$PUB_HOST port=$PUB_PORT dbname=$PUB_DB user=$PUB_USER password=$PUB_PW sslmode=$PUB_SSLMODE"
        if [ "$DRY_RUN" = true ]; then
            log_dry "CREATE SUBSCRIPTION $SUB_NAME CONNECTION '<...>' PUBLICATION historian_pub WITH (copy_data=false, create_slot=true, enabled=true, slot_name='$SLOT_NAME');"
        else
            subscriber_psql <<SQL
CREATE SUBSCRIPTION $SUB_NAME
CONNECTION '$CONN_STR'
PUBLICATION historian_pub
WITH (
    copy_data   = false,
    create_slot = true,
    enabled     = true,
    slot_name   = '$SLOT_NAME',
    streaming   = 'on'
);
SQL
        fi
        log_success "Subscription created (streaming from now)"
    fi
fi

# ------- STEP 4: PROGRESS TABLE --------
log_info "Step 4: preparing backfill progress table..."
if [ "$DRY_RUN" = false ]; then
    subscriber_psql <<'SQL'
CREATE TABLE IF NOT EXISTS public.backfill_progress (
    chunk_start  timestamp PRIMARY KEY,
    chunk_end    timestamp NOT NULL,
    inserted     bigint,
    completed_at timestamptz NOT NULL DEFAULT now()
);
SQL
fi

# ------- STEP 5: CHUNKED BACKFILL --------
log_info "Step 5: chunked backfill of public.data..."

# Determine bounds
if [ -z "$START_TS" ]; then
    START_TS=$(publisher_psql -tA -c "SELECT COALESCE(MIN(ts), NOW())::text FROM public.data" | xargs)
fi
END_TS=$(publisher_psql -tA -c "SELECT NOW()::text" | xargs)
log_info "Backfill window: [$START_TS, $END_TS) in chunks of $CHUNK_INTERVAL"

# Compute chunk boundaries on the publisher (one per line). We iterate on
# newlines rather than shell word-splitting because timestamps contain spaces.
CHUNKS_FILE="$(mktemp)"
trap 'rm -f "$CHUNKS_FILE"' EXIT
publisher_psql -tA >"$CHUNKS_FILE" <<SQL
SELECT to_char(gs, 'YYYY-MM-DD HH24:MI:SS')
FROM generate_series('$START_TS'::timestamp, '$END_TS'::timestamp, '$CHUNK_INTERVAL'::interval) AS gs
UNION ALL
SELECT to_char('$END_TS'::timestamp, 'YYYY-MM-DD HH24:MI:SS')
ORDER BY 1;
SQL

# Read all boundaries into an array (newline-delimited, spaces allowed within
# each entry). Deduplicate consecutive equal boundaries (the union above adds
# END_TS explicitly, which may coincide with the last generate_series value).
BOUNDS=()
LAST=""
while IFS= read -r line; do
    line="${line%%[[:space:]]}"
    [ -z "$line" ] && continue
    [ "$line" = "$LAST" ] && continue
    BOUNDS+=("$line")
    LAST="$line"
done <"$CHUNKS_FILE"

CHUNK_COUNT=$((${#BOUNDS[@]} - 1))
[ "$CHUNK_COUNT" -lt 0 ] && CHUNK_COUNT=0
log_info "Will process up to $CHUNK_COUNT chunks"

for (( i=0; i<CHUNK_COUNT; i++ )); do
    CHUNK_IDX=$((i + 1))
    CHUNK_START="${BOUNDS[$i]}"
    CHUNK_END="${BOUNDS[$((i + 1))]}"

    if [ "$DRY_RUN" = true ]; then
        log_info "[$CHUNK_IDX/$CHUNK_COUNT] $CHUNK_START -> $CHUNK_END"
        log_dry "  COPY data rows in window and INSERT ... ON CONFLICT DO NOTHING"
        continue
    fi

    # Skip if this chunk already completed
    DONE=$(subscriber_psql -tA -c "SELECT count(*) FROM public.backfill_progress WHERE chunk_start = '$CHUNK_START'::timestamp" | xargs)
    if [ "$DONE" = "1" ]; then
        log_info "[$CHUNK_IDX/$CHUNK_COUNT] $CHUNK_START -> $CHUNK_END  (skip: already completed)"
        continue
    fi

    log_info "[$CHUNK_IDX/$CHUNK_COUNT] $CHUNK_START -> $CHUNK_END"

    # Stage-and-merge in a persistent staging table (dropped after merge).
    # Using a real (non-TEMP) table lets us pipe COPY from a separate psql
    # invocation on the publisher into a psql invocation on the subscriber.
    subscriber_psql -c "DROP TABLE IF EXISTS public.backfill_stage; CREATE UNLOGGED TABLE public.backfill_stage (LIKE public.data);" >/dev/null

    # Retryable: if the pipe fails, we bail and let the operator re-run.
    if ! PGPASSWORD="$PUB_PW" psql \
            -h "$PUB_HOST" -p "$PUB_PORT" -U "$PUB_USER" -d "$PUB_DB" \
            -v ON_ERROR_STOP=1 \
            -c "\copy (SELECT topic_id, ts, value_string FROM public.data WHERE ts >= '$CHUNK_START'::timestamp AND ts < '$CHUNK_END'::timestamp) TO STDOUT" \
        | PGPASSWORD="$SUB_PW" psql \
            -h "$SUB_HOST" -p "$SUB_PORT" -U "$SUB_USER" -d "$SUB_DB" \
            -v ON_ERROR_STOP=1 \
            -c "\copy public.backfill_stage (topic_id, ts, value_string) FROM STDIN"
    then
        log_warning "  chunk failed — re-run the script to retry from here"
        subscriber_psql -c "DROP TABLE IF EXISTS public.backfill_stage;" >/dev/null 2>&1 || true
        exit 3
    fi

    # Merge stage into public.data and checkpoint progress in one transaction.
    # Use a plain SELECT (no BEGIN/COMMIT) so the RETURNING value is the only
    # thing that psql prints — otherwise `tail -1` picks up "COMMIT" instead.
    INSERTED=$(subscriber_psql -tA <<SQL
WITH stage_count AS (
    SELECT count(*)::bigint AS n FROM public.backfill_stage
),
ins AS (
    INSERT INTO public.data (topic_id, ts, value_string)
    SELECT topic_id, ts, value_string FROM public.backfill_stage
    ON CONFLICT (topic_id, ts) DO NOTHING
    RETURNING 1
),
prog AS (
    INSERT INTO public.backfill_progress (chunk_start, chunk_end, inserted)
    VALUES ('$CHUNK_START'::timestamp, '$CHUNK_END'::timestamp, (SELECT count(*) FROM ins))
    RETURNING chunk_start
)
SELECT n FROM stage_count, prog;
SQL
)
    INSERTED=$(printf '%s' "$INSERTED" | tr -d ' ')
    subscriber_psql -c "DROP TABLE IF EXISTS public.backfill_stage;" >/dev/null 2>&1 || true
    log_success "  chunk merged (${INSERTED} rows scanned)"
done

# ------- STEP 6: VERIFY --------
log_info "Step 6: verification..."
PUB_TOPICS=$(publisher_psql -tA -c "SELECT count(*) FROM public.topics" | xargs)
PUB_DATA=$(publisher_psql -tA -c "SELECT count(*) FROM public.data" | xargs)
SUB_TOPICS=$(subscriber_psql -tA -c "SELECT count(*) FROM public.topics" | xargs)
SUB_DATA=$(subscriber_psql -tA -c "SELECT count(*) FROM public.data" | xargs)
log_info "  topics: publisher=$PUB_TOPICS subscriber=$SUB_TOPICS"
log_info "  data:   publisher=$PUB_DATA subscriber=$SUB_DATA"

DELTA=$((PUB_DATA - SUB_DATA))
if [ "$DELTA" -le 0 ]; then
    log_success "Convergence: subscriber has all publisher rows (delta=$DELTA)."
else
    log_warning "Subscriber is $DELTA rows behind. Live streaming will close the gap over time."
    log_warning "Re-run this script (or --verify-only) to check progress."
fi

echo ""
echo "================================================"
log_success "Done."
echo "================================================"
