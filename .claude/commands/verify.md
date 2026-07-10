---
description: Verify deployment edge cases end-to-end using Docker Compose and a headless browser
---

Exercise all documented deployment edge cases against the Docker stack. Runs `scripts/verify-browser.mjs` (Playwright/Chromium) for browser-visible checks.

---

## Step 0: Mode selection

**If `$ARGUMENTS` contains `--non-destructive`**, skip the prompt and use mode 1.  
**If `$ARGUMENTS` contains `--destructive`**, skip the prompt and use mode 2.  
**Otherwise**, print the following and wait for the user to answer `1` or `2` (Ctrl-C to abort):

```
This verify command can run in two modes:

  [1] NON-DESTRUCTIVE — checks the running stack without modifying secrets or volumes.
      Safe to run against a live dev environment.

  [2] DESTRUCTIVE — full cold-start exercise. Tears down all volumes, regenerates
      secrets from .env.secrets, and boots from scratch. Exercises the complete
      first-boot path including migrations, cert generation, seeding, and backup
      keypair generation.
      ⚠ Wipes all data in the DB and all named Docker volumes.

Which mode? (1 = non-destructive, 2 = destructive, or Ctrl-C to abort):
```

Store the chosen mode as `VERIFY_MODE` (1 or 2).

---

## Step 1: Setup

Run `date +"%Y%m%d-%H%M%S"` to get the current timestamp. Create the progress log:

```
docs/in-progress/<TIMESTAMP>-verify-deployment.md
```

Write the header:

```markdown
# Verify Deployment — <TIMESTAMP>
Mode: <NON-DESTRUCTIVE|DESTRUCTIVE>

## Progress
```

Extract these values from root `.env` (use `grep -E '^KEY=' .env | cut -d= -f2- | tr -d '"'`):
- `APP_HOSTNAME`
- `DATABASE_USERNAME`
- `COMPOSE_PROJECT_NAME`
- `DATABASE_NAME`

Verify the working directory is the **repo root** (contains both `docker-compose.yml` and `docker/`). If not, print an error and stop — running compose from the wrong directory loads the wrong `.env`.

---

## NON-DESTRUCTIVE MODE (mode 1)

Run phases P1–P6 below. Skip `--skip-startup` check: if `$ARGUMENTS` contains `--skip-startup`, skip phase P2 entirely.

---

### Phase P1: Pre-flight checks (no Docker required)

For each check, print `[EC-xxx] Description → PASS` or `[EC-xxx] Description → FAIL: <reason>`.

**[EC-SECRETS]** Check that all 13 Docker secret files exist:
```
docker/secrets/session_secret.txt
docker/secrets/jwt_secret.txt
docker/secrets/database_password.txt
docker/secrets/redis_password.txt
docker/secrets/keycloak_client_secret.txt
docker/secrets/keycloak_admin_password.txt
docker/secrets/keycloak_database_password.txt
docker/secrets/nominatim_database_password.txt
docker/secrets/bookstack_session_secret.txt
docker/secrets/bookstack_root_password.txt
docker/secrets/bookstack_database_password.txt
docker/secrets/bookstack_keycloak_client_secret.txt
docker/secrets/worker_token.txt
```
Run: `for f in docker/secrets/*.txt; do [ -f "$f" ] || echo "MISSING: $f"; done`
Any missing file → FAIL. (Missing files cause a silent `docker compose up` failure.)

**[EC-HOSTNAME]** `APP_HOSTNAME` must not be `localhost` or `127.0.0.1`:
```bash
echo "$APP_HOSTNAME" | grep -qE '^(localhost|127\.0\.0\.1)$' && echo FAIL || echo PASS
```
FAIL if it matches — `Set-Cookie Domain` and OAuth redirects both break on localhost.

**[EC-CHECKENV]** Run `./check-env.sh` (if it exists) and verify exit code 0:
```bash
[ -f check-env.sh ] && bash check-env.sh && echo PASS || echo "FAIL (check-env.sh returned non-zero)"
```

**[EC-INSTANCE-DUPE]** Verify `INSTANCE_TYPE=*` appears in at most one of the service env files:
```bash
count=$(grep -rl 'INSTANCE_TYPE=\*' docker/.env.services docker/.env.seeders docker/.env.server 2>/dev/null | wc -l)
[ "$count" -le 1 ] && echo PASS || echo "FAIL: INSTANCE_TYPE=* found in $count files — two wildcard workers fight for background service locks"
```

Log results to the progress log.

---

### Phase P2: Stack startup

Run from the repo root:
```bash
docker compose up -d
```
(NEVER `cd docker && docker compose up`, NEVER `docker compose -f docker/docker-compose.yml up -d` — both load the wrong `.env`.)

Poll every 10 seconds for up to 5 minutes until all non-profiled services are healthy:
```bash
docker compose ps --format json
```

**[EC-INIT-ORDER]** After polling completes, verify the `init` container exited 0:
```bash
docker inspect ${COMPOSE_PROJECT_NAME}-init --format '{{.State.ExitCode}}' 2>/dev/null
```
Exit code 0 → PASS. Non-zero or container not found → FAIL.

**[EC-CERTS-ORDER]** Verify the `certs` container exited 0:
```bash
docker inspect ${COMPOSE_PROJECT_NAME}-certs --format '{{.State.ExitCode}}' 2>/dev/null
```
Exit code 0 → PASS. Non-zero or not found → FAIL (proxy depends on certs via `service_completed_successfully`).

Report any service that is not `running (healthy)` after the poll timeout as a FAIL.

Log results to the progress log.

---

### Phase P3: Core service verification

**[EC-POSTGIS]** Confirm PostGIS is available in the DB container (custom image, not vanilla postgres:16):
```bash
docker compose exec -T database psql -U "$DATABASE_USERNAME" -c "SELECT PostGIS_version();" 2>&1
```
Output containing `PostGIS` version string → PASS. Error or empty → FAIL.

**[EC-INSTANCE-TYPE]** Confirm worker/handler separation:
```bash
# services container should have INSTANCE_TYPE set
docker compose exec -T services env | grep -q INSTANCE_TYPE && echo "services: PASS" || echo "services: FAIL — INSTANCE_TYPE not set"
# server container should NOT have INSTANCE_TYPE=* (unset, empty, or "none" are all correct)
val=$(docker compose exec -T server env 2>/dev/null | grep INSTANCE_TYPE | cut -d= -f2 || true)
[ -z "$val" ] || [ "$val" = "" ] || [ "$val" = "none" ] && echo "server: PASS" || echo "server: FAIL — INSTANCE_TYPE=$val (should be unset or 'none' on request handler, not '*')"
```

**[EC-BACKUP-KEYS]** Confirm backup keypair was auto-generated on first boot:
```bash
ls docker/secrets/backup/ 2>/dev/null | grep -q . && echo PASS || echo "FAIL: docker/secrets/backup/ is empty or missing — backup sidecar has not generated its keypair yet"
```

Log results to the progress log.

---

### Phase P4: API smoke tests

**[EC-HTTP-REDIRECT]** HTTP must redirect to HTTPS:
```bash
code=$(curl -sio /dev/null -w "%{http_code}" "http://$APP_HOSTNAME" 2>/dev/null || echo 000)
echo "$code" | grep -qE '^30[12]$' && echo "PASS (HTTP $code)" || echo "FAIL: expected 301/302, got $code — Traefik HTTP→HTTPS redirect not working"
```

**[EC-GRAPHQL]** GraphQL introspection health check:
```bash
resp=$(curl -sk -X POST "https://$APP_HOSTNAME/graphql" \
  -H 'Content-Type: application/json' \
  -d '{"query":"{__typename}"}' 2>/dev/null || echo "curl_failed")
echo "$resp" | grep -q '"__typename"' && echo PASS || echo "FAIL: expected {\"data\":{\"__typename\":\"Query\"}}, got: $resp"
```

**[EC-API-PROVIDERS]** Auth providers endpoint reachable (200 or 401, never 404/502):
```bash
code=$(curl -sko /dev/null -w "%{http_code}" "https://$APP_HOSTNAME/authjs/providers" 2>/dev/null || echo 000)
echo "$code" | grep -qE '^(200|401|403|405)$' && echo "PASS (HTTP $code)" || echo "FAIL: got $code — /authjs/providers is not routed or service is down"
```

**[EC-EXT-ROUTING]** `/ext/` path must not return a Traefik routing error (502/503):
```bash
code=$(curl -sko /dev/null -w "%{http_code}" "https://$APP_HOSTNAME/ext/" 2>/dev/null || echo 000)
echo "$code" | grep -qE '^(200|404|401|403)$' && echo "PASS (HTTP $code)" || echo "FAIL: got $code — /ext/ routing is broken in Traefik"
```

Log results to the progress log.

---

### Phase P5: Browser verification

Check whether Playwright is available in `scripts/`:
```bash
node --input-type=module <<'EOF' 2>/dev/null && echo installed || echo missing
import { chromium } from './scripts/node_modules/playwright/index.js';
EOF
```

If missing, install the npm package and then the browser binary:
```bash
npm install playwright --prefix scripts/
npx playwright install chromium --with-deps
```
(Warn: first install downloads ~300 MB total.)

Run the browser verification script:
```bash
APP_HOSTNAME="$APP_HOSTNAME" node scripts/verify-browser.mjs
```

The script outputs a JSON array of results to stdout. Parse and display each `{ id, description, pass, detail }` entry as:
```
[EC-xxx] Description → PASS
[EC-xxx] Description → FAIL: detail
```

Edge cases covered by the browser script:
- **[EC-TLS]** Page loads without TLS certificate error
- **[EC-APP-LOAD]** HTTP 200 with HTML body on `/`
- **[EC-SECURITY-HEADERS]** `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options` present
- **[EC-COOKIE-ATTRS]** Auth.js CSRF/session cookie has `Secure` flag and `Domain` matches `APP_HOSTNAME`
- **[EC-AUTH-PAGE]** `/authjs/signin` returns non-500
- **[EC-NO-CONSOLE-ERRORS]** No JS console errors on initial page load

Log results to the progress log.

---

### Phase P6: Credential rotation dry-run

**[EC-ROTATE-DRY]** Confirm the rotation script can read current state:
```bash
[ -f rotate-secrets.sh ] && bash rotate-secrets.sh --dry-run && echo PASS || echo "FAIL: rotate-secrets.sh --dry-run returned non-zero"
```

Log result to the progress log.

---

## DESTRUCTIVE MODE (mode 2)

**Final confirmation:** Print the following and wait for explicit `y` (anything else aborts):

```
⚠ DESTRUCTIVE MODE — This will:
  • Stop all containers
  • Wipe all named Docker volumes (database, certs, uploads, caches)
  • Delete all docker/secrets/*.txt files
  • Delete docker/secrets/backup/ keypair
  • Regenerate secrets from .env.secrets
  • Boot from a completely clean state

All data in the database will be permanently lost.

Type 'y' to continue, anything else to abort:
```

If not `y`, stop. Do not proceed.

---

### Phase D1: Teardown

```bash
docker compose down -v
```

Wipes all named volumes including the DB. Log the output.

Remove all secret files:
```bash
rm -f docker/secrets/*.txt
rm -rf docker/secrets/backup/
```

Log: "Volumes wiped. Secret files deleted."

---

### Phase D2: Secret regeneration

**[EC-SECRETS-REGEN]** Regenerate secret files from `.env.secrets`:
```bash
bash secrets.sh
```
Then verify all 13 files now exist (same check as EC-SECRETS above).
PASS if all 13 present. FAIL if any missing — secrets.sh may have an error or `.env.secrets` is incomplete.

Log results to the progress log.

---

### Phase D3: Env validation (cold)

**[EC-CHECKENV-COLD]** `check-env.sh` must pass after fresh generation:
```bash
[ -f check-env.sh ] && bash check-env.sh && echo PASS || echo "FAIL: check-env.sh returned non-zero after fresh secret generation"
```

Log result to the progress log.

---

### Phase D4: Cold start

Run from the repo root:
```bash
docker compose up -d
```

Poll every 10 seconds for up to 10 minutes (longer than mode 1 — cold migrations take time).

**[EC-COLD-MIGRATION]** `init` container must exit 0 (migrations ran against empty DB):
```bash
docker inspect ${COMPOSE_PROJECT_NAME}-init --format '{{.State.ExitCode}}' 2>/dev/null
```

**[EC-CERTS-FRESH]** `certs` container must exit 0 (mkcert generated fresh certs):
```bash
docker inspect ${COMPOSE_PROJECT_NAME}-certs --format '{{.State.ExitCode}}' 2>/dev/null
```

**[EC-BACKUP-KEYGEN]** After backup sidecar boots, `docker/secrets/backup/` must contain key files:
```bash
# Wait up to 60 seconds for the backup container to generate its keypair
for i in $(seq 1 12); do
  ls docker/secrets/backup/ 2>/dev/null | grep -q . && break || sleep 5
done
ls docker/secrets/backup/ 2>/dev/null | grep -q . && echo PASS || echo "FAIL: docker/secrets/backup/ still empty after 60s — init-keys.sh may have failed"
```

**[EC-SEEDERS-RUN]** `seeders` container must exit 0 (seed data loaded into fresh DB):
```bash
# seeders has restart: on-failure:3; wait up to 60s for it to complete
for i in $(seq 1 12); do
  state=$(docker inspect ${COMPOSE_PROJECT_NAME}-seeders --format '{{.State.Status}}' 2>/dev/null || echo unknown)
  code=$(docker inspect ${COMPOSE_PROJECT_NAME}-seeders --format '{{.State.ExitCode}}' 2>/dev/null || echo -1)
  [ "$state" = "exited" ] && break || sleep 5
done
[ "$code" = "0" ] && echo PASS || echo "FAIL: seeders exited with code $code (state: $state)"
```

**[EC-INIT-ORDER]** Same ordering check as P2.

Log results to the progress log.

---

### Phase D5: Post-cold-start data verification

**[EC-COLD-SEED]** Confirm seed data landed in the DB. The `User` table is always seeded (`docker/seed/20211103151730-system-user.json`):
```bash
count=$(docker compose exec -T database psql -U "$DATABASE_USERNAME" -d "$DATABASE_NAME" -t -c 'SELECT COUNT(*) FROM "User";' 2>/dev/null | tr -d ' ')
[ -n "$count" ] && [ "$count" -gt 0 ] && echo "PASS: $count row(s) in User table" || echo "FAIL: User table empty or query failed — seeders may not have completed"
```

Log result to the progress log.

---

### Phase D6: Live credential rotation

**[EC-ROTATE-LIVE]** Change `SESSION_SECRET` in `.env.secrets`, rotate live, verify health, restore.

```bash
# 1. Save current value
old_val=$(grep '^SESSION_SECRET=' .env.secrets | cut -d= -f2-)

# 2. Write a new value
NEW_VAL="verify-test-rotation-$(date +%s)"
sed -i "s|^SESSION_SECRET=.*|SESSION_SECRET=$NEW_VAL|" .env.secrets

# 3. Run live rotation
bash rotate-secrets.sh

# 4. Check-env still passes
bash check-env.sh && echo "check-env: PASS" || echo "check-env: FAIL"

# 5. GraphQL health still works (services restarted by rotate-secrets.sh)
sleep 15
resp=$(curl -sk -X POST "https://$APP_HOSTNAME/graphql" \
  -H 'Content-Type: application/json' \
  -d '{"query":"{__typename}"}' 2>/dev/null || echo curl_failed)
echo "$resp" | grep -q '"__typename"' && echo "graphql-after-rotate: PASS" || echo "graphql-after-rotate: FAIL: $resp"

# 6. Restore with a fresh random value (avoid sed delimiter collisions with the original)
RESTORED_VAL=$(openssl rand -hex 32)
sed -i "s|^SESSION_SECRET=.*|SESSION_SECRET=$RESTORED_VAL|" .env.secrets
bash rotate-secrets.sh
```

Report PASS only if both `check-env` and `graphql-after-rotate` passed. Log results.

---

### Phases D7–D10: Run all non-destructive phases P3–P6

After cold start stabilizes, run phases P3, P4, P5, P6 exactly as described above. Everything verified against a warm stack is now verified from cold.

---

## Final report (both modes)

Print a full summary table:

```
╔══════════════════════════════════════════════════════════════════╗
║  VERIFY DEPLOYMENT — <MODE>                                      ║
╠══════════════════════════════════════════════════════════════════╣
║ Phase     │ Check                          │ Result             ║
╠══════════════════════════════════════════════════════════════════╣
║ Pre-flight│ [EC-SECRETS] Secret files       │ ✓ PASS            ║
║ ...                                                              ║
╚══════════════════════════════════════════════════════════════════╝
<N> passed, <M> failed
```

For each FAIL, print a remediation hint:
- **EC-SECRETS**: "Run `./secrets.sh` to regenerate secret files from `.env.secrets`."
- **EC-HOSTNAME**: "Set `APP_HOSTNAME` in `.env` to a real hostname (e.g. a hosts-file entry like `myapp.local`), not `localhost`."
- **EC-CHECKENV**: "Run `./check-env.sh` manually to see the specific inconsistency. Common cause: `.env.secrets` edited but `secrets.sh` not re-run."
- **EC-INSTANCE-DUPE**: "Edit `docker/.env.services` and `docker/.env.seeders` so only one file has `INSTANCE_TYPE=*`. Two wildcard instances fight for background service locks."
- **EC-INIT-ORDER**: "Run `docker compose logs init` to see the migration error. Common causes: DB not reachable, stale migration conflict."
- **EC-CERTS-ORDER**: "Run `docker compose logs certs` to see the mkcert error. Try `./reset-service.sh certs` to regenerate."
- **EC-POSTGIS**: "The running DB image is missing PostGIS. Do not substitute `postgres:16` — use the custom image in `docker/database/Dockerfile`."
- **EC-INSTANCE-TYPE**: "Check `docker/.env.services` has `INSTANCE_TYPE` set, and that `docker/.env.server` does NOT have `INSTANCE_TYPE=*`."
- **EC-BACKUP-KEYS**: "The backup sidecar has not generated its keypair. Check `docker compose logs backup` for `init-keys.sh` errors."
- **EC-HTTP-REDIRECT**: "The `proxy` profile may not be active. Start with `docker compose --profile proxy up -d`."
- **EC-GRAPHQL**: "Run `docker compose logs server` for startup errors. Common causes: DB connection failed, migration not applied."
- **EC-API-PROVIDERS**: "Run `docker compose logs server` — likely a startup failure. `/authjs/providers` is served by the Next.js client; check `docker compose logs client` if server looks healthy."
- **EC-EXT-ROUTING**: "Check Traefik labels on server container and `docker/proxy/certs-traefik.yml` for `/ext/` path rule."
- **EC-TLS**: "The mkcert cert is not trusted by your system. Run `./reset-service.sh certs` and re-run `./secrets.sh`, then restart the proxy."
- **EC-APP-LOAD**: "Client container may not be healthy. Run `docker compose logs client`."
- **EC-SECURITY-HEADERS**: "Check Traefik labels on the `client` service in `docker/docker-compose.yml` — security middleware may be missing."
- **EC-COOKIE-ATTRS**: "Auth cookie is missing `Secure` or has wrong `Domain`. Check `APP_HOSTNAME` is not `localhost` and that the Next.js server is setting `Domain` on cookies. If no cookie at all: check `docker compose logs client` — the signin page may be returning an error."
- **EC-AUTH-PAGE**: "Auth pages returned 500. Run `docker compose logs server` for the error."
- **EC-NO-CONSOLE-ERRORS**: "Check the browser output above for specific JS errors — usually a failed fetch or missing env var on the client."
- **EC-ROTATE-DRY**: "Run `./rotate-secrets.sh --dry-run` manually to see the error output."
- **EC-SECRETS-REGEN**: "Check that `.env.secrets` exists and has all required keys. Compare with `.env.secrets.example`."
- **EC-CHECKENV-COLD**: "Check `./check-env.sh` output — likely a key in `.env.secrets` that `secrets.sh` didn't write to `docker/secrets/`."
- **EC-COLD-MIGRATION**: "Run `docker compose logs init` — migration failed against clean DB. May be a schema file or Prisma version issue."
- **EC-CERTS-FRESH**: "Run `docker compose logs certs` — mkcert failed on cold start."
- **EC-BACKUP-KEYGEN**: "Run `docker compose logs backup` — `init-keys.sh` may have a permissions error writing to `./secrets/backup/`."
- **EC-SEEDERS-RUN**: "Run `docker compose logs seeders` — seed data failed to load. Seeders restart up to 3× before giving up."
- **EC-COLD-SEED**: "The `User` table is empty. Seeders may have failed — check `docker compose logs seeders`."
- **EC-ROTATE-LIVE**: "Live rotation failed. Run `./rotate-secrets.sh` manually and inspect output. Check `docker compose logs server` for auth errors."

**On all pass:**
```bash
mv "docs/in-progress/<TIMESTAMP>-verify-deployment.md" "docs/complete/<TIMESTAMP>-verify-deployment.md"
```
Print: "All checks passed. Log moved to docs/complete/."

**On any fail:**
Keep the log in `docs/in-progress/`. Print: "<M> check(s) failed. See docs/in-progress/<TIMESTAMP>-verify-deployment.md for details."
