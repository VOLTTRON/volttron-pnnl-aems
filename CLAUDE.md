# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AEMS (Autonomous Energy Management Software) provides intelligent HVAC control for small/medium commercial buildings. The repository contains three main components that work together:

- **aems-app**: Full-stack TypeScript web application (Next.js frontend + NestJS backend + PostgreSQL/Prisma)
- **aems-edge**: Python-based edge stack with VOLTTRON agents for BACnet device control (Poetry-managed)
- **aems-lib-fastapi**: Python FastAPI message bus server that replaces VOLTTRON's core message bus (pip/setuptools)

## Architecture

### Deployment Modes (mutually exclusive)

- **FastAPI mode** (`COMPOSE_PROFILES=fastapi,fastapi-agents`): Uses `aems-lib-fastapi` as the message bus. Individual agents run as separate Docker containers.
- **Legacy VOLTTRON mode** (`COMPOSE_PROFILES=volttron`): Monolithic VOLTTRON container. Do NOT combine with `fastapi` profile (port 5410 conflict).

### Component Relationships

```
aems-app (web UI + API)
  ├── client/ (Next.js 14+ frontend)
  ├── server/ (NestJS backend, GraphQL via Apollo/Pothos)
  ├── prisma/ (DB schema, migrations)
  └── common/ (shared TypeScript types/utils)

aems-lib-fastapi (message bus)
  └── src/aems/
      ├── server/ (FastAPI WebSocket message bus)
      ├── client/ (Agent framework, base Agent class)
      └── compat/ (VOLTTRON import shims for legacy agents)

aems-edge (edge agents)
  └── Manager/ (AEMS Manager agent - Poetry project)
```

### Communication Flow

Web UI → NestJS GraphQL API → PostgreSQL ← Historian Agent ← FastAPI Message Bus ← Device Agents (BACnet/Modbus)

## Common Development Commands

### aems-app (TypeScript monorepo)

```bash
cd aems-app

# Build all modules (order: prisma → common → server → client)
./build.sh

# Run tests for all modules
./test.sh

# Per-module commands (from client/, server/, common/, or prisma/ dirs)
yarn install
yarn build
yarn start        # dev mode
yarn start:prod   # production mode
yarn test
yarn lint
yarn check        # TypeScript type checking

# Database migrations (from prisma/ directory)
yarn migrate:deploy   # apply pending migrations
yarn migrate:create   # create new migration after schema change
yarn migrate:reset    # reset DB (destroys data)

# Docker deployment
source ./secrets.sh   # load secrets into env
docker compose build
docker compose up -d
```

### aems-lib-fastapi (Python FastAPI)

```bash
cd aems-lib-fastapi

# Setup
./setup-dev.sh            # creates .venv, installs deps, pre-commit
source .venv/bin/activate
pip install -e ".[dev]"

# Code quality
make lint        # ruff check (no fix)
make fix         # ruff check --fix
make format      # ruff format
make lint-fix    # fix + format (recommended before commit)
make check       # lint + format-check + test

# Testing
make test                              # all tests
.venv/bin/pytest tests/test_foo.py     # single file
.venv/bin/pytest -k "test_config"      # pattern match

# Run server
aems-server --host 127.0.0.1 --port 8000

# Docker
make docker-build
make compose-up
make compose-down
```

### aems-edge/Manager (Python, Poetry)

```bash
cd aems-edge/Manager

poetry install
poetry run pytest
poetry run start-server --help
```

## Key Configuration

- **aems-app/.env**: Master config for Docker Compose deployment (profiles, secrets, hostnames)
- **aems-lib-fastapi/ruff.toml** + `pyproject.toml`: Ruff linter/formatter config (120 char line length, NumPy docstring style)
- **aems-app/docker/docker-compose.yml**: Actual service definitions (aems-app/docker-compose.yml just includes it)

### Docker Compose Profiles

| Profile | Purpose |
|---------|---------|
| `proxy` | Traefik reverse proxy + TLS |
| `sso` | Keycloak authentication |
| `redis` | Redis cache/sessions |
| `fastapi` | FastAPI message bus + historian DB |
| `fastapi-agents` | Agent containers (listener, historian, manager, weather, etc.) |
| `grafana` | Monitoring dashboards |
| `sim-rtu` | Simulated RTU devices (dev/testing) |
| `volttron` | Legacy VOLTTRON monolith |

## Important Patterns

### VOLTTRON Compatibility Layer (aems-lib-fastapi)

Legacy VOLTTRON agents run unmodified via `src/aems/compat/`:
- Import hooks redirect `volttron.*` imports to AEMS shims
- VIP address format: `ws://host:port` (not `http://`)
- RPC timeout is 30 seconds (BACnet operations are slow)
- Use `.venv/bin/python start-legacy.py` to run legacy agents

### TypeScript Monorepo Build Order

Prisma → Common → Server → Client (each depends on previous). Docker uses multi-stage builds replicating this chain per service.

### Database

- App DB: PostgreSQL 16+ with PostGIS (Prisma ORM)
- Historian DB: Separate PostgreSQL instance for time-series data from VOLTTRON agents
- Supports logical replication to remote sites via Traefik TCP proxy
