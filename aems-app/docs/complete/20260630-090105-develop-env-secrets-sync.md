# env-secrets-sync

Implementing pre-deploy validation of `.env`, `.env.secrets`, and `docker/secrets/` consistency, plus fixing the `BOOKSTACK_SESSION_SECRET` docker-secrets gap.

No design doc existed; decisions documented inline.

## Plan summary

- `check-env.sh` + `check-env.ps1`: mode-aware validation (env-only / secrets / mixed / broken)
- Fix `BOOKSTACK_SESSION_SECRET` gap: add docker secret + init-wiki.sh injection
- Wire `check-env` into `start-services.sh` / `start-services.ps1`

---

## Progress

### 2026-06-30 09:01 — Scripts layer (no Prisma/common/server/client changes needed)

**Files created:**
- `check-env.sh` — POSIX validation script, mode-aware (env-only / secrets / mixed / broken), exits 0 or 1
- `check-env.ps1` — PowerShell equivalent

**Files modified:**
- `.env.secrets.example` — Added `BOOKSTACK_SESSION_SECRET` entry + architecture comment
- `docker/docker-compose.yml` — Added `bookstack_session_secret` top-level secret + added to `wiki:` service secrets list
- `docker/wiki/init-wiki.sh` — Injects `APP_KEY` from `/run/secrets/bookstack_session_secret` when present; falls back to env var in dev
- `start-services.sh` — Calls `./check-env.sh` before build; aborts on failure
- `start-services.ps1` — Calls `.\check-env.ps1` before build; aborts on failure

**Status: PASS** — No compilation steps required (shell/YAML/PS1 only). All files verified by inspection.

### 2026-06-30 (rotation + verification session)

**Rotation tooling added:**
- `rotate-secrets.sh` — detects changed keys (diff between `.env.secrets` and `docker/secrets/*.txt`), applies SQL ALTER for Postgres/MariaDB, kcadm for Keycloak, file+restart for app/Redis secrets. `--dry-run` flag.
- `rotate-secrets.ps1` — PowerShell equivalent

**Bug fix:**
- `secrets.sh` — `while IFS='=' read -r key value` split on ALL `=` signs, truncating base64 values with trailing `=`. Fixed to `IFS= read -r line` + manual `sed 's/^[^=]*=//'` split.

**check-env hint added:**
- Stale-value error now shows: `run ./rotate-secrets.sh to apply changes to running services`

**Documentation updated:**
- `.claude/architecture/deployment.md` — secrets bootstrap section, helper scripts table, 7-step deploy flow, rotation workflow block
- `.claude/architecture/docker.md` — secrets model, operational reference table, gotchas
- `.claude/rules.md` — Docker rules: check-env step, rotate-secrets consequence
- `README.md` — Quick Start check-env step, WORKER_TOKEN + BOOKSTACK_SESSION_SECRET entries, check-env/rotate-secrets sections
- `docker/README.md` — Basic Deployment steps
- `docker/CLAUDE.md` — secrets model, workflow, gotchas

**Verified against running dev Docker stack:**

1. ✅ `check-env.sh` — all 13 secrets pass when `.env.secrets` ↔ `docker/secrets/` are in sync
2. ✅ Stale detection — editing DATABASE_PASSWORD in `.env.secrets` without running `secrets.sh` → `[ERROR] stale — run ./rotate-secrets.sh`
3. ✅ `rotate-secrets.sh DATABASE_PASSWORD` — dry-run shows correct plan; live run executes `ALTER ROLE`, updates secret file, restart skipped (server/client not in this stack). DB verified with new password via `psql`.
4. ✅ `rotate-secrets.sh REDIS_PASSWORD` — updates file, restarts `skeleton-redis`, `redis-cli PING` with new password returns `PONG`.
5. ✅ `rotate-secrets.sh` (no args, nothing changed) — "All secrets are current. No rotation needed."
6. ✅ Env-only mode (no `.env.secrets`) — exits 0 with warnings only
7. ✅ `secrets.sh` base64 bug — values with trailing `=` written correctly

**Status: COMPLETE**
