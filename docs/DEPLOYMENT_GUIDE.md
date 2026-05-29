# AEMS Deployment Guide

Authoritative, step-by-step guide for deploying the full AEMS stack with Docker Compose. It covers
both edge runtimes (FastAPI and legacy VOLTTRON), the validated bring-up procedure, verification,
credentials, and troubleshooting.

- **Architecture reference (FastAPI mode):** [FASTAPI_DOCKER_STATUS.md](./FASTAPI_DOCKER_STATUS.md)
- **Full configuration reference (env, profiles, secrets, backups, Keycloak):** [../aems-app/README.md](../aems-app/README.md)
- **Operator runbook (updates, maintenance, restore, replication):** the Deployment Guide section of [../README.md](../README.md)

> **Run every command from `aems-app/`** — not from `aems-app/docker/`. The file
> `aems-app/docker-compose.yml` is a shim that `include:`s `aems-app/docker/docker-compose.yml`, and
> running from `aems-app/` is what makes Compose auto-load `aems-app/.env`. Invoking with
> `-f docker/docker-compose.yml` or `cd docker && docker compose …` loads the wrong env file.

---

## 1. Prerequisites

**Host**

- Linux, macOS, or Windows with Docker Engine 24+ and Docker Compose v2 (Docker Desktop is fine).
- 4+ vCPU, 8+ GB RAM baseline. Size disk against historian retention — telemetry growth dominates.
- A real, resolvable DNS hostname for anything beyond local testing. **`localhost` does not work**:
  session cookies and Keycloak OAuth redirects require a stable hostname, and Traefik routes by it.
- Outbound internet for image pulls and (if used) Let's Encrypt ACME.
- Device reachability for your chosen edge runtime — see [§3 Choose an edge runtime](#3-choose-an-edge-runtime).

**Tools you install yourself**

- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) or Docker Engine + Compose v2

---

## 2. Clone the repositories

The FastAPI runtime is built from a sibling repo, expected as a symlink inside `volttron-pnnl-aems`.

```bash
mkdir ~/repos && cd ~/repos
git clone https://github.com/VOLTTRON/volttron-pnnl-aems.git
git clone https://github.com/VOLTTRON/aems-lib-fastapi.git    # FastAPI message bus (required for FastAPI mode)
git clone https://github.com/VOLTTRON/sim-rtu.git             # optional: simulated devices for dev/testing

cd volttron-pnnl-aems
ln -s ../aems-lib-fastapi .      # compose build context expects this sibling as a symlink
ln -s ../sim-rtu .               # only if using the sim-rtu profile
```

> If `aems-lib-fastapi` is missing, the `fastapi-setup` / `aems-fastapi` image builds fail. Legacy
> VOLTTRON mode does not need it.

---

## 3. Choose an edge runtime

The two edge runtimes are **mutually exclusive** — pick one. They are equally supported; choose by how
your building's devices are reached.

| | **FastAPI mode** | **Legacy VOLTTRON mode** |
|---|---|---|
| Profiles | `fastapi,fastapi-agents` | `volttron` |
| Message bus | `aems-lib-fastapi` (WebSocket) | VOLTTRON ZMQ monolith |
| Agents | All agents in **one** `aems-agents` container | Inside the monolithic `volttron` container |
| Device access | HTTP to a **Normal Framework (NF) gateway** that bridges BACnet | Direct **BACnet/IP** (UDP 47808) |
| Needs `aems-lib-fastapi` symlink | Yes | No |

> **Never enable both `volttron` and `fastapi` at once** — they conflict on port 5410.

Typical `COMPOSE_PROFILES` values (set in `aems-app/.env`):

```bash
# Full stack, FastAPI edge runtime
COMPOSE_PROFILES=proxy,sso,redis,fastapi,fastapi-agents,grafana

# Full stack, legacy VOLTTRON edge runtime
COMPOSE_PROFILES=proxy,sso,redis,volttron,grafana

# Development: FastAPI + simulated devices, no proxy/SSO
COMPOSE_PROFILES=fastapi,fastapi-agents,sim-rtu

# Minimal: app + FastAPI bus only
COMPOSE_PROFILES=fastapi,fastapi-agents
```

| Profile | Enables |
|---------|---------|
| `proxy` | Traefik reverse proxy + TLS |
| `sso` | Keycloak SSO (+ keycloak-db) |
| `redis` | Redis (sessions, GraphQL subscriptions) |
| `fastapi` | FastAPI message bus + `fastapi-setup` + historian DB |
| `fastapi-agents` | The consolidated `aems-agents` container |
| `grafana` | Grafana dashboards (+ grafana-db, grafana-setup) |
| `sim-rtu` | Simulated BACnet RTUs (dev/testing) |
| `volttron` | Legacy VOLTTRON monolith (do **not** combine with `fastapi`) |

The always-on core (no profile) is: `database`, `init` (migrations), `certs`, `client`, `server`,
`services`, `seeders`, and the `backup` sidecar.

---

## 4. Configure

All admin configuration lives in two files at the root of `aems-app/`:

- **`aems-app/.env`** — non-secret config (hostname, ports, profiles, site/device settings). Auto-loaded
  by Compose. Per-service `aems-app/docker/.env.*` files interpolate from it — do not edit those unless
  overriding a specific value.
- **`aems-app/.env.secrets`** — gitignored; every password/secret. Processed by `secrets.sh` into
  per-secret files under `aems-app/docker/secrets/`. Template: `aems-app/.env.secrets.example`.

```bash
cd aems-app
cp .env.secrets.example .env.secrets
# Edit .env.secrets — set EVERY password/secret to a strong unique value.
```

### Minimum `.env` settings

| Variable | Purpose | Example |
|----------|---------|---------|
| `HOSTNAME` | Public FQDN (never `localhost` in production) | `aems1.pnl.gov` |
| `COMPOSE_PROFILES` | Active profiles (picks the edge runtime) | see [§3](#3-choose-an-edge-runtime) |
| `COMPOSE_PROJECT_NAME` | Container/volume name prefix | `aems` |
| `COMPOSE_CONTAINER_REGISTRY` | `localhost` for local image builds | `localhost` |
| `TAG` | Image tag | `latest` |
| `ADMIN_EMAIL` | Let's Encrypt contact (if `CERT_RESOLVER=letsencrypt`) | `admin@example.com` |
| `CERT_RESOLVER` | Empty = self-signed (default); `letsencrypt` for ACME | _(empty)_ |

### Site / device settings (consumed by `fastapi-setup` and seeders)

| Variable | Purpose | Example |
|----------|---------|---------|
| `VOLTTRON_CAMPUS` | Campus identifier | `PNNL` |
| `VOLTTRON_BUILDING` | Building identifier | `ROB` |
| `VOLTTRON_PREFIX` | Device name prefix | `rtu` |
| `VOLTTRON_NUM_CONFIGS` | Number of RTU/HP devices | `5` |
| `VOLTTRON_TIMEZONE` | Site timezone | `America/Los_Angeles` |
| `VOLTTRON_WEATHER_STATION` | weather.gov station ID | `KPSC` |
| `VOLTTRON_ILC` | Enable the ILC (load-control) agent | `true` |
| `VOLTTRON_NF_GATEWAY_URL` | **FastAPI mode:** NF gateway URL | `http://host.docker.internal:8081` |
| `VOLTTRON_GATEWAY_ADDRESS` | **VOLTTRON mode:** BACnet gateway / device IP | `192.168.1.1` |

### Required secrets (in `.env.secrets`)

`DATABASE_PASSWORD`, `HISTORIAN_DATABASE_PASSWORD`, `HISTORIAN_REPLICATOR_PASSWORD`, `SESSION_SECRET`,
`JWT_SECRET`, `KEYCLOAK_CLIENT_SECRET`, `KEYCLOAK_GRAFANA_CLIENT_SECRET`, `KEYCLOAK_ADMIN_PASSWORD`,
`KEYCLOAK_DATABASE_PASSWORD`, `REDIS_PASSWORD`. See [§8 Credentials & access](#8-credentials--access)
for how each is actually consumed at runtime — some have non-obvious precedence.

---

## 5. Generate secrets, build, and start

```bash
cd aems-app

./secrets.sh            # Linux/macOS — writes docker/secrets/*.txt from .env.secrets
# .\secrets.ps1         # Windows

./start-services.sh     # wraps: docker compose build && docker compose up -d
# .\start-services.ps1  # Windows
```

`start-services.sh` builds all images (local builds, since `COMPOSE_CONTAINER_REGISTRY=localhost`) and
brings the stack up detached. Startup order is enforced by `depends_on` + healthchecks:

1. `database` (healthcheck `pg_isready`)
2. `init` (Prisma migrations) and `certs` (TLS) — one-shot
3. `fastapi-setup` — generates agent configs from `.env`, one-shot _(FastAPI mode)_
4. `aems-fastapi-server` — waits for setup + init to complete _(FastAPI mode)_
5. `aems-agents` — waits for the bus to be healthy, then launches all agents _(FastAPI mode)_
6. `client`, `server`, `services`, `seeders`
7. `proxy`, `grafana`, `keycloak`, … per profiles

> **Re-running after changes:** edit `.env` / code → `./start-services.sh` (rebuilds + rolls
> containers). Edit `.env.secrets` → `./secrets.sh` then `./start-services.sh`. For a true clean slate
> (re-run all init/seed scripts), see [§9 Clean redeploy](#9-clean-redeploy).

---

## 6. Verify the deployment

```bash
cd aems-app

# 1. Everything healthy, nothing restarting
docker compose ps
docker ps --format '{{.Names}}\t{{.Status}}' | grep -E 'unhealthy|Restarting' || echo "all healthy"

# 2. Web UI reachable through the proxy
curl -k -o /dev/null -s -w "%{http_code}\n" https://$HOSTNAME/        # 200
```

### FastAPI mode — message bus and agents

In a healthy FastAPI deployment there are exactly **two** edge runtime containers —
`aems-aems-fastapi-server` and `aems-aems-agents` — plus the `aems-historian` database. There should be
**no** separate per-agent containers (`*-nf-driver`, `*-manager-rtuNN`, `*-listener`, etc.); all agents
run inside `aems-agents`.

```bash
# All 10 agents started inside the single container, none exited
docker logs aems-aems-agents 2>&1 | grep -E '\[start-agents\].*(Starting agent|All agents|exited)'

# platform.driver registered on the bus (connected:true)
docker exec aems-aems-agents curl -sf http://aems-fastapi-server:8000/connections/platform.driver

# All connected agent identities
docker exec aems-aems-agents curl -sf http://aems-fastapi-server:8000/connections
```

### Historian is persisting telemetry

```bash
# Row count should be > 0 and climbing; 0 replica-identity errors
docker exec aems-historian sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" psql -At -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
   -c "SELECT count(*) AS rows, max(ts) AS newest FROM data;"'
docker logs aems-historian 2>&1 | grep -c 'replica identity'   # expect 0
```

### Grafana shows the data

```bash
docker exec aems-grafana sh -c '
  curl -s -u "$GF_SECURITY_ADMIN_USER:$GF_SECURITY_ADMIN_PASSWORD" \
    http://localhost:3000/api/datasources | head -c 400'        # PostgreSQL ds -> historian:5432
```

Then open `https://$HOSTNAME/grafana` → folder **PNNL/ROB** → the per-RTU and Site Overview dashboards.

---

## 7. Access

Everything is served by Traefik over **HTTPS on port 443** at `HOSTNAME` (HTTP :80 redirects to HTTPS).

| Service | URL |
|---------|-----|
| Web UI | `https://<HOSTNAME>/` |
| GraphQL | `https://<HOSTNAME>/graphql` |
| Grafana | `https://<HOSTNAME>/grafana` |
| Keycloak admin | `https://<HOSTNAME>/auth/sso/admin/` |
| FastAPI bus (host-published) | `http://localhost:5410/` (internal `aems-fastapi-server:8000`) |
| Historian DB (host-published) | `localhost:5543` (internal `historian:5432`) |
| Historian replication (TCP) | port `6543` (off-site subscribers only) |

> The browser machine must resolve `HOSTNAME` to this server (DNS or `/etc/hosts`). Traefik routes by
> `Host(\`HOSTNAME\`)` and the TLS cert is issued for that name — an IP or `localhost` will not match.
> With the default self-signed cert you also get a trust warning unless the CA is installed.

---

## 8. Credentials & access

| Login | Username | Password source | Notes |
|-------|----------|-----------------|-------|
| **App / Grafana (normal)** | your email | Keycloak (SSO) | `AUTH_PROVIDERS=keycloak`; the seeded local `password` fields are unused. |
| **Keycloak admin console** | `admin` (`KEYCLOAK_ADMIN`) | **`docker/secrets/keycloak_admin_password.txt`** | ⚠️ **Not** the `KEYCLOAK_ADMIN_PASSWORD` value in `.env`. The Keycloak entrypoint reads the Docker secret and exports it over the env var at runtime, so the secret file is the source of truth. Using the `.env` value gives `invalid_grant`. |
| **Grafana local admin** | `admin` (`GF_SECURITY_ADMIN_USER`) | `GRAFANA_ADMIN_PASSWORD` in `.env` | Built-in admin that bypasses SSO. ⚠️ Ships as the placeholder `CHANGE_ME_grafana_admin_password` — change it before any real deployment. |

### Create the first admin user (Keycloak SSO)

`update-user-role.sh` only sets a role on a **User row that already exists** in the app DB, so the
account must exist first. Two ways:

**A. Pre-seed (no manual login needed).** Add a seed file under `aems-app/docker/seed/` modeled on
`20211103151730-system-user.json` with the user's email and `"role": "admin"`, then create the matching
Keycloak account:

```bash
docker exec aems-keycloak sh -c '
  KC=/opt/keycloak/bin/kcadm.sh
  PW=$(cat /run/secrets/keycloak_admin_password | tr -d "\n\r")
  $KC config credentials --server http://localhost:8080/auth/sso --realm master --user admin --password "$PW"
  $KC create users -r default -s username=USER@EXAMPLE.COM -s email=USER@EXAMPLE.COM \
     -s enabled=true -s emailVerified=true
  $KC set-password -r default --username USER@EXAMPLE.COM --new-password "CHANGE_ME"
'
```

**B. Self-register, then grant role.** Open `https://<HOSTNAME>/`, use the login → registration flow
(provisions the user in both Keycloak and the app DB), then from `aems-app/`:

```bash
./update-user-role.sh user@example.com admin     # takes effect on next page load
```

---

## 9. Clean redeploy

To re-test the deployment from scratch (re-runs every init/seed/replication script — the only way to
validate first-boot behavior such as historian schema setup):

```bash
cd aems-app
docker compose down -v --remove-orphans   # DESTRUCTIVE: wipes all data volumes (app DB, historian, keycloak, grafana)
./start-services.sh
```

`docker compose down` **without** `-v` keeps data volumes; the database/historian init scripts will
**not** re-run because the data directories are already initialized. Use `-v` when you specifically want
a fresh first boot. Host-side secret files in `docker/secrets/` survive `down -v` (they are bind-mounted
files, not volumes).

> `--remove-orphans` clears containers from services no longer in the compose file — important if you
> previously ran an older layout that defined separate per-agent containers.

---

## 10. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `fastapi-setup` / `aems-fastapi` build fails | Missing `aems-lib-fastapi` sibling symlink | `ln -s ../aems-lib-fastapi .` from the repo root |
| `aems-edge` build context not found | Missing symlink or wrong relative path | Verify `../../aems-edge` resolves from `aems-app/docker/` |
| Port 5410 conflict | Both `volttron` and `fastapi` profiles enabled | Use only one edge runtime in `COMPOSE_PROFILES` |
| `SeT_tHiS_iN_0x3A-.env.secrets-` in logs | Placeholder secrets not replaced | Set real values in `.env.secrets`, re-run `./secrets.sh`, then `./start-services.sh` |
| Duplicate/orphan per-agent containers (`*-nf-driver`, `*-manager-rtuNN`) running alongside `aems-agents` | Stale containers from a pre-consolidation layout | `docker compose down --remove-orphans`, then `up -d`. All agents belong inside `aems-agents`. |
| `platform.driver` keeps restarting; managers log `Peer platform.driver not found` / RPC timeouts | NF driver crashed (e.g. missing/incorrect registry CSV path in the generated `nf-driver/config`) | Confirm the registry path resolves; the generator writes `/app/site-config/configs/configuration_store/platform.driver/registry_configs/…`. Check `docker logs aems-aems-agents` for the crashing agent. |
| Historian DB rejects writes: `cannot update table "data" … does not have a replica identity and publishes updates`; `data` row count stuck at 0 | The `data` table (created by the historian at runtime) had no usable replica identity under the `historian_pub` publication | Fixed in `docker/historian/setup-replication.sh` via a DDL event trigger that sets a replica identity on new tables. On a pre-fix DB: `ALTER TABLE data ADD PRIMARY KEY (topic_id, ts);` |
| Historian can't connect | Wrong host/port | Internal host is `historian`, port `5432` (host-published on `5543`) |
| Keycloak admin login `invalid_grant` | Using the `.env` `KEYCLOAK_ADMIN_PASSWORD` | Use `docker/secrets/keycloak_admin_password.txt` — see [§8](#8-credentials--access) |
| Agent containers exit immediately | FastAPI server not healthy yet | `docker compose ps` — `aems-fastapi-server` must be `healthy` first |
| Config edits not taking effect | Agent configs are read at startup | Restart the affected container (FastAPI mode: `docker compose restart aems-agents`) |
| Web UI unreachable over HTTPS | `certs` failed or `HOSTNAME` mismatch | `docker compose logs certs`; verify `HOSTNAME` and that the browser resolves it |
| Setpoint write-backs time out at startup | Burst of concurrent setpoint pushes vs. NF gateway / 30s RPC timeout | Transient; managers retry. Persistent failures usually mean the NF gateway has no reachable BACnet devices. |
| `docker compose build` very slow | No BuildKit cache | `export DOCKER_BUILDKIT=1` or use `docker buildx` |

### Useful log commands

```bash
docker logs -f aems-aems-agents          # all FastAPI-mode agents (driver, managers, historian, weather, ilc, listener)
docker logs -f aems-aems-fastapi-server  # message bus + RPC routing
docker logs -f aems-historian            # historian Postgres
docker logs -f aems-proxy                # Traefik routing / TLS
docker logs -f aems-keycloak             # SSO
```

---

## 11. External dependency: the Normal Framework gateway (FastAPI mode)

FastAPI mode does **not** speak BACnet directly. The NF driver (`platform.driver`) makes HTTP calls to a
**Normal Framework gateway** that bridges to BACnet/IP:

```
Manager agent → RPC → NF driver → HTTP → NF gateway → BACnet/IP → RTU/HP device
```

- The NF gateway runs **outside** this compose stack (e.g. on the host), reached at
  `VOLTTRON_NF_GATEWAY_URL` (default `http://host.docker.internal:8081`).
- No BACnet proxy, UDP ports, or interface config is needed inside Docker.
- Setpoint writes only succeed when the gateway has reachable BACnet devices; otherwise the manager
  reports failure and the UI shows a red error icon. Telemetry scraping and historian writes are
  independent of write-back success.

For legacy VOLTTRON mode, device communication is direct BACnet/IP — ensure UDP **47808** reachability
from the host to the building devices, and configure devices under
`aems-app/docker/volttron/setup/configs/`.

---

## See also

- **Operator runbook** (updates, backups/restore, routine maintenance, off-site replication, hardening
  checklist): Deployment Guide in [../README.md](../README.md)
- **FastAPI architecture & data-flow reference:** [FASTAPI_DOCKER_STATUS.md](./FASTAPI_DOCKER_STATUS.md)
- **Full configuration / env reference:** [../aems-app/README.md](../aems-app/README.md)
- **Compose & profiles detail:** [../aems-app/docker/CLAUDE.md](../aems-app/docker/CLAUDE.md)
