#!/bin/bash
# docker/backup/lib/discover.sh
#
# Inspect the resolved docker compose configuration (honoring active profiles
# and top-level includes) and emit a JSON plan describing what to back up.
#
# Usage: discover.sh [--exclude-volumes "a b c"] [--exclude-paths "p1 p2"]
#                    [--exclude-services "svc1 svc2"]
#                    [--include-databases "svc1:postgres svc2:mariadb"]
#
# Blacklist semantics: every compose service with at least one volume or
# bind contributes to the plan. Items listed in --exclude-volumes /
# --exclude-paths are dropped. Services listed in --exclude-services have
# their DB dump suppressed (volumes/binds still contributed by other
# services).
#
# --include-databases: authoritative "service:engine" hints from the
# server's BackupDiscoveryService (which parses Dockerfiles' last FROM
# line and therefore sees custom DB builds that image-name sniffing here
# misses). When a hint is present for a service, its engine overrides
# the image-substring classification below. Services without a hint
# still fall through to the substring check, so the script remains
# usable standalone (no --include-databases) with the old behavior.
#
# Output (stdout): JSON document, e.g.
# {
#   "project": "skeleton",
#   "services": [
#     {"name": "database", "hasVolume": true, "image": "postgis/...", "engine": "postgres"},
#     {"name": "wiki",     "hasVolume": true, "image": "wiki:...",    "engine": null}
#   ],
#   "volumes": [
#     {"name": "database-data", "services": ["database"]}
#   ],
#   "binds": [
#     {"source": "/abs/path", "type": "directory", "services": ["wiki"]},
#     {"source": "/abs/file", "type": "file", "services": ["seeders"]}
#   ],
#   "databases": [
#     {"service": "database", "engine": "postgres", "image": "postgis/..."},
#     {"service": "wiki-db", "engine": "mariadb", "image": "mariadb:..."}
#   ]
# }
#
# This script must be run from the repo root so that `docker compose config`
# resolves the top-level compose file (which `include:`s docker/docker-compose.yml).

set -euo pipefail

EXCLUDE_VOLUMES=""
EXCLUDE_PATHS=""
EXCLUDE_SERVICES=""
INCLUDE_DATABASES=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --exclude-volumes)   EXCLUDE_VOLUMES="$2";   shift 2 ;;
        --exclude-paths)     EXCLUDE_PATHS="$2";     shift 2 ;;
        --exclude-services)  EXCLUDE_SERVICES="$2";  shift 2 ;;
        --include-databases) INCLUDE_DATABASES="$2"; shift 2 ;;
        *) echo "discover.sh: unknown argument: $1" >&2; exit 2 ;;
    esac
done

if ! command -v docker >/dev/null 2>&1; then
    echo "discover.sh: docker is required" >&2
    exit 1
fi
if ! command -v python3 >/dev/null 2>&1; then
    echo "discover.sh: python3 is required" >&2
    exit 1
fi

# Get the fully resolved compose config as JSON. Validate the output is
# actually JSON - older `docker compose` plugins silently fall back to
# YAML if `--format json` is unrecognized, and interpolation warnings can
# leak to stdout on some versions. Any of those leave the downstream
# Python json.load() failing with a useless traceback, so we fail fast
# here with the real diagnostic info instead.
CONFIG_STDERR_FILE="$(mktemp)"
trap 'rm -f "$CONFIG_STDERR_FILE"' EXIT

CONFIG_RC=0
CONFIG_JSON="$(docker compose config --format json 2>"$CONFIG_STDERR_FILE")" || CONFIG_RC=$?

bail() {
    {
        echo "discover.sh: $1"
        echo "  cwd:      $(pwd)"
        echo "  compose:  $(docker compose version 2>&1 | head -1)"
        echo "  exitcode: $CONFIG_RC"
        echo "---- stderr ----"
        cat "$CONFIG_STDERR_FILE"
        echo "----------------"
        if [[ -n "$CONFIG_JSON" ]]; then
            echo "---- stdout (truncated) ----"
            printf '%s\n' "$CONFIG_JSON" | head -c 2000
            echo
            echo "----------------------------"
        fi
    } >&2
    exit 1
}

[[ $CONFIG_RC -ne 0 ]] && bail "'docker compose config --format json' exited non-zero"
[[ -z "$CONFIG_JSON" ]] && bail "'docker compose config --format json' produced empty output"
# Quick JSON shape sanity check - the output should start with '{'. This
# catches YAML-mode fallback (starts with a key-line) and interpolation
# warnings landing on stdout.
case "$(printf '%s' "$CONFIG_JSON" | head -c 1)" in
    '{') ;;
    *)   bail "'docker compose config --format json' returned non-JSON output" ;;
esac

export CONFIG_JSON EXCLUDE_VOLUMES EXCLUDE_PATHS EXCLUDE_SERVICES INCLUDE_DATABASES

python3 - <<'PY'
import json, os, sys

data = json.loads(os.environ["CONFIG_JSON"])

project = data.get("name") or "docker"
services = data.get("services") or {}
top_volumes = set((data.get("volumes") or {}).keys())

excl_vols = set((os.environ.get("EXCLUDE_VOLUMES") or "").split())
excl_paths = set((os.environ.get("EXCLUDE_PATHS") or "").split())
# Scope note: EXCLUDE_SERVICES suppresses only the DB dump for listed
# services. Their volumes and bind mounts still contribute to the plan
# (filtered separately by EXCLUDE_VOLUMES / EXCLUDE_PATHS and by the
# server-side auto-exclude logic).
excl_services = set((os.environ.get("EXCLUDE_SERVICES") or "").split())

# Authoritative "service:engine" hints from the server. Services listed
# here are treated as DB services with the given engine regardless of
# what image-name sniffing would conclude. This is how custom-built DB
# images (our own PostGIS `database` service) get dumped: the server's
# BackupDiscoveryService parses their Dockerfile's last FROM line, and
# ships the answer down here so we don't have to duplicate that logic.
include_db_hints = {}
for pair in (os.environ.get("INCLUDE_DATABASES") or "").split():
    if ":" not in pair:
        continue
    svc, engine = pair.split(":", 1)
    svc = svc.strip()
    engine = engine.strip().lower()
    if svc and engine in ("postgres", "mariadb"):
        include_db_hints[svc] = engine

svc_list = []   # {name, hasVolume, image, engine|null}
vol_map = {}    # vol_name -> [service, ...]
bind_map = {}   # abs source path -> {"type": "directory"|"file", "services": [...]}
db_list = []

def classify_bind(src):
    # Treat trailing slash or existing dir as directory, trailing file ext as file.
    if os.path.isdir(src):
        return "directory"
    if os.path.isfile(src):
        return "file"
    # Heuristic when path doesn't exist on the host running discovery:
    return "file" if ("." in os.path.basename(src) and not src.endswith("/")) else "directory"

def is_db_image(image):
    img = (image or "").lower()
    return any(k in img for k in ("postgres", "postgis", "mariadb", "mysql"))

def db_engine(image):
    img = (image or "").lower()
    if "mariadb" in img or ("mysql" in img and "postgres" not in img):
        return "mariadb"
    return "postgres"

for svc_name, svc in services.items():
    image = svc.get("image") or ""
    has_vol = False

    for v in (svc.get("volumes") or []):
        if isinstance(v, dict):
            vtype = v.get("type")
            source = v.get("source")
        else:
            # short syntax "src:dst[:mode]"
            parts = str(v).split(":")
            source = parts[0] if parts else ""
            vtype = "volume" if source and source in top_volumes else "bind"

        if not source:
            continue
        has_vol = True

        if vtype == "volume" or source in top_volumes:
            if source in excl_vols:
                continue
            vol_map.setdefault(source, []).append(svc_name)
        elif vtype == "bind":
            # Resolve to absolute path for stable keying.
            abs_src = os.path.abspath(source)
            if abs_src in excl_paths or source in excl_paths:
                continue
            entry = bind_map.setdefault(abs_src, {"type": classify_bind(abs_src), "services": []})
            if svc_name not in entry["services"]:
                entry["services"].append(svc_name)

    # Classify as a DB service. Prefer the explicit server-side hint when
    # present (covers custom-built images whose tag lacks a DB keyword);
    # otherwise fall through to image-name sniffing so standalone shell
    # invocations (no --include-databases) keep working.
    hinted_engine = include_db_hints.get(svc_name)
    image_is_db = is_db_image(image)
    resolved_engine = db_engine(image) if image_is_db else hinted_engine
    is_db = image_is_db or hinted_engine is not None

    # Emit every non-excluded service with a volume/bind.
    if has_vol:
        svc_list.append({
            "name": svc_name,
            "hasVolume": True,
            "image": image,
            "engine": resolved_engine,
        })

    # Databases: a derived view used by the executor for engine-specific dumps.
    # excl_services suppresses the dump only — the service's volumes/binds
    # already went through the loops above unaffected.
    if is_db and svc_name not in excl_services:
        db_list.append({"service": svc_name, "engine": resolved_engine, "image": image})

out = {
    "project": project,
    "services": sorted(svc_list, key=lambda s: s["name"]),
    "volumes": [{"name": n, "services": sorted(set(s))} for n, s in sorted(vol_map.items())],
    "binds": [{"source": p, "type": e["type"], "services": sorted(set(e["services"]))}
              for p, e in sorted(bind_map.items())],
    "databases": sorted(db_list, key=lambda d: d["service"]),
}
json.dump(out, sys.stdout, indent=2)
sys.stdout.write("\n")
PY
