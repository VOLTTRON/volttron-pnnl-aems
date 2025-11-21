# Grafana Dashboard Generator

Automated tool for generating and uploading Grafana dashboards for building automation systems. This tool automatically discovers RTU devices from your Grafana datasource and creates separate, customized dashboards for each device with device point mapping and automatic API deployment.

## Features

- **Auto-Device Discovery**: Automatically detects all RTU devices from Grafana PostgreSQL datasource
- **Separate Dashboards Per Device**: Creates individual dashboard for each RTU device (no dropdown selectors)
- **Device Point Mapping**: Validates and maps device points from configuration
- **Direct API Upload**: Automatically uploads dashboards to Grafana using basic authentication
- **Organized Output**: All generated files saved to `output/` folder (auto-created)
- **Updated Occupancy Status**: Proper 3-state occupancy mapping (Local Control/Occupied/Unoccupied)
- **Multiple Visualizations**: Gauges, stats, time series with color-coded thresholds
- **Response Logging**: Saves API upload responses to JSON files for audit trails
- **Creative Dashboard Design**: Temperature gauges, equipment status indicators, setpoint displays

## Prerequisites

- Python 3.7+
- Access to a Grafana instance with PostgreSQL datasource configured
- PostgreSQL must have topics for all the devices
- The script expects PostgreSQL topics in the format:
```
{campus}/{building}/{device}/{metric}
```
- Grafana admin credentials

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
output-dir = output
timezone = America/Los_Angeles

[device_mapping]
effective_zone_temperature_setpoint = EffectiveZoneTemperatureSetPoint
first_stage_heating = FirstStageHeating
occupancy_command = OccupancyCommand
occupied_cooling_setpoint = OccupiedCoolingSetPoint
occupied_heating_setpoint = OccupiedHeatingSetPoint
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
```

#### Configuration Parameters

**[dashboard] Section:**
- `campus`: Campus identifier (e.g., PNNL)
- `building`: Building identifier (e.g., ROB)
- `output-dir`: Directory for generated JSON files (default: output)
- `timezone`: Timezone for dashboards (default: America/Los_Angeles)

**[device_mapping] Section:**
- Maps internal point names (left) to actual device point names (right)
- Used for validation and ensuring consistency across dashboards

**[grafana] Section:**
- `url`: Full URL to your Grafana instance
- `username`: Grafana username (requires admin or editor role)
- `password`: Grafana password
- `verify_ssl`: Set to `false` for self-signed certificates (default: false)

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

- Grafana configuration is missing from config.ini
- Cannot connect to Grafana API
- No PostgreSQL datasource found in Grafana
- Dashboard template files are missing

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
