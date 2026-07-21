# FastAPI Docker Deployment — Status & Architecture

## Overview

The FastAPI Docker deployment (`COMPOSE_PROFILES=fastapi,fastapi-agents`) is an alternative to the
legacy VOLTTRON monolith. It replaces VOLTTRON's ZMQ message bus with a FastAPI WebSocket-based
message bus and runs all agents as Python processes within a single container.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Compose Stack                         │
│                                                                 │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐            │
│  │  client    │    │  server    │    │  services  │            │
│  │ (Next.js)  │    │ (NestJS)   │    │ (NestJS    │            │
│  │            │    │ GraphQL    │────│  cron jobs) │            │
│  └─────┬──────┘    └─────┬──────┘    └─────┬──────┘            │
│        │                 │                 │                    │
│        │     ┌───────────┴─────────────────┘                   │
│        │     │ HTTP/JSON-RPC                                   │
│        │     ▼                                                 │
│  ┌─────┴─────────────────────────────────────────────┐         │
│  │              Traefik Proxy (TLS)                   │         │
│  └───────────────────────────────────────────────────┘         │
│                                                                 │
│  ┌───────────────────┐    ┌──────────────────────────┐         │
│  │ aems-fastapi-     │    │ aems-agents              │         │
│  │ server            │◄───│ (single container)       │         │
│  │                   │ WS │                          │         │
│  │ WebSocket message │    │ • listener               │         │
│  │ bus + REST API    │    │ • platform.historian      │         │
│  │ Port 8000 (5410)  │    │ • platform.weather       │         │
│  └───────────────────┘    │ • platform.driver (NF)   │         │
│                           │ • ilc.platform            │         │
│                           │ • manager.rtu01-05        │         │
│                           └────────────┬─────────────┘         │
│                                        │ HTTP                  │
│  ┌──────────┐  ┌──────────┐           │                       │
│  │ database │  │historian │           │                       │
│  │ (app DB) │  │ (ts DB)  │           │                       │
│  └──────────┘  └──────────┘           │                       │
└────────────────────────────────────────┼───────────────────────┘
                                         │
                              ┌──────────▼──────────┐
                              │  Normal Framework   │
                              │  Gateway (external) │
                              │  host:8081          │
                              │                     │
                              │  BACnet/IP ↔ REST   │
                              └──────────┬──────────┘
                                         │
                                    BACnet/IP
                                         │
                              ┌──────────▼──────────┐
                              │   RTU Thermostats   │
                              │   (Schneider)       │
                              └─────────────────────┘
```

## Container Inventory

### Core (always start)
| Container | Purpose |
|-----------|---------|
| `database` | PostgreSQL — app data (users, units, schedules) |
| `init` | Prisma DB migrations (runs once) |
| `client` | Next.js frontend |
| `server` | NestJS GraphQL API |
| `services` | NestJS background cron (ConfigService pushes setpoints) |
| `seeders` | DB seed data (runs once) |
| `certs` | TLS certificate generation (runs once) |

### Profile: `fastapi`
| Container | Purpose |
|-----------|---------|
| `fastapi-setup` | Config generation init container (runs once) |
| `aems-fastapi-server` | WebSocket message bus (port 8000, exposed as 5410) |
| `historian` | PostgreSQL — time-series data from agents |

### Profile: `fastapi-agents`
| Container | Purpose |
|-----------|---------|
| `aems-agents` | All agents in a single container via `start-agents.sh` |

### Optional Profiles
| Profile | Containers |
|---------|-----------|
| `proxy` | Traefik reverse proxy |
| `sso` | Keycloak + keycloak-db |
| `redis` | Redis (sessions, GraphQL subscriptions) |
| `grafana` | Grafana + grafana-db + grafana-setup |
| `sim-rtu` | Simulated BACnet RTU devices |

## Device Communication

The FastAPI deployment does NOT use direct BACnet. Instead, it uses the **Normal Framework (NF)
Driver** — an HTTP/REST-based BACnet gateway.

**Flow:** Manager agent → RPC → NF Driver → HTTP POST → NF Gateway → BACnet/IP → Device

- The NF gateway runs **outside** the Docker stack on the host machine
- Agents reach it via `host.docker.internal:8081` (configurable via `VOLTTRON_NF_GATEWAY_URL`)
- No BACnet proxy, UDP ports, or network interface config needed inside Docker

## Configuration Generation

The `fastapi-setup` init container runs `setup-fastapi.sh` which:

1. Runs `generate_configs.py` to create manager, driver, historian, and weather configs
2. Generates `site.json` with campus/building/systems info
3. Copies ILC templates from `aems-edge/configurations/templates/`
4. Generates NF driver config with device list and gateway URL
5. Generates ILC config and config store entries (when `VOLTTRON_ILC=true`)

Output is written to `./fastapi/setup/` and mounted read-only into agent containers at
`/app/site-config/`.

## Config Push Flow (Web UI → Devices)

1. User edits unit settings in the AEMS web UI
2. NestJS `ConfigService` (runs every 10s in `services` container) picks up units with pending changes
3. Sends JSON-RPC call to `http://aems-fastapi-server:8000/gs` targeting `manager.rtuNN`
4. FastAPI message bus routes the RPC to the manager agent via WebSocket
5. Manager agent calls `platform.driver.set_point` via RPC
6. NF driver sends HTTP POST to NF gateway at `host.docker.internal:8081`
7. NF gateway writes to BACnet device

**If devices are unreachable:** Manager returns `false`, NestJS marks the push as failed,
UI shows red error icon. This is expected when the NF gateway has no connected BACnet devices.

## Key Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `COMPOSE_PROFILES` | `proxy,sso,redis,fastapi,fastapi-agents,grafana` | Which services to start |
| `VOLTTRON_NF_GATEWAY_URL` | `http://host.docker.internal:8081` | NF gateway URL |
| `VOLTTRON_NUM_CONFIGS` | `5` | Number of RTU configs to generate |
| `VOLTTRON_CAMPUS` | `PNNL` | Campus identifier |
| `VOLTTRON_BUILDING` | `ROB` | Building identifier |
| `VOLTTRON_PREFIX` | `rtu` | RTU name prefix |
| `VOLTTRON_ILC` | `true` | Enable ILC agent |
| `HISTORIAN_DB_HOST` | `historian` | Historian DB hostname (Docker internal) |
| `HISTORIAN_DB_INTERNAL_PORT` | `5432` | Historian DB port (Docker internal) |
| `VOLTTRON_API_URL` | `http://aems-fastapi-server:8000/gs` | FastAPI JSON-RPC endpoint |
| `VOLTTRON_AUTH_URL` | `http://aems-fastapi-server:8000/authenticate` | FastAPI auth endpoint |

## Current Status

**Working:**
- All 10 agents start and connect to the message bus in a single container
- FastAPI message bus routes RPC calls between agents
- NestJS server communicates with agents via JSON-RPC
- Config push reaches manager agents end-to-end
- SQL Historian writes to historian database
- Weather agent polls Weather.gov
- ILC config generated from templates with config store entries
- Grafana dashboards configured for all 5 RTUs

**Requires external setup:**
- Normal Framework gateway must be running on the host at `VOLTTRON_NF_GATEWAY_URL`
- BACnet devices must be reachable from the NF gateway for setpoint writes to succeed
- `.env.secrets` must be created and `secrets.sh` run before first deployment
