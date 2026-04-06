# AEMS System Setup Guide

Authoritative guide for deploying AEMS from scratch. Based on the running aems1 production deployment.

## Prerequisites

- Docker 20.10+ and Docker Compose v2+
- Git
- Go 1.24+ (only if using sim-rtu)

## 1. Clone Repositories

Three repos, all siblings:

```bash
mkdir ~/repos && cd ~/repos
git clone git@github.com:VOLTTRON/volttron-pnnl-aems.git
git clone git@github.com:VOLTTRON/aems-lib-fastapi.git
# Optional: simulated devices for development
git clone git@github.com:VOLTTRON/sim-rtu.git
```

Create symlinks (compose build contexts expect siblings):

```bash
cd volttron-pnnl-aems
ln -s ../aems-lib-fastapi .
ln -s ../sim-rtu .        # only if using sim-rtu
```

## 2. Configure .env

The root `.env` at `aems-app/.env` is the **master configuration file**. Per-service `.env.*` files in `aems-app/docker/` are templates that interpolate from it. Do NOT edit the per-service files unless overriding specific values.

```bash
cd aems-app
cp .env.secrets.example .env.secrets
# Edit .env.secrets with real passwords (see table below)
# Then source it to overlay onto .env:
source ./secrets.sh      # Linux/Mac
# .\secrets.ps1          # Windows
```

Or edit `.env` directly, replacing all `SeT_tHiS_iN_0x3A-.env.secrets-` placeholders with real values.

### Required Variables

#### Site Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `HOSTNAME` | Server FQDN or IP | `aems1.pnl.gov` |
| `COMPOSE_PROFILES` | Active profiles (comma-separated) | `proxy,sso,redis,fastapi,fastapi-agents,grafana` |
| `COMPOSE_PROJECT_NAME` | Docker project name | `aems` |
| `COMPOSE_CONTAINER_REGISTRY` | Image registry (`localhost` for local builds) | `localhost` |
| `TAG` | Image tag | `latest` |
| `ADMIN_EMAIL` | Email for Let's Encrypt certs | `admin@example.com` |

#### Database

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_NAME` | App database name | `aems` |
| `DATABASE_USERNAME` | App database user | `aems` |
| `DATABASE_PASSWORD` | App database password | **must set** |
| `HISTORIAN_DATABASE_PASSWORD` | Historian DB password | **must set** |
| `HISTORIAN_REPLICATOR_PASSWORD` | Historian replication password | **must set** |

#### Authentication

| Variable | Description | Example |
|----------|-------------|---------|
| `AUTH_PROVIDERS` | Auth method | `keycloak` (prod) or `local` (dev) |
| `SESSION_SECRET` | Session signing key | **must set** |
| `JWT_SECRET` | JWT signing key | **must set** |
| `KEYCLOAK_CLIENT_SECRET` | Keycloak app client secret | **must set** |
| `KEYCLOAK_ADMIN_PASSWORD` | Keycloak admin password | **must set** |
| `KEYCLOAK_DATABASE_PASSWORD` | Keycloak DB password | **must set** |

#### Edge Platform (VOLTTRON/FastAPI)

| Variable | Description | Example |
|----------|-------------|---------|
| `VOLTTRON_CAMPUS` | Site campus ID | `PNNL` |
| `VOLTTRON_BUILDING` | Building ID | `ROB` |
| `VOLTTRON_PREFIX` | Device prefix | `rtu` |
| `VOLTTRON_NUM_CONFIGS` | Number of RTU devices | `5` |
| `VOLTTRON_GATEWAY_ADDRESS` | BACnet gateway or sim-rtu IP | `192.168.1.1` |
| `VOLTTRON_TIMEZONE` | Site timezone | `America/Los_Angeles` |
| `VOLTTRON_WEATHER_STATION` | weather.gov station ID | `KPSC` |
| `VOLTTRON_ILC` | Enable ILC agent | `true` |

#### Redis

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_USERNAME` | Redis user | `redis` |
| `REDIS_PASSWORD` | Redis password | **must set** |

### Profile Selection

| Profile | What it enables | When to use |
|---------|----------------|-------------|
| `proxy` | Traefik reverse proxy + TLS | Always (production) |
| `sso` | Keycloak SSO | Production with SSO |
| `redis` | Redis cache/sessions | Production |
| `fastapi` | FastAPI server + setup + historian | Always (replaces volttron) |
| `fastapi-agents` | Agent containers | Always with fastapi |
| `grafana` | Monitoring dashboards | Production |
| `sim-rtu` | Simulated RTU devices | Development/testing only |
| `volttron` | Legacy VOLTTRON monolith | Legacy only, **DO NOT use with fastapi** |

Example profiles:

```bash
# Production
COMPOSE_PROFILES=proxy,sso,redis,fastapi,fastapi-agents,grafana

# Development (no SSO, no proxy, simulated devices)
COMPOSE_PROFILES=fastapi,fastapi-agents,sim-rtu

# Minimal (just the app + FastAPI)
COMPOSE_PROFILES=fastapi,fastapi-agents
```

> **WARNING:** Do not enable both `volttron` and `fastapi` profiles. They both bind to port 5410 and will conflict.

## 3. Build and Start

```bash
cd aems-app/docker
docker compose build
docker compose up -d
```

The startup order is automatic via `depends_on` and healthchecks:

1. `database` (healthcheck: pg_isready)
2. `init` (migrations) + `certs` (TLS) -- one-shot
3. `fastapi-setup` (config generation from env vars) -- one-shot
4. `aems-fastapi-server` (waits for setup + init)
5. Agent containers: listener, sql-historian, manager, weather, nf-driver, ilc (wait for server healthy)
6. `client` + `server` + `services` (wait for init + database)
7. `proxy`, `grafana`, `keycloak`, etc. (based on profiles)

## 4. Verify

```bash
# Container status
docker compose ps

# FastAPI health
curl -s http://localhost:5410/health/

# Connected agents
curl -s http://localhost:5410/connections

# Web UI
curl -s -o /dev/null -w "%{http_code}" http://localhost:3010/
```

## 5. Access

| Service | URL | Notes |
|---------|-----|-------|
| Web UI | `https://HOSTNAME/` | Via Traefik proxy |
| GraphQL | `https://HOSTNAME/graphql` | API playground |
| FastAPI | `http://localhost:5410/` | Agent message bus |
| Grafana | `https://HOSTNAME/grafana` | Monitoring |
| Keycloak | `https://HOSTNAME/auth/sso` | SSO admin |

## Per-Service .env Files

Located in `aems-app/docker/`. These interpolate from the root `.env` -- do NOT edit directly unless overriding.

| File | Purpose |
|------|---------|
| `.env.aems-fastapi` | FastAPI server + agent containers (port, VOLTTRON_HOME) |
| `.env.certs` | TLS certificate generation (HOSTNAME) |
| `.env.client` | Next.js frontend (database, auth, proxy settings) |
| `.env.database` | PostgreSQL app database (user, password, db name) |
| `.env.grafana` | Grafana dashboards (admin, OAuth, datasource) |
| `.env.historian` | Historian PostgreSQL (user, password, replication) |
| `.env.init` | Database migration container (connection string) |
| `.env.keycloak` | Keycloak SSO (hostname, DB, admin creds) |
| `.env.nominatim` | Geocoding service (PBF data source) |
| `.env.redis` | Redis cache (username, password) |
| `.env.seeders` | Database seed data (instance type, paths) |
| `.env.server` | Backend API server (auth, session, logging) |
| `.env.services` | Background services (auth, VOLTTRON integration) |
| `.env.sim-rtu` | Simulated RTU config (log level, config path) |
| `.env.volttron` | Legacy VOLTTRON + fastapi-setup (all VOLTTRON_* vars) |
| `.env.wiki` | Bookstack wiki (app key, DB, Keycloak) |

## Generated Configs

The `fastapi-setup` container generates agent configs in `aems-app/docker/fastapi/setup/` from environment variables:

| Config | Agent | Generated From |
|--------|-------|---------------|
| `historian.config` | SQL Historian | `HISTORIAN_DATABASE_PASSWORD`, historian service hostname |
| `weather.config` | Weather agent | `VOLTTRON_WEATHER_STATION` |
| `configuration_store/manager.rtuXX/` | Manager agents | `VOLTTRON_CAMPUS`, `VOLTTRON_BUILDING`, `VOLTTRON_PREFIX` |
| `configs/nf-driver/config` | NF Driver | `VOLTTRON_GATEWAY_ADDRESS`, `VOLTTRON_NUM_CONFIGS` |
| `site.json` | Services | `VOLTTRON_PREFIX`, `VOLTTRON_NUM_CONFIGS` |
| `ilc.config` | ILC agent | `VOLTTRON_ILC`, campus/building/prefix |

> **Note:** On aems1, only ONE manager agent runs (`manager.rtu02`), not all 5 devices. The manager identity is hardcoded in the compose file. To run additional managers, duplicate the `aems-manager` service block with updated `--config`, `--identity`, and `container_name`.

## Common Operations

### Read a point

```bash
curl -X POST http://localhost:5410/gs \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"1","method":"get_point","params":{"args":["PNNL/ROB/rtu01","ZoneTemperature"]}}'
```

### Check agent status

```bash
curl http://localhost:5410/connections/platform.driver
```

### View logs

```bash
docker compose logs -f aems-nf-driver
docker compose logs -f aems-manager
docker compose logs -f aems-fastapi-server
```

### Rebuild after code changes

```bash
docker compose build aems-fastapi-server
docker compose up -d
```

### Restart a single agent

```bash
docker compose restart aems-nf-driver
```

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `SeT_tHiS_iN_0x3A-.env.secrets-` in errors | Placeholder passwords not replaced | Replace all `SeT_tHiS_iN_0x3A-.env.secrets-` values in `.env` with real passwords |
| Port 5410 conflict | Both `volttron` and `fastapi` profiles enabled | Use only one: remove `volttron` from `COMPOSE_PROFILES` |
| Historian can't connect | Wrong host/port for Docker networking | Historian host is `historian` (Docker service name), port `5432` |
| `fastapi-setup` build fails | Missing symlink for aems-lib-fastapi | Run `ln -s ../aems-lib-fastapi .` from repo root |
| `aems-edge` build context not found | Missing symlink or wrong relative path | Verify `../../aems-edge` resolves from `aems-app/docker/` |
| SQL Historian crashes | Missing `psycopg2` | Verify the FastAPI image includes `psycopg2-binary` |
| NF driver crash | Empty `Write Priority` field in registry | Patch `aems-edge/Normal/nf/driver.py` to handle empty strings |
| Agent containers exit immediately | FastAPI server not healthy yet | Check `docker compose ps` -- server must show `healthy` |
| `fastapi-setup` exits with error | VOLTTRON_* env vars not set | Check `.env` has all required VOLTTRON_* variables |
| Config changes not taking effect | Configs read at startup only | Restart the affected container |
| Web UI unreachable via HTTPS | Certs container failed or HOSTNAME wrong | Check `docker compose logs certs` and verify `HOSTNAME` in `.env` |
| Keycloak login fails | Wrong `KEYCLOAK_CLIENT_SECRET` or HOSTNAME mismatch | Regenerate secret in Keycloak admin, update `.env` |
| `docker compose build` very slow | No Docker BuildKit cache | Set `DOCKER_BUILDKIT=1` or use `docker buildx` |

## Architecture Notes

- **Image builds are local.** `COMPOSE_CONTAINER_REGISTRY=localhost` means `docker compose build` builds all images locally. No remote registry pull.
- **Docker compose runs from `aems-app/docker/`** but the root `.env` at `aems-app/.env` is loaded automatically (compose walks up to find it).
- **FastAPI server exposes port 8000 internally**, mapped to `5410` externally via `AEMS_FASTAPI_TEST_PORT`.
- **Agent containers connect to the server via WebSocket** at `ws://aems-fastapi-server:8000` (Docker internal DNS).
- **The NF driver mounts a local fix** for the Write Priority empty string bug (`driver.py` bind mount in compose).
