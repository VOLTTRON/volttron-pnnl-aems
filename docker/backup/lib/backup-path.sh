#!/bin/bash
# docker/backup/lib/backup-path.sh
#
# Archive a host directory or file (bind-mount source) into a gzipped tarball.
#
# Usage: backup-path.sh <source_path> <output_file.tar.gz>

set -euo pipefail

SOURCE="${1:-}"
OUTPUT="${2:-}"

if [[ -z "$SOURCE" || -z "$OUTPUT" ]]; then
    echo "Usage: backup-path.sh <source_path> <output_file.tar.gz>" >&2
    exit 2
fi

if [[ ! -e "$SOURCE" ]]; then
    echo "backup-path: source does not exist: $SOURCE" >&2
    exit 1
fi

# Archive with paths relative to the parent so restore places contents back
# in the same location.
PARENT="$(cd "$(dirname "$SOURCE")" && pwd)"
BASENAME="$(basename "$SOURCE")"

# Defense-in-depth excludes. These directories are never worth archiving
# regardless of what bind-mount path they live under: build caches,
# dependency trees reproducible from lockfiles, VCS internals. Scan rule
# parity with backup.sh's env-file find excludes.
TAR_EXCLUDES=(
    --exclude=node_modules
    --exclude=.git
    --exclude=.next
    --exclude=.yarn
    --exclude=.cache
    --exclude=dist
    --exclude=build
    --exclude=coverage
    --exclude=out
)

tar -czf "$OUTPUT" "${TAR_EXCLUDES[@]}" -C "$PARENT" "$BASENAME"

echo "backup-path: wrote $OUTPUT (from $SOURCE)"
