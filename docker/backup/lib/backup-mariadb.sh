#!/bin/bash
# docker/backup/lib/backup-mariadb.sh
#
# Dump a MariaDB/MySQL database from a running docker compose service into a
# gzipped SQL file.
#
# Usage: backup-mariadb.sh <service> <output_file.sql.gz>

set -euo pipefail

SERVICE="${1:-}"
OUTPUT="${2:-}"

if [[ -z "$SERVICE" || -z "$OUTPUT" ]]; then
    echo "Usage: backup-mariadb.sh <service> <output_file.sql.gz>" >&2
    exit 2
fi

# `-T` disables TTY but leaves stdin attached — if this script runs inside
# a `while read` loop fed from a pipe, docker exec inherits that pipe and
# drains it, starving later iterations. Force stdin to /dev/null.
docker compose exec -T "$SERVICE" sh -c '
    set -e
    # When MYSQL_DATABASE is set we only need the app user — it always
    # has GRANT ALL on its own database and its credentials are initialised
    # deterministically from MYSQL_USER/MYSQL_PASSWORD (or *_FILE). Root
    # is reserved for --all-databases dumps where no scope is configured,
    # because some mariadb images (linuxserver) generate a random root
    # password when MYSQL_ROOT_PASSWORD_FILE is injected but empty.
    if [ -n "${MYSQL_DATABASE:-}" ] && [ -n "${MYSQL_USER:-}" ]; then
        if [ -n "${MYSQL_PASSWORD_FILE:-}" ] && [ -r "$MYSQL_PASSWORD_FILE" ]; then
            PASS="$(cat "$MYSQL_PASSWORD_FILE")"
        else
            PASS="${MYSQL_PASSWORD:-}"
        fi
        USER="$MYSQL_USER"
    elif [ -n "${MYSQL_ROOT_PASSWORD_FILE:-}" ] && [ -r "$MYSQL_ROOT_PASSWORD_FILE" ]; then
        PASS="$(cat "$MYSQL_ROOT_PASSWORD_FILE")"
        USER="root"
    elif [ -n "${MYSQL_ROOT_PASSWORD:-}" ]; then
        PASS="$MYSQL_ROOT_PASSWORD"
        USER="root"
    else
        echo "backup-mariadb: no usable credentials (set MYSQL_DATABASE+MYSQL_USER or MYSQL_ROOT_PASSWORD)" >&2
        exit 1
    fi

    # Choose the right client binary (mariadb-dump is preferred on newer images).
    if command -v mariadb-dump >/dev/null 2>&1; then
        DUMP=mariadb-dump
    else
        DUMP=mysqldump
    fi

    export MYSQL_PWD="$PASS"

    if [ -n "${MYSQL_DATABASE:-}" ]; then
        "$DUMP" --user="$USER" --single-transaction --routines --triggers \
                --add-drop-database --databases "$MYSQL_DATABASE"
    else
        "$DUMP" --user="$USER" --single-transaction --routines --triggers \
                --all-databases
    fi
' </dev/null | gzip -c > "$OUTPUT"

echo "backup-mariadb: wrote $OUTPUT"
