#!/bin/bash
# docker/backup/lib/destination-s3.sh
#
# Upload and prune for AWS S3 destinations. Requires the `aws` CLI and
# working credentials (via env vars, ~/.aws/credentials, IAM role, etc.).
#
# Usage:
#   destination-s3.sh upload <archive> <s3_uri> [sse] [kms_key_id]
#   destination-s3.sh prune  <s3_uri> <retention_days> <project>
#
# s3_uri must be of the form: s3://bucket/prefix/
# (a trailing slash is recommended)

set -euo pipefail

ACTION="${1:-}"
shift || true

require_aws() {
    if ! command -v aws >/dev/null 2>&1; then
        echo "destination-s3: aws CLI is required" >&2
        exit 1
    fi
}

case "$ACTION" in
    upload)
        ARCHIVE="${1:-}"
        DEST="${2:-}"
        SSE="${3:-}"
        KMS_KEY="${4:-}"
        if [[ -z "$ARCHIVE" || -z "$DEST" ]]; then
            echo "Usage: destination-s3.sh upload <archive> <s3_uri> [sse] [kms_key_id]" >&2
            exit 2
        fi
        require_aws
        [[ "$DEST" == */ ]] || DEST="${DEST}/"

        SSE_ARGS=()
        if [[ -n "$SSE" ]]; then
            SSE_ARGS+=(--sse "$SSE")
            if [[ "$SSE" == "aws:kms" && -n "$KMS_KEY" ]]; then
                SSE_ARGS+=(--sse-kms-key-id "$KMS_KEY")
            fi
        fi

        aws s3 cp "$ARCHIVE" "${DEST}$(basename "$ARCHIVE")" "${SSE_ARGS[@]}"
        echo "destination-s3: uploaded $(basename "$ARCHIVE") -> ${DEST}"
        ;;
    prune)
        DEST="${1:-}"
        DAYS="${2:-0}"
        PROJECT="${3:-}"
        if [[ -z "$DEST" || -z "$PROJECT" ]]; then
            echo "Usage: destination-s3.sh prune <s3_uri> <retention_days> <project>" >&2
            exit 2
        fi
        if [[ "$DAYS" -le 0 ]]; then
            echo "destination-s3: retention disabled (retention_days=$DAYS)"
            exit 0
        fi
        require_aws
        [[ "$DEST" == */ ]] || DEST="${DEST}/"

        # Compute cutoff date (UTC) in a cross-platform way.
        if date -u -d "1970-01-01" >/dev/null 2>&1; then
            CUTOFF_EPOCH=$(( $(date -u +%s) - DAYS * 86400 ))
        else
            # BSD date (macOS)
            CUTOFF_EPOCH=$(( $(date -u +%s) - DAYS * 86400 ))
        fi

        # List objects and delete those older than the cutoff whose keys match
        # the project prefix. aws s3 ls returns "YYYY-MM-DD HH:MM:SS  SIZE  key".
        aws s3 ls "$DEST" | \
        awk -v project="$PROJECT" '
            {
                # columns: date, time, size, key
                key = $4
                for (i = 5; i <= NF; i++) key = key " " $i
                if (key ~ ("^" project "-.*\\.tar\\.")) {
                    printf "%sT%sZ\t%s\n", $1, $2, key
                }
            }
        ' | \
        while IFS=$'\t' read -r ts key; do
            # Convert ISO timestamp to epoch.
            if date -u -d "$ts" +%s >/dev/null 2>&1; then
                obj_epoch=$(date -u -d "$ts" +%s)
            else
                # macOS/BSD fallback
                obj_epoch=$(date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "$ts" +%s 2>/dev/null || echo 0)
            fi
            if [[ "$obj_epoch" -gt 0 && "$obj_epoch" -lt "$CUTOFF_EPOCH" ]]; then
                aws s3 rm "${DEST}${key}"
                echo "destination-s3: removed ${DEST}${key}"
            fi
        done
        echo "destination-s3: prune complete (retention_days=$DAYS)"
        ;;
    *)
        echo "destination-s3.sh: unknown action: $ACTION" >&2
        exit 2
        ;;
esac
