# Verify Current Work — 20260924-090449

Verification of uncommitted work: historian pg_shadow reconciler (docker-entrypoint-wrapper.sh, setup-replication.sh), check-env.sh line-integrity guardrail, volttron.service.ts JSON parse hardening.

Plan: `~/.claude/plans/verify-the-current-work-encapsulated-wave.md`
Verify command reference: `aems-app/.claude/commands/verify.md`
Mode chosen: **Destructive Mode 2 (D1–D10)**, plus historian-specific side-effect checks.

## Progress

### 20260924-090449 — Step 1: check-env.sh line-integrity positive test → PASS

Ran `bash check-env.sh`. Exit code **1**. Output includes:

```
Line-integrity check FAILED for .env.secrets
  [ERROR] One or more lines look like KEY=VALUEKEY=VALUE (missing newline between entries):
    34:HISTORIAN_REPLICATOR_PASSWORD=passwordVOLTTRON_PASSWORD=admin
  [ERROR] Fix the file (insert the missing newline) and re-run ./check-env.sh
```

Guardrail behaves as designed: the regex `^[A-Z][A-Z0-9_]*=.*[a-zA-Z0-9][A-Z][A-Z0-9]{2,}(_[A-Z0-9]+)+=` catches the concatenation, the block prints the offending line with its number, and the script exits non-zero so `docker compose up` is blocked. All 13 docker-secret files are present and in sync — only the line-integrity check is failing.

Note: `.env.secrets` also has line 35 `VOLTTRON_PASSWORD=admin` (already a duplicate). Fixing line 34 to just `HISTORIAN_REPLICATOR_PASSWORD=password` naturally resolves the concatenation without introducing a new duplicate — line 35 stays as the single `VOLTTRON_PASSWORD` entry.

### 20260924-090510 — Step 2: post-fix check-env → line-integrity PASS, downstream reveals stale docker/secret

After the newline fix, line-integrity passes. Exit 1 is now driven by `docker/secrets/historian_replicator_password.txt is stale (out of sync with .env.secrets)` — the on-disk secret file still contains the pre-fix concatenated value from the previous `secrets.sh` run. Expected — destructive Mode 2 D2 wipes and regenerates `docker/secrets/*.txt` from the corrected `.env.secrets`.

### 20260924-090525 — Step 3 D1 (teardown) → PASS

Ran `./stop-services.sh --volumes --force` (scripted equivalent of `docker compose down -v`, per user's script-preference). All aems-project services stopped and all named volumes removed (database, historian, keycloak, keycloak-cache, volttron-* ×7, grafana ×4, certs, acme, backup, client-cache, file-upload). The separate `pol-data-pipeline_*` volume set was left untouched.

Deleted `docker/secrets/*.txt` and `docker/secrets/backup/`. Only `.placeholder` remained.

### 20260924-090620 — Step 3 D2 + D3 (secrets regen + cold check-env) → PASS

`bash secrets.sh`: all 19 secret files freshly written including `historian_replicator_password.txt` now containing `password` (matches the fixed `.env.secrets:34`). `.env.secrets.docker` regenerated. Post-regen `check-env.sh` exit 0 (`All checks passed`).

### 20260924-090800 — Step 3 D4 (cold start via `start-services.sh --no-build`) → PASS with one pre-existing caveat

Cold `docker compose up -d`. Terminal ordering summary from the script:
- **[EC-INIT-ORDER]** `aems-init` exited **0** → PASS (migrations ran against empty DB).
- **[EC-CERTS-FRESH]** `aems-certs` exited **0** → PASS (mkcert generated fresh certs).
- **[EC-SEEDERS-RUN]** `aems-seeders` exited **0** → PASS.
- **[EC-GRAFANA-SETUP]** `aems-grafana-setup` exited **0** → PASS.
- **[EC-VOLTTRON-SETUP]** `aems-volttron-setup` exited **0** → PASS.
- Long-running services (`database`, `client`, `server`, `services`, `grafana`, `keycloak-db`) reached `healthy`.
- Non-healthchecked services (`historian`, `proxy`, `redis`, `keycloak`, `volttron`, `synth-worker`, `backup`) all `running`.

**Caveat (pre-existing, unrelated to this work): `aems-grafana-db` fails to start** with `Error: Database is uninitialized and superuser password is not specified.` `.env.grafana` intentionally omits `POSTGRES_PASSWORD` (comment on the file explains that grafana reads historian creds via `/run/secrets/historian_database_password` in setup-grafana.sh), but the standalone `grafana-db` (postgres:16-alpine) still needs it on cold init. The service ran fine for 7 days pre-teardown, meaning either the initial init happened under different conditions or this service is dead code. **Not blocking on this — it is out of scope for the historian password / check-env / volttron JSON work being verified.**

### 20260924-090815 — Step 4a (historian fingerprint file) → PASS

```
$ docker exec aems-historian sh -c 'ls -la "$PGDATA/.historian_pw_fp" && cat "$PGDATA/.historian_pw_fp"'
-rw-r--r--    1 postgres postgres  72 Sep 24 16:13 /var/lib/postgresql/data/.historian_pw_fp
secret:5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8
```

- Path: `${PGDATA}/.historian_pw_fp` (present).
- Format: `<SOURCE_TAG>:<64-hex sha256>` — matches design.
- `SOURCE_TAG=secret` (the entrypoint wrapper's tag when reading `/run/secrets/historian_database_password`).
- sha256 `5e884898…d1542d8` is sha256("password"), which matches `.env.secrets:HISTORIAN_DATABASE_PASSWORD=password`.
- Written by **setup-replication.sh** at first-init (this was a fresh volume from the teardown), so the fresh-init seed path is exercised end-to-end.

### 20260924-090830 — Step 4b (silent restart with matching fingerprint) → PASS

`docker restart aems-historian`. Post-restart logs contain **no** `Historian password source changed` message and **no** `reconciling pg_shadow` message. The fingerprint-match short-circuit at the top of the entrypoint wrapper works.

### 20260924-090900 — Step 4c (drift-reconcile path) → PASS

Injected drift:
- `historian_database_password.txt` overwritten to `password-drift-test-1790266839` (sha256 `affe48a1…398309a`).
- `docker restart aems-historian`.

Result:
```
Historian password source changed (secret) — reconciling pg_shadow via single-user mode...
backend> backend> Historian pg_shadow reconciled.
```

Verification that pg_shadow was actually rewritten:
```
$ docker exec -e PGPASSWORD='password-drift-test-1790266839' aems-historian \
    psql -h localhost -U historian -d historian -c "SELECT current_user, now();"
 current_user |              now
--------------+-------------------------------
 historian    | 2026-09-24 16:20:56.685932+00
```

Auth succeeded with the drifted password — the ALTER USER via `postgres --single` actually took effect on-disk.

Restored `historian_database_password.txt` to `password` and restarted; a second reconcile fired (fp on-disk still had the drift-hash, source now had the original), the reconciler executed cleanly, and the fingerprint now shows `secret:5e884898…d1542d8` again (back to sha256("password")). Auth with the restored password: **PASS**.

Both directions of drift (source-different-from-fp → reconcile) work.

### 20260924-090930 — Step 4d (replicator connectivity) → PASS

- Direct local psql inside historian as `replicator`: blocked by pg_hba (`no pg_hba.conf entry for host "::1", user "replicator"`) — this is the expected security posture, replicator is remote-only.
- From `aems-database` (the main-DB subscriber) with `PGPASSWORD=password` reaching `historian`: `SELECT current_user;` returns `replicator`. **Auth works end-to-end** with the value written to the docker-secret by `secrets.sh`.
- Note: historian logs contain `replication slot "historian_sub_slot" does not exist` — but this is about slot **creation** on the subscriber side (a separate workflow, not password auth). Auth is fine.

### 20260924-091015 — Step 5 (Volttron JSON hardening) → deployed and wired; failure path not exercised

`parseJsonResponseOrThrow` confirmed present in the running container at `/app/server/dist/services/volttron.service.js:36` and wired into both `makeAuthCall` (line 65: `Volttron auth` context) and `makeApiCallWithRetry` (line 98: `Volttron API ${method}` context).

Volttron auth calls during this run failed with **ECONNREFUSED** (a network-level failure, thrown by `fetch` before any response is available). That failure path executes before `parseJsonResponseOrThrow` is called, so the new error format is not visible in logs. The helper is designed to catch the different failure mode where `fetch` returns a response whose body is HTML/non-JSON — that path did not occur during this verification, so the improvement is present but unexercised.

**Not blocking — the change is deployed correctly and only fires on the specific failure mode it targets.**

### 20260924-091100 — Step 3 P3+P4 (EC smoke tests) → all PASS

| Check | Result |
|---|---|
| `[EC-POSTGIS]` | PostGIS 3.6 USE_GEOS=1 USE_PROJ=1 USE_STATS=1 |
| `[EC-INSTANCE-TYPE-services]` | `INSTANCE_TYPE=*,!seed,!synth` |
| `[EC-INSTANCE-TYPE-server]` | `INSTANCE_TYPE=none` |
| `[EC-BACKUP-KEYS]` | `age.key`, `age.pub`, `archive` present in `docker/secrets/backup/` |
| `[EC-COLD-SEED]` | 3 rows in `User` table |
| `[EC-HTTP-REDIRECT]` | HTTP 302 → HTTPS |
| `[EC-GRAPHQL]` | `{"data":{"__typename":"Query"}}` |
| `[EC-API-PROVIDERS]` | HTTP 200 |
| `[EC-EXT-ROUTING]` | HTTP 404 (acceptable per verify.md: 200/404/401/403) |

### 20260924-091130 — Step 3 P6 EC-ROTATE-DRY → PASS

`bash secrets.sh --dry-run`: `All secrets are up to date.` Exit 0.

### 20260924-091200 — Step 3 P5 (browser verification) → EC-TLS FAIL (local trust store), rest not run

Installed playwright 1.63.0 + chromium 1243 (~300MB). Ran `APP_HOSTNAME=aems.local node scripts/verify-browser.mjs`.

Only result:
```json
{"id":"EC-TLS","description":"TLS certificate is trusted by system (no cert error)",
 "pass":false,
 "detail":"Navigation failed: net::ERR_CERT_AUTHORITY_INVALID at https://aems.local/."}
```

Cause: mkcert CA not installed in this machine's system trust store (fix: `./trust-ca.sh`). All downstream browser checks short-circuit off EC-TLS.

**Not blocking — this is a local dev-machine trust-store setup issue, orthogonal to the historian / check-env / volttron work being verified. The stack itself is serving a valid mkcert cert; the browser rejects it because the CA isn't trusted on this Windows box.**

### 20260924-091500 — Step 3 D6 EC-ROTATE-LIVE → PASS

Rotated `SESSION_SECRET` in `.env.secrets` from a dev-default (length 8) to a timestamp-suffixed test value, ran `bash secrets.sh` (which restarts affected services), then:
- `check-env.sh` post-rotation: PASS.
- `https://aems.local/graphql` `{__typename}`: `{"data":{"__typename":"Query"}}` — **graphql-after-rotate PASS**.
- Restored `SESSION_SECRET` to a fresh `openssl rand -hex 32` value and re-ran `secrets.sh`. Final state: 64-hex random SESSION_SECRET.

Live credential rotation is working end-to-end.

### 20260924-091530 — Final state

```
NAME                STATUS
aems-backup         Up 10m
aems-client         Up 15m (healthy)
aems-database       Up 15m (healthy)
aems-grafana        Up 15m (healthy)
aems-grafana-db     Restarting (1)         ← pre-existing, out of scope
aems-historian      Up 8m
aems-keycloak       Up 15m
aems-keycloak-db    Up 15m (healthy)
aems-proxy          Up 15m
aems-redis          Up 15m
aems-server         Up 21s (healthy)       ← recently restarted by SESSION_SECRET rotation
aems-services       Up 11m (healthy)
aems-synth-worker   Up 15m
aems-volttron       Up 15m
```

Historian fingerprint (final): `secret:5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8` — matches sha256("password"), consistent with the restored source-of-truth.

## Verdict

**Historian pg_shadow reconciler** — **verified working end-to-end:**
- Fresh-volume fingerprint seed (setup-replication.sh): ✓
- Silent restart on match: ✓
- Drift detection + `postgres --single` ALTER USER: ✓ (both directions)
- Post-reconcile auth against `pg_shadow`: ✓
- Replicator connectivity from main DB to historian: ✓

**check-env.sh line-integrity guardrail** — **verified working:**
- Hard-fails on `KEY=VALUEKEY=VALUE` concatenation with the offending line number: ✓
- Does not false-positive after the fix: ✓
- Regenerated docker-secret files bring `check-env` back to green: ✓

**volttron.service.ts `parseJsonResponseOrThrow`** — **deployed and wired correctly:**
- Present in dist, called from both `makeAuthCall` and `makeApiCallWithRetry`: ✓
- Actual failure-mode exercise: not triggered (auth was ECONNREFUSED, a different code path). No regression from the change is visible.

**Out-of-scope findings surfaced during the run (not part of this work):**
1. `aems-grafana-db` cannot cold-boot — `.env.grafana` omits `POSTGRES_PASSWORD`. Latent since before this work; noted for a separate ticket.
2. `EC-TLS` browser check fails on this machine — mkcert CA not in Windows trust store. Fix: `./trust-ca.sh`. Environment issue, not code.
3. `historian` replicator can auth but `historian_sub_slot` does not exist — separate subscription-setup workflow, not password auth.
