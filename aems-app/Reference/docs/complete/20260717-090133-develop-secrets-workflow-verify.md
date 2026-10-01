# secrets-workflow-verify

Verifying the secrets workflow after commit `cffc421` which merged `rotate-secrets.sh` / `rotate-secrets.ps1` into `secrets.sh` / `secrets.ps1` and switched Docker Compose secrets to the `${FOO_SOURCE:-./secrets/.placeholder}` indirection pattern.

No design doc exists; verifying against the scripts as-implemented.

---

## Progress

### 2026-07-17 09:01 — Verification

All 8 phases executed against a live Docker stack on `test.local` (Windows, Git Bash).

**Phase 1 — Baseline check (no .env.secrets):** PASS
- `check-env.sh` exits 0 with "raw dev" mode warnings when no `.env.secrets` exists.

**Phase 2 — Bootstrap path:** PASS
- `secrets.sh` with no `.env.secrets` creates a stub with 13 empty keys and exits.
- Note: `--dry-run` has no effect on the bootstrap path (safe — bootstrap never touches `docker/secrets/` and is idempotent).

**Phase 3 — Fresh deploy path:** PASS
- All 13 keys classified as `FRESH_WRITES` with no deployed files present.
- Dry-run shows correct "Would write" plan for all 13.
- Live run writes all 13 `docker/secrets/*.txt` and regenerates `docker/.env.secrets.docker` with 13 `_SOURCE=` lines.
- `check-env.sh` exits 0 with all 26 checks passing (13 completeness + 13 sync).

**Phase 4 — No-op path:** PASS
- Second run with no changes → "All secrets are up to date." exits 0.

**Phase 5 — Docker stack up with secrets:** PASS
- Correct invocation: `docker compose --env-file .env --env-file docker/.env.secrets.docker up -d`
- All core services healthy (database, server, client, services, keycloak-db, redis, backup, wiki).
- GraphQL health check returns `{"data":{"__typename":"Query"}}`.
- **BUG FOUND AND FIXED**: README documented single `--env-file docker/.env.secrets.docker` which replaces `.env` entirely — all base vars (APP_HOSTNAME, TAG, etc.) unset. Fixed to double `--env-file .env --env-file docker/.env.secrets.docker`.

**Phase 6 — Rotation path (SESSION_SECRET):** PASS
- Dry-run classifies as ROTATION, shows restart plan for `server`.
- Live run writes updated file and restarts `skeleton-server`.
- `check-env.sh` passes after rotation.
- GraphQL health check passes after server restart.

**Phase 7 — Conflict guard:** PASS
- Blanking `SESSION_SECRET` in `.env.secrets` while deployed file exists → exit 1 "Refusing to overwrite deployed secrets with empty values".
- Deployed file unmodified.

**Phase 8 — --force flag:** PASS
- DATABASE_PASSWORD changed in `.env.secrets` while `skeleton-database` stopped → exit 1 "container is not running... nothing has been written".
- `--force` bypasses rotation check, writes file with warning, exits 0 with 1 warning.

**Phase 9 — Final state:** PASS
- Full stack brought back up, `check-env.sh` 26/26 checks passed, GraphQL returns `{"data":{"__typename":"Query"}}`.

---

## Files modified

- `README.md` — fixed double `--env-file` invocation for secrets-mode deploy (lines 1269, 1300)

## Issues found

1. **Documentation bug (fixed):** README instructions for secrets-mode deploy used `--env-file docker/.env.secrets.docker` alone, which replaces `.env` causing all non-secret vars (TAG, APP_HOSTNAME, etc.) to be blank. Fixed to `--env-file .env --env-file docker/.env.secrets.docker`.

2. **Bootstrap ignores --dry-run:** The bootstrap path (no `.env.secrets`) always writes the stub even when `--dry-run` is passed. This is safe behavior (bootstrap never touches `docker/secrets/`), but the behavior could confuse users who expect nothing to be written. Not a bug, but worth documenting.

**Status: PASS** — all scripts work correctly after the `cffc421` refactor.
