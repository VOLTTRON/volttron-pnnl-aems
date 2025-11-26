# Grafana Dashboard Generator

Automated tool for generating and uploading Grafana dashboards for building automation systems. This tool generates customized dashboards for each device using templates, integrates PostgreSQL database as a datasource, validates device point mappings, and deploys them to Grafana via API. For viewer-only visualization, it automatically configures anonymous access and viewer user management, so users can view in read-only mode.

## Features

- **Auto-Device Discovery**: Automatically detects all RTU devices from Grafana PostgreSQL datasource
- **Device Point Mapping**: Validates and maps device points from configuration
- **Direct API Upload**: Automatically uploads dashboards to Grafana using basic authentication
- **Auto-Replace Dashboards**: Automatically deletes existing dashboards with the same name before uploading new versions
- **Anonymous Access Configuration**: Automatically configures Grafana for anonymous viewer access by updating environment files and restarting containers (Note tested)
- **Viewer User Management**: Creates and manages viewer user accounts for read-only dashboard access
- **Organized Output**: All generated files saved to `output/` folder (auto-created)
- **Response Logging**: Saves API upload responses to timestamped JSON files for audit trails
- **Dashboard URL Tracking**: Generates JSON file with all dashboard URLs for easy access

## Prerequisites

- Python 3.7+
- Access to a Grafana instance and its admin credentials
- Postgres database and its credentials

## Installation

1. Clone or download this repository: 
```bash
git clone https://github.com/RoshanLKini/aems-grafana-automation.git
cd aems-grafana-automation
```
2. Install required Python packages:
```bash
pip install requests urllib3
```

## Configuration

### config.ini

Create or edit `config.ini` with the following sections:

```ini
[dashboard]
campus = PNNL
building = ROB
gateway-address = <replace with gateway ip address>
prefix = rtu
config-subdir = configs
num-configs = 4
weather-station = 
registry-file-path = 
bacnet-address = 
timezone = America/Los_Angeles

[device_mapping]
effective_zone_temperature_setpoint = EffectiveZoneTemperatureSetPoint
first_stage_heating = FirstStageHeating
occupancy_command = OccupancyCommand
occupied_cooling_setpoint = OccupiedCoolingSetPoint
occupied_heating_setpoint = OccupiedHeatingSetPoint
unoccupied_cooling_setpoint = UnoccupiedCoolingSetPoint
unoccupied_heating_setpoint = UnoccupiedHeatingSetPoint
outdoor_air_temperature = OutdoorAirTemperature
supply_fan_status = SupplyFanStatus
building_power = Watts
zone_humidity = ZoneHumidity
zone_temperature = ZoneTemperature
weather_air_temperature = air_temperature

[grafana]
url = https://your-grafana-server.com/grafana
username = admin
password = your_password
verify_ssl = false

[viewer-user]
username = dashboard_viewer
email = viewer@aems.local
password = ViewerPass123!
role = Viewer

[PostgreSQL-DB]
host = grafana-db
port = 5432
dbname = grafana
user = grafana
password = your_db_password
```

#### Configuration Parameters

**[dashboard] Section:**
- `campus`: Campus identifier (e.g., PNNL)
- `building`: Building identifier (e.g., ROB)
- `gateway-address`: IP address of the gateway device
- `prefix`: Prefix for RTU device names (e.g., rtu)
- `config-subdir`: Subdirectory for configuration files (e.g., configs)
- `num-configs`: Number of RTU configurations to generate
- `weather-station`: Weather station identifier (optional)
- `registry-file-path`: Path to BACnet registry file (optional)
- `bacnet-address`: BACnet device address (optional)
- `timezone`: Timezone for dashboards (default: America/Los_Angeles)

**[device_mapping] Section:**
- Maps internal point names (left) to actual device point names (right)
- Used for validation and ensuring consistency across dashboards
- Includes both occupied and unoccupied setpoints for complete HVAC control visibility

**[grafana] Section:**
- `url`: Full URL to your Grafana instance
- `username`: Grafana username (requires admin or editor role)
- `password`: Grafana password
- `verify_ssl`: Set to `false` for self-signed certificates (default: false)

**[viewer-user] Section:**
- `username`: Username for the viewer account (read-only access)
- `email`: Email address for the viewer account
- `password`: Password for the viewer account
- `role`: User role (typically "Viewer" for read-only access)

**[PostgreSQL-DB] Section:**
- `host`: PostgreSQL database host
- `port`: PostgreSQL port (default: 5432)
- `dbname`: Database name
- `user`: Database username
- `password`: Database password

## Usage

### Generate and Upload Dashboards

```bash
python generate_dashboards.py
```

This will:
1. Load configuration from `config.ini`
2. Connect to Grafana API
3. Auto-detect PostgreSQL datasource
4. **Query and discover all RTU devices from Grafana**
5. Load dashboard templates (`rtu_overview.json`, `site_overview.json`)
6. **Generate separate dashboard for each device discovered**
7. Validate device points against mapping
8. Upload all dashboards to Grafana
9. Save API responses to timestamped JSON file in `output/` folder

### Output Files

The script generates the following files in the `output/` folder:

**Per-Device RTU Dashboards:**
- `{CAMPUS}_{BUILDING}_{DEVICE}_RTU_Overview.json` - Individual dashboard for each RTU
  - Example: `PNNL_ROB_rtu01_RTU_Overview.json`
  - Example: `PNNL_ROB_rtu02_RTU_Overview.json`
  - Example: `PNNL_ROB_rtu03_RTU_Overview.json`

**Site Overview:**
- `{CAMPUS}_{BUILDING}_Site_Overview.json` - Building-wide dashboard



## Dashboard Templates

### RTU Overview Dashboard (Per Device)

Each RTU device gets its own dedicated dashboard with real-time data:

### Site Overview Dashboard

Provides building-wide overview with multiple data points.


## Logging

The script uses Python's logging module with INFO level by default:

Logs are output to the console. To save logs to a file, redirect output:

```bash
python generate_dashboards.py > dashboard_generation.log 2>&1
```

## Error Handling

The script performs validation and will exit with an error if:

- Required configuration sections are missing from config.ini (dashboard, device_mapping, grafana, PostgreSQL-DB)
- Cannot connect to Grafana API (invalid URL, credentials, or network issues)
- No PostgreSQL datasource found in Grafana
- Dashboard template files are missing (rtu_overview.json, site_overview.json)
- PostgreSQL database connection fails
- Device discovery returns no RTU devices
- Anonymous access configuration fails
- Dashboard upload fails (permissions, invalid JSON, etc.)
- Viewer user creation or update fails

## Topic Structure

The script expects PostgreSQL topics in the format:
```
{campus}/{building}/{device}/{metric}
```

Example: `PNNL/ROB/rtu01/ZoneTemperature`


### Modifying Colors and Thresholds

Edit the template JSON files:
- `rtu_overview.json` - RTU dashboard template
- `site_overview.json` - Site dashboard template
