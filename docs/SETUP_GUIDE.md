# AEMS System Setup Guide

Advanced Energy Management System (AEMS). Three repos work together:

| Repo | Purpose |
|------|---------|
| **volttron-pnnl-aems** (this repo) | AEMS edge agents, device configs, Docker Compose orchestration |
| **aems-lib-fastapi** | FastAPI message bus replacing legacy VOLTTRON platform |
| **sim-rtu** | Simulated RTU devices for development (optional) |

---

## Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| Python | 3.10+ | `python3 --version` |
| Docker + Compose | 24+ / v2 | `docker compose version` |
| Git | any | `git --version` |
| Go | 1.24+ (sim-rtu only) | `go version` |

## Repository Layout

```
repos/
  volttron-pnnl-aems/          # This repo
  aems-lib-fastapi/            # FastAPI message bus + orchestration pipeline
  VOLTTRON/sim-rtu/            # Simulated RTU devices (optional)
  VOLTTRON/volttron/           # Legacy VOLTTRON source (for agent code)
```

```bash
mkdir -p ~/repos && cd ~/repos
git clone https://github.com/VOLTTRON/volttron-pnnl-aems.git
git clone <your-aems-lib-fastapi-repo> aems-lib-fastapi
```

---

## Quick Start (Simulated Devices)

Fastest path to a running system with no hardware.

### 1. Build and start sim-rtu

```bash
cd ~/repos
git clone https://github.com/VOLTTRON/sim-rtu.git VOLTTRON/sim-rtu
cd VOLTTRON/sim-rtu
make build
./bin/sim-rtu --config configs/default.yml
```

Verify:

```bash
curl http://127.0.0.1:8080/api/v1/status
curl http://127.0.0.1:8080/api/v1/devices
```

### 2. Install aems-lib-fastapi

```bash
cd ~/repos/aems-lib-fastapi
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[pipeline,drivers]"
```

### 3. Create config.ini

```bash
cp config.ini.example config.ini
```

Set the driver mode (NF recommended):

```ini
[agents]
platform_driver = false
nf_driver = true
```

Install sim-rtu device configs:

```bash
~/repos/VOLTTRON/sim-rtu/scripts/switch-to-nf.sh ~/repos/aems-lib-fastapi
```

### 4. Run the orchestration pipeline

```bash
python orchestrate.py
```

This generates agent configs, `agents-config.json`, and Docker Compose services from `config.ini`.

### 5. Start Docker stack

```bash
cd ~/repos/volttron-pnnl-aems/aems-app/docker
docker compose --profile fastapi --profile fastapi-agents up -d --build
```

### 6. Verify

```bash
# Health check
curl http://localhost:5410/health/

# Read a simulated point
curl http://localhost:5410/devices/SIM/RTU/Schneider/ZoneTemperature

# Write a setpoint
curl -X PUT http://localhost:5410/devices/SIM/RTU/Schneider/OccupiedCoolingSetPoint \
     -H "Content-Type: application/json" \
     -d '{"value": 73.0, "priority": 16}'

# All simulated devices
curl http://localhost:5410/devices/SIM/RTU/Schneider
curl http://localhost:5410/devices/SIM/RTU/OpenStat
curl http://localhost:5410/devices/SIM/RTU/DENT

# Container status
docker compose --profile fastapi ps
```

---

## Production Setup (Real Hardware)

### 1. Network requirements

- AEMS host on same subnet as BACnet devices (or via BACnet router)
- UDP port **47808** open between AEMS host and devices
- If using NF gateway: HTTP access on port 8081

### 2. Configure config.ini

```bash
cd ~/repos/aems-lib-fastapi
cp config.ini.example config.ini
```

```ini
[site]
campus = PNNL
building = SEB
timezone = America/Los_Angeles
gateway_address = 192.168.1.1
stat_type = schneider

[device:1]
name = rtu01
address = 192.168.1.101
device_id = 1001
stat_type = schneider

[device:2]
name = rtu02
address = 192.168.1.102
device_id = 1002
stat_type = schneider

[meter]
name = meter
address = 192.168.1.100
device_id = 100
registry = dent.csv
```

### 3. Choose driver mode

See [Driver Modes](#driver-modes) below.

### 4. Run orchestration and deploy

```bash
cd ~/repos/aems-lib-fastapi
source .venv/bin/activate
python orchestrate.py

cd ~/repos/volttron-pnnl-aems/aems-app/docker
docker compose --profile fastapi --profile fastapi-agents up -d --build
```

### 5. Verify

```bash
# BACnet connectivity
nc -zu 192.168.1.101 47808

# Read a point
curl http://localhost:5410/devices/PNNL/SEB/RTU01/ZoneTemperature

# Write a setpoint
curl -X PUT http://localhost:5410/devices/PNNL/SEB/RTU01/OccupiedCoolingSetPoint \
     -H "Content-Type: application/json" \
     -d '{"value": 74.0, "priority": 16}'
```

---

## Device Configuration

### Schneider SE8650 Thermostat

`config.ini` device section:

```ini
[device:1]
name = rtu01
address = 192.168.1.101
device_id = 1001
stat_type = schneider
```

Registry: `schneider.csv` (~60 points: temps, setpoints, modes, stages)

Thermostat config (`configs/aems-manager/schneider.config`):

```json
{
    "campus": "PNNL",
    "building": "SEB",
    "system": "SCHNEIDER",
    "system_status_point": "OccupancyCommand",
    "setpoint_control": 1,
    "local_tz": "US/Pacific",
    "default_setpoints": {
        "UnoccupiedHeatingSetPoint": 65,
        "UnoccupiedCoolingSetPoint": 78,
        "DeadBand": 3,
        "OccupiedSetPoint": 71
    },
    "schedule": {
        "Monday":    {"start": "6:00", "end": "18:00"},
        "Tuesday":   {"start": "6:00", "end": "18:00"},
        "Wednesday": {"start": "6:00", "end": "18:00"},
        "Thursday":  {"start": "6:00", "end": "18:00"},
        "Friday":    {"start": "6:00", "end": "18:00"},
        "Saturday":  "always_off",
        "Sunday":    "always_off"
    },
    "occupancy_values": {
        "occupied": 2,
        "unoccupied": 3
    }
}
```

Key fields:

| Field | Description |
|-------|-------------|
| `setpoint_control` | `1` = Schneider dual-setpoint |
| `default_setpoints` | Unoccupied fallback temperatures |
| `schedule` | Occupied hours per day |
| `occupancy_values` | Schneider: `2`/`3` |

### OpenStat Thermostat

Same pattern as Schneider with these differences:

| Field | Schneider | OpenStat |
|-------|-----------|----------|
| `stat_type` | `schneider` | `openstat` |
| `setpoint_control` | `1` (dual) | `0` (single) |
| `occupancy_values` | `2`/`3` | `1`/`0` |
| Registry | `schneider.csv` | `openstat.csv` |

### DENT Power Meter

```ini
[meter]
name = meter
address = 192.168.1.100
device_id = 100
registry = dent.csv
```

Registry: `dent.csv` (~40 points: voltage, current, power, PF, THD)

---

## Driver Modes

### NF Driver (Recommended)

Use when a Normal Framework gateway is available (sim-rtu or real NF gateway).

```ini
[agents]
platform_driver = false
nf_driver = true
```

NF driver config (`configs/nf-driver/config`):

```yaml
polling_interval: 60
driver_config:
  url: http://sim-rtu:8080          # or http://aems-gateway.local:8081
  client_id: my-client
  client_secret: my-secret
device_list:
- device_id: 86254
  registry_file: schneider.csv
  points_per_request: 25
  topic: SIM/RTU/Schneider
```

### Legacy BACnet Driver

Use for direct BACnet/IP to devices (no NF gateway).

```ini
[agents]
platform_driver = true
nf_driver = false
```

Requires BACnet proxy agent. Device config (`configs/platform-driver/devices/rtu01.config`):

```json
{
    "driver_config": {
        "device_address": "192.168.1.101",
        "device_id": 1001
    },
    "driver_type": "bacnet",
    "registry_config": "config://registry_configs/schneider.csv",
    "interval": 60,
    "timezone": "US/Pacific",
    "heart_beat_point": "HeartBeat"
}
```

Python 3.12+ requires:

```bash
pip install bacpypes==0.16.7 pyasyncore pyasynchat
```

### Switching Between Modes

sim-rtu provides scripts to install the right configs:

```bash
# Switch to NF driver
~/repos/VOLTTRON/sim-rtu/scripts/switch-to-nf.sh ~/repos/aems-lib-fastapi

# Switch to BACnet driver
~/repos/VOLTTRON/sim-rtu/scripts/switch-to-bacnet.sh ~/repos/aems-lib-fastapi
```

See [sim-rtu driver-switching.md](https://github.com/VOLTTRON/sim-rtu/blob/main/docs/driver-switching.md) for details.

---

## AEMS Agents

All agents run as Docker containers connecting via WebSocket to `aems-fastapi-server`.

| Agent | Identity | Purpose |
|-------|----------|---------|
| **Manager** | `manager.rtuXX` | Per-device energy management (schedules, setpoints, occupancy) |
| **NF Driver** | `platform.driver` | BACnet device polling via Normal Framework |
| **SQL Historian** | `platform.historian` | Time-series data storage (PostgreSQL) |
| **Weather** | `platform.weather` | Weather.gov station polling |
| **ILC** | `ilc.platform` | Intelligent Load Control (depends on NF driver) |
| **Listener** | `listener` | Debug/example pub/sub agent |

### Manager Agent

One instance per managed device. Configure via `config.ini`:

```ini
[aems_manager]
prefix = rtu
num_devices = 3          # creates manager.rtu01, manager.rtu02, manager.rtu03
```

Thermostat config in `aems-edge/configurations/thermostats/schneider.config`.

### Weather Agent

```ini
[weather]
station = KRIC           # nearest weather.gov station ID
```

Config file (`configs/weather/config`):

```json
{
    "database_file": "weather.sqlite",
    "max_size_gb": 1,
    "poll_locations": [{"station": "KPSC"}],
    "poll_interval": 60
}
```

### ILC Agent

Intelligent Load Control. Requires NF driver running. Config templates in `aems-edge/configurations/templates/`.

### SQL Historian

```ini
[database]
db_name = volttron
db_user = volttron
db_password = CHANGE_ME    # set a real password
db_address = historian     # Docker service name
db_port = 5432
```

---

## Orchestration Pipeline

`config.ini` drives a three-step pipeline:

```
config.ini
  → generate_configs.py       → configs/          (agent config files)
  → generate-agents-config.py → agents-config.json (agent metadata)
  → generate-docker-compose.py → docker-compose.yml (container definitions)
```

Run all steps:

```bash
cd ~/repos/aems-lib-fastapi
python orchestrate.py
```

Flags:

| Flag | Purpose |
|------|---------|
| `--config my-site.ini` | Use a different config file |
| `--dry-run` | Preview without writing files |
| `--skip-configs` | Skip if `configs/` already exists |
| `--aems-edge-path /path` | Override default `../volttron-pnnl-aems/aems-edge` |

See [aems-lib-fastapi PIPELINE.md](https://github.com/VOLTTRON/aems-lib-fastapi/blob/develop/docs/PIPELINE.md) for full details.

---

## Mixed Setup (Simulated + Real)

Run sim-rtu alongside real hardware for development.

```ini
[site]
campus = PNNL
building = SEB
timezone = America/Los_Angeles
gateway_address = 192.168.1.1
stat_type = schneider

# Simulated devices (sim-rtu)
[device:1]
name = sim-schneider
address = 127.0.0.1
device_id = 86254
stat_type = schneider

# Real devices
[device:2]
name = rtu01
address = 192.168.1.101
device_id = 1001
stat_type = schneider

[meter]
name = meter
address = 192.168.1.100
device_id = 100
registry = dent.csv
```

Topic separation:

| Device | Topic | Source |
|--------|-------|--------|
| sim-schneider | `SIM/RTU/Schneider` | sim-rtu on localhost |
| rtu01 | `PNNL/SEB/RTU01` | Real Schneider SE8650 |
| meter | `PNNL/SEB/METER` | Real DENT meter |

---

## Verification

```bash
# Health check
curl http://localhost:5410/health/

# Container status
docker compose --profile fastapi ps

# Read a point
curl http://localhost:5410/devices/PNNL/SEB/RTU01/ZoneTemperature

# Write a setpoint
curl -X PUT http://localhost:5410/devices/PNNL/SEB/RTU01/OccupiedCoolingSetPoint \
     -H "Content-Type: application/json" \
     -d '{"value": 74.0, "priority": 16}'

# API docs (Swagger UI)
open http://localhost:5410/docs

# Agent logs
docker compose logs -f aems-manager
docker compose logs -f aems-nf-driver
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Address already in use` on 47808 | `lsof -i UDP:47808` — kill conflicting process |
| `No module named asyncore` | Python 3.12+ removed it. `pip install pyasyncore pyasynchat` |
| `No response from device` (BACnet) | Check `device_address` in config. Use `172.17.0.1` for Docker |
| Connection refused on 8080 | sim-rtu not running or bound to `127.0.0.1`. Use `0.0.0.0` for Docker |
| AEMS not polling | Check `polling_interval` in NF config. Default 60s |
| `bacpypes` import errors | Must be `bacpypes==0.16.7` exactly (not bacpypes3) |
| Config changes not taking effect | AEMS reads configs at startup. Restart after changes |
| `orchestrate.py` exits code 2 | `volttron-pnnl-aems/aems-edge` not found. Use `--aems-edge-path` |
| Docker: can't reach sim-rtu | Use `172.17.0.1` (docker0 bridge) or container name |
| Firewall blocking BACnet | `sudo ufw allow 47808/udp` |
| Wrong BACnet device ID | Run WhoIs discovery (see [BACnet discovery](#2-configure-configini)) |
| NF gateway unreachable | Verify URL, check OAuth creds, `curl http://<gateway>:8081/health` |
| Wrong occupancy behavior | Schneider: `2`=occupied/`3`=unoccupied. OpenStat: `1`/`0` |
| Intermittent BACnet reads | Reduce `points_per_request` to avoid timeouts |
| FastAPI server unhealthy | `docker compose logs aems-fastapi-server`. Check port 5410 |
| Agent containers exit immediately | Server must be healthy first. Check `docker compose ps` |
| `db_password = CHANGE_ME` | Set a real database password in `config.ini` |
