#!/bin/bash
# docker/backup/lib/backup-postgres.sh
#
# Dump a PostgreSQL database from a running docker compose service into a
# gzipped SQL file. Uses the container's own pg_dump so versions always match
# the server. Credentials are read from inside the container (via file-based
# docker secrets or the POSTGRES_PASSWORD env var), never echoed to the host.
#
# Usage: backup-postgres.sh <service> <output_file.sql.gz>
#
# The service must be running: `docker compose ps <service>` should show it up.

set -euo pipefail

SERVICE="${1:-}"
OUTPUT="${2:-}"

if [[ -z "$SERVICE" || -z "$OUTPUT" ]]; then
    echo "Usage: backup-postgres.sh <service> <output_file.sql.gz>" >&2
    exit 2
fi

# Run pg_dump inside the container, streaming SQL to stdout.
# The container already has PGPASSWORD-equivalent context via its normal env.
# We detect the username/db from standard postgres env vars inside the container.
#
# Supports either POSTGRES_PASSWORD_FILE (file-based secret) or POSTGRES_PASSWORD
# (env var fallback). This mirrors the server's own fallback behavior.

# `-T` disables TTY but leaves stdin attached — if this script runs inside
# a `while read` loop fed from a pipe, docker exec inherits that pipe and
# drains it, starving later iterations. Force stdin to /dev/null.
docker compose exec -T "$SERVICE" sh -c '
    set -e
    if [ -n "${POSTGRES_PASSWORD_FILE:-}" ] && [ -r "$POSTGRES_PASSWORD_FILE" ]; then
        PGPASSWORD="$(cat "$POSTGRES_PASSWORD_FILE")"
    fi
    export PGPASSWORD
    USER="${POSTGRES_USER:-postgres}"
    DB="${POSTGRES_DB:-$USER}"
    pg_dump --clean --if-exists --no-owner --no-privileges \
        -U "$USER" -d "$DB"
' </dev/null | gzip -c > "$OUTPUT"

echo "backup-postgres: wrote $OUTPUT"
