#!/bin/bash
# Historian replication repair — post-hoc, idempotent.
#
# setup-replication.sh only runs on fresh PGDATA volumes. Existing deployments
# whose publication was created before the FOR TABLES IN SCHEMA public narrowing
# — or which have a stale migration_stage schema leaking into a FOR ALL TABLES
# publication — need to be repaired without wiping the historian data volume.
# This script performs that repair in place.
#
# Actions (all idempotent):
#   1. Drop migration_stage schema if present.
#   2. If publication is missing, FOR ALL TABLES, FOR TABLE ..., or covers any
#      non-public schema: drop and recreate as FOR TABLES IN SCHEMA public.
#   3. Re-apply replicator grants and default privileges.
#   4. Ensure primary keys on data / topics if they exist.
#   5. Report publication contents, replication slots, and next-step guidance.
#
# Usage (inside the historian container):
#   /usr/local/bin/repair-replication.sh            # perform repair
#   /usr/local/bin/repair-replication.sh --dry-run  # report only, no writes
#
# Wrapper for host-side invocation: aems-app/repair-historian-replication.sh

set -e

DRY_RUN=false
for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN=true ;;
        -h|--help)
            sed -n '2,20p' "$0"
            exit 0
            ;;
        *)
            echo "ERROR: unknown argument '$arg'" >&2
            exit 2
            ;;
    esac
done

echo "================================================"
echo "Historian Replication Repair"
if [ "$DRY_RUN" = true ]; then
    echo "Mode: DRY RUN (no writes)"
fi
echo "================================================"

# Wait for PostgreSQL to be ready (short — this runs against a live container).
for _ in 1 2 3 4 5; do
    if pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" >/dev/null 2>&1; then
        break
    fi
    echo "Waiting for PostgreSQL to be ready..."
    sleep 2
done

pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" >/dev/null 2>&1 || {
    echo "ERROR: PostgreSQL is not ready. Aborting." >&2
    exit 1
}

# --- Diagnose current state --------------------------------------------------

DIAG=$(psql -X -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -tA <<'SQL'
WITH pub AS (
    SELECT pubname, puballtables
    FROM pg_publication
    WHERE pubname = 'historian_pub'
),
pub_tables AS (
    SELECT count(*) AS n_tables,
           count(*) FILTER (WHERE schemaname <> 'public') AS n_non_public
    FROM pg_publication_tables
    WHERE pubname = 'historian_pub'
),
pub_schemas AS (
    SELECT count(*) AS n_schemas,
           count(*) FILTER (WHERE pn.nspname <> 'public') AS n_non_public_schemas
    FROM pg_publication_namespace pns
    JOIN pg_publication p ON p.oid = pns.pnpubid
    JOIN pg_namespace pn ON pn.oid = pns.pnnspid
    WHERE p.pubname = 'historian_pub'
),
stage AS (
    SELECT count(*) AS n
    FROM pg_namespace
    WHERE nspname = 'migration_stage'
)
SELECT
    COALESCE((SELECT pubname FROM pub), ''),
    COALESCE((SELECT puballtables::text FROM pub), 'f'),
    COALESCE((SELECT n_tables FROM pub_tables), 0),
    COALESCE((SELECT n_non_public FROM pub_tables), 0),
    COALESCE((SELECT n_schemas FROM pub_schemas), 0),
    COALESCE((SELECT n_non_public_schemas FROM pub_schemas), 0),
    COALESCE((SELECT n FROM stage), 0);
SQL
)

IFS='|' read -r PUBNAME PUB_ALL_TABLES N_TABLES N_NON_PUBLIC_TABLES N_SCHEMAS N_NON_PUBLIC_SCHEMAS HAS_STAGE <<< "$DIAG"

echo ""
echo "Current state:"
if [ -z "$PUBNAME" ]; then
    echo "  publication historian_pub:  MISSING"
    PUB_ACTION="create"
else
    echo "  publication historian_pub:  present"
    echo "    puballtables:             ${PUB_ALL_TABLES}"
    echo "    tables in publication:    ${N_TABLES} (${N_NON_PUBLIC_TABLES} in non-public schemas)"
    echo "    schemas in publication:   ${N_SCHEMAS} (${N_NON_PUBLIC_SCHEMAS} non-public)"
    if [ "$PUB_ALL_TABLES" = "t" ] || [ "${N_NON_PUBLIC_TABLES:-0}" -gt 0 ] || [ "${N_NON_PUBLIC_SCHEMAS:-0}" -gt 0 ]; then
        PUB_ACTION="rebuild"
    else
        # Also rebuild if publication exists but wasn't created FOR TABLES IN SCHEMA public
        # (i.e. n_schemas == 0 while some public tables exist as FOR TABLE ... — narrower than intended).
        # Detect by absence of any public schema entry in pg_publication_namespace.
        HAS_PUBLIC_SCHEMA=$(psql -X -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -tA -c \
            "SELECT count(*) FROM pg_publication_namespace pns JOIN pg_publication p ON p.oid=pns.pnpubid JOIN pg_namespace n ON n.oid=pns.pnnspid WHERE p.pubname='historian_pub' AND n.nspname='public';" | xargs)
        if [ "${HAS_PUBLIC_SCHEMA:-0}" = "0" ]; then
            PUB_ACTION="rebuild"
        else
            PUB_ACTION="none"
        fi
    fi
fi
echo "  migration_stage schema:     $([ "${HAS_STAGE:-0}" -gt 0 ] && echo present || echo absent)"
echo ""

case "$PUB_ACTION" in
    create)   echo "Plan: create historian_pub FOR TABLES IN SCHEMA public." ;;
    rebuild)  echo "Plan: DROP and recreate historian_pub FOR TABLES IN SCHEMA public." ;;
    none)     echo "Plan: publication scope already correct — no publication change." ;;
esac
[ "${HAS_STAGE:-0}" -gt 0 ] && echo "Plan: DROP SCHEMA migration_stage CASCADE."
echo "Plan: re-apply replicator grants, default privileges, and primary-key checks."

if [ "$DRY_RUN" = true ]; then
    echo ""
    echo "Dry run complete. No changes written."
    exit 0
fi

# --- Apply repair ------------------------------------------------------------

REPLICATOR_PASSWORD=""
if [ -s "/run/secrets/historian_replicator_password" ]; then
    REPLICATOR_PASSWORD="$(cat /run/secrets/historian_replicator_password)"
fi

echo ""
echo "Applying repair..."

psql -v ON_ERROR_STOP=1 -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" <<SQL
BEGIN;

-- 1. Drop staging schema if present.
DROP SCHEMA IF EXISTS migration_stage CASCADE;

-- 2. Rebuild publication if scope is wrong.
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'historian_pub') THEN
        CREATE PUBLICATION historian_pub FOR TABLES IN SCHEMA public;
    ELSIF (
        SELECT puballtables FROM pg_publication WHERE pubname = 'historian_pub'
    ) THEN
        DROP PUBLICATION historian_pub;
        CREATE PUBLICATION historian_pub FOR TABLES IN SCHEMA public;
    ELSIF EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'historian_pub' AND schemaname <> 'public'
    ) OR NOT EXISTS (
        SELECT 1 FROM pg_publication_namespace pns
        JOIN pg_publication p ON p.oid = pns.pnpubid
        JOIN pg_namespace n ON n.oid = pns.pnnspid
        WHERE p.pubname = 'historian_pub' AND n.nspname = 'public'
    ) THEN
        DROP PUBLICATION historian_pub;
        CREATE PUBLICATION historian_pub FOR TABLES IN SCHEMA public;
    END IF;
END
\$\$;

-- 3. Ensure replicator role and grants (idempotent).
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'replicator') THEN
        CREATE USER replicator WITH REPLICATION LOGIN PASSWORD '${REPLICATOR_PASSWORD}';
    END IF;
END
\$\$;

ALTER USER replicator NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;

GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO replicator;
GRANT USAGE ON SCHEMA public TO replicator;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO replicator;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO replicator;
ALTER DEFAULT PRIVILEGES FOR ROLE ${POSTGRES_USER} IN SCHEMA public GRANT SELECT ON TABLES TO replicator;

-- 4. Ensure primary keys on data / topics if they exist.
DO \$\$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='data') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='data_pkey' AND contype='p') THEN
            ALTER TABLE public.data ADD PRIMARY KEY (topic_id, ts);
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='topics') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='topics_pkey' AND contype='p') THEN
            ALTER TABLE public.topics ADD PRIMARY KEY (topic_id);
        END IF;
    END IF;
END
\$\$;

COMMIT;
SQL

# --- Post-repair report ------------------------------------------------------

echo ""
echo "Repair applied. Post-state:"
psql -X -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" <<'SQL'
SELECT pubname, puballtables, pubinsert, pubupdate, pubdelete
FROM pg_publication
WHERE pubname = 'historian_pub';

SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'historian_pub'
ORDER BY schemaname, tablename;

SELECT slot_name, active, restart_lsn
FROM pg_replication_slots
WHERE slot_name LIKE 'aems_%_slot'
ORDER BY slot_name;
SQL

echo ""
echo "================================================"
echo "Repair complete."
echo ""
echo "IMPORTANT: any downstream subscribers must be re-initialized."
echo "  On each subscriber, drop the existing subscription and re-create it:"
echo "    ALTER SUBSCRIPTION <name> DISABLE;"
echo "    ALTER SUBSCRIPTION <name> SET (slot_name = NONE);"
echo "    DROP SUBSCRIPTION <name>;"
echo "    CREATE SUBSCRIPTION <name> CONNECTION '...' PUBLICATION historian_pub"
echo "      WITH (copy_data=true, create_slot=true);"
echo "================================================"
