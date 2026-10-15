#!/bin/bash
#
# backup.sh - Internal backup executor invoked by the docker backup sidecar.
#
# This script is NOT a user-facing command. Operators configure and trigger
# backups through the Backups admin UI (/backups); the NestJS BackupService
# enqueues BackupRun rows and the docker/backup worker sidecar claims them
# and spawns this script with the appropriate CLI flags derived from the
# BackupPolicy + BackupDestination rows.
#
# It discovers persistent state (named volumes, bind-mounted paths, and
# relational databases) from the resolved `docker compose config` output,
# dumps each component, bundles them into a single archive, encrypts the
# archive, and uploads it to one or more destinations (local, s3).
#
# Usage (driven by the worker; not for interactive use):
#   -d, --destination <local|s3>         Destination type (repeatable; paired with --output)
#   -o, --output <path|s3://...>         Destination output (repeatable; paired with --destination)
#   -r, --retention-days <N>             Retention in days (default 30)
#       --exclude-volumes <list>         Space-separated named volumes to skip
#       --exclude-paths <list>           Space-separated bind-mount sources to skip
#       --exclude-services <list>        Space-separated compose services to skip (suppresses DB dumps)
#       --exclude-env-files <list>       Space-separated env-file paths to skip
#       --extra-env-files <list>         Space-separated env-file paths to include beyond scan
#       --include-databases <list>       Space-separated service:engine hints for DB classification
#                                        (engine = postgres|mariadb). Overrides image-name sniffing
#                                        in discover.sh for services whose image tag doesn't contain
#                                        a DB keyword (e.g. custom PostGIS builds).
#   -n, --dry-run                        Show what would happen without making changes
#   -q, --quiet                          Minimize output
#       --json                           Emit NDJSON progress events on stdout (for sidecar)
#       --run-id <id>                    Run id assigned by the BackupRun row
#   -h, --help                           Show this help
#
# Encryption keys are resolved from BACKUP_AGE_RECIPIENT or BACKUP_GPG_KEY_FILE,
# which the sidecar entrypoint exports from the active BackupKey row.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/docker/backup/lib"
STARTING_PATH="$(pwd)"

# ----- Output helpers -----------------------------------------------------
QUIET=false
JSON_MODE=false
RUN_ID_OVERRIDE=""

# In JSON mode, stdout is reserved for NDJSON progress events so the sidecar
# worker can parse them line-by-line. All human-facing logs are redirected
# to stderr.
_log_sink() { if [[ "$JSON_MODE" == "true" ]]; then cat >&2; else cat; fi; }
print_blue()   { [[ "$QUIET" == "true" ]] || echo -e "\033[1;34m$1\033[0m" | _log_sink; }
print_cyan()   { [[ "$QUIET" == "true" ]] || echo -e "\033[1;36m$1\033[0m" | _log_sink; }
print_green()  { [[ "$QUIET" == "true" ]] || echo -e "\033[1;32m$1\033[0m" | _log_sink; }
print_yellow() { [[ "$QUIET" == "true" ]] || echo -e "\033[1;33m$1\033[0m" | _log_sink; }
print_red()    { echo -e "\033[1;31m$1\033[0m" >&2; }

# Emit a single NDJSON event to stdout (only when --json is active). Argument
# pairs are passed to python for correct JSON quoting and coercion.
#   emit_event <event> [key value ...]
emit_event() {
    [[ "$JSON_MODE" == "true" ]] || return 0
    python3 - "$@" <<'PY'
import json, sys
args = sys.argv[1:]
if not args:
    sys.exit(0)
evt = {"event": args[0]}
_INT_FIELDS = {"bytes", "durationMs", "uploadedBytes", "archiveBytes"}
for i in range(1, len(args), 2):
    k = args[i]
    v = args[i + 1] if i + 1 < len(args) else ""
    if k in _INT_FIELDS:
        try: v = int(v)
        except (TypeError, ValueError): pass
    evt[k] = v
print(json.dumps(evt), flush=True)
PY
}

show_help() {
    grep -E '^# ?' "${BASH_SOURCE[0]}" | head -n 36 | sed 's/^# \{0,1\}//'
    exit 0
}

# ----- Argument parsing ---------------------------------------------------
DRY_RUN=false
DESTS_TYPE_CLI=()
DESTS_OUT_CLI=()
RETENTION_CLI=""
EXCLUDE_VOLUMES_CLI=""
EXCLUDE_PATHS_CLI=""
EXCLUDE_SERVICES_CLI=""
EXCLUDE_ENV_FILES_CLI=""
EXTRA_ENV_FILES_CLI=""
INCLUDE_DATABASES_CLI=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        -d|--destination)    DESTS_TYPE_CLI+=("$2"); shift 2 ;;
        -o|--output)         DESTS_OUT_CLI+=("$2"); shift 2 ;;
        -r|--retention-days) RETENTION_CLI="$2"; shift 2 ;;
        --exclude-volumes)   EXCLUDE_VOLUMES_CLI="$2"; shift 2 ;;
        --exclude-paths)     EXCLUDE_PATHS_CLI="$2"; shift 2 ;;
        --exclude-services)  EXCLUDE_SERVICES_CLI="$2"; shift 2 ;;
        --exclude-env-files) EXCLUDE_ENV_FILES_CLI="$2"; shift 2 ;;
        --extra-env-files)   EXTRA_ENV_FILES_CLI="$2"; shift 2 ;;
        --include-databases) INCLUDE_DATABASES_CLI="$2"; shift 2 ;;
        -n|--dry-run)        DRY_RUN=true; shift ;;
        -q|--quiet)          QUIET=true; shift ;;
        --json)              JSON_MODE=true; shift ;;
        --run-id)            RUN_ID_OVERRIDE="$2"; shift 2 ;;
        -h|--help)           show_help ;;
        *) print_red "Unknown argument: $1"; exit 2 ;;
    esac
done

if [[ ${#DESTS_TYPE_CLI[@]} -ne ${#DESTS_OUT_CLI[@]} ]]; then
    print_red "--destination and --output must be provided in matching pairs"
    exit 2
fi

# ----- Resolve parameters -------------------------------------------------
# Defaults for sidecar-container settings. These are container internals set
# by docker/backup/entrypoint.sh + the docker-compose backup service, not
# operator config; CLI flags from the worker take precedence.
BACKUP_STAGING_DIR="${BACKUP_STAGING_DIR:-./backups/staging}"
BACKUP_ARCHIVE_DIR="${BACKUP_ARCHIVE_DIR:-./backups}"
BACKUP_LOG_FILE="${BACKUP_LOG_FILE:-./backups/backup.log}"
BACKUP_RETENTION_DAYS="${RETENTION_CLI:-30}"
BACKUP_EXCLUDE_VOLUMES="${EXCLUDE_VOLUMES_CLI:-}"
BACKUP_EXCLUDE_PATHS="${EXCLUDE_PATHS_CLI:-}"
BACKUP_EXCLUDE_SERVICES="${EXCLUDE_SERVICES_CLI:-}"
BACKUP_EXCLUDE_ENV_FILES="${EXCLUDE_ENV_FILES_CLI:-}"
BACKUP_EXTRA_ENV_FILES="${EXTRA_ENV_FILES_CLI:-}"
BACKUP_INCLUDE_DATABASES="${INCLUDE_DATABASES_CLI:-}"

DEST_TYPES=()
DEST_OUTPUTS=()
DEST_SSES=()
DEST_KMS=()

for i in "${!DESTS_TYPE_CLI[@]}"; do
    DEST_TYPES+=("${DESTS_TYPE_CLI[$i]}")
    DEST_OUTPUTS+=("${DESTS_OUT_CLI[$i]}")
    DEST_SSES+=("")
    DEST_KMS+=("")
done

if [[ ${#DEST_TYPES[@]} -eq 0 ]]; then
    print_red "No destinations supplied. Add one via the Backups admin UI (/backups) before triggering a run."
    exit 2
fi

# ----- Pre-flight checks --------------------------------------------------
on_failure() {
    print_red "Backup failed"
    emit_event done status Failed
    # Clear transient workspace so a failed run never leaks staging trees
    # or partially-built archives into the sidecar's backup-data volume.
    # Variables may not be set yet if failure fires before plan discovery.
    [[ -n "${STAGING:-}" && -d "${STAGING:-}" ]] && rm -rf "$STAGING"
    [[ -n "${ARCHIVE_PLAIN:-}" ]] && rm -f "$ARCHIVE_PLAIN"
    [[ -n "${ARCHIVE_ENC:-}" ]] && rm -f "$ARCHIVE_ENC"
    cd "$STARTING_PATH"
    exit 1
}
trap on_failure ERR

for cmd in docker python3 tar gzip; do
    command -v "$cmd" >/dev/null 2>&1 || { print_red "Required command not found: $cmd"; exit 1; }
done

# Encryption pre-flight: refuse to run unencrypted.
ENCRYPTION_MODE=""
ENCRYPTION_EXT=""
KEY_FINGERPRINT=""
if command -v age >/dev/null 2>&1 && [[ -n "${BACKUP_AGE_RECIPIENT:-}" ]]; then
    ENCRYPTION_MODE="age"; ENCRYPTION_EXT="age"
    # Fingerprint = sha256 of the recipient public key (stable identifier, safe to log)
    KEY_FINGERPRINT="$(printf '%s' "$BACKUP_AGE_RECIPIENT" | sha256sum | cut -d' ' -f1)"
elif command -v gpg >/dev/null 2>&1 && [[ -n "${BACKUP_GPG_KEY_FILE:-}" && -r "${BACKUP_GPG_KEY_FILE:-/nonexistent}" ]]; then
    ENCRYPTION_MODE="gpg"; ENCRYPTION_EXT="gpg"
    KEY_FINGERPRINT="gpg:$(sha256sum "$BACKUP_GPG_KEY_FILE" | cut -d' ' -f1)"
else
    print_red "Encryption is mandatory but no key is configured."
    print_red "The sidecar entrypoint should have exported BACKUP_AGE_RECIPIENT from the active BackupKey row."
    print_red "Check the Keys tab in the Backups admin UI and confirm docker/backup/init-keys.sh ran successfully."
    exit 1
fi
print_cyan "Encryption: $ENCRYPTION_MODE"

# S3 CLI check
for t in "${DEST_TYPES[@]}"; do
    if [[ "$t" == "s3" ]]; then
        command -v aws >/dev/null 2>&1 || { print_red "aws CLI is required for s3 destination"; exit 1; }
        break
    fi
done

# ----- Discover ----------------------------------------------------------
print_blue "Discovering backup targets from docker compose config..."

PLAN_JSON="$(bash "$LIB_DIR/discover.sh" \
    --exclude-volumes   "$BACKUP_EXCLUDE_VOLUMES" \
    --exclude-paths     "$BACKUP_EXCLUDE_PATHS" \
    --exclude-services  "$BACKUP_EXCLUDE_SERVICES" \
    --include-databases "$BACKUP_INCLUDE_DATABASES")"

PROJECT="$(printf '%s' "$PLAN_JSON" | python3 -c 'import json,sys;print(json.load(sys.stdin)["project"])')"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
if [[ -n "$RUN_ID_OVERRIDE" ]]; then
    RUN_ID="$RUN_ID_OVERRIDE"
else
    RUN_ID="${PROJECT}-${TIMESTAMP}"
fi

STAGING="$BACKUP_STAGING_DIR/$RUN_ID"
ARCHIVE_PLAIN="$BACKUP_ARCHIVE_DIR/${RUN_ID}.tar.gz"
ARCHIVE_ENC="$BACKUP_ARCHIVE_DIR/${RUN_ID}.tar.gz.${ENCRYPTION_EXT}"

print_cyan "Project:    $PROJECT"
print_cyan "Run ID:     $RUN_ID"
print_cyan "Staging:    $STAGING"
print_cyan "Retention:  $BACKUP_RETENTION_DAYS days"
print_cyan "Destinations:"
for i in "${!DEST_TYPES[@]}"; do
    print_cyan "  - ${DEST_TYPES[$i]} -> ${DEST_OUTPUTS[$i]}"
done

# Emit plan event for the sidecar worker.
emit_event plan project "$PROJECT" runId "$RUN_ID" timestamp "$TIMESTAMP" \
    encryption "$ENCRYPTION_MODE" keyFingerprint "$KEY_FINGERPRINT" \
    retentionDays "$BACKUP_RETENTION_DAYS"

# Render plan summary to stderr (pretty output for humans).
printf '%s' "$PLAN_JSON" | python3 -c '
import json, sys
p = json.load(sys.stdin)
print("  Volumes (%d):" % len(p["volumes"]))
for v in p["volumes"]:
    print("    - %s  used by: %s" % (v["name"], ", ".join(v["services"])))
print("  Bind mounts (%d):" % len(p["binds"]))
for b in p["binds"]:
    print("    - [%s] %s  used by: %s" % (b["type"], b["source"], ", ".join(b["services"])))
print("  Databases (%d):" % len(p["databases"]))
for d in p["databases"]:
    print("    - %s  (%s)" % (d["service"], d["engine"]))
' >&2

if [[ "$DRY_RUN" == "true" ]]; then
    print_yellow "[DRY RUN] No files will be written and nothing will be uploaded."
    emit_event done status Success dryRun true
    exit 0
fi

# ----- Stage --------------------------------------------------------------
mkdir -p "$STAGING/databases" "$STAGING/volumes" "$STAGING/paths" "$STAGING/includes"
mkdir -p "$BACKUP_ARCHIVE_DIR"

# Helper: time a component and emit Running/Success/Failed events.
run_component() {
    local comp_type="$1" comp_name="$2" out_file="$3"; shift 3
    emit_event component type "$comp_type" name "$comp_name" status Running
    local t0 t1 bytes=0 rc=0
    t0=$(date +%s%N 2>/dev/null || echo 0)
    if "$@"; then rc=0; else rc=$?; fi
    t1=$(date +%s%N 2>/dev/null || echo 0)
    local dur_ms=0
    if [[ "$t0" != "0" && "$t1" != "0" ]]; then
        dur_ms=$(( (t1 - t0) / 1000000 ))
    fi
    if [[ $rc -eq 0 ]]; then
        [[ -f "$out_file" ]] && bytes=$(stat -c %s "$out_file" 2>/dev/null || stat -f %z "$out_file" 2>/dev/null || echo 0)
        emit_event component type "$comp_type" name "$comp_name" status Success bytes "$bytes" durationMs "$dur_ms"
    else
        emit_event component type "$comp_type" name "$comp_name" status Failed durationMs "$dur_ms" error "exit=$rc"
        return $rc
    fi
}

# Databases
print_blue "Dumping databases..."
while IFS=$'\t' read -r svc engine; do
    [[ -z "$svc" ]] && continue
    out="$STAGING/databases/${svc}.sql.gz"
    case "$engine" in
        postgres)
            run_component Postgres "$svc" "$out" bash "$LIB_DIR/backup-postgres.sh" "$svc" "$out"
            ;;
        mariadb)
            run_component MariaDB "$svc" "$out" bash "$LIB_DIR/backup-mariadb.sh" "$svc" "$out"
            ;;
        *)
            # Unknown engine means discovery misclassified something — no
            # matching enum value, so log to stderr but don't try to record
            # a BackupComponent row for it (the type would fail Prisma
            # validation against BackupComponentType).
            print_yellow "Skipping unknown DB engine for $svc: $engine"
            ;;
    esac
done < <(printf '%s' "$PLAN_JSON" | python3 -c '
import json,sys
for d in json.load(sys.stdin)["databases"]:
    print("%s\t%s" % (d["service"], d["engine"]))
')

# Named volumes
print_blue "Archiving named volumes..."
while IFS= read -r vol; do
    [[ -z "$vol" ]] && continue
    out="$STAGING/volumes/${vol}.tar.gz"
    run_component Volume "$vol" "$out" bash "$LIB_DIR/backup-volume.sh" "$PROJECT" "$vol" "$out"
done < <(printf '%s' "$PLAN_JSON" | python3 -c '
import json,sys
for v in json.load(sys.stdin)["volumes"]:
    print(v["name"])
')

# Bind-mounted paths
print_blue "Archiving bind-mounted paths..."
while IFS= read -r src; do
    [[ -z "$src" ]] && continue
    if [[ ! -e "$src" ]]; then
        print_yellow "  skip (missing): $src"
        emit_event component type Path name "$src" status Skipped error "missing"
        continue
    fi
    # Safe filename: replace slashes with underscores, trim leading underscore.
    safe="$(echo "$src" | sed 's|^/||; s|/|_|g')"
    out="$STAGING/paths/${safe}.tar.gz"
    run_component Path "$src" "$out" bash "$LIB_DIR/backup-path.sh" "$src" "$out"
done < <(printf '%s' "$PLAN_JSON" | python3 -c '
import json,sys
for b in json.load(sys.stdin)["binds"]:
    print(b["source"])
')

# Env files - dynamically discovered, with operator blacklist/extras applied.
#
# Scan rule parity: the excluded directories below MUST match
# server/src/services/backup/backup-discovery.service.ts SCAN_EXCLUDE_DIRS
# so the UI and the actual backup agree on which files exist.
print_blue "Archiving env files (dynamic scan)..."
mapfile -t SCANNED_ENV_FILES < <(find . -maxdepth 4 -type f -name '.env*' \
    -not -path '*/node_modules/*' \
    -not -path '*/.git/*' \
    -not -path '*/.next/*' \
    -not -path '*/.yarn/*' \
    -not -path '*/.cache/*' \
    -not -path '*/dist/*' \
    -not -path '*/build/*' \
    -not -path '*/coverage/*' \
    -not -path '*/out/*' 2>/dev/null | sed 's|^\./||' | sort -u)

ENV_EXCLUDE_SET=" $BACKUP_EXCLUDE_ENV_FILES "
declare -A SEEN_ENV=()
EFFECTIVE_ENV_FILES=()
for f in "${SCANNED_ENV_FILES[@]}" $BACKUP_EXTRA_ENV_FILES; do
    [[ -z "$f" ]] && continue
    [[ -n "${SEEN_ENV[$f]:-}" ]] && continue
    SEEN_ENV[$f]=1
    case "$ENV_EXCLUDE_SET" in
        *" $f "*) continue ;;
    esac
    EFFECTIVE_ENV_FILES+=("$f")
done

for inc in "${EFFECTIVE_ENV_FILES[@]}"; do
    if [[ -e "$inc" ]]; then
        safe="$(echo "$inc" | sed 's|^\./||; s|/|_|g')"
        out="$STAGING/includes/${safe}.tar.gz"
        run_component File "$inc" "$out" bash "$LIB_DIR/backup-path.sh" "$inc" "$out"
    else
        print_yellow "  skip (missing): $inc"
        emit_event component type File name "$inc" status Skipped error "missing"
    fi
done

# ----- Manifest -----------------------------------------------------------
print_blue "Writing manifest..."
GIT_SHA="$(git rev-parse HEAD 2>/dev/null || echo 'unknown')"

MANIFEST_PATH="$STAGING/manifest.json"
python3 - <<PY >"$MANIFEST_PATH"
import json, os, hashlib, sys

def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            h.update(chunk)
    return h.hexdigest()

staging = "$STAGING"
files = []
for root, _, names in os.walk(staging):
    for n in names:
        if n == "manifest.json":
            continue
        p = os.path.join(root, n)
        rel = os.path.relpath(p, staging)
        files.append({
            "path": rel.replace(os.sep, "/"),
            "size": os.path.getsize(p),
            "sha256": sha256(p),
        })

manifest = {
    "project": "$PROJECT",
    "run_id": "$RUN_ID",
    "timestamp_utc": "$TIMESTAMP",
    "git_sha": "$GIT_SHA",
    "encryption": "$ENCRYPTION_MODE",
    "key_fingerprint": "$KEY_FINGERPRINT",
    "retention_days": int("$BACKUP_RETENTION_DAYS"),
    "files": sorted(files, key=lambda x: x["path"]),
}
json.dump(manifest, sys.stdout, indent=2, sort_keys=True)
PY

# Emit manifest event (full manifest JSON object) for the sidecar.
if [[ "$JSON_MODE" == "true" ]]; then
    python3 - <<PY
import json, sys
with open("$MANIFEST_PATH") as f:
    m = json.load(f)
print(json.dumps({"event": "manifest", "manifest": m}), flush=True)
PY
fi

# ----- Archive + encrypt --------------------------------------------------
print_blue "Creating archive: $ARCHIVE_PLAIN"
tar -czf "$ARCHIVE_PLAIN" -C "$BACKUP_STAGING_DIR" "$RUN_ID"

print_blue "Encrypting archive: $ARCHIVE_ENC"
bash "$LIB_DIR/encrypt.sh" encrypt "$ARCHIVE_PLAIN" "$ARCHIVE_ENC" >/dev/null
rm -f "$ARCHIVE_PLAIN"
rm -rf "$STAGING"

ARCHIVE_BYTES="$(stat -c %s "$ARCHIVE_ENC" 2>/dev/null || stat -f %z "$ARCHIVE_ENC" 2>/dev/null || echo 0)"
ARCHIVE_SIZE="$(du -h "$ARCHIVE_ENC" | cut -f1)"
ARCHIVE_SHA="$(sha256sum "$ARCHIVE_ENC" | cut -d' ' -f1)"
print_green "Archive ready: $ARCHIVE_ENC ($ARCHIVE_SIZE)"

emit_event archive archivePath "$ARCHIVE_ENC" archiveBytes "$ARCHIVE_BYTES" \
    archiveSha256 "$ARCHIVE_SHA" keyFingerprint "$KEY_FINGERPRINT"

# ----- Upload + prune per destination ------------------------------------
for i in "${!DEST_TYPES[@]}"; do
    TYPE="${DEST_TYPES[$i]}"
    OUT="${DEST_OUTPUTS[$i]}"
    SSE="${DEST_SSES[$i]}"
    KMS="${DEST_KMS[$i]}"
    print_blue "Uploading to [$TYPE] $OUT"
    emit_event destination type "$TYPE" output "$OUT" status Running
    upload_rc=0
    case "$TYPE" in
        local) bash "$LIB_DIR/destination-local.sh" upload "$ARCHIVE_ENC" "$OUT" || upload_rc=$? ;;
        s3)    bash "$LIB_DIR/destination-s3.sh"    upload "$ARCHIVE_ENC" "$OUT" "$SSE" "$KMS" || upload_rc=$? ;;
        *) print_red "Unknown destination type: $TYPE"; upload_rc=1 ;;
    esac
    if [[ $upload_rc -ne 0 ]]; then
        emit_event destination type "$TYPE" output "$OUT" status Failed error "upload exit=$upload_rc"
        print_red "Upload to [$TYPE] $OUT failed"
        exit $upload_rc
    fi

    final_path=""
    case "$TYPE" in
        local) final_path="${OUT%/}/$(basename "$ARCHIVE_ENC")" ;;
        s3)    final_path="${OUT%/}/$(basename "$ARCHIVE_ENC")" ;;
    esac

    emit_event destination type "$TYPE" output "$OUT" status Success \
        uploadedBytes "$ARCHIVE_BYTES" finalPath "$final_path"

    print_cyan "Pruning old backups at [$TYPE] $OUT (>$BACKUP_RETENTION_DAYS days)"
    case "$TYPE" in
        local) bash "$LIB_DIR/destination-local.sh" prune "$OUT" "$BACKUP_RETENTION_DAYS" "$PROJECT" || true ;;
        s3)    bash "$LIB_DIR/destination-s3.sh"    prune "$OUT" "$BACKUP_RETENTION_DAYS" "$PROJECT" || true ;;
    esac
done

# The archive has been uploaded to every configured destination. The
# sidecar-local copy at $ARCHIVE_ENC served only as upload source; keeping
# it around would duplicate storage (each destination already holds the
# authoritative copy) and — prior to this change — leaked multi-GB files
# into backup-data forever. Always delete.
rm -f "$ARCHIVE_ENC"

# ----- Log ----------------------------------------------------------------
mkdir -p "$(dirname "$BACKUP_LOG_FILE")"
SUMMARY="$(date -u +%Y-%m-%dT%H:%M:%SZ) SUCCESS project=$PROJECT run=$RUN_ID size=$ARCHIVE_SIZE destinations=${#DEST_TYPES[@]} retention=$BACKUP_RETENTION_DAYS encryption=$ENCRYPTION_MODE"
echo "$SUMMARY" | tee -a "$BACKUP_LOG_FILE" >&2

emit_event done status Success
print_green "Backup complete."
trap - ERR
cd "$STARTING_PATH"
