# Docker Configuration

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
   
   # Set secrets as environment variables
   # Windows
   ..\secrets.ps1
   
   # Linux/Mac  
   source ../secrets.sh
   ```

2. **Start core services**
   ```bash
   # From project root
   docker compose up -d
   ```

3. **Access the application**
   - Main application: https://localhost (or your configured HOSTNAME)
   - GraphQL API: https://localhost/graphql

### Enable Optional Services

```bash
# Enable specific profiles in .env file
COMPOSE_PROFILES=proxy,redis,sso,map,nom,wiki

# Start with all optional services
docker compose --profile proxy --profile redis --profile sso up -d
```

---

## 📁 Directory Structure

```
docker/
├── docker-compose.yml          # Main compose configuration
├── .env.*                      # Environment variable files
├── certs/                      # TLS certificate generation
│   ├── Dockerfile
│   └── mkcert.sh
├── keycloak/                   # Keycloak SSO configuration
│   └── default-realm.json
├── map/                        # Map tiles and configuration
│   ├── config.json
│   ├── icons/                  # Map marker icons
│   ├── mbtiles/               # Map tile storage
│   ├── pmtiles/               # PMTiles storage
│   └── styles/                # Map styles
├── proxy/                      # Traefik proxy configuration
│   ├── certs-traefik.yml
│   └── README.md
├── seed/                       # Database seed data
│   ├── *.json                 # Seed files
│   └── README.md
└── wiki/                       # Wiki initialization
    └── init-wiki.sh
```

---

## ⚙️ Configuration

### Environment Files

The Docker configuration uses multiple environment files for different services:

| File | Purpose | Services |
|------|---------|----------|
| `.env.client` | Client application settings | client |
| `.env.server` | Server application settings | server |
| `.env.services` | Background services settings | services |
| `.env.database` | PostgreSQL configuration | database |
| `.env.redis` | Redis configuration | redis |
| `.env.keycloak` | Keycloak SSO settings | keycloak, keycloak-db |
| `.env.nominatim` | Geocoding service settings | nominatim |
| `.env.wiki` | Wiki service settings | wiki, wiki-db |
| `.env.certs` | Certificate generation settings | certs |
| `.env.init` | Database initialization settings | init |

### Key Configuration Variables

#### Core Application
```bash
# Main environment file (../.env)
COMPOSE_PROJECT_NAME=skeleton
TAG=latest
HOSTNAME=localhost                    # Change for production
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
# Production server container (no background services)
INSTANCE_TYPE=""

# Development environment
INSTANCE_TYPE=*

# Database seeding container (runs once then exits)
INSTANCE_TYPE=^seed

# Background services only
INSTANCE_TYPE=seed,log

# Log management only
INSTANCE_TYPE=log
```

**Service Types:**
- `seed` - Database seeding and data import service  
- `log` - Log management and pruning service

**Docker Compose Integration:**

```yaml
# docker-compose.yml example
services:
  server:
    environment:
      - INSTANCE_TYPE=""  # No background services
  
  services:
    environment:
      - INSTANCE_TYPE=seed,log
  
  seed-init:
    environment:
      - INSTANCE_TYPE=^seed  # Runs seed then exits
```

#### Database Configuration
```bash
DATABASE_NAME=skeleton
DATABASE_USERNAME=skeleton
DATABASE_PASSWORD=your_secure_password
```

#### Security Settings
```bash
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
KEYCLOAK_CLIENT_SECRET=your_keycloak_secret
```

#### Optional Service Ports (Development/Testing)
```bash
# Uncomment to expose services for testing
# CLIENT_TEST_PORT=8443
# SERVER_TEST_PORT=9443
# DATABASE_TEST_PORT=6543
# REDIS_TEST_PORT=6379
# KEYCLOAK_TEST_PORT=8880
```

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
HOSTNAME=yourdomain.com
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
# Backup database
docker exec skeleton-database pg_dump -U skeleton skeleton > backup.sql

# Backup volumes
docker run --rm -v skeleton_database-data:/data -v $(pwd):/backup alpine tar czf /backup/database-backup.tar.gz /data

# Restore database
docker exec -i skeleton-database psql -U skeleton skeleton < backup.sql
```

---

## 🚀 Service Profiles

### Core Services (Always Running)

- **common**: Shared libraries and utilities
- **init**: Database migrations and initialization
- **database**: PostgreSQL with PostGIS
- **client**: Next.js frontend application
- **server**: NestJS API server
- **services**: Background job processing

### Optional Profiles

#### Proxy Profile (`proxy`)
```bash
COMPOSE_PROFILES=proxy
```
- **proxy**: Traefik reverse proxy
- **certs**: TLS certificate generation
- Provides HTTPS termination and routing

#### Redis Profile (`redis`)
```bash
COMPOSE_PROFILES=redis
```
- **redis**: Redis cache server
- Used for sessions and GraphQL subscriptions

#### SSO Profile (`sso`)
```bash
COMPOSE_PROFILES=sso
```
- **keycloak**: Authentication server
- **keycloak-db**: Keycloak database
- Provides enterprise SSO capabilities

#### Map Profile (`map`)
```bash
COMPOSE_PROFILES=map
```
- **maptiles**: OpenStreetMap tile server
- Serves map tiles and styles

#### Nominatim Profile (`nom`)
```bash
COMPOSE_PROFILES=nom
```
- **nominatim**: Geocoding service
- Address lookup and reverse geocoding

#### Wiki Profile (`wiki`)
```bash
COMPOSE_PROFILES=wiki
```
- **wiki**: BookStack documentation wiki
- **wiki-db**: Wiki database (MariaDB)

---

## 🛠️ Development & Debugging

### Development Mode

```bash
# Enable test ports for direct access
# Edit .env file:
CLIENT_TEST_PORT=8443
SERVER_TEST_PORT=9443
DATABASE_TEST_PORT=6543

# Restart services
docker compose up -d
```

### Service Health Checks

All services include health checks:
```bash
# Check service health
docker compose ps

# View service logs
docker compose logs client
docker compose logs server
docker compose logs database

# Follow logs in real-time
docker compose logs -f server
```

### Database Access

```bash
# Connect to database
docker exec -it skeleton-database psql -U skeleton skeleton

# Run migrations manually
docker compose run --rm init yarn migrate:deploy

# Reset database (WARNING: Deletes all data)
docker compose run --rm init yarn migrate:reset
```

### Debugging Services

```bash
# SSH into containers
docker exec -it skeleton-client /bin/sh
docker exec -it skeleton-server /bin/sh

# View container resource usage
docker stats

# Inspect service configuration
docker compose config
```

---

## 🗺️ Map Services Configuration

### OpenStreetMap Tiles

The map service provides OpenStreetMap tiles using TileServer GL:

#### Configuration
- **Config**: `map/config.json`
- **Styles**: `map/styles/` (multiple style options)
- **Icons**: `map/icons/` (SVG map markers)
- **Data**: `map/mbtiles/` (tile data) or `map/pmtiles/` (PMTiles format)

#### Adding Map Data
```bash
# Download pre-processed tiles (recommended)
# Place .mbtiles files in docker/map/mbtiles/

# Or generate from OSM data
docker run --rm -it -v $(pwd)/docker/map:/data \
  ghcr.io/systemed/tilemaker:master \
  /data/region.osm.pbf --output /data/mbtiles/region.mbtiles
```

### Nominatim Geocoding

Nominatim provides address lookup and geocoding services:

#### Configuration
```bash
# Configure data source in .env
PBF_URL=https://download.geofabrik.de/north-america/us/washington-latest.osm.pbf
REPLICATION_URL=https://download.geofabrik.de/north-america/us/washington-updates/
```

#### Data Sources
- **Geofabrik**: https://download.geofabrik.de/
- **Planet OSM**: https://planet.openstreetmap.org/

---

## 🔐 Authentication Configuration

### Keycloak SSO Setup

1. **Access Keycloak Admin**
   ```
   URL: https://localhost/auth/sso/admin/
   Username: admin (from KEYCLOAK_ADMIN)
   Password: (from KEYCLOAK_ADMIN_PASSWORD)
   ```

2. **Configure Realm**
   - Default realm is pre-configured
   - Client ID: `app`
   - Update client secret in `.env` file

3. **User Management**
   - Users can self-register (if enabled)
   - Administrators assign roles through Keycloak UI
   - Roles: `admin`, `user`, `viewer`

### Local Authentication

Default test users are seeded from `seed/20211103151730-system-user.json`:
```json
{
  "email": "admin@example.com",
  "password": "ChAnGe_ThIs_PaSsWoRd_0x2E",
  "role": "admin"
}
```

---

## 📊 Monitoring & Maintenance

### Health Monitoring

```bash
# Check all service health
docker compose ps

# View resource usage
docker stats

# Check logs for errors
docker compose logs --tail=100 server | grep ERROR
```

### Maintenance Tasks

#### Update Images
```bash
# Pull latest images
docker compose pull

# Rebuild and restart
docker compose up -d --build
```

#### Clean Up
```bash
# Remove unused images
docker image prune

# Remove unused volumes (WARNING: Data loss)
docker volume prune

# Complete cleanup (WARNING: Removes all data)
docker compose down -v
docker system prune -a
```

#### Database Maintenance
```bash
# Run database migrations
docker compose run --rm init yarn migrate:deploy

# Backup database
docker exec skeleton-database pg_dump -U skeleton skeleton > backup.sql

# Vacuum database
docker exec skeleton-database psql -U skeleton -d skeleton -c "VACUUM ANALYZE;"
```

---

## 🚨 Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check port usage
netstat -tulpn | grep :80
netstat -tulpn | grep :443

# Change ports in .env file
TRAEFIK_TEST_PORT=8080
CLIENT_TEST_PORT=8443
```

#### Certificate Issues
```bash
# Regenerate certificates
docker compose down
docker volume rm skeleton_certs-data
docker compose up -d certs
```

#### Database Connection Issues
```bash
# Check database health
docker compose ps database

# View database logs
docker compose logs database

# Test connection
docker exec skeleton-database pg_isready -U skeleton
```

#### Memory Issues
```bash
# Increase Docker memory limit (Docker Desktop)
# Settings > Resources > Memory > 4GB+

# Check container memory usage
docker stats --no-stream
```

### Service-Specific Issues

#### Keycloak Startup Issues
```bash
# Keycloak requires database to be ready
docker compose logs keycloak-db
docker compose logs keycloak

# Restart Keycloak after database is ready
docker compose restart keycloak
```

#### Map Tiles Not Loading
```bash
# Check map service logs
docker compose logs maptiles

# Verify tile data exists
ls -la docker/map/mbtiles/
ls -la docker/map/pmtiles/
```

#### Nominatim Import Issues
```bash
# Check import progress
docker compose logs nominatim

# Large imports may take hours
# Monitor disk space during import
df -h
```

---

## 🔧 Advanced Configuration

### Custom TLS Certificates

To use custom certificates instead of auto-generated ones:

1. Place certificates in `proxy/` directory
2. Update `proxy/certs-traefik.yml` with certificate paths
3. Restart proxy service

### External Database

To use an external PostgreSQL database:

1. Update database connection in `.env.database`
2. Remove `database` service from compose file
3. Ensure external database has PostGIS extension

### Load Balancing

For production deployments with multiple replicas:

```yaml
# Uncomment in docker-compose.yml
deploy:
  mode: replicated
  endpoint_mode: vip
  replicas: 2
```

### Custom Environment Variables

Add custom environment variables to service-specific `.env.*` files:

```bash
# .env.server
CUSTOM_API_KEY=your_api_key
CUSTOM_FEATURE_FLAG=true

# .env.client  
NEXT_PUBLIC_CUSTOM_CONFIG=production
```

---

## 📚 Additional Resources

### Documentation
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Related Files
- [Main README](../README.md) - Project overview and setup
- [Client README](../client/README.md) - Frontend application
- [Server README](../server/README.md) - Backend API
- [Prisma README](../prisma/README.md) - Database schema

### Support
- **Technical Issues**: [amelia.bleeker@pnnl.gov](mailto:amelia.bleeker@pnnl.gov)
- **Repository**: [https://tanuki.pnnl.gov/amelia.bleeker/skeleton](https://tanuki.pnnl.gov/amelia.bleeker/skeleton)

---

<p align="center">
  <strong>Docker Configuration for Skeleton App</strong><br>
  <em>Developed by Pacific Northwest National Laboratory</em>
</p>
