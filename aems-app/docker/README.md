# AEMS Docker Compose Stack

<p align="center">
  <strong>Docker Compose deployment configuration for the Skeleton App</strong>
</p>

<p align="center">
  <a href="https://docs.docker.com/compose/" target="_blank">
    <img src="https://img.shields.io/badge/docker--compose-2.x-blue.svg" alt="Docker Compose Version" />
  </a>
  <a href="https://traefik.io/" target="_blank">
    <img src="https://img.shields.io/badge/traefik-2.10-orange.svg" alt="Traefik Version" />
  </a>
  <a href="https://www.postgresql.org/" target="_blank">
    <img src="https://img.shields.io/badge/postgresql-16-blue.svg" alt="PostgreSQL Version" />
  </a>
  <a href="https://www.keycloak.org/" target="_blank">
    <img src="https://img.shields.io/badge/keycloak-latest-red.svg" alt="Keycloak Version" />
  </a>
</p>

---

## Table of Contents

- [🏗️ Overview](#️-overview)
  - [Architecture](#architecture)
  - [Optional Services (Profiles)](#optional-services-profiles)
- [🚀 Quick Start](#-quick-start)
  - [Prerequisites](#prerequisites)
  - [Basic Deployment](#basic-deployment)
  - [Enable Optional Services](#enable-optional-services)
- [📁 Directory Structure](#-directory-structure)
- [⚙️ Configuration](#️-configuration)
  - [Environment Files](#environment-files)
  - [Key Configuration Variables](#key-configuration-variables)
- [🔒 Security & TLS](#-security--tls)
  - [Certificate Management](#certificate-management)
  - [Security Headers](#security-headers)
- [🗄️ Data Persistence](#️-data-persistence)
  - [Docker Volumes](#docker-volumes)
  - [Backup Considerations](#backup-considerations)
- [🚀 Service Profiles](#-service-profiles)
  - [Core Services (Always Running)](#core-services-always-running)
  - [Optional Profiles](#optional-profiles)
- [🛠️ Development & Debugging](#️-development--debugging)
  - [Development Mode](#development-mode)
  - [Service Health Checks](#service-health-checks)
  - [Database Access](#database-access)
  - [Debugging Services](#debugging-services)
- [🗺️ Map Services Configuration](#️-map-services-configuration)
  - [OpenStreetMap Tiles](#openstreetmap-tiles)
  - [Nominatim Geocoding](#nominatim-geocoding)
- [🔐 Authentication Configuration](#-authentication-configuration)
  - [Keycloak SSO Setup](#keycloak-sso-setup)
  - [Local Authentication](#local-authentication)
- [📊 Monitoring & Maintenance](#-monitoring--maintenance)
  - [Health Monitoring](#health-monitoring)
  - [Maintenance Tasks](#maintenance-tasks)
- [🚨 Troubleshooting](#-troubleshooting)
  - [Common Issues](#common-issues)
  - [Service-Specific Issues](#service-specific-issues)
- [🔧 Advanced Configuration](#-advanced-configuration)
  - [Custom TLS Certificates](#custom-tls-certificates)
  - [External Database](#external-database)
  - [Load Balancing](#load-balancing)
  - [Custom Environment Variables](#custom-environment-variables)
- [📚 Additional Resources](#-additional-resources)
  - [Documentation](#documentation)
  - [Related Files](#related-files)
  - [Support](#support)

---

## 🏗️ Overview

This directory contains the Docker Compose configuration and supporting files for deploying the Skeleton App in containerized environments. The configuration supports both development and production deployments with optional services that can be enabled through Docker Compose profiles.

### Architecture

The Docker deployment consists of the following core services:

- **Client**: Next.js frontend application
- **Server**: NestJS backend API server  
- **Services**: Background services and job processing
- **Database**: PostgreSQL with PostGIS extensions
- **Init**: Database migration and initialization service

### Optional Services (Profiles)

- **Proxy** (`proxy`): Traefik reverse proxy with TLS/SSL support
- **Redis** (`redis`): Caching and session storage
- **SSO** (`sso`): Keycloak authentication server
- **Map** (`map`): OpenStreetMap tile server
- **Nominatim** (`nom`): Geocoding and address lookup service
- **Wiki** (`wiki`): BookStack documentation wiki

---

## 🚀 Quick Start

### Prerequisites

- Docker 20.10+ and Docker Compose 2.x
- At least 4GB RAM available for containers
- 10GB+ disk space for images and volumes

### Basic Deployment

1. **Configure environment variables**
   ```bash
   # Copy and edit the main environment file
   cp ../.env.example ../.env
   cp ../.env.secrets.example ../.env.secrets

   # Edit ../.env.secrets with real values, then generate docker/secrets/ files
   # Windows
   ..\secrets.ps1

   # Linux/Mac
   ../secrets.sh

   # Validate configuration before starting
   ../check-env.sh       # Linux/Mac
   ..\check-env.ps1      # Windows
   ```

2. **Start core services**
   ```bash
   # From project root
   docker compose up -d
   ```

3. **Access the application**
   - Main application: https://localhost (or your configured APP_HOSTNAME)
   - GraphQL API: https://localhost/graphql

### Enable Optional Services

```bash
cd volttron-pnnl-aems/aems-app/docker

# Edit .env — set all passwords (replace SeT_tHiS_iN_0x3A- placeholders), HOSTNAME, COMPOSE_PROFILES
docker compose up -d --build
docker compose ps

# Access: http://localhost:<CLIENT_TEST_PORT> or https://<HOSTNAME> (with proxy profile)
```

## Prerequisites

| Tool | Version |
|------|---------|
| Docker Engine | 24+ |
| Docker Compose | v2.x |

**Required in `aems-app/.env`:** all passwords, `HOSTNAME`, `COMPOSE_PROFILES`, `ADMIN_EMAIL` (if using Let's Encrypt).

For corporate proxies, set `HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY` in `.env`.

## Core Services

Always start with `docker compose up -d` (no profile needed).

| Service | Image / Build | Ports (internal → host) | Key Details |
|---------|--------------|------------------------|-------------|
| `database` | PostgreSQL 16 (`docker/database/`) | 5432 → `${DATABASE_TEST_PORT}` | Healthcheck: `pg_isready`. Volume: `database-data` |
| `init` | Prisma migrations (`prisma/`) | — | One-shot. Runs migrations. All services wait for completion |
| `certs` | Cert generator (`docker/certs/`) | — | One-shot. Generates self-signed TLS certs to `certs-data` volume |
| `client` | Next.js (`client/`) | 3000 → `${CLIENT_TEST_PORT}` | Depends on: `init` complete, `database` started |
| `server` | Node.js (`server/`) | 3000 → `${SERVER_TEST_PORT}` | GraphQL/REST API. Routes: `/authjs`, `/graphql`, `/api`, `/ext` |
| `services` | Same as server | — | Background services (all except seeders). Has `host.docker.internal` mapping |
| `seeders` | Same as server | — | Database seeding. Restarts up to 3× on failure |

## Profiles

### Key Configuration Variables

#### Core Application
```bash
# Main environment file (../.env)
COMPOSE_PROJECT_NAME=skeleton
TAG=latest
APP_HOSTNAME=localhost                # Change for production
AUTH_PROVIDERS=keycloak              # local,super,bearer,keycloak
LOGGERS=console,database             # console,database
INSTANCE_TYPE=""                     # Service configuration (see below)
```

#### Service Instance Configuration

The `INSTANCE_TYPE` environment variable controls which background services run in each container, enabling flexible deployment configurations:

**Basic Syntax:**
```bash
# Enable specific services
INSTANCE_TYPE=seed,log

# Enable all services  
INSTANCE_TYPE=*

# Enable all except specific services
INSTANCE_TYPE=*,!log

# Run one service then shutdown
INSTANCE_TYPE=^seed
```

**Common Deployment Patterns:**

```bash
# Persistent (.env):
COMPOSE_PROFILES=proxy,sso,redis,volttron,grafana

# One-time:
docker compose --profile fastapi --profile redis up -d
```

| Profile | Services | Purpose | Extra Setup |
|---------|----------|---------|-------------|
| `proxy` | `proxy` (Traefik v3.6.2) | TLS termination, routing | `HOSTNAME`, `ADMIN_EMAIL`, `CERT_RESOLVER` |
| `redis` | `redis` (6.2) | Cache / session store | `REDIS_USERNAME`, `REDIS_PASSWORD` |
| `sso` | `keycloak`, `keycloak-db` | Keycloak SSO at `/auth/sso/` | Keycloak passwords; requires `proxy` |
| `map` | `maptiles` | Tile server at `/ext/map` | Place `.mbtiles` in `docker/map/` |
| `nom` | `nominatim` (4.4) | Geocoding | `PBF_URL` or `PBF_PATH` |
| `wiki` | `wiki`, `wiki-db` | BookStack wiki | BookStack passwords/secrets |
| `grafana` | `grafana`, `grafana-setup` | Monitoring dashboards | `GRAFANA_ADMIN_PASSWORD` |
| `volttron` | `volttron`, `volttron-setup`, `historian` | Building automation (host network for BACnet) | VOLTTRON settings in `.env` |
| `fastapi` | `aems-fastapi-server` + 6 agents | FastAPI-based VOLTTRON replacement | Clone `aems-lib-fastapi`, run pipeline |
| `fastapi-agents` | 6 agent containers only | Agents without server | Server must already be running |

### FastAPI Profile

Replaces the monolithic `volttron` profile with per-agent containers over WebSocket.

**Agents:**

| Service | Identity | Description |
|---------|----------|-------------|
| `aems-fastapi-server` | — | WebSocket server, agent coordinator |
| `aems-listener` | `listener` | Debug/example listener |
| `aems-sql-historian` | `platform.historian` | SQL historian for time-series data |
| `aems-manager` | `manager.rtu02` | RTU manager |
| `aems-weather-dot-gov` | `platform.weather` | Weather.gov data |
| `aems-nf-driver` | `platform.driver` | BACnet driver (Normal Framework) |
| `aems-ilc` | `ilc.platform` | Intelligent Load Control (depends on `aems-nf-driver`) |

All agent containers share image `aems-fastapi:${TAG}`, connect to `ws://aems-fastapi-server:8000`, and mount `aems-volttron-home` and `aems-agent-logs` volumes. The `aems-fastapi-server` itself mounts only `aems-volttron-home` and the Docker socket.

---

## 🔒 Security & TLS

### Certificate Management

The `certs` service automatically generates self-signed certificates using mkcert:

- **Development**: Self-signed certificates for localhost
- **Production**: Let's Encrypt certificates for valid domains

#### Self-signed Certificates (Development)
```bash
# Certificates are automatically generated
# CA certificate: /etc/certs/mkcert-ca.crt
# Host certificate: /etc/certs/mkcert-hostname.crt
```

#### Let's Encrypt Certificates (Production)
```bash
# Configure in main .env file
CERT_RESOLVER=letsencrypt
ADMIN_EMAIL=your.email@example.com
APP_HOSTNAME=yourdomain.com
```

### Security Headers

Traefik proxy automatically applies security headers:
- HTTPS redirect
- HSTS (HTTP Strict Transport Security)
- XSS protection
- Content type sniffing protection
- Frame denial
- Referrer policy

---

## 🗄️ Data Persistence

### Docker Volumes

| Volume | Purpose | Data |
|--------|---------|------|
| `database-data` | PostgreSQL data | Application database |
| `certs-data` | TLS certificates | SSL/TLS certificates |
| `client-cache` | Next.js cache | Build cache and static files |
| `file-upload` | File uploads | User uploaded files |
| `keycloak-data` | Keycloak database | SSO configuration |
| `keycloak-cache` | Keycloak cache | Session and cache data |
| `nominatim-data` | Nominatim database | Geocoding data |
| `nominatim-cache` | Nominatim cache | Search cache |
| `wiki-data` | Wiki configuration | BookStack config |
| `wiki-storage` | Wiki storage | Wiki content and uploads |

### Backup Considerations

```bash
# 1. Clone aems-lib-fastapi as sibling to volttron-pnnl-aems
# 2. Generate configs:
cd aems-lib-fastapi
cp config.ini.example config.ini   # edit with site details
python orchestrate.py              # runs generate_configs → agents-config.json → docker-compose.yml

# 3. Start:
cd ../volttron-pnnl-aems/aems-app
docker compose --profile fastapi up -d --build

# 4. Verify:
curl http://localhost:5410/health/
```

Pipeline docs: [`aems-lib-fastapi/docs/PIPELINE.md`](../../aems-lib-fastapi/docs/PIPELINE.md)

## Environment Configuration

Two-tier system: edit only `aems-app/.env`. Per-service `docker/.env.*` files are templates that interpolate from it.

| Env File | Service(s) |
|----------|-----------|
| `.env.client` | `client` |
| `.env.server` | `server` |
| `.env.services` | `services` |
| `.env.seeders` | `seeders` |
| `.env.database` | `database` |
| `.env.init` | `init` |
| `.env.certs` | `certs` |
| `.env.redis` | `redis` |
| `.env.nominatim` | `nominatim` |
| `.env.wiki` | `wiki`, `wiki-db` |
| `.env.keycloak` | `keycloak`, `keycloak-db` |
| `.env.grafana` | `grafana`, `grafana-setup` |
| `.env.historian` | `historian` |
| `.env.volttron` | `volttron`, `volttron-setup` |
| `.env.aems-fastapi` | `aems-fastapi-server`, all `aems-*` agents |

**Key variables in `.env`:**

| Variable | Default | Description |
|----------|---------|-------------|
| `COMPOSE_PROJECT_NAME` | `aems` | Container name prefix |
| `COMPOSE_CONTAINER_REGISTRY` | `localhost` | Image registry (`localhost` = local builds) |
| `TAG` | `latest` | Image tag for all built images |
| `COMPOSE_PROFILES` | `proxy,sso,redis,volttron,grafana` | Active profiles |
| `HOSTNAME` | `172.31.32.1` | Domain/IP for routing and certs |
| `CERT_RESOLVER` | (empty) | Set `letsencrypt` for real TLS |
| `DATABASE_PASSWORD` | (placeholder) | Must be changed |
| `AUTH_PROVIDERS` | `keycloak` | Options: `local`, `super`, `bearer`, `keycloak` |

## Volumes

| Volume | Used By | Purpose |
|--------|---------|---------|
| `certs-data` | `certs`, `proxy`, `services`, `grafana` | TLS certificates |
| `client-cache` | `client` | Next.js build cache |
| `file-upload` | `server`, `services` | User uploads |
| `database-data` | `database` | PostgreSQL data |
| `nominatim-data` | `nominatim` | Nominatim PostgreSQL data |
| `nominatim-cache` | `nominatim` | Nominatim import cache |
| `wiki-data` | `wiki`, `wiki-db` | BookStack + MariaDB data |
| `wiki-storage` | `wiki` | BookStack uploads |
| `keycloak-cache` | `keycloak` | Keycloak standalone data |
| `keycloak-data` | `keycloak-db` | Keycloak PostgreSQL data |
| `grafana-setup` | `grafana-setup`, `server` | Generated dashboard configs |
| `grafana-cache` | `grafana` | Grafana persistent data |
| `historian-data` | `historian` | Historian PostgreSQL data |
| `volttron-setup` | `volttron-setup` | Generated VOLTTRON config |
| `volttron-data` | `volttron` | VOLTTRON SQLite databases |
| `volttron-home` | `volttron` | VOLTTRON config store |
| `volttron-manager` | `volttron` | VOLTTRON manager state |
| `aems-volttron-home` | `aems-fastapi-server`, all `aems-*` agents | Shared FastAPI platform state |
| `aems-agent-logs` | All `aems-*` agents | Agent log files |

## Service Dependency Graph

```
  Core services:

      database    grafana-setup
      [healthy]    [completed]
          |        /    |    \
        init      /     |     \
      [completed]/      |      \
       / |  \   /       |       \
  client server services seeders grafana

  server depends on:   init (completed), grafana-setup (completed), database (started)
  services depends on: init (completed), grafana-setup (completed), database (started)
  client depends on:   init (completed), database (started)
  seeders depends on:  init (completed), database (started)
  grafana depends on:  grafana-setup (completed)


  Certs / VOLTTRON chain:

                      certs
                   [completed]
                   /    |    \
               proxy  historian  volttron
                   (volttron)   (volttron)
                                  |
                            volttron-setup
                             [completed]


  FastAPI chain:

              init
               |
          [completed]
               |
      aems-fastapi-server
          [healthy]
         /    |     \      \        \           \
  listener  historian  manager  weather  nf-driver  ilc
                                            |        |
                                         [started]---+
                                            |
                                     ilc depends on nf-driver


  SSO chain:            Wiki chain:

  keycloak-db            wiki-db     init
    [healthy]               \       /
       |                     wiki
    keycloak
```

## Common Operations

```bash
# Start core only (no profiles):
COMPOSE_PROFILES= docker compose up -d

# Start with .env profiles:
docker compose up -d

# Start with specific profiles:
docker compose --profile fastapi --profile redis up -d

# Build and start:
docker compose up -d --build

# Logs (all / specific / last N lines):
docker compose logs -f
docker compose logs -f server
docker compose logs --tail=100 server

# Rebuild (specific / no cache / rebuild+restart):
docker compose build server
docker compose build --no-cache client
docker compose up -d --build server

# Stop (keep volumes / destroy volumes):
docker compose down
docker compose down -v   # DATA LOSS — destroys database, certs, etc.

# Restart / recreate:
docker compose restart server
docker compose up -d --force-recreate server

# Status:
docker compose ps
docker compose ps --format "table {{.Name}}\t{{.Status}}"
```

## Troubleshooting

**init container fails:**
Check `docker compose logs database` and `docker compose logs init`. If volume is corrupted: `docker compose down && docker volume rm aems_database-data && docker compose up -d`.

**Client/server restart loop:**
Check `docker compose logs client` (or `server`). Common causes: init not complete, database connection refused, missing env vars.

**Port already in use:**
`lsof -i :<port>` to find conflict. Change the port in `.env` (e.g. `AEMS_FASTAPI_TEST_PORT=5411`).

**Cannot connect through Traefik:**
Verify `HOSTNAME` matches your actual host, `COMPOSE_PROFILES` includes `proxy`. If hostname changed: `docker compose down && docker volume rm aems_certs-data && docker compose up -d`.

**VOLTTRON BACnet communication fails:**
Runs in `network_mode: host`. Check `VOLTTRON_GATEWAY_ADDRESS`, firewall rules (UDP 47808), and host network access to BACnet devices.

**FastAPI server unhealthy:**
`curl http://localhost:5410/health/` and check `docker compose logs aems-fastapi-server`. Common causes: `aems-lib-fastapi` not cloned as sibling, init not complete, port 5410 conflict.

**FastAPI agents exit immediately:**
Check agent logs (`docker compose logs aems-manager`). Common causes: server not healthy yet, config pipeline not run, missing agent_dir in image.

**Keycloak login redirect fails:**
`HOSTNAME` must match browser URL. `proxy` profile must be active. Check `docker compose logs keycloak`.

**Full reset:**
```bash
docker compose down -v --remove-orphans   # destroys ALL persistent data
docker compose build --no-cache
docker compose up -d
```
