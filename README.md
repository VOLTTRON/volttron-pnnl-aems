# Volttron PNNL AEMS

This repository contains two projects: `aems-edge` and `aems-app`.

## Autonomous Energy Management Software (AEMS)

The AEMS adds intelligent and flexible control for small- and medium-sized commercial buildings' HVAC systems. It leverages the VOLTTRON™ platform to deliver effective control and energy management solutions for rooftop units (RTUs) and heat pumps (HPs).

The AEMS contains a web-based user interface (`aems-app`) that allows building operators or occupants to easily enable energy efficiency and comfort for their building. The second component is `aems-edge`, which integrates with the VOLTTRON project and utilizes the BACnet driver for device integration, the VOLTTRON Historian for data storage, and the VOLTTRON integrated Weather.gov for forecast information.

## Overview

The AEMS system is designed to bring advanced energy efficiency and grid-responsive control to SMBs. It comprises two main components:

1. **Web-Based User Interface**: An intuitive interface that allows building managers to configure, monitor, and optimize energy usage. The web UI facilitates user interactions and data visualization for easy energy management.

2. **Edge Stack Integrated with VOLTTRON**: This component operates at the building edge, using VOLTTRON for real-time control and integration with HVAC systems, specifically RTUs and HPs. It executes optimization algorithms and communicates with the grid for demand response and energy savings.

## Key Features

1. **Energy Efficiency**: Advanced algorithms to minimize the energy consumption of RTUs and HPs while maintaining indoor comfort. Includes automated diagnostics and scheduling for optimal performance.

2. **Demand Response**: Integration with utility signals to provide grid services, allowing buildings to adjust energy usage based on grid conditions and financial incentives.

3. **User-Friendly Web Interface**: Simplified setup and management, making energy control accessible for facilities with limited technical expertise.

4. **Scalable Control**: Capable of scaling from single-building deployments to multiple locations, adapting easily to varying HVAC configurations.

## Architecture

The architecture of AEMS integrates the following elements:

- **Web Interface**: Built using modern web technologies, it provides real-time feedback and energy management capabilities.
- **Edge Control Stack**: Deployed on-site, the stack interfaces with HVAC equipment using VOLTTRON agents to execute energy optimization and respond to external commands.

## Usage

- Use the web UI to configure RTUs and HPs setpoints, set schedules, enable setbacks and lockouts.
- Deploy edge agents to communicate with HVAC systems and execute control strategies.
- Enable grid-interaction features for demand response and participate in utility programs.

## Deployment Guide

This section is written for the administrator who is installing, configuring, and maintaining an AEMS deployment. It covers the deployment lifecycle end-to-end and links into the in-depth references in [aems-app/README.md](./aems-app/README.md) rather than duplicating them.

### Topology

The full AEMS stack — web UI, API, database, historian, VOLTTRON edge agents, Keycloak SSO, and Grafana — is deployed as a **single Docker Compose project** rooted at [aems-app/](./aems-app/). The contents of [aems-edge/](./aems-edge/) (the Manager, Normal Framework driver, and ILC agents) are built into images and run as services inside that same compose project; they are not installed separately. There is no per-building install step under normal operation.

All commands below are run from the `aems-app/` directory.

### Prerequisites

**Host:**

- Linux, macOS, or Windows with Docker Engine 24+ and Docker Compose v2 (Docker Desktop is fine)
- 4+ vCPU and 8+ GB RAM as a baseline; size disk against your historian retention (telemetry growth dominates)
- A real DNS hostname for production. **`localhost` does not work** — session cookies and OAuth redirects depend on a stable, resolvable name
- Outbound internet for image pulls and (if used) Let's Encrypt ACME
- For BACnet driver mode: UDP **47808** reachability from the host to the building's RTUs/HPs (or HTTP access to a Normal Framework gateway)

**Software you install yourself:**

- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) or Docker Engine + Compose v2

### Pre-Deployment Planning

Decide these before you start; they are awkward to change later.

1. **Hostname / TLS** — Pick the public hostname and certificate strategy:
   - **Let's Encrypt** (recommended for public deployments) — requires a valid DNS name and ports 80/443 reachable from the internet
   - **Third-party CA** — drop certs in and edit [aems-app/docker/proxy/certs-traefik.yml](./aems-app/docker/proxy/certs-traefik.yml)
   - **Self-signed** (the default when `CERT_RESOLVER` is empty) — generated automatically on first boot; the CA must be installed on operator browsers
2. **Site inventory** — campus name, building name, per-device IP and BACnet device ID, thermostat type (`schneider` / `openstat`), meter info — drives the VOLTTRON agent configs
3. **Backup destinations** — local disk is the default; production should add off-host S3 destination and store the active backup encryption key offline
4. **Off-site replication (optional)** — if you want a read replica or a DR copy of the historian at another site, plan the subscriber host and firewall rules now

Authentication is **Keycloak SSO with Auth.js** out of the box (`AUTH_PROVIDERS=keycloak` in [aems-app/.env](./aems-app/.env)) — no decision required up front, but you will need to set the Keycloak client secret during [Initial Configuration](#initial-configuration) below.

### What runs by default

The default `COMPOSE_PROFILES` value in [aems-app/.env](./aems-app/.env) brings up the full operational stack — `proxy`, `sso`, `redis`, `volttron`, `historian`, `grafana` — plus the always-on core (init, certs, database, client, server, services, seeders, backup sidecar). This is the configuration most deployments should use as-is.

The compose project also defines a few rarely-used profiles that are **not** in the default set: `map` (OpenStreetMap tiles), `nom` (Nominatim geocoder), `wiki` (BookStack), and `fastapi` / `fastapi-agents` (alternative FastAPI-based edge runtime). You only need these for specific scenarios; see [aems-app/docker/docker-compose.yml](./aems-app/docker/docker-compose.yml) for the authoritative service list.

### Install

```bash
git clone https://github.com/VOLTTRON/volttron-pnnl-aems.git
cd volttron-pnnl-aems/aems-app

# 1. Non-secret configuration
#    Edit .env (already present) — at minimum set HOSTNAME, ADMIN_EMAIL,
#    CERT_RESOLVER, and COMPOSE_PROFILES. See "Configuration" below.

# 2. Secrets
cp .env.secrets.example .env.secrets
#    Edit .env.secrets — set every password/secret. Never commit this file.

# 3. Generate Docker secret files
./secrets.sh           # Linux/macOS
# .\secrets.ps1        # Windows

# 4. Bring the stack up (build images, generate certs, run DB migrations)
./start-services.sh    # wraps: docker compose build && docker compose up -d

# 5. Confirm everything is healthy (curl will return the http status code with 200 meaning okay)
docker compose ps
curl -k -o /dev/null -s --max-time 10 -w "%{http_code}" https://<HOSTNAME>
```

The web UI is now reachable at `https://<HOSTNAME>`. **The local users in [aems-app/docker/seed/](./aems-app/docker/seed/) are not usable from the UI** — Keycloak is the default auth provider, so logins go through SSO. The first administrator account must be created in Keycloak and then granted an application role with [aems-app/update-user-role.sh](./aems-app/update-user-role.sh); see [Initial Configuration](#initial-configuration) below.

> **Always run `docker compose` from `aems-app/`, not from `aems-app/docker/`.** The root file [aems-app/docker-compose.yml](./aems-app/docker-compose.yml) is a shim that includes [aems-app/docker/docker-compose.yml](./aems-app/docker/docker-compose.yml), and running from `aems-app/` is what makes Compose pick up `aems-app/.env`. Invoking with `-f docker/docker-compose.yml` loads the wrong env.

### Configuration

The vast majority of admin-facing configuration lives in two files at the root of `aems-app/`:

- **[aems-app/.env](./aems-app/.env)** — non-secret defaults (hostname, ports, profiles, feature toggles). Auto-loaded by Compose.
- **`aems-app/.env.secrets`** — gitignored, contains every password/secret. Processed by `secrets.sh` / `secrets.ps1` into per-secret files under [aems-app/docker/secrets/](./aems-app/docker/secrets/) plus a generated `.env.secrets.docker`. Template: [aems-app/.env.secrets.example](./aems-app/.env.secrets.example).

Beyond those, several files contain configuration that an admin may need to touch. None of these have to be edited for a default deployment, but you should know they exist:

| File / directory | What it controls |
|------------------|------------------|
| [aems-app/docker/.env.server](./aems-app/docker/), `.env.client`, `.env.services`, `.env.seeders`, `.env.init`, `.env.certs`, `.env.database`, `.env.redis`, `.env.historian`, `.env.keycloak`, `.env.grafana`, `.env.volttron`, `.env.aems-fastapi`, `.env.nominatim`, `.env.wiki` | Per-service environment overrides. Most settings flow through from the root `.env` via interpolation; edit these only when you need a value that differs from the root default. |
| [aems-app/server/config/site.json](./aems-app/server/config/) | Default site definition shipped with the server image (campus / building defaults that the seeders use). |
| [aems-app/server/config/historian-topic-map.default.json](./aems-app/server/config/) | Default VOLTTRON-topic → historian-column mapping. The deployed copy is at [aems-app/docker/historian/historian-topic-map.json](./aems-app/docker/historian/) and is mounted into the server; edit that file to customize topic naming and dashboard bin aggregation for your site. |
| [aems-app/docker/seed/](./aems-app/docker/seed/) | First-boot DB seed data: default admin user (`20211103151730-system-user.json`), default backup policy (`20260427080000-backup-policy.json`), geographies. |
| [aems-app/docker/historian/pg_hba.conf](./aems-app/docker/historian/), `postgresql.conf`, `setup-replication.sh`, `setup-subscriber.sh` | Historian DB host-based auth, tuning, and replication setup. Edit `pg_hba.conf` to restrict replication subscribers by IP. |
| [aems-app/docker/keycloak/default-realm.json](./aems-app/docker/keycloak/) | Realm imported on first Keycloak boot. |
| [aems-app/docker/proxy/](./aems-app/docker/proxy/) (`certs-traefik.yml`, `dynamic.yml`, `historian-tcp.yml`, `volttron-transport.yml`) | Traefik dynamic config — third-party cert paths, the historian-replication TCP route, and the VOLTTRON transport route. |
| [aems-app/docker/grafana/dashboard-site.json](./aems-app/docker/grafana/), `dashboard-unit.json` | Grafana dashboards provisioned on first boot of the `grafana` profile. |
| [aems-app/docker/volttron/setup/configs/](./aems-app/docker/volttron/setup/) (`platform_config.yml`, `bacnet.config`, `driver.config`, `historian.config`, `weather.config`, etc.) and [templates/](./aems-app/docker/volttron/setup/templates/) | VOLTTRON agent and platform configuration mounted into the `volttron` container. **Edit these to define your devices, BACnet driver settings, weather station, and emailer.** |

> **There may be additional config files I have not enumerated here.** When in doubt, search for a setting under [aems-app/docker/](./aems-app/docker/) and [aems-app/server/config/](./aems-app/server/config/), and check the per-service env files. Every host bind-mount in [aems-app/docker/docker-compose.yml](./aems-app/docker/docker-compose.yml) points at a file or directory that the container treats as configuration.

### Initial Configuration

After the stack is healthy:

1. **Harden Keycloak for production** — confirm `KEYCLOAK_CLIENT_SECRET` and `KEYCLOAK_GRAFANA_CLIENT_SECRET` in `.env.secrets` are strong, unique values; the Keycloak init container pushes them into the realm automatically on first boot, so no UI copy step is required. Then sign into the Keycloak admin console at `https://<HOSTNAME>/auth/sso/admin/` with `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD` from `.env.secrets`, enable MFA on the realm, and rotate the admin password. Full Keycloak reference: [aems-app/README.md → Setup Keycloak](./aems-app/README.md#setup-keycloak).
2. **Create the first admin user** — open the web UI at `https://<HOSTNAME>`. The top-right user menu shows **Guest**; open it and choose **Login**, which redirects to Keycloak. Use the registration flow to create a new account (this provisions the user in both Keycloak and the application database in a single step). After the new user lands back in the UI, grant them the admin role from a host shell:
   ```bash
   ./update-user-role.sh admin@example.com admin
   ```
   The role takes effect on the next page load.
3. **Customize VOLTTRON device configs** if running the `volttron` profile — edit files under [aems-app/docker/volttron/setup/configs/](./aems-app/docker/volttron/setup/) and restart the `volttron` service (`docker compose restart volttron`)
4. **Customize historian topic mappings** if site naming differs from the defaults — edit [aems-app/docker/historian/historian-topic-map.json](./aems-app/docker/historian/) and restart the `server` and `historian` services
5. **Configure backups** in the `/backups` admin UI: set the cron schedule and retention, add at least one off-host destination, and **download the age private key for offline safekeeping** — you cannot decrypt archives without it

### Managing the Stack

Day-to-day operations are driven by a set of helper scripts at the root of `aems-app/`. All of them must be invoked from the `aems-app/` directory so that `docker compose` resolves the right project context. Windows admins use the `.ps1` equivalents (`start-services.ps1`, `reset-service.ps1`, `secrets.ps1`, `update-user-role.ps1`, `backup-restore.ps1`, `build.ps1`, `test.ps1`).

| Script | Purpose |
|--------|---------|
| [start-services.sh](./aems-app/start-services.sh) | Build images and bring the stack up in detached mode (`docker compose build && docker compose up -d`). Use this after pulling code, editing `.env`, or re-running `secrets.sh`. |
| [reset-service.sh](./aems-app/reset-service.sh) | **Destructive.** Stops the stack, deletes one or more services' persistent volumes, then brings everything back up. Run with no arguments to list eligible services. Common targets: `certs` (after a hostname change), `keycloak-db` (to reset the realm), `database` (full app reset — wipes all application data). Add `--dry-run` to preview, `--force` to skip the prompt. |
| [secrets.sh](./aems-app/secrets.sh) | Reads `.env.secrets` and writes per-secret files under [aems-app/docker/secrets/](./aems-app/docker/secrets/) plus a generated `.env.secrets.docker`. Re-run any time `.env.secrets` changes, then `./start-services.sh` to roll the affected containers. |
| [update-user-role.sh](./aems-app/update-user-role.sh) | Sets or clears an application role on a user looked up by email. Usage: `./update-user-role.sh <email> <role>` (pass `""` to remove the role). The user must have signed into the UI at least once so the row exists in the application database. |
| [update-keycloak-grafana-mapper.sh](./aems-app/update-keycloak-grafana-mapper.sh) | Recovery tool: re-installs the client-roles mapper on the `grafana-oauth` Keycloak client. The mapper is shipped in [aems-app/docker/keycloak/default-realm.json](./aems-app/docker/keycloak/default-realm.json) and applied automatically on first boot, so this script is only needed if someone has removed the mapper manually. Reads admin credentials from `docker/.env.keycloak`. |
| [migrate-historian-data.sh](./aems-app/migrate-historian-data.sh) | One-shot migration of legacy time-series data from `grafana-db` into the `historian` database. Requires both `grafana` and `historian` profiles running. Only relevant when upgrading from an older deployment that stored telemetry in `grafana-db`. |
| [backup-restore.sh](./aems-app/backup-restore.sh) | Break-glass restore from an encrypted backup archive. See [Restoring from a Backup](#restoring-from-a-backup). |
| [backup.sh](./aems-app/backup.sh) | **Internal — do not invoke directly.** Executed by the backup sidecar in response to BackupRun rows. Operators trigger backups through the `/backups` admin UI. |
| [build.sh](./aems-app/build.sh) | Builds the monorepo modules in dependency order (`prisma → common → server → client`). Only needed for source-tree builds; the Docker images run their own builds during `start-services.sh`. |
| [test.sh](./aems-app/test.sh) | Runs lint, type-check, and Jest tests across all modules. Slow; intended for CI / pre-release verification. |

### Routine Maintenance

| Task | How |
|------|-----|
| Confirm last night's backup ran | `/backups` admin UI → Runs tab |
| Health check | `curl https://<HOSTNAME>/api/health` and `docker compose ps` from `aems-app/` |
| View container logs | `docker logs <container>` (e.g. `aems-server`, `aems-historian`, `aems-proxy`, `aems-volttron`) |
| Add or change a user role | `./update-user-role.sh <email> <role>` (user must have logged in once first) |
| Reset a single service | `./reset-service.sh <service>` (e.g. `certs` after a hostname change) |
| Rotate secrets | Edit `.env.secrets`, re-run `./secrets.sh`, then `./start-services.sh` |
| Restart a single service after config edits | `docker compose restart <service>` from `aems-app/` |
| Inspect off-site replication (if configured) | See [aems-app/README.md → Historian Database Replication](./aems-app/README.md#historian-database-replication) |

### Updates

```bash
cd aems-app
git stash
git pull
git stash pop
docker compose pull          # if you deploy from prebuilt images
./start-services.sh          # rebuilds, brings stack up, runs DB migrations via the init container
```

**Always verify a successful backup exists** in the `/backups` Runs tab immediately before applying an update. Migrations are forward-only.

### Restoring from a Backup

Restore is a break-glass CLI operation because the UI may be unavailable when you need it. Briefly:

1. Locate the encrypted archive (local, share, or `s3://`)
2. Locate the matching age private key (rotations create new keys — keep offline copies of every key that was active when an archive was written)
3. Stop user traffic, ensure target service containers are up
4. Dry-run: `./backup-restore.sh --archive <path> --identity <key> --dry-run`
5. Real run: same command without `--dry-run`
6. `docker compose down && docker compose up -d`

The full procedure with all flags is in [aems-app/README.md → Backups](./aems-app/README.md#backups).

### Off-Site Historian Replication (Optional)

If you want a read replica or DR copy of the historian at another site, the historian publisher is configured automatically when the `historian` profile is up; you set up the subscriber host yourself per [aems-app/README.md → Historian Database Replication](./aems-app/README.md#historian-database-replication). This is **not** how building edge agents talk to the historian — those are services in this same compose project — it is purely an off-site / DR feature.

### Hardening Checklist

- [ ] `HOSTNAME` set to a real DNS name (never `localhost` in production)
- [ ] Every value in `.env.secrets` is unique and strong; deployed via `./secrets.sh`
- [ ] `CERT_RESOLVER=letsencrypt` (with a real `ADMIN_EMAIL`) or a third-party cert is in use
- [ ] Keycloak realm has a freshly generated client secret (do **not** ship the default), and MFA is enabled for production accounts
- [ ] If off-site replication is configured, subscribers are restricted by IP in [aems-app/docker/historian/pg_hba.conf](./aems-app/docker/historian/)
- [ ] Backups have an off-host destination configured and the active age key has an offline copy
- [ ] Firewall exposes only `443/tcp` publicly; `HISTORIAN_REPLICATION_PORT` (default `6543`) is allowed only from known subscriber IPs; BACnet `47808/udp` is internal-only
- [ ] Default seeded admin password has been changed

### Common Issues

| Symptom | Where to look first |
|---------|---------------------|
| Web UI not reachable | `docker compose ps`, then `docker logs aems-proxy` |
| Login redirects fail / cookie not set | Hostname or cert SAN mismatch — re-check `HOSTNAME` and run `./reset-service.sh certs` |
| TLS errors after hostname change | Certs were issued for the old name — `./reset-service.sh certs` regenerates them |
| VOLTTRON agents not publishing | `docker logs aems-volttron`; verify configs under [aems-app/docker/volttron/setup/configs/](./aems-app/docker/volttron/setup/) |
| Devices not polling | Driver config + BACnet `47808/udp` reachability — see [docs/SETUP_GUIDE.md](./docs/SETUP_GUIDE.md#troubleshooting) |
| Off-site subscriber not syncing | Replication slot, publication, or TLS — [aems-app/README.md → Troubleshooting](./aems-app/README.md#troubleshooting) under Historian Replication |
| Backup runs fail | `/backups` → Runs tab for the per-component error, then `docker logs aems-backup` |

### Detailed References

- **Full configuration reference (env vars, profiles, secrets, replication, backups, Keycloak):** [aems-app/README.md](./aems-app/README.md)
- **Backup pipeline internals and per-component restore details:** [aems-app/docker/backup/README.md](./aems-app/docker/backup/)
- **VOLTTRON edge agent reference:** [aems-edge/README.rst](./aems-edge/README.rst)
- **FastAPI edge runtime walkthrough (driver modes, device wiring):** [docs/SETUP_GUIDE.md](./docs/SETUP_GUIDE.md)
- **VOLTTRON platform documentation:** [volttron.readthedocs.io](https://volttron.readthedocs.io/en/main/)

## Generating Certificates

### Self-Signed Certificate

To generate a self-signed certificate that can act as a Certificate Authority (CA) for testing purposes, run the following commands:

```bash
cd scripts
chmod +x generate_cert.sh
./generate_cert.sh ca
```

The generated CA certificate and private key will be placed in the `certs` directory.

### Certificate with a Common Name

To generate a certificate with a specified common name, signed by the self-signed CA, use the following command:

```bash
cd scripts
./generate_cert.sh generate <common_name> [--client|--server] [--ip <ip_address>]
```

Replace `<common_name>` with the desired common name for the certificate. The optional `--client` or `--server` parameter determines the type of certificate to generate, defaulting to a client certificate. You can also specify an IP address using `--ip`. This operation will create a new certificate and private key in the `certs` directory.

## Running Automated Tests

To run automated tests for the server, ensure you have `pytest` and `httpx` installed in your environment. You can install them using:

```bash
poetry add --group dev pytest httpx
```

Once set up, execute the tests with the following command:

```bash
# from the aems-edge/Manager direcctory
poetry run pytest
```

This will run all test cases defined in `test_server.py`, verifying both authentication and JSON-RPC functionality.

## Acknowledgements

This project is developed by PNNL with funding from the U.S. Department of Energy Building Technologies Office, aiming to advance energy management solutions for small and medium-sized buildings.
