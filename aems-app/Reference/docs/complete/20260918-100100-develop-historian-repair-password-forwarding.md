# Historian repair script — password forwarding fix

## Problem

`./repair-historian-replication.sh` on production fails with:

```
ERROR: no database password available
(/run/secrets/historian_database_password missing and POSTGRES_PASSWORD unset).
```

Passwords are configured in host `.env` and `docker/.env.secrets.docker`, but the host wrapper does not forward them into the container and the in-container script only recognises the compose secret mount + `POSTGRES_PASSWORD` (which is intentionally blanked in production).

## Approach

Approved plan: `C:\Users\d3x573\.claude\plans\the-production-instance-replication-hashed-tome.md`.

Two-part fix:

1. Host wrappers (`repair-historian-replication.sh` and `.ps1`) forward `HISTORIAN_DATABASE_PASSWORD` and `HISTORIAN_REPLICATOR_PASSWORD` via `docker exec -e` — same pattern as `migrate-historian-data.sh`.
2. In-container `docker/historian/repair-replication.sh` extends its fallback chain to: secret file → `HISTORIAN_DATABASE_PASSWORD` → `POSTGRES_PASSWORD` → clearer error. Mirror change for the replicator password.

No design doc existed in `docs/proposed/` for this — proceeding without one, decisions documented inline in the plan file.

## Layers

Task touches only shell/PowerShell scripts baked into the historian image. **Prisma / common / server / client layers are NOT exercised.** Verification is `bash -n` syntax check plus manual runtime verification against a live historian container.

## Progress

### 20260918-100100 — start

Progress log created. Plan approved. Beginning edits.

### 20260918-100100 — edits complete

Files changed:

- [aems-app/repair-historian-replication.sh](../../repair-historian-replication.sh) — both `docker exec` calls now pass `-e HISTORIAN_DATABASE_PASSWORD` and `-e HISTORIAN_REPLICATOR_PASSWORD` from the wrapper's already-loaded `.env`.
- [aems-app/repair-historian-replication.ps1](../../repair-historian-replication.ps1) — same fix in PowerShell syntax (`-e "KEY=$value"`, backticks for line continuation).
- [aems-app/docker/historian/repair-replication.sh](../../docker/historian/repair-replication.sh) — both password lookups (lines 62-72 and 158-161) now try secret file → env var (`HISTORIAN_DATABASE_PASSWORD` / `HISTORIAN_REPLICATOR_PASSWORD`) → compose `POSTGRES_PASSWORD` → error. Error message names all three sources and points at the wrapper as the intended entry point.

Syntax check: `bash -n` clean on both shell scripts. PowerShell IDE reports only a pre-existing `$check` unused-variable warning on an unrelated line.

No TypeScript workspaces touched — Prisma / common / server / client layers were not exercised. Final full-workspace `yarn check` not run per plan; the change is baked-shell only.

### 20260918-100100 — remaining runtime verification

Cannot be run from this workstation — requires the production stack + rebuilt historian image. Handoff notes:

1. `cd aems-app && docker compose build historian && docker compose up -d historian` — rebuild so the in-container script is refreshed.
2. `./repair-historian-replication.sh --dry-run` — should now print the "Current state:" block instead of the password error.
3. Confirm secret-file path still works by inspecting: with a valid mount in place, the secret-file branch wins (unchanged behavior).
