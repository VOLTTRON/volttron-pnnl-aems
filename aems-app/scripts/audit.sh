#!/usr/bin/env bash
set -euo pipefail

# Run osv-scanner against all workspace lockfiles.
# Usage: bash scripts/audit.sh [--json]
#   --json  write machine-readable output to osv-report.json

JSON_OUTPUT=${1:-}

OSV_ARGS=(
  --lockfile prisma/yarn.lock
  --lockfile common/yarn.lock
  --lockfile server/yarn.lock
  --lockfile client/yarn.lock
)

if [[ "$JSON_OUTPUT" == "--json" ]]; then
  OSV_ARGS+=(--format json --output osv-report.json)
fi

# Also search the winget portable packages directory (Windows-specific install location
# not automatically added to the bash PATH).
if [[ -n "${LOCALAPPDATA:-}" ]]; then
  for _dir in "$LOCALAPPDATA/Microsoft/WinGet/Packages"/Google.OSVScanner_*/; do
    [[ -x "$_dir/osv-scanner.exe" ]] && PATH="$PATH:$_dir" && break
  done
fi

if command -v osv-scanner &>/dev/null || command -v osv-scanner.exe &>/dev/null; then
  osv-scanner "${OSV_ARGS[@]}"
else
  echo "osv-scanner not found — falling back to yarn npm audit"
  echo "Install: winget install Google.OSVScanner"
  echo "         or https://github.com/google/osv-scanner/releases"
  echo ""
  for dir in prisma common server client; do
    echo "=== $dir ==="
    (cd "$dir" && yarn npm audit) || true
    echo ""
  done
fi
