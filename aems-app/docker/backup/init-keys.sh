#!/bin/bash
#
# init-keys.sh - Idempotently generate the age keypair used by the backup sidecar.
#
# Generates (into $BACKUP_SECRETS_DIR, host-mounted):
#   age.key   (private key, mode 0600)  -- NEVER in DB, NEVER uploaded
#   age.pub   (public recipient)        -- safe to show in UI
#
# Pure file-ops: the BackupKey row is synced with the server by the
# worker process (index.js → /worker/backup/keys/upsert) on the next
# tick. This script must not touch the database.
#
# Environment:
#   BACKUP_SECRETS_DIR       default /host-secrets (host-mounted; survives rebuilds)
#   BACKUP_KEY_ALGORITHM     default age (gpg must be pre-provisioned)
#

set -euo pipefail

SECRETS_DIR="${BACKUP_SECRETS_DIR:-/host-secrets}"
ALGO="${BACKUP_KEY_ALGORITHM:-age}"
KEY_FILE="$SECRETS_DIR/age.key"
PUB_FILE="$SECRETS_DIR/age.pub"
ARCHIVE_DIR="$SECRETS_DIR/archive"

mkdir -p "$SECRETS_DIR" "$ARCHIVE_DIR"
# chmod may fail on bind-mounts owned by a different uid (e.g. Windows hosts).
# Best-effort only — the directory already exists with suitable permissions in
# that case, so silently skip rather than aborting the whole script.
chmod 700 "$SECRETS_DIR" "$ARCHIVE_DIR" 2>/dev/null || true

log() { echo "[init-keys] $*"; }
err() { echo "[init-keys] ERROR: $*" >&2; }

case "$ALGO" in
    age)
        command -v age-keygen >/dev/null 2>&1 || { err "age-keygen not installed"; exit 1; }
        if [[ ! -s "$KEY_FILE" ]]; then
            log "No private key found at $KEY_FILE - generating new age keypair"
            umask 077
            age-keygen -o "$KEY_FILE" >/dev/null
            chmod 600 "$KEY_FILE"
            # Extract public key line (format: "# public key: age1...")
            grep -i "public key" "$KEY_FILE" | sed 's/^#\s*public key:\s*//I' > "$PUB_FILE"
            chmod 644 "$PUB_FILE"
            log "New key generated."
            log "*****************************************************************"
            log "* A NEW BACKUP ENCRYPTION KEY WAS AUTO-GENERATED.                *"
            log "* The matching PRIVATE key lives at: $KEY_FILE"
            log "* BACK IT UP SOMEWHERE SAFE via the admin UI as soon as possible."
            log "* Without this key, ENCRYPTED BACKUPS CANNOT BE RESTORED.        *"
            log "*****************************************************************"
        else
            log "Existing private key found at $KEY_FILE"
            # Regenerate pubkey file from private key if missing or stale.
            DERIVED_PUB="$(age-keygen -y "$KEY_FILE" 2>/dev/null || true)"
            if [[ -z "$DERIVED_PUB" ]]; then
                err "Unable to derive public key from $KEY_FILE - file may be corrupt"
                exit 1
            fi
            if [[ ! -s "$PUB_FILE" ]] || [[ "$(cat "$PUB_FILE" 2>/dev/null)" != "$DERIVED_PUB" ]]; then
                echo "$DERIVED_PUB" > "$PUB_FILE"
                chmod 644 "$PUB_FILE"
                log "Rewrote public key file to match private key."
            fi
        fi

        PUBKEY="$(cat "$PUB_FILE")"
        FINGERPRINT="$(printf '%s' "$PUBKEY" | sha256sum | cut -d' ' -f1)"
        log "Active public key:   $PUBKEY"
        log "Key fingerprint:     $FINGERPRINT"
        ;;

    gpg)
        command -v gpg >/dev/null 2>&1 || { err "gpg not installed"; exit 1; }
        if [[ ! -s "$KEY_FILE" ]]; then
            err "GPG mode requires a pre-provisioned private key at $KEY_FILE."
            err "Automatic GPG keypair generation is intentionally not supported (requires interactive entropy/passphrase decisions)."
            exit 1
        fi
        log "Using pre-provisioned GPG key at $KEY_FILE"
        ;;

    *)
        err "Unsupported BACKUP_KEY_ALGORITHM: $ALGO (expected 'age' or 'gpg')"
        exit 2
        ;;
esac

log "Key initialization complete."
