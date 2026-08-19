# Fix: volttron container reads placeholder for HISTORIAN_DB_PASSWORD

**Problem**: In production, the `volttron` container runs with `HISTORIAN_DB_PASSWORD=SeT_tHiS_iN_0x3A-.env.secrets-` — the literal placeholder — even though `aems-app/.env.secrets` has real values and `docker/secrets/historian_database_password.txt` was generated correctly. The same interpolation gap affects `grafana` and the `historian` Postgres (both consume `${HISTORIAN_DATABASE_PASSWORD}` at compose parse time).

**Root cause**: `secrets.sh`'s `write_secrets_env` only emits `_FILE=` and `_SOURCE=` lines into `docker/.env.secrets.docker`. It never emits a plain `KEY=<real>` line, so Compose's `${VAR}` interpolation for `.env.volttron:35`, `.env.grafana:52`, `.env.historian:3`, and `docker-compose.yml:746` falls through to the placeholder in the auto-loaded root `.env`.

**Fix**: Extend `write_secrets_env` to append a plain-value block after the `_SOURCE=` block, before the existing `POSTGRES_PASSWORD=` / `KEYCLOAK_ADMIN_PASSWORD=` / `KC_DB_PASSWORD=` blanking footer. Compose treats duplicate keys as "last wins", so the blanking still applies to the three collision names.

**Second discovery** during implementation: the include's `env_file:` in the shim compose file has LOWER priority than compose's `.env` auto-load. That means putting plain values in `.env.secrets.docker` alone is not enough — direct `docker compose up -d` still resolves `${HISTORIAN_DATABASE_PASSWORD}` to the placeholder from `.env`. Confirmed with a docker compose config diff before/after the emit change.

**Second-half fix**: Export `COMPOSE_ENV_FILES=".env,docker/.env.secrets.docker"` in every operator wrapper (`start-services.sh` / `.ps1`, `stop-services.sh` / `.ps1`, `reset-service.sh` / `.ps1`, `restart-service.sh` / `.ps1`). `COMPOSE_ENV_FILES` bypasses the auto-load and lets the second file win. Direct `docker compose up -d` without setting this env var still only picks up the `_FILE`/`_SOURCE` variables (backward-compatible) — documented as a caveat.

Plan file: `~/.claude/plans/in-the-production-deployment-kind-deer.md`

No prisma/common/server/client involvement — this is a docker/ops scripting fix.

## Progress

**2026-08-13 10:42 — Implementation complete.**

- `aems-app/secrets.sh` — `write_secrets_env` now emits plain `KEY=<real>` lines for every declared secret between the `_SOURCE=` block and the blanking footer. Verified via manual `./secrets.sh` run against a checkout with real values in `.env.secrets`: file contains e.g. `HISTORIAN_DATABASE_PASSWORD=password` alongside `HISTORIAN_DATABASE_PASSWORD_SOURCE=./secrets/historian_database_password.txt` and the trailing `POSTGRES_PASSWORD=` / `KEYCLOAK_ADMIN_PASSWORD=` / `KC_DB_PASSWORD=` blanks.
- `aems-app/secrets.ps1` — mirrored the same emit in `Write-SecretsEnv`.
- `aems-app/start-services.sh` + `.ps1`, `stop-services.sh` + `.ps1`, `reset-service.sh` + `.ps1`, `restart-service.sh` + `.ps1` — all export `COMPOSE_ENV_FILES=".env,docker/.env.secrets.docker"` (only when the file exists) before invoking `docker compose`.
- `aems-app/check-env.sh` + `.ps1` — new section validates every plain-value line in `docker/.env.secrets.docker` matches `.env.secrets`, skipping the three deliberately blanked keys.
- `aems-app/docker/CLAUDE.md`, `aems-app/README.md`, `aems-app/docker/README.md`, `docs/proposed/aems-deployment-guide/aems-deployment-guide.md` — updated to describe the plain-value overrides and the `COMPOSE_ENV_FILES` requirement.

**End-to-end verification** (dev host, `.env.secrets` populated, `COMPOSE_ENV_FILES` exported):

```
$ docker compose --profile volttron --profile grafana config \
    | grep -E "HISTORIAN_DB_PASSWORD|^      DATABASE_PASSWORD|^      POSTGRES_PASSWORD"
      DATABASE_PASSWORD: password
      POSTGRES_PASSWORD: ""              # main db — file_env path, blanked as intended
      POSTGRES_PASSWORD_FILE: /run/secrets/database_password
      HISTORIAN_DB_PASSWORD: password    # volttron / volttron-setup
      POSTGRES_PASSWORD: password        # historian initdb
      HISTORIAN_DB_PASSWORD: password    # grafana
      ...
```

Before the fix these all showed `SeT_tHiS_iN_0x3A-.env.secrets-`.

`./check-env.sh` — all checks pass, including the new `docker/.env.secrets.docker plain-value overrides` section.

**Recovery for existing broken deployments** (documented in the deployment guide's Materialize section): pull the fix, run `./secrets.sh`, `./check-env.sh`, then `./reset-service.sh historian` to drop the placeholder-seeded Postgres volume before `./start-services.sh`. `volttron-setup` regenerates `docker/volttron/setup/configs/historian.config` on next up.

**Not modified**: `aems-app/.env`, `aems-app/.env.secrets`, `docker/.env.volttron`, `.env.grafana`, `.env.historian`, `docker/docker-compose.yml` — none needed changes; their existing `${VAR}` interpolation now resolves correctly.

---

## 2026-08-14 — Superseded: refactor to native docker secrets

**User feedback**: "I'm confused as to why the .env.secrets.docker file needs fake passwords." The 08-13 approach worked but duplicated real password values into a third file (alongside `.env.secrets` and `docker/secrets/*.txt`) and required an out-of-band `COMPOSE_ENV_FILES` contract for anyone invoking `docker compose` directly.

**New approach** (approved plan): revert the plain-value emit and the `COMPOSE_ENV_FILES` wiring, then extend the docker-secrets pattern already used by main-db / Keycloak / Nominatim / BookStack to `historian`, `volttron-setup`, `grafana-setup`, and `grafana`. Each service declares `secrets:` and consumes via `POSTGRES_PASSWORD_FILE` / `GF_*__FILE` / `cat /run/secrets/*` in setup scripts. Real values live only in `docker/secrets/*.txt`; `.env.secrets.docker` reverts to `_FILE`/`_SOURCE` pointers.

**2026-08-14 — Refactor complete.**

Reverts (undoing the 08-13 workaround):
- `aems-app/secrets.sh` — plain-value emit removed from `write_secrets_env`. Added one line for `HISTORIAN_DATABASE_PASSWORD_FILE=/run/secrets/historian_database_password` in the `_FILE` block (mirrors the main-db pattern).
- `aems-app/secrets.ps1` — mirrored.
- `aems-app/check-env.sh` + `check-env.ps1` — plain-value validation section removed.
- `aems-app/start-services.sh` + `.ps1`, `stop-services.sh` + `.ps1`, `reset-service.sh` + `.ps1`, `restart-service.sh` + `.ps1` — `COMPOSE_ENV_FILES` export blocks removed.

Native docker secrets wiring:
- `aems-app/docker/docker-compose.yml` — top-level `secrets:` block gained `historian_database_password`, `historian_replicator_password`, `grafana_admin_password`, `keycloak_grafana_client_secret`. Service blocks for `historian`, `volttron-setup`, `grafana-setup`, `grafana` each declare their `secrets: [...]` list. Historian service `environment:` now uses the `${POSTGRES_PASSWORD-${HISTORIAN_DATABASE_PASSWORD}}` / `${HISTORIAN_DATABASE_PASSWORD_FILE:-}` pair (same shape as main-db).
- `aems-app/docker/.env.historian` — removed `POSTGRES_PASSWORD=...` and `REPLICATOR_PASSWORD=...`.
- `aems-app/docker/.env.volttron` — removed `HISTORIAN_DB_PASSWORD=...`.
- `aems-app/docker/.env.grafana` — converted `GF_SECURITY_ADMIN_PASSWORD` and `GF_AUTH_GENERIC_OAUTH_CLIENT_SECRET` to `__FILE` variants pointing at `/run/secrets/`; removed `POSTGRES_PASSWORD`, `GRAFANA_PASSWORD`, `HISTORIAN_DB_PASSWORD`, and the grafana-setup `KEYCLOAK_ADMIN_PASSWORD` line.
- `aems-app/docker/historian/setup-replication.sh` — reads `REPLICATOR_PASSWORD` from `/run/secrets/historian_replicator_password` when present; refuses to run with an empty value.
- `aems-edge/setup-volttron.sh` — reads `HISTORIAN_DB_PASSWORD` from `/run/secrets/historian_database_password` when present.
- `aems-edge/setup-grafana.sh` — reads `HISTORIAN_DB_PASSWORD`, `GRAFANA_PASSWORD`, and `KEYCLOAK_ADMIN_PASSWORD` from `/run/secrets/*` when present.

Docs rolled back and rewritten to describe the docker-secrets pattern: `aems-app/docker/CLAUDE.md`, `aems-app/README.md`, `aems-app/docker/README.md`, `docs/proposed/aems-deployment-guide/aems-deployment-guide.md`.

**Verification** (dev host):

```
$ ./secrets.sh
All secrets are up to date.

$ grep _FILE= docker/.env.secrets.docker
POSTGRES_PASSWORD_FILE=/run/secrets/database_password
KEYCLOAK_ADMIN_PASSWORD_FILE=/run/secrets/keycloak_admin_password
KC_DB_PASSWORD_FILE=/run/secrets/keycloak_database_password
KC_DB_POSTGRES_PASSWORD_FILE=/run/secrets/keycloak_database_password
NOMINATIM_POSTGRES_PASSWORD_FILE=/run/secrets/nominatim_database_password
MYSQL_ROOT_PASSWORD_FILE=/run/secrets/bookstack_root_password
MYSQL_PASSWORD_FILE=/run/secrets/bookstack_database_password
HISTORIAN_DATABASE_PASSWORD_FILE=/run/secrets/historian_database_password
# (no plain KEY=<value> lines anywhere)

$ ./check-env.sh
… All checks passed.

$ docker compose --profile historian --profile volttron --profile grafana config \
    | grep -E "HISTORIAN_DB_PASSWORD|POSTGRES_PASSWORD:|POSTGRES_PASSWORD_FILE|GF_.*__FILE"
      POSTGRES_PASSWORD: ""
      POSTGRES_PASSWORD_FILE: /run/secrets/database_password       # main db
      POSTGRES_PASSWORD: ""
      POSTGRES_PASSWORD_FILE: /run/secrets/historian_database_password    # historian
      GF_SECURITY_ADMIN_PASSWORD__FILE: /run/secrets/grafana_admin_password
      GF_AUTH_GENERIC_OAUTH_CLIENT_SECRET__FILE: /run/secrets/keycloak_grafana_client_secret
# HISTORIAN_DB_PASSWORD env var no longer set on any service.
```

Every service's `secrets:` list resolves to the correct `source:`/`target:` mount pairs (verified via `docker compose config` output).

**Recovery for the existing broken deployment** (documented in the deployment guide's Materialize section): rebuild affected images (`docker compose build historian volttron-setup grafana-setup grafana`), run `./secrets.sh`, `./check-env.sh`, then `./reset-service.sh historian` to drop the placeholder-seeded Postgres volume before `./start-services.sh`.

