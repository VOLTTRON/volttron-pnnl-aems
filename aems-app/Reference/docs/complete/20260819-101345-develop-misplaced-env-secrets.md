# Develop: Misplaced .env Secrets Migration

**Started**: 2026-08-19 10:13:45  
**Feature**: Detect secret values set directly in `.env` instead of `.env.secrets`; warn and auto-migrate so downstream pipeline works.

## Design decisions

- Detection is pattern-based (`_PASSWORD`, `_SECRET`, `_TOKEN`, `_KEY` suffix on key name) rather than a hardcoded list — covers the base 13 keys and any additional secrets downstream teams add.
- Only migrate when `.env.secrets` has no real value for the key (blank or still placeholder). If `.env.secrets` already has a value, the `.env` value is irrelevant — no warning.
- Bootstrap fall-through: if all keys end up populated after merging misplaced values, skip the "fill in and re-run" exit and proceed directly to the deploy pass.
- No Prisma / common / server / client changes — this is purely a shell/PowerShell script change.

## Files changed

- `secrets.sh`
- `secrets.ps1`

## Progress

### secrets.sh helpers
- [x] Add `env_misplaced_keys()` after `env_secret_keys()` (line 98)
- [x] Add `update_secrets_entry()` helper (line 112)
- [x] Modify bootstrap path — warns + merges misplaced keys, pre-fills values, fall-through when all populated (line 267)
- [x] Add migration sweep in deploy path after `KEYS_TO_CHECK` is built (line 367)

### secrets.ps1 equivalents
- [x] Add `Get-MisplacedKeys` (line 89)
- [x] Add `Update-SecretsEntry` (line 104)
- [x] Modify bootstrap path (line 265)
- [x] Add migration sweep in deploy path (line 372)

**Completed**: 2026-08-19 10:13:45
