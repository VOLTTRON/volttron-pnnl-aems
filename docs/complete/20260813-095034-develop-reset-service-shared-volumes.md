# Reset service script: skip shared volumes by default

**Started:** 2026-08-13 09:50:34
**Completed:** 2026-08-13 09:58:52

## Problem

`./reset-service.sh historian` (from `aems-app/`) discovered `certs-data` alongside `historian-data` and staged both for deletion. `certs-data` is shared — owned by the `certs` service, read-only-consumed by `historian`, `proxy`, `server`, `grafana`, etc. Deleting it as a side effect of resetting `historian` blew away the shared cert store.

## Approach

Changed volume discovery to only list volumes attached to exactly one service (from the target set's perspective) by default. Added `-s` / `--include-shared` (also `-IncludeShared` in PowerShell) to opt in to shared-volume deletion. Pure ops-script fix — no prisma/common/server/client changes.

## Progress

### 2026-08-13 09:52 — reset-service.sh
- Added `-s|--include-shared` flag: help text, argument parser, list-mode footer.
- Rewrote the discovery Python to build a `{volume: [owning_services]}` map across all services in a single pass, emit tab-separated `source<TAB>external_owner_count<TAB>external_owners_csv` per unique named volume attached to any target service.
- Shell caller filters rows: if `external_owner_count > 0` and `INCLUDE_SHARED != true`, log `Skipping shared volume: X (also mounted by: Y, Z)` and drop from delete list.
- Added graceful exit when the target service's only volumes are all shared (no `docker compose down`).
- Added skip-count note before the confirmation prompt.
- Reused same map for list-mode annotation: `- <vol> (shared with: A, B, C)`.
- Result: `bash -n reset-service.sh` → SYNTAX OK.

### 2026-08-13 09:56 — reset-service.ps1
- Mirrored all changes in PowerShell.
- Added `Get-VolumeOwnershipMap` helper function returning `{source -> @(services)}`.
- Reset flow now uses `-IncludeShared` (also accepts `-s` / `--include-shared`) to gate the shared filter.
- Result: `[System.Management.Automation.Language.Parser]::ParseFile` → SYNTAX OK.

### 2026-08-13 09:58 — Verification (Docker stack up, aems-app/)

| Command | Expected | Actual |
| --- | --- | --- |
| `./reset-service.sh` | list annotates `certs-data` under multiple services as `(shared with: …)` | PASS — annotated everywhere it appears (certs, grafana, historian, proxy, services) |
| `./reset-service.sh historian --dry-run` | deletes only `historian-data`; skips `certs-data` | PASS — output: `Skipping shared volume: certs-data (also mounted by: certs,grafana,proxy,services)`; deletes `aems_historian-data` |
| `./reset-service.sh historian --include-shared --dry-run` | deletes both volumes | PASS — deletes `aems_historian-data` and `aems_certs-data` |
| `./reset-service.sh certs --dry-run` | graceful exit; all volumes shared | PASS — `All discovered volumes are shared with other services and were skipped.` |
| `./reset-service.sh certs --include-shared --dry-run` | deletes `certs-data` | PASS |
| Reproducer: `./reset-service.sh historian` (answer `no`) | volumes-to-delete list contains only `historian-data` | PASS — original bug is fixed |
| PowerShell parity: `reset-service.ps1 historian -n` | same as shell | PASS |
| PowerShell parity: `reset-service.ps1 historian --include-shared -n` | includes both | PASS |
| PowerShell parity: `reset-service.ps1 certs -n` | graceful exit | PASS |
| PowerShell list mode | annotates shared volumes | PASS |

## Files touched

- `aems-app/reset-service.sh`
- `aems-app/reset-service.ps1`

No prisma/common/server/client layer changes.
