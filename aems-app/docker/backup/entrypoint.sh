#!/bin/bash
#
# entrypoint.sh - Initialize keys, then hand off to the worker process.

set -euo pipefail

# Sweep transient workspace directories. If the previous run was killed
# abruptly (container OOM, SIGKILL, power loss), backup.sh's ERR trap
# never fired and staging trees + partial archives may remain on disk.
# These dirs are always transient; nothing we delete here is recoverable
# or authoritative — the authoritative copy lives on the destination
# (share/s3/local). Scoped to the configured paths so we can't nuke
# anything outside the backup-data volume.
for d in "${BACKUP_STAGING_DIR:-}" "${BACKUP_ARCHIVE_DIR:-}"; do
    if [[ -n "$d" && -d "$d" ]]; then
        find "$d" -mindepth 1 -maxdepth 1 -exec rm -rf {} + 2>/dev/null || true
    fi
done

# Ensure encryption keys exist on disk before the worker starts claiming
# runs. The worker itself syncs the key row with the server via the
# /worker/backup/keys/upsert endpoint on its first tick.
/usr/local/bin/init-keys.sh

# Default cwd is the mounted workspace so the shell pipeline's relative paths
# (./backups, docker compose config) work exactly as they do on a dev host.
cd "${BACKUP_WORKSPACE:-/workspace}"

# Expose the active age recipient (public key) and identity (private key) to
# backup.sh / backup-restore.sh via the env vars they already read.
SECRETS_DIR="${BACKUP_SECRETS_DIR:-/host-secrets}"
if [[ -z "${BACKUP_AGE_RECIPIENT:-}" ]] && [[ -s "$SECRETS_DIR/age.pub" ]]; then
    export BACKUP_AGE_RECIPIENT="$(cat "$SECRETS_DIR/age.pub")"
fi
if [[ -z "${BACKUP_AGE_IDENTITY:-}" ]] && [[ -s "$SECRETS_DIR/age.key" ]]; then
    export BACKUP_AGE_IDENTITY="$SECRETS_DIR/age.key"
fi

exec "$@"
