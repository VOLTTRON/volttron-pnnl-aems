#!/bin/bash
# docker/backup/lib/destination-local.sh
#
# Upload (copy) and prune for local filesystem destinations.
#
# Usage:
#   destination-local.sh upload <archive> <output_dir>
#   destination-local.sh prune  <output_dir> <retention_days> <project>

set -euo pipefail

ACTION="${1:-}"
shift || true

case "$ACTION" in
    upload)
        ARCHIVE="${1:-}"
        DEST="${2:-}"
        if [[ -z "$ARCHIVE" || -z "$DEST" ]]; then
            echo "Usage: destination-local.sh upload <archive> <output_dir>" >&2
            exit 2
        fi
        mkdir -p "$DEST"
        cp "$ARCHIVE" "$DEST/"
        echo "destination-local: copied $(basename "$ARCHIVE") -> $DEST/"
        ;;
    prune)
        DEST="${1:-}"
        DAYS="${2:-0}"
        PROJECT="${3:-}"
        if [[ -z "$DEST" || -z "$PROJECT" ]]; then
            echo "Usage: destination-local.sh prune <output_dir> <retention_days> <project>" >&2
            exit 2
        fi
        if [[ "$DAYS" -le 0 ]]; then
            echo "destination-local: retention disabled (retention_days=$DAYS)"
            exit 0
        fi
        if [[ ! -d "$DEST" ]]; then
            exit 0
        fi
        find "$DEST" -maxdepth 1 -type f -name "${PROJECT}-*.tar.*" -mtime "+${DAYS}" -print -delete
        echo "destination-local: pruned files older than ${DAYS} days in $DEST"
        ;;
    *)
        echo "destination-local.sh: unknown action: $ACTION" >&2
        exit 2
        ;;
esac
