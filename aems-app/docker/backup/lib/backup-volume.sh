#!/bin/bash
# docker/backup/lib/backup-volume.sh
#
# Archive a named docker volume into a gzipped tarball. Uses a throwaway
# alpine container to mount the volume read-only, so the live service does
# not need to be stopped.
#
# Usage: backup-volume.sh <project> <volume_short_name> <output_file.tar.gz>
#
# The actual volume name is "<project>_<volume_short_name>" (docker compose
# naming convention). If that doesn't exist, we attempt to locate the volume
# by suffix match.

set -euo pipefail

PROJECT="${1:-}"
VOLUME="${2:-}"
OUTPUT="${3:-}"

if [[ -z "$PROJECT" || -z "$VOLUME" || -z "$OUTPUT" ]]; then
    echo "Usage: backup-volume.sh <project> <volume_short_name> <output_file.tar.gz>" >&2
    exit 2
fi

FULL_NAME="${PROJECT}_${VOLUME}"
if ! docker volume inspect "$FULL_NAME" >/dev/null 2>&1; then
    # Fall back to suffix match - useful when project name differs from directory.
    FOUND="$(docker volume ls --format '{{.Name}}' | grep -E "_${VOLUME}$" | head -n1 || true)"
    if [[ -n "$FOUND" ]]; then
        FULL_NAME="$FOUND"
    else
        echo "backup-volume: volume not found: ${PROJECT}_${VOLUME}" >&2
        exit 1
    fi
fi

# Mount the volume read-only and tar its contents relative to /data.
OUTPUT_ABS="$(cd "$(dirname "$OUTPUT")" && pwd)/$(basename "$OUTPUT")"
OUTPUT_DIR="$(dirname "$OUTPUT_ABS")"

docker run --rm \
    -v "${FULL_NAME}:/data:ro" \
    -v "${OUTPUT_DIR}:/backup" \
    alpine:3 \
    sh -c "cd /data && tar czf /backup/$(basename "$OUTPUT_ABS") ."

echo "backup-volume: wrote $OUTPUT (from $FULL_NAME)"
