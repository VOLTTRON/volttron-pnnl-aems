#!/bin/bash
# docker/backup/lib/encrypt.sh
#
# Encrypt/decrypt a stream using age (preferred) or gpg (fallback).
#
# Usage:
#   encrypt.sh encrypt <input_file> <output_file>
#   encrypt.sh decrypt <input_file> <output_file>
#
# Environment:
#   BACKUP_AGE_RECIPIENT - age public key (required for age encryption)
#   BACKUP_GPG_KEY_FILE  - path to gpg passphrase file (required for gpg)
#   BACKUP_AGE_IDENTITY  - path to age private key file (required for age decryption)

set -euo pipefail

MODE="${1:-}"
INPUT="${2:-}"
OUTPUT="${3:-}"

if [[ -z "$MODE" || -z "$INPUT" || -z "$OUTPUT" ]]; then
    echo "Usage: encrypt.sh {encrypt|decrypt} <input> <output>" >&2
    exit 2
fi

has_age() { command -v age >/dev/null 2>&1; }
has_gpg() { command -v gpg >/dev/null 2>&1; }

case "$MODE" in
    encrypt)
        if has_age && [[ -n "${BACKUP_AGE_RECIPIENT:-}" ]]; then
            age -r "$BACKUP_AGE_RECIPIENT" -o "$OUTPUT" "$INPUT"
            echo "age"
        elif has_gpg && [[ -n "${BACKUP_GPG_KEY_FILE:-}" ]]; then
            gpg --batch --yes --passphrase-file "$BACKUP_GPG_KEY_FILE" \
                --symmetric --cipher-algo AES256 \
                --output "$OUTPUT" "$INPUT"
            echo "gpg"
        else
            echo "encrypt.sh: no encryption tool available." >&2
            echo "  - Install 'age' and set BACKUP_AGE_RECIPIENT, or" >&2
            echo "  - Install 'gpg' and set BACKUP_GPG_KEY_FILE." >&2
            exit 1
        fi
        ;;
    decrypt)
        if [[ "$INPUT" == *.age ]] || [[ "${BACKUP_ENCRYPTION_MODE:-}" == "age" ]]; then
            if ! has_age; then
                echo "encrypt.sh: 'age' is required to decrypt this archive" >&2
                exit 1
            fi
            if [[ -z "${BACKUP_AGE_IDENTITY:-}" ]]; then
                echo "encrypt.sh: BACKUP_AGE_IDENTITY must point to your age private key" >&2
                exit 1
            fi
            age -d -i "$BACKUP_AGE_IDENTITY" -o "$OUTPUT" "$INPUT"
        elif [[ "$INPUT" == *.gpg ]] || [[ "${BACKUP_ENCRYPTION_MODE:-}" == "gpg" ]]; then
            if ! has_gpg; then
                echo "encrypt.sh: 'gpg' is required to decrypt this archive" >&2
                exit 1
            fi
            if [[ -z "${BACKUP_GPG_KEY_FILE:-}" ]]; then
                echo "encrypt.sh: BACKUP_GPG_KEY_FILE must point to your gpg passphrase file" >&2
                exit 1
            fi
            gpg --batch --yes --passphrase-file "$BACKUP_GPG_KEY_FILE" \
                --decrypt --output "$OUTPUT" "$INPUT"
        else
            echo "encrypt.sh: cannot infer encryption type from extension (.age or .gpg)" >&2
            exit 1
        fi
        ;;
    *)
        echo "encrypt.sh: unknown mode: $MODE" >&2
        exit 2
        ;;
esac
