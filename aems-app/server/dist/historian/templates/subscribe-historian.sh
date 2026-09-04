#!/bin/bash
# subscribe-historian.sh — standalone historian subscriber provisioning.
#
# Run from any machine that has psql + pg_dump on PATH and network access to
# both the publisher and the subscriber. No repo checkout or Docker required.
#
# What it does:
#   1. Clones public.data / public.topics DDL from the publisher.
#   2. COPY's the small public.topics table (one-shot).
#   3. Creates a logical subscription with copy_data=false — streaming begins
#      from the publisher's current LSN immediately.
#   4. Chunked resumable backfill of public.data via `INSERT … ON CONFLICT
#      DO NOTHING`, checkpointed per chunk in public.backfill_progress on
#      the subscriber. Survives arbitrary network drops.
#   5. If the publisher's slot has been invalidated (wal_status='lost' or
#      slot missing), auto-detects and re-creates the subscription; existing
#      rows on the subscriber are preserved through the re-init.
#
# The subscriber can be any PostgreSQL 16+ instance — bare Postgres, no AEMS
# deployment or Docker needed.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
log_info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[OK]${NC} $*"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }
log_dry()     { echo -e "${YELLOW}[DRY-RUN]${NC} $*"; }

show_help() {
    cat <<'HELP'
Usage: subscribe-historian.sh [OPTIONS]

Publisher connection (required unless --verify-only):
  --publisher-host HOST         (or env PUB_HOST)
  --publisher-port PORT         Default: {{PORT}}   (env PUB_PORT)
  --publisher-db NAME           Default: historian  (env PUB_DB)
  --publisher-user USER         Default: replicator (env PUB_USER)
  --publisher-password PW       (env PUB_PASSWORD, or --publisher-password-file)
  --publisher-password-file F
  --publisher-sslmode MODE      Default: {{SSLMODE}} (env PUB_SSLMODE)

Subscriber connection (required):
  --subscriber-host HOST        (env SUB_HOST)
  --subscriber-port PORT        Default: 5432       (env SUB_PORT)
  --subscriber-db NAME          Default: historian  (env SUB_DB)
  --subscriber-user USER        (env SUB_USER)
  --subscriber-password PW      (env SUB_PASSWORD, or --subscriber-password-file)
  --subscriber-password-file F
  --subscriber-sslmode MODE     Default: prefer     (env SUB_SSLMODE)

Behavior:
  --subscription-name NAME      Default: historian_sub
  --slot-name NAME              Default: historian_sub_slot
  --chunk-interval INTERVAL     Backfill chunk width. Default: '1 week'
  --start-ts TIMESTAMP          Backfill window start (default: MIN(ts) on publisher)
  --skip-schema                 Assume tables exist on subscriber
  --skip-subscription           Backfill only; do not touch pg_subscription
  --verify-only                 Only compare row counts
  --dry-run                     Report plan, no writes
  -y, --yes                     Skip interactive confirmation
  -h, --help                    Show this message

The script is idempotent: safe to interrupt (Ctrl-C) and re-run. Progress is
tracked in public.backfill_progress on the subscriber.
HELP
    exit 0
}

PUB_HOST="${PUB_HOST:-}"
PUB_PORT="${PUB_PORT:-{{PORT}}}"
PUB_DB="${PUB_DB:-historian}"
PUB_USER="${PUB_USER:-replicator}"
PUB_PW="${PUB_PASSWORD:-}"
PUB_PW_FILE=""
PUB_SSLMODE="${PUB_SSLMODE:-{{SSLMODE}}}"

SUB_HOST="${SUB_HOST:-}"
SUB_PORT="${SUB_PORT:-5432}"
SUB_DB="${SUB_DB:-historian}"
SUB_USER="${SUB_USER:-}"
SUB_PW="${SUB_PASSWORD:-}"
SUB_PW_FILE=""
SUB_SSLMODE="${SUB_SSLMODE:-prefer}"

SUB_NAME="historian_sub"
SLOT_NAME="historian_sub_slot"
CHUNK_INTERVAL="1 week"
START_TS=""
SKIP_SCHEMA=false
SKIP_SUBSCRIPTION=false
VERIFY_ONLY=false
DRY_RUN=false
FORCE=false

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
        --subscription-name)        SUB_NAME="$2"; shift 2 ;;
        --slot-name)                SLOT_NAME="$2"; shift 2 ;;
        --chunk-interval)           CHUNK_INTERVAL="$2"; shift 2 ;;
        --start-ts)                 START_TS="$2"; shift 2 ;;
        --skip-schema)              SKIP_SCHEMA=true; shift ;;
        --skip-subscription)        SKIP_SUBSCRIPTION=true; shift ;;
        --verify-only)              VERIFY_ONLY=true; shift ;;
        --dry-run)                  DRY_RUN=true; shift ;;
        -y|--yes)                   FORCE=true; shift ;;
        -h|--help)                  show_help ;;
        *)
            log_error "Unknown argument: $1"
            echo "Use -h for help."
            exit 2
            ;;
    esac
done

[ -n "$PUB_PW_FILE" ] && [ -s "$PUB_PW_FILE" ] && PUB_PW="$(cat "$PUB_PW_FILE")"
[ -n "$SUB_PW_FILE" ] && [ -s "$SUB_PW_FILE" ] && SUB_PW="$(cat "$SUB_PW_FILE")"

if [ -z "$PUB_HOST" ]; then log_error "--publisher-host (or env PUB_HOST) is required"; exit 2; fi
if [ -z "$SUB_HOST" ]; then log_error "--subscriber-host (or env SUB_HOST) is required"; exit 2; fi
if [ -z "$SUB_USER" ]; then log_error "--subscriber-user (or env SUB_USER) is required"; exit 2; fi

if ! command -v psql >/dev/null 2>&1; then
    log_error "psql not found on PATH. Install PostgreSQL client tools."
    exit 1
fi

publisher_psql() {
    PGPASSWORD="$PUB_PW" psql \
        -h "$PUB_HOST" -p "$PUB_PORT" -U "$PUB_USER" -d "$PUB_DB" \
        -v ON_ERROR_STOP=1 --set=sslmode="$PUB_SSLMODE" "$@"
}
subscriber_psql() {
    PGPASSWORD="$SUB_PW" psql \
        -h "$SUB_HOST" -p "$SUB_PORT" -U "$SUB_USER" -d "$SUB_DB" \
        -v ON_ERROR_STOP=1 --set=sslmode="$SUB_SSLMODE" "$@"
}

echo "================================================"
echo "Historian Subscriber Provisioning"
[ "$DRY_RUN" = true ] && echo "MODE: DRY RUN (no writes)"
echo "================================================"
log_info "Publisher:  $PUB_USER@$PUB_HOST:$PUB_PORT/$PUB_DB (sslmode=$PUB_SSLMODE)"
log_info "Subscriber: $SUB_USER@$SUB_HOST:$SUB_PORT/$SUB_DB (sslmode=$SUB_SSLMODE)"
log_info "Chunk interval: $CHUNK_INTERVAL"

log_info "Verifying connectivity..."
publisher_psql -tA -c "SELECT 1" >/dev/null 2>&1 || { log_error "Cannot connect to publisher."; exit 1; }
log_success "Publisher reachable"
subscriber_psql -tA -c "SELECT 1" >/dev/null 2>&1 || { log_error "Cannot connect to subscriber."; exit 1; }
log_success "Subscriber reachable"

PUB_EXISTS=$(publisher_psql -tA -c "SELECT count(*) FROM pg_publication WHERE pubname='historian_pub';")
if [ "$PUB_EXISTS" != "1" ]; then
    log_error "Publication 'historian_pub' does not exist on publisher."
    exit 1
fi
log_success "Publication historian_pub present on publisher"

if [ "$VERIFY_ONLY" = true ]; then
    log_info "Verify-only mode: comparing row counts..."
    PUB_TOPICS=$(publisher_psql -tA -c "SELECT count(*) FROM public.topics" | xargs)
    PUB_DATA=$(publisher_psql -tA -c "SELECT count(*) FROM public.data" | xargs)
    SUB_TOPICS=$(subscriber_psql -tA -c "SELECT count(*) FROM public.topics" | xargs)
    SUB_DATA=$(subscriber_psql -tA -c "SELECT count(*) FROM public.data" | xargs)
    log_info "  topics: publisher=$PUB_TOPICS subscriber=$SUB_TOPICS"
    log_info "  data:   publisher=$PUB_DATA subscriber=$SUB_DATA"
    if [ "$SUB_DATA" -ge "$PUB_DATA" ] && [ "$SUB_TOPICS" -ge "$PUB_TOPICS" ]; then
        log_success "Subscriber converged."
        exit 0
    else
        log_warning "Subscriber is behind. Re-run without --verify-only to backfill."
        exit 2
    fi
fi

if [ "$DRY_RUN" = false ] && [ "$FORCE" = false ]; then
    echo ""
    log_warning "This will create (or reuse) the '$SUB_NAME' subscription and start a resumable backfill."
    read -p "Continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then log_warning "Cancelled."; exit 0; fi
fi

# ------- STEP 1: SCHEMA --------
if [ "$SKIP_SCHEMA" = false ]; then
    log_info "Step 1: ensuring subscriber schema matches publisher..."
    SUB_HAS=$(subscriber_psql -tA -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('data','topics')" | xargs)
    if [ "$SUB_HAS" = "2" ]; then
        log_info "Both tables exist on subscriber; skipping DDL."
    else
        if ! command -v pg_dump >/dev/null 2>&1; then
            log_error "pg_dump not found on PATH — needed for schema clone. Install postgresql-client or run --skip-schema after applying DDL manually."
            exit 1
        fi
        if [ "$DRY_RUN" = true ]; then
            log_dry "pg_dump --schema-only … | subscriber psql"
        else
            PGPASSWORD="$PUB_PW" pg_dump \
                -h "$PUB_HOST" -p "$PUB_PORT" -U "$PUB_USER" -d "$PUB_DB" \
                --schema-only --no-owner --no-privileges \
                -t public.data -t public.topics -t public.topics_topic_id_seq \
                | subscriber_psql
            log_success "Schema cloned"
        fi
    fi
else
    log_info "Step 1: --skip-schema"
fi

# ------- STEP 2: TOPICS COPY (small, one-shot) --------
log_info "Step 2: copying public.topics..."
if [ "$DRY_RUN" = true ]; then
    log_dry "COPY public.topics FROM publisher (small, one-shot)"
else
    subscriber_psql <<'SQL'
CREATE TABLE IF NOT EXISTS public.topics_stage (LIKE public.topics INCLUDING DEFAULTS);
TRUNCATE public.topics_stage;
SQL
    PGPASSWORD="$PUB_PW" psql -h "$PUB_HOST" -p "$PUB_PORT" -U "$PUB_USER" -d "$PUB_DB" \
        -v ON_ERROR_STOP=1 \
        -c "\copy (SELECT topic_id, topic_name, metadata FROM public.topics ORDER BY topic_id) TO STDOUT" \
    | subscriber_psql -c "\copy public.topics_stage (topic_id, topic_name, metadata) FROM STDIN"
    subscriber_psql <<'SQL'
INSERT INTO public.topics (topic_id, topic_name, metadata)
SELECT topic_id, topic_name, metadata FROM public.topics_stage
ON CONFLICT (topic_id) DO UPDATE
  SET topic_name = EXCLUDED.topic_name, metadata = EXCLUDED.metadata;
SELECT setval('public.topics_topic_id_seq', COALESCE((SELECT max(topic_id) FROM public.topics), 1));
DROP TABLE public.topics_stage;
SQL
    log_success "topics copied"
fi

# ------- STEP 3: SUBSCRIPTION (copy_data=false) --------
if [ "$SKIP_SUBSCRIPTION" = true ]; then
    log_info "Step 3: --skip-subscription"
else
    log_info "Step 3: creating/verifying subscription '$SUB_NAME' with copy_data=false..."
    SUB_EXISTS=$(subscriber_psql -tA -c "SELECT count(*) FROM pg_subscription WHERE subname='$SUB_NAME'")
    if [ "$SUB_EXISTS" = "1" ]; then
        SLOT_STATUS=$(publisher_psql -tA -c "SELECT wal_status FROM pg_replication_slots WHERE slot_name='$SLOT_NAME'" | xargs)
        case "$SLOT_STATUS" in
            reserved|extended)
                log_info "Subscription healthy — leaving in place."
                ;;
            lost|unreserved|"")
                log_warning "Publisher slot state '$SLOT_STATUS' — dropping and recreating."
                if [ "$DRY_RUN" = false ]; then
                    subscriber_psql <<SQL
ALTER SUBSCRIPTION $SUB_NAME DISABLE;
ALTER SUBSCRIPTION $SUB_NAME SET (slot_name = NONE);
DROP SUBSCRIPTION $SUB_NAME;
SQL
                    publisher_psql -c "SELECT pg_drop_replication_slot('$SLOT_NAME');" 2>/dev/null || true
                    SUB_EXISTS=0
                fi
                ;;
        esac
    fi
    if [ "$SUB_EXISTS" != "1" ]; then
        CONN_STR="host=$PUB_HOST port=$PUB_PORT dbname=$PUB_DB user=$PUB_USER password=$PUB_PW sslmode=$PUB_SSLMODE"
        if [ "$DRY_RUN" = true ]; then
            log_dry "CREATE SUBSCRIPTION $SUB_NAME ... WITH (copy_data=false)"
        else
            subscriber_psql <<SQL
CREATE SUBSCRIPTION $SUB_NAME
CONNECTION '$CONN_STR'
PUBLICATION historian_pub
WITH (copy_data=false, create_slot=true, enabled=true, slot_name='$SLOT_NAME', streaming='on');
SQL
            log_success "Subscription created (streaming from now)"
        fi
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
if [ -z "$START_TS" ]; then
    START_TS=$(publisher_psql -tA -c "SELECT COALESCE(MIN(ts), NOW())::text FROM public.data" | xargs)
fi
END_TS=$(publisher_psql -tA -c "SELECT NOW()::text" | xargs)
log_info "Backfill window: [$START_TS, $END_TS) in chunks of $CHUNK_INTERVAL"

CHUNKS_FILE="$(mktemp)"
trap 'rm -f "$CHUNKS_FILE"' EXIT
publisher_psql -tA >"$CHUNKS_FILE" <<SQL
SELECT to_char(gs, 'YYYY-MM-DD HH24:MI:SS')
FROM generate_series('$START_TS'::timestamp, '$END_TS'::timestamp, '$CHUNK_INTERVAL'::interval) AS gs
UNION ALL
SELECT to_char('$END_TS'::timestamp, 'YYYY-MM-DD HH24:MI:SS')
ORDER BY 1;
SQL

BOUNDS=(); LAST=""
while IFS= read -r line; do
    line="${line%%[[:space:]]}"
    [ -z "$line" ] && continue
    [ "$line" = "$LAST" ] && continue
    BOUNDS+=("$line"); LAST="$line"
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

    DONE=$(subscriber_psql -tA -c "SELECT count(*) FROM public.backfill_progress WHERE chunk_start = '$CHUNK_START'::timestamp" | xargs)
    if [ "$DONE" = "1" ]; then
        log_info "[$CHUNK_IDX/$CHUNK_COUNT] $CHUNK_START -> $CHUNK_END  (skip: already completed)"
        continue
    fi
    log_info "[$CHUNK_IDX/$CHUNK_COUNT] $CHUNK_START -> $CHUNK_END"

    subscriber_psql -c "DROP TABLE IF EXISTS public.backfill_stage; CREATE UNLOGGED TABLE public.backfill_stage (LIKE public.data);" >/dev/null

    if ! PGPASSWORD="$PUB_PW" psql -h "$PUB_HOST" -p "$PUB_PORT" -U "$PUB_USER" -d "$PUB_DB" \
            -v ON_ERROR_STOP=1 \
            -c "\copy (SELECT topic_id, ts, value_string FROM public.data WHERE ts >= '$CHUNK_START'::timestamp AND ts < '$CHUNK_END'::timestamp) TO STDOUT" \
        | subscriber_psql -c "\copy public.backfill_stage (topic_id, ts, value_string) FROM STDIN"
    then
        log_warning "  chunk failed — re-run the script to retry from here"
        subscriber_psql -c "DROP TABLE IF EXISTS public.backfill_stage;" >/dev/null 2>&1 || true
        exit 3
    fi

    INSERTED=$(subscriber_psql -tA <<SQL
WITH stage_count AS (SELECT count(*)::bigint AS n FROM public.backfill_stage),
ins AS (
    INSERT INTO public.data (topic_id, ts, value_string)
    SELECT topic_id, ts, value_string FROM public.backfill_stage
    ON CONFLICT (topic_id, ts) DO NOTHING RETURNING 1
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
    log_warning "Subscriber is $DELTA rows behind. Live streaming will close the gap."
fi

echo ""
echo "================================================"
log_success "Done."
echo "================================================"
