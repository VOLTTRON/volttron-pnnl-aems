#!/bin/bash
#
# backup-restore.sh - Restore components from an encrypted backup archive.
#
# Decrypts the archive, verifies manifest checksums, then restores databases
# (via docker compose exec), named volumes (via throwaway alpine), and/or
# bind-mount paths.
#
# This is the break-glass CLI recovery tool; normal backup operation happens
# entirely through the Backups admin UI (/backups). Restore is kept as a CLI
# because it must work when the app and its UI may be unavailable.
#
# Usage:
#   ./backup-restore.sh                          # fully interactive
#   ./backup-restore.sh --archive <path-or-s3-url> [options]
#
# Options:
#   --archive <path|s3://...>            Path or S3 URL to the encrypted archive.
#                                        Omit to pick from a menu of archives found in
#                                        ./docker/backups/ and the backup-archives docker volume.
#   --identity <file>                    Path to the age private key file (for .age archives).
#                                        Omit to auto-detect ./docker/secrets/backup/age.key
#                                        or to paste the key contents interactively.
#   --gpg-key-file <file>                Path to the gpg passphrase file (for .gpg archives).
#   --components <list>                  Comma-separated: databases,volumes,paths,includes,all
#                                        Default: all (interactive picker if omitted on a TTY).
#   --only <names>                       Comma-separated component names to include
#                                        (e.g. "database,file-upload"). Overrides --components.
#   --force                              Skip confirmation prompts
#   --dry-run                            Show actions without performing them
#   -h, --help                           Show this help
#
# The backup sidecar stores the active age private key at /host-secrets/age.key
# inside the container; on the host that's ./docker/secrets/backup/age.key. The
# key can also be downloaded from the Backups admin UI (Keys tab) for safekeeping.
#
# WARNING: restore overwrites running data. Stop traffic or put the app in
# maintenance mode before running.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/docker/backup/lib"

ARCHIVE=""
COMPONENTS="all"
ONLY=""
IDENTITY_CLI=""
GPG_KEY_FILE_CLI=""
FORCE=false
DRY_RUN=false

print_blue()   { echo -e "\033[1;34m$1\033[0m"; }
print_cyan()   { echo -e "\033[1;36m$1\033[0m"; }
print_green()  { echo -e "\033[1;32m$1\033[0m"; }
print_yellow() { echo -e "\033[1;33m$1\033[0m"; }
print_red()    { echo -e "\033[1;31m$1\033[0m" >&2; }

show_help() {
    sed -n '1,39p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
    exit 0
}

# Default host-side locations (repo root is $SCRIPT_DIR). The docker-compose
# mounts ./backups and ./secrets/backup relative to ./docker/, so on the host
# they live under ./docker/.
DEFAULT_ARCHIVE_DIR="$SCRIPT_DIR/docker/backups"
DEFAULT_AGE_KEY="$SCRIPT_DIR/docker/secrets/backup/age.key"
DEFAULT_SECRETS_DIR="$SCRIPT_DIR/docker/secrets/backup"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --archive)       ARCHIVE="$2"; shift 2 ;;
        --components)    COMPONENTS="$2"; shift 2 ;;
        --only)          ONLY="$2"; shift 2 ;;
        --identity)      IDENTITY_CLI="$2"; shift 2 ;;
        --gpg-key-file)  GPG_KEY_FILE_CLI="$2"; shift 2 ;;
        --force)         FORCE=true; shift ;;
        --dry-run)       DRY_RUN=true; shift ;;
        -h|--help)       show_help ;;
        *) print_red "Unknown argument: $1"; exit 2 ;;
    esac
done

# CLI flags override environment. The sidecar container pre-exports
# BACKUP_AGE_IDENTITY so restore run from inside the sidecar works with no
# flags; host-side restores supply --identity / --gpg-key-file explicitly.
if [[ -n "$IDENTITY_CLI" ]]; then
    export BACKUP_AGE_IDENTITY="$IDENTITY_CLI"
fi
if [[ -n "$GPG_KEY_FILE_CLI" ]]; then
    export BACKUP_GPG_KEY_FILE="$GPG_KEY_FILE_CLI"
fi

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# --- Interactive archive discovery ---------------------------------------

human_size() {
    local bytes="$1"
    if (( bytes >= 1073741824 )); then printf "%.1fG" "$(awk "BEGIN{print $bytes/1073741824}")"
    elif (( bytes >= 1048576 )); then printf "%.1fM" "$(awk "BEGIN{print $bytes/1048576}")"
    elif (( bytes >= 1024 )); then printf "%.1fK" "$(awk "BEGIN{print $bytes/1024}")"
    else printf "%dB" "$bytes"; fi
}

# Append discovered candidates to $WORK/candidates.tsv as:
#   <source>\t<display>\t<locator>
# where <source> is "local" or "volume:<name>"; <locator> is an absolute host
# path for local, or the filename within the named volume otherwise.
discover_archives() {
    local out="$WORK/candidates.tsv"
    : > "$out"

    if [[ -d "$DEFAULT_ARCHIVE_DIR" ]]; then
        while IFS= read -r -d '' f; do
            local size mtime disp
            size=$(stat -c '%s' "$f" 2>/dev/null || wc -c <"$f")
            mtime=$(date -r "$f" '+%Y-%m-%d %H:%M' 2>/dev/null || echo "?")
            disp="$(basename "$f")  ($(human_size "$size"), $mtime)"
            printf "local\t%s\t%s\n" "$disp" "$f" >> "$out"
        done < <(find "$DEFAULT_ARCHIVE_DIR" -maxdepth 1 -type f \
                    \( -name '*.tar.gz.age' -o -name '*.tar.gz.gpg' \) -print0 2>/dev/null | sort -zr)
    fi

    if command -v docker >/dev/null 2>&1; then
        local proj="${COMPOSE_PROJECT_NAME:-$(basename "$SCRIPT_DIR")}"
        local vol="${proj}_backup-archives"
        if docker volume inspect "$vol" >/dev/null 2>&1; then
            while IFS= read -r line; do
                [[ -z "$line" ]] && continue
                printf "volume:%s\t[volume] %s\t%s\n" "$vol" "$line" "$line" >> "$out"
            done < <(docker run --rm -v "${vol}:/d:ro" alpine:3 sh -c \
                        'ls -1t /d 2>/dev/null | grep -E "\.tar\.gz\.(age|gpg)$"' 2>/dev/null)
        fi
    fi
}

prompt_archive() {
    print_blue "Searching for backup archives..."
    discover_archives
    local candidates="$WORK/candidates.tsv"

    local -a items=()
    if [[ -s "$candidates" ]]; then
        mapfile -t items < "$candidates"
    fi

    print_cyan "Found ${#items[@]} candidate archive(s):"
    local i=1
    for entry in "${items[@]}"; do
        local disp="${entry#*$'\t'}"; disp="${disp%$'\t'*}"
        printf "  %2d) %s\n" "$i" "$disp"
        i=$((i+1))
    done
    local s3_opt=$i;     printf "  %2d) Enter S3 URL (s3://bucket/key)\n" "$s3_opt"; i=$((i+1))
    local path_opt=$i;   printf "  %2d) Enter custom file path\n" "$path_opt"; i=$((i+1))
    local cancel_opt=$i; printf "  %2d) Cancel\n" "$cancel_opt"

    local choice
    read -r -p "Select [1-$cancel_opt]: " choice
    [[ "$choice" =~ ^[0-9]+$ ]] || { print_red "Invalid selection: $choice"; exit 2; }

    if (( choice == cancel_opt )); then print_yellow "Cancelled"; exit 0
    elif (( choice == s3_opt )); then
        read -r -p "S3 URL (s3://bucket/key): " ARCHIVE
        [[ -z "$ARCHIVE" ]] && { print_red "No URL given"; exit 2; }
    elif (( choice == path_opt )); then
        read -r -p "Archive path: " ARCHIVE
        [[ -z "$ARCHIVE" ]] && { print_red "No path given"; exit 2; }
    elif (( choice >= 1 && choice <= ${#items[@]} )); then
        local entry="${items[$((choice-1))]}"
        local src="${entry%%$'\t'*}"
        local rest="${entry#*$'\t'}"
        local locator="${rest#*$'\t'}"
        if [[ "$src" == "local" ]]; then
            ARCHIVE="$locator"
        else
            local vol="${src#volume:}"
            print_blue "Copying $locator from docker volume $vol..."
            mkdir -p "$WORK/volcopy"
            docker run --rm -v "${vol}:/d:ro" -v "$WORK/volcopy:/out" alpine:3 \
                sh -c "cp '/d/$locator' '/out/$locator'"
            ARCHIVE="$WORK/volcopy/$locator"
        fi
    else
        print_red "Invalid selection"; exit 2
    fi
    print_green "Archive: $ARCHIVE"
}

# --- Interactive key discovery -------------------------------------------

prompt_key() {
    # Already provided via CLI or env.
    [[ -n "${BACKUP_AGE_IDENTITY:-}" || -n "${BACKUP_GPG_KEY_FILE:-}" ]] && return 0

    # Infer type from extension; default to age.
    local kind="age"
    case "$ARCHIVE" in *.gpg) kind="gpg" ;; esac

    if [[ "$kind" == "age" && -f "$DEFAULT_AGE_KEY" ]]; then
        print_blue "Auto-detected age key at $DEFAULT_AGE_KEY"
        export BACKUP_AGE_IDENTITY="$DEFAULT_AGE_KEY"
        return 0
    fi

    print_yellow "No recovery key configured."
    if [[ "$kind" == "age" ]]; then
        echo "  Searched: $DEFAULT_AGE_KEY (not present)"
        echo "  Options:"
        echo "    1) Paste age private key (line starting with AGE-SECRET-KEY-1...)"
        echo "    2) Enter path to an age key file"
        echo "    3) Cancel"
        local choice
        read -r -p "Select [1-3]: " choice
        case "$choice" in
            1)
                local kf="$WORK/identity.age"
                print_cyan "Paste the key, then press Enter on a blank line:"
                local line buf=""
                while IFS= read -r line; do
                    [[ -z "$line" ]] && break
                    buf+="$line"$'\n'
                done
                [[ -z "$buf" ]] && { print_red "No input received"; exit 2; }
                printf '%s' "$buf" > "$kf"
                chmod 600 "$kf"
                if ! grep -q 'AGE-SECRET-KEY-' "$kf"; then
                    print_yellow "Warning: pasted content does not look like an age private key."
                    read -r -p "Continue anyway? (yes/no): " c
                    [[ "$c" == "yes" ]] || { print_yellow "Cancelled"; exit 0; }
                fi
                export BACKUP_AGE_IDENTITY="$kf"
                ;;
            2)
                read -r -p "Age key file path: " p
                [[ -f "$p" ]] || { print_red "File not found: $p"; exit 1; }
                export BACKUP_AGE_IDENTITY="$p"
                ;;
            *) print_yellow "Cancelled"; exit 0 ;;
        esac
    else
        echo "  Options:"
        echo "    1) Enter gpg passphrase (hidden input)"
        echo "    2) Enter path to a passphrase file"
        echo "    3) Cancel"
        local choice
        read -r -p "Select [1-3]: " choice
        case "$choice" in
            1)
                local pf="$WORK/passphrase.txt"
                read -r -s -p "Passphrase: " pass; echo
                [[ -z "$pass" ]] && { print_red "No input received"; exit 2; }
                printf '%s' "$pass" > "$pf"
                chmod 600 "$pf"
                export BACKUP_GPG_KEY_FILE="$pf"
                ;;
            2)
                read -r -p "Passphrase file path: " p
                [[ -f "$p" ]] || { print_red "File not found: $p"; exit 1; }
                export BACKUP_GPG_KEY_FILE="$p"
                ;;
            *) print_yellow "Cancelled"; exit 0 ;;
        esac
    fi
}

# Run discovery / key prompt before touching the archive.
if [[ -z "$ARCHIVE" ]]; then
    if [[ ! -t 0 ]]; then
        print_red "--archive is required (no TTY for interactive prompt)"
        exit 2
    fi
    prompt_archive
fi

if [[ -z "${BACKUP_AGE_IDENTITY:-}" && -z "${BACKUP_GPG_KEY_FILE:-}" ]]; then
    if [[ ! -t 0 ]]; then
        print_red "No decryption key provided. Pass --identity or --gpg-key-file,"
        print_red "or run from a TTY for the interactive prompt."
        exit 2
    fi
    prompt_key
fi

# --- Fetch archive ---
LOCAL_ARCHIVE=""
if [[ "$ARCHIVE" == s3://* ]]; then
    command -v aws >/dev/null 2>&1 || { print_red "aws CLI is required"; exit 1; }
    LOCAL_ARCHIVE="$WORK/$(basename "$ARCHIVE")"
    print_blue "Downloading $ARCHIVE"
    aws s3 cp "$ARCHIVE" "$LOCAL_ARCHIVE"
else
    LOCAL_ARCHIVE="$ARCHIVE"
    [[ -f "$LOCAL_ARCHIVE" ]] || { print_red "Archive not found: $LOCAL_ARCHIVE"; exit 1; }
fi

# --- Decrypt ---
# Prefer local age/gpg. If the needed binary is missing but docker is
# available (common on Windows hosts), fall back to a throwaway container
# so users don't need to install age/gpg just to run restore.
DECRYPTED="$WORK/archive.tar.gz"
print_blue "Decrypting archive"

# Build a host path docker will accept. On Git Bash / MSYS, $WORK looks
# like /tmp/tmp.xxx which is not a real filesystem path Docker Desktop can
# see — cygpath -w turns it into C:\Users\...\Temp\tmp.xxx. Docker Desktop
# needs C: shared (default) and, on Windows, that the temp dir be reachable.
# We stage files under a dir inside the repo ($SCRIPT_DIR) to sidestep the
# temp-dir sharing question entirely.
host_path() {
    if command -v cygpath >/dev/null 2>&1; then
        cygpath -w "$1"
    else
        printf '%s' "$1"
    fi
}

docker_decrypt_stage() {
    # Stage under the repo tree rather than $WORK — ./docker/ is mounted
    # into containers already, so Docker Desktop certainly has access.
    local stage="$SCRIPT_DIR/.restore-stage.$$"
    mkdir -p "$stage"
    chmod 700 "$stage"
    printf '%s' "$stage"
}

decrypt_via_docker_age() {
    command -v docker >/dev/null 2>&1 || {
        print_red "'age' is not installed and docker is unavailable as a fallback."
        print_red "Install age:  winget install FiloSottile.age   (Windows)"
        print_red "              brew install age                 (macOS)"
        print_red "              apt install age                  (Debian/Ubuntu)"
        exit 1
    }
    [[ -f "$BACKUP_AGE_IDENTITY" ]] || { print_red "Age key not found: $BACKUP_AGE_IDENTITY"; exit 1; }
    print_yellow "age not found locally; decrypting via docker alpine:3.19"
    local stage; stage="$(docker_decrypt_stage)"
    trap 'rm -rf "$stage"' RETURN
    cp "$BACKUP_AGE_IDENTITY" "$stage/id.age"
    chmod 600 "$stage/id.age"
    local host; host="$(host_path "$stage")"
    MSYS_NO_PATHCONV=1 docker run --rm -i -v "${host}:/w" alpine:3.19 \
        sh -c 'apk add --no-cache age >/dev/null 2>&1 && age -d -i /w/id.age' \
        < "$LOCAL_ARCHIVE" > "$DECRYPTED"
}

decrypt_via_docker_gpg() {
    command -v docker >/dev/null 2>&1 || { print_red "'gpg' is not installed and docker is unavailable."; exit 1; }
    [[ -f "$BACKUP_GPG_KEY_FILE" ]] || { print_red "GPG passphrase file not found"; exit 1; }
    print_yellow "gpg not found locally; decrypting via docker alpine:3.19"
    local stage; stage="$(docker_decrypt_stage)"
    trap 'rm -rf "$stage"' RETURN
    cp "$BACKUP_GPG_KEY_FILE" "$stage/pass.txt"
    chmod 600 "$stage/pass.txt"
    local host; host="$(host_path "$stage")"
    MSYS_NO_PATHCONV=1 docker run --rm -i -v "${host}:/w" alpine:3.19 \
        sh -c 'apk add --no-cache gnupg >/dev/null 2>&1 && gpg --batch --yes --passphrase-file /w/pass.txt --decrypt' \
        < "$LOCAL_ARCHIVE" > "$DECRYPTED"
}

case "$LOCAL_ARCHIVE" in
    *.age)
        if command -v age >/dev/null 2>&1; then
            bash "$LIB_DIR/encrypt.sh" decrypt "$LOCAL_ARCHIVE" "$DECRYPTED"
        else
            decrypt_via_docker_age
        fi
        ;;
    *.gpg)
        if command -v gpg >/dev/null 2>&1; then
            bash "$LIB_DIR/encrypt.sh" decrypt "$LOCAL_ARCHIVE" "$DECRYPTED"
        else
            decrypt_via_docker_gpg
        fi
        ;;
    *)
        bash "$LIB_DIR/encrypt.sh" decrypt "$LOCAL_ARCHIVE" "$DECRYPTED"
        ;;
esac

# --- Extract ---
EXTRACT="$WORK/contents"
mkdir -p "$EXTRACT"
tar -xzf "$DECRYPTED" -C "$EXTRACT"

# Archive contains a single directory named <project>-<timestamp>.
INNER="$(find "$EXTRACT" -mindepth 1 -maxdepth 1 -type d | head -n1)"
if [[ -z "$INNER" || ! -f "$INNER/manifest.json" ]]; then
    print_red "Invalid archive layout: manifest.json not found"
    exit 1
fi

print_cyan "Contents:"
ls -1 "$INNER"

# --- Verify checksums ---
print_blue "Verifying checksums"
# Windows Python doesn't understand msys paths like /tmp/tmp.xxx — it maps
# them to C:\tmp\tmp.xxx. Translate to a native Windows path with cygpath
# before handing the path to Python, and use os.path.join so the native
# separator (which os.open accepts on both platforms) is used.
if command -v cygpath >/dev/null 2>&1; then
    INNER_PY="$(cygpath -w "$INNER")"
else
    INNER_PY="$INNER"
fi
INNER_PY="$INNER_PY" python3 - <<'PY'
import hashlib, json, os, sys
inner = os.environ["INNER_PY"]
with open(os.path.join(inner, "manifest.json")) as f:
    manifest = json.load(f)
bad = []
for entry in manifest["files"]:
    rel = entry["path"].replace("/", os.sep)
    p = os.path.join(inner, rel)
    try:
        fh = open(p, 'rb')
    except FileNotFoundError:
        bad.append((entry["path"], "missing"))
        continue
    h = hashlib.sha256()
    with fh:
        for chunk in iter(lambda: fh.read(65536), b''):
            h.update(chunk)
    if h.hexdigest() != entry["sha256"]:
        bad.append((entry["path"], "checksum mismatch"))
if bad:
    for name, err in bad:
        print(f"  FAIL {name}: {err}")
    sys.exit(1)
print("  OK: %d files" % len(manifest["files"]))
PY

# --- Interactive component picker ---
# Only prompt when nothing was specified and we're on a TTY. Explicit
# --components / --only flags skip the menu entirely.
if [[ -z "$ONLY" && "$COMPONENTS" == "all" && "$FORCE" != "true" && -t 0 ]]; then
    declare -a ITEM_KIND=() ITEM_NAME=()
    for kind in databases volumes paths includes; do
        [[ -d "$INNER/$kind" ]] || continue
        for f in "$INNER/$kind"/*; do
            [[ -f "$f" ]] || continue
            b="$(basename "$f")"; b="${b%.sql.gz}"; b="${b%.tar.gz}"
            ITEM_KIND+=("$kind"); ITEM_NAME+=("$b")
        done
    done
    if (( ${#ITEM_KIND[@]} > 0 )); then
        echo
        print_cyan "Restorable items (${#ITEM_KIND[@]}):"
        for idx in "${!ITEM_KIND[@]}"; do
            printf "  %2d) %s / %s\n" "$((idx+1))" "${ITEM_KIND[$idx]}" "${ITEM_NAME[$idx]}"
        done
        echo "  a) Restore ALL items                       (default)"
        echo "  c) Pick categories (databases,volumes,...)"
        echo "  s) Pick individual items by number         (e.g. 1,3,5)"
        echo "  q) Cancel"
        read -r -p "Select [a/c/s/q]: " pick
        case "${pick:-a}" in
            a|A) : ;;
            c|C)
                read -r -p "Categories: " COMPONENTS
                [[ -z "$COMPONENTS" ]] && COMPONENTS="all"
                ;;
            s|S)
                read -r -p "Item numbers (comma-separated): " nums
                picked=""
                IFS=',' read -ra arr <<< "$nums"
                for n in "${arr[@]}"; do
                    n="${n// /}"
                    [[ "$n" =~ ^[0-9]+$ ]] || continue
                    if (( n >= 1 && n <= ${#ITEM_KIND[@]} )); then
                        picked+="${ITEM_NAME[$((n-1))]},"
                    fi
                done
                ONLY="${picked%,}"
                [[ -z "$ONLY" ]] && { print_red "No valid items selected"; exit 2; }
                ;;
            q|Q) print_yellow "Cancelled"; exit 0 ;;
            *) print_red "Invalid selection"; exit 2 ;;
        esac
    fi
fi

# --- Confirm ---
if [[ "$FORCE" != "true" && "$DRY_RUN" != "true" ]]; then
    print_yellow "This will OVERWRITE existing databases, volumes, and paths."
    if [[ -n "$ONLY" ]]; then
        print_yellow "Items to restore: $ONLY"
    elif [[ "$COMPONENTS" != "all" ]]; then
        print_yellow "Categories to restore: $COMPONENTS"
    else
        print_yellow "Restoring ALL components."
    fi
    read -r -p "Proceed with restore? (yes/no): " ans
    [[ "$ans" == "yes" ]] || { print_yellow "Aborted"; exit 0; }
fi

should_run() {
    local kind="$1" name="$2"
    if [[ -n "$ONLY" ]]; then
        [[ ",${ONLY}," == *",${name},"* ]]
        return
    fi
    [[ "$COMPONENTS" == "all" ]] && return 0
    [[ ",${COMPONENTS}," == *",${kind},"* ]]
}

run_or_echo() {
    if [[ "$DRY_RUN" == "true" ]]; then
        print_yellow "[DRY RUN] $*"
    else
        eval "$@"
    fi
}

# --- Prepare services for restore ---------------------------------------
# Users shouldn't need to know which containers to start. We detect the DB
# services we're about to restore, bring them up on-demand (no deps, so the
# app server doesn't spin up and hold connections), and wait for readiness.
# Non-DB services that are currently running are flagged because they may
# write to the DBs or hold volume files open during restore.

is_service_running() {
    docker compose ps --services --filter 'status=running' 2>/dev/null | grep -qx "$1"
}

wait_for_db_ready() {
    local svc="$1"
    local timeout=90
    local waited=0
    print_blue "Waiting for $svc to accept connections (up to ${timeout}s)..."
    while (( waited < timeout )); do
        if docker compose exec -T "$svc" sh -lc '
            if command -v pg_isready >/dev/null 2>&1; then
                pg_isready -U "${POSTGRES_USER:-postgres}" -q && exit 0
            fi
            if command -v mariadb-admin >/dev/null 2>&1; then ADMIN=mariadb-admin
            elif command -v mysqladmin >/dev/null 2>&1; then ADMIN=mysqladmin
            else exit 1; fi
            # Try unset MYSQL_PWD first (covers socket / no-password root
            # accounts). Then fall through to each known candidate.
            env -u MYSQL_PWD "$ADMIN" -uroot ping --silent >/dev/null 2>&1 && exit 0
            CF=$(mktemp)
            if [ -n "${MYSQL_ROOT_PASSWORD_FILE:-}" ] && [ -f "$MYSQL_ROOT_PASSWORD_FILE" ]; then
                printf "%s\n" "$(cat "$MYSQL_ROOT_PASSWORD_FILE")" >> "$CF"
            fi
            if [ -n "${MYSQL_ROOT_PASSWORD:-}" ]; then
                case "$MYSQL_ROOT_PASSWORD" in
                    SeT_tHiS_iN_*|CHANGEME*) : ;;
                    *) printf "%s\n" "$MYSQL_ROOT_PASSWORD" >> "$CF" ;;
                esac
            fi
            for f in /run/secrets/*root_password* /run/secrets/*_root_password; do
                [ -f "$f" ] || continue
                printf "%s\n" "$(cat "$f")" >> "$CF"
            done
            while IFS= read -r p; do
                if MYSQL_PWD="$p" "$ADMIN" -uroot ping --silent >/dev/null 2>&1; then
                    rm -f "$CF"; exit 0
                fi
            done < "$CF"
            rm -f "$CF"
            exit 1
        ' >/dev/null 2>&1; then
            print_green "  $svc is ready"
            return 0
        fi
        sleep 2
        waited=$((waited + 2))
    done
    print_red "Timeout waiting for $svc"
    return 1
}

STARTED_BY_US=()

prepare_services() {
    command -v docker >/dev/null 2>&1 || { print_red "docker is required for restore"; exit 1; }

    # Build all custom images up front. This handles fresh clones where the
    # PostGIS database image (and any other build-based service) doesn't yet
    # exist locally. Compose uses its layer cache, so this is fast on
    # subsequent runs.
    print_blue "Building service images (docker compose build)..."
    run_or_echo "docker compose build"

    local -a need_db=()
    if [[ -d "$INNER/databases" ]]; then
        for dump in "$INNER/databases"/*.sql.gz; do
            [[ -f "$dump" ]] || continue
            local svc
            svc="$(basename "$dump" .sql.gz)"
            should_run "databases" "$svc" || continue
            need_db+=("$svc")
        done
    fi

    # If no DBs are being restored, nothing to start. Volume/path/include
    # restores don't require running services.
    if (( ${#need_db[@]} == 0 )); then
        return 0
    fi

    # Warn about running non-DB services. They can keep connections open
    # against the DBs or hold volume files, causing restore to fail or
    # leave inconsistent state.
    local running
    running="$(docker compose ps --services --filter 'status=running' 2>/dev/null || true)"
    if [[ -n "$running" ]]; then
        local -a noisy=()
        local s
        while IFS= read -r s; do
            [[ -z "$s" ]] && continue
            local needed=false n
            for n in "${need_db[@]}"; do
                [[ "$s" == "$n" ]] && { needed=true; break; }
            done
            $needed && continue
            noisy+=("$s")
        done <<< "$running"

        if (( ${#noisy[@]} > 0 )); then
            print_yellow "These services are currently running and may conflict with the restore:"
            for s in "${noisy[@]}"; do echo "    - $s"; done
            local ans="yes"
            if [[ "$FORCE" != "true" && "$DRY_RUN" != "true" && -t 0 ]]; then
                read -r -p "Stop them before restoring? (yes/no) [yes]: " ans
                ans="${ans:-yes}"
            fi
            if [[ "$ans" == "yes" ]]; then
                # shellcheck disable=SC2086
                run_or_echo "docker compose stop ${noisy[*]}"
            else
                print_yellow "Leaving them running — restore may fail or produce inconsistent state."
            fi
        fi
    fi

    local svc
    for svc in "${need_db[@]}"; do
        if is_service_running "$svc"; then
            print_cyan "Service already running: $svc"
        else
            print_blue "Starting service: $svc"
            # Images were already built above. --no-deps keeps the app
            # server (and other downstream consumers) from spinning up and
            # holding DB connections while we restore.
            run_or_echo "docker compose up -d --no-deps \"$svc\""
            STARTED_BY_US+=("$svc")
        fi
        if [[ "$DRY_RUN" != "true" ]]; then
            wait_for_db_ready "$svc" || exit 1
        fi
    done
}

prepare_services

# --- Restore databases ---
if [[ -d "$INNER/databases" ]]; then
    for dump in "$INNER/databases"/*.sql.gz; do
        [[ -f "$dump" ]] || continue
        svc="$(basename "$dump" .sql.gz)"
        should_run "databases" "$svc" || { print_cyan "skip db: $svc"; continue; }
        print_blue "Restoring database: $svc"
        # Detect engine from running container image.
        IMAGE="$(docker compose images --format json "$svc" 2>/dev/null | python3 -c '
import json, sys
try:
    rows = json.load(sys.stdin)
    if isinstance(rows, list) and rows:
        print(rows[0].get("Repository","") + ":" + rows[0].get("Tag",""))
except Exception:
    pass
' || true)"
        case "${IMAGE,,}" in
            *mariadb*|*mysql*)
                # Probe for a working root auth method in this order:
                #   1) unset MYSQL_PWD entirely  (socket / no-password root)
                #   2) \$MYSQL_ROOT_PASSWORD_FILE content
                #   3) \$MYSQL_ROOT_PASSWORD (rejecting known placeholders)
                #   4) any /run/secrets/*root_password* file
                #
                # Candidate passwords are written newline-terminated to a
                # tmpfile and consumed with `while IFS= read -r` so empty
                # lines are preserved. An explicit "env -u MYSQL_PWD" pass
                # is done first because some deployments (linuxserver's
                # mariadb with placeholder secrets) configure root with no
                # password at all — not even empty-string.
                run_or_echo "gunzip -c \"$dump\" | docker compose exec -T \"$svc\" sh -c '
                    if command -v mariadb >/dev/null 2>&1; then CLI=mariadb; else CLI=mysql; fi
                    TMP=\$(mktemp); cat > \"\$TMP\"
                    CF=\$(mktemp)
                    if [ -n \"\${MYSQL_ROOT_PASSWORD_FILE:-}\" ] && [ -f \"\$MYSQL_ROOT_PASSWORD_FILE\" ]; then
                        printf \"%s\\n\" \"\$(cat \"\$MYSQL_ROOT_PASSWORD_FILE\")\" >> \"\$CF\"
                    fi
                    if [ -n \"\${MYSQL_ROOT_PASSWORD:-}\" ]; then
                        case \"\$MYSQL_ROOT_PASSWORD\" in
                            SeT_tHiS_iN_*|CHANGEME*) : ;;
                            *) printf \"%s\\n\" \"\$MYSQL_ROOT_PASSWORD\" >> \"\$CF\" ;;
                        esac
                    fi
                    for f in /run/secrets/*root_password* /run/secrets/*_root_password; do
                        [ -f \"\$f\" ] || continue
                        printf \"%s\\n\" \"\$(cat \"\$f\")\" >> \"\$CF\"
                    done
                    MODE=
                    WORKING=
                    if env -u MYSQL_PWD \"\$CLI\" --user=root -e \"SELECT 1\" >/dev/null 2>&1; then
                        MODE=unset
                    else
                        while IFS= read -r p; do
                            if MYSQL_PWD=\"\$p\" \"\$CLI\" --user=root -e \"SELECT 1\" >/dev/null 2>&1; then
                                MODE=pwd; WORKING=\"\$p\"; break
                            fi
                        done < \"\$CF\"
                    fi
                    rm -f \"\$CF\"
                    if [ -z \"\$MODE\" ]; then
                        echo \"Could not authenticate to MariaDB as root.\" >&2
                        echo \"Tried unset, \\\$MYSQL_ROOT_PASSWORD_FILE, \\\$MYSQL_ROOT_PASSWORD, /run/secrets/*root_password*.\" >&2
                        rm -f \"\$TMP\"; exit 1
                    fi
                    if [ \"\$MODE\" = unset ]; then
                        env -u MYSQL_PWD \"\$CLI\" --user=root < \"\$TMP\"
                    else
                        MYSQL_PWD=\"\$WORKING\" \"\$CLI\" --user=root < \"\$TMP\"
                    fi
                    rc=\$?; rm -f \"\$TMP\"; exit \$rc'"
                ;;
            *)
                run_or_echo "gunzip -c \"$dump\" | docker compose exec -T \"$svc\" sh -c '
                    if [ -n \"\${POSTGRES_PASSWORD_FILE:-}\" ]; then PGPASSWORD=\$(cat \"\$POSTGRES_PASSWORD_FILE\"); fi
                    export PGPASSWORD
                    USER=\"\${POSTGRES_USER:-postgres}\"; DB=\"\${POSTGRES_DB:-\$USER}\"
                    psql -U \"\$USER\" -d \"\$DB\"'"
                ;;
        esac
    done
fi

# --- Restore named volumes ---
if [[ -d "$INNER/volumes" ]]; then
    PROJECT="$(INNER_PY="$INNER_PY" python3 -c 'import json,os;print(json.load(open(os.path.join(os.environ["INNER_PY"], "manifest.json")))["project"])')"
    for arc in "$INNER/volumes"/*.tar.gz; do
        [[ -f "$arc" ]] || continue
        vol="$(basename "$arc" .tar.gz)"
        should_run "volumes" "$vol" || { print_cyan "skip volume: $vol"; continue; }
        print_blue "Restoring volume: $vol"
        FULL="${PROJECT}_${vol}"
        if ! docker volume inspect "$FULL" >/dev/null 2>&1; then
            run_or_echo "docker volume create \"$FULL\""
        fi
        run_or_echo "docker run --rm -v \"${FULL}:/data\" -v \"$(dirname "$arc"):/backup\" alpine:3 sh -c 'cd /data && tar xzf /backup/$(basename "$arc")'"
    done
fi

# --- Restore bind-mount paths ---
# The backup was created inside the sidecar container, where the host repo
# root is bind-mounted at /workspace (see docker/docker-compose.yml: the
# backup service mounts ../:/workspace). So archive names like
# "workspace_docker_secrets_backup" decode to /workspace/docker/secrets/backup
# inside the sidecar, which on the host maps to $SCRIPT_DIR/docker/secrets/backup.
# BACKUP_WORKSPACE_HOST lets an operator override the host-side workspace
# root for unusual deployments.
WORKSPACE_PREFIX="${BACKUP_WORKSPACE:-/workspace}"
WORKSPACE_HOST="${BACKUP_WORKSPACE_HOST:-$SCRIPT_DIR}"

if [[ -d "$INNER/paths" ]]; then
    for arc in "$INNER/paths"/*.tar.gz; do
        [[ -f "$arc" ]] || continue
        name="$(basename "$arc" .tar.gz)"
        should_run "paths" "$name" || { print_cyan "skip path: $name"; continue; }
        # Reconstruct absolute path from encoded filename (underscores <- slashes).
        dest="/$(echo "$name" | sed 's|_|/|g')"

        # Remap sidecar paths back to the host repo root.
        if [[ "$dest" == "$WORKSPACE_PREFIX" || "$dest" == "$WORKSPACE_PREFIX"/* ]]; then
            dest_host="${WORKSPACE_HOST}${dest#$WORKSPACE_PREFIX}"
            print_blue "Restoring path: $dest  ->  $dest_host"
            dest="$dest_host"
        else
            print_blue "Restoring path: $dest"
        fi

        # Ensure the parent directory exists — we may be restoring into a
        # location that was cleared or never existed on this host.
        parent="$(dirname "$dest")"
        if [[ ! -d "$parent" ]]; then
            run_or_echo "mkdir -p \"$parent\""
        fi
        run_or_echo "tar -xzf \"$arc\" -C \"$parent\""
    done
fi

# --- Restore include files (e.g. .env) ---
# Include archive names encode the original relative path with "/" replaced
# by "_" (see backup.sh). The archive itself contains only the file's
# basename (backup-path.sh uses `tar -C <parent> <basename>`), so we must
# extract into the *parent* subdirectory of the decoded path — not blindly
# into the repo root. Extracting into the repo root would flatten every
# <subdir>/.env into the root and clobber them in iteration order.
if [[ -d "$INNER/includes" ]]; then
    for arc in "$INNER/includes"/*.tar.gz; do
        [[ -f "$arc" ]] || continue
        name="$(basename "$arc" .tar.gz)"
        should_run "includes" "$name" || { print_cyan "skip include: $name"; continue; }

        # Decode: "docker_.env.client" -> "docker/.env.client",
        #        ".env"                -> ".env" (root-level),
        #        "common_.env"         -> "common/.env".
        decoded="$(echo "$name" | sed 's|_|/|g')"
        rel_parent="$(dirname "$decoded")"
        if [[ "$rel_parent" == "." ]]; then
            target_dir="$SCRIPT_DIR"
        else
            target_dir="$SCRIPT_DIR/$rel_parent"
        fi

        print_blue "Restoring include: $decoded  ->  $target_dir/$(basename "$decoded")"
        if [[ ! -d "$target_dir" ]]; then
            run_or_echo "mkdir -p \"$target_dir\""
        fi
        run_or_echo "tar -xzf \"$arc\" -C \"$target_dir\""
    done
fi

print_green "Restore complete."

# --- Start the full application stack ---
# Safe to do now that the DBs hold restored data: the project's init /
# seeder / prisma / migrator services are idempotent and will no-op (or
# apply outstanding migrations) against a populated database.
if [[ "$FORCE" != "true" && "$DRY_RUN" != "true" && -t 0 ]]; then
    echo
    if (( ${#STARTED_BY_US[@]} > 0 )); then
        print_cyan "Services started for restore: ${STARTED_BY_US[*]}"
    fi
    print_cyan "Start the full application stack now? [Y/n]"
    read -r -p "> " final
    case "${final:-y}" in
        y|Y|yes|YES)
            run_or_echo "docker compose up -d"
            print_green "Stack started. Check status with: docker compose ps"
            ;;
        *)
            print_yellow "Skipped. Start manually with: docker compose up -d"
            ;;
    esac
elif [[ "$FORCE" == "true" && "$DRY_RUN" != "true" ]]; then
    # Non-interactive / forced mode: bring everything up without asking.
    run_or_echo "docker compose up -d"
fi
