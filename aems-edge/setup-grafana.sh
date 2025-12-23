#!/bin/bash

# Grafana AEMS Edge Setup Script - Grafana Only
# This script executes only the Grafana dashboard setup

set -e  # Exit on any error
set -u  # Exit on undefined variables

# Define colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to generate config.ini for Grafana dashboard generation
generate_grafana_config() {
    local config_file="$1"
    local campus="$2"
    local building="$3"
    local prefix="$4"
    local num_configs="$5"
    local gateway_address="$6"
    local timezone="$7"
    
    log_info "Generating config.ini for Grafana dashboard generation"
    log_info "Config file: ${config_file}"
    
    # Validate inputs
    if [[ -z "${config_file}" || -z "${campus}" || -z "${building}" || -z "${prefix}" || -z "${num_configs}" ]]; then
        log_error "Missing required parameters for config.ini generation"
        return 1
    fi
    
    # Ensure config directory exists
    local config_dir=$(dirname "${config_file}")
    if [[ ! -d "${config_dir}" ]]; then
        log_error "Config directory does not exist: ${config_dir}"
        return 1
    fi
    
    # Generate the config.ini content
    cat > "${config_file}" << EOF
[dashboard]
campus = ${campus}
building = ${building}
gateway-address = ${gateway_address}
prefix = ${prefix}
config-subdir = configs
num-configs = ${num_configs}
weather-station = 
registry-file-path = 
bacnet-address = 
timezone = ${timezone}

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
EOF

    # Add PostgreSQL-DB section if variables are provided
    if [[ -n "${GRAFANA_DB_HOST}" && -n "${GRAFANA_DB_NAME}" ]]; then
        cat >> "${config_file}" << EOF

[PostgreSQL-DB]
host = ${GRAFANA_DB_HOST}
port = ${GRAFANA_DB_PORT:-5432}
dbname = ${GRAFANA_DB_NAME}
user = ${GRAFANA_DB_USER}
password = ${GRAFANA_DB_PASSWORD}
EOF
        log_info "Added PostgreSQL-DB configuration"
    else
        log_warning "PostgreSQL-DB configuration not added - missing required variables"
    fi

    # Add Grafana API section if variables are provided
    if [[ -n "${GRAFANA_URL}" && -n "${GRAFANA_USERNAME}" ]]; then
        cat >> "${config_file}" << EOF

[grafana]
url = ${GRAFANA_URL}
username = ${GRAFANA_USERNAME}
password = ${GRAFANA_PASSWORD}
verify_ssl = ${GRAFANA_VERIFY_SSL}
EOF
        log_info "Added Grafana API configuration"
    else
        log_warning "Grafana API configuration not added - missing required variables"
    fi

    # Add Keycloak API section if variables are provided
    if [[ -n "${KEYCLOAK_URL}" && -n "${KEYCLOAK_ADMIN}" ]]; then
        cat >> "${config_file}" << EOF

[keycloak]
url = ${KEYCLOAK_URL}
realm = ${KEYCLOAK_REALM:-default}
admin_user = ${KEYCLOAK_ADMIN}
admin_password = ${KEYCLOAK_ADMIN_PASSWORD}
client_id = ${KEYCLOAK_CLIENT_ID:-grafana-oauth}
verify_ssl = ${KEYCLOAK_VERIFY_SSL:-false}
EOF
        log_info "Added Keycloak API configuration"
    else
        log_warning "Keycloak API configuration not added - missing required variables"
    fi

    # Add viewer-user section with defaults
    cat >> "${config_file}" << EOF

[viewer-user]
username = dashboard_viewer
email = viewer@aems.local
password = ViewerPass123!
role = Viewer
EOF
    
    local result=$?
    if [[ $result -eq 0 ]]; then
        log_success "config.ini file created successfully"
        log_info "Config file location: ${config_file}"
    else
        log_error "Failed to create config.ini file, return code: ${result}"
        return $result
    fi
    
    return 0
}

# Function to install Grafana dashboard dependencies
install_grafana_dependencies() {
    local grafana_dir="$1"
    local requirements_file="${grafana_dir}/requirements.txt"
    
    log_info "Installing Grafana dashboard dependencies"
    
    if [[ ! -f "${requirements_file}" ]]; then
        log_warning "Grafana requirements.txt not found at: ${requirements_file}"
        return 0
    fi
    
    log_info "Installing dependencies from: ${requirements_file}"
    STDERR_FILE=$(mktemp)
    pip install -r "${requirements_file}" 2> "${STDERR_FILE}"
    EXIT_CODE=$?

    STDERR_OUTPUT=$(<"${STDERR_FILE}")
    rm -f "${STDERR_FILE}"

    if [[ -n "${STDERR_OUTPUT}" ]]; then
        log_warning "${STDERR_OUTPUT}"
    fi

    if [[ ${EXIT_CODE} -eq 0 ]]; then
        log_success "Grafana dependencies installed successfully"
    else
        log_error "Grafana dependencies installation failed with exit code ${EXIT_CODE}"
        return ${EXIT_CODE}
    fi
    
    return 0
}

# Function to run Grafana dashboard generation
run_grafana_dashboard_generation() {
    local grafana_dir="$1"
    local generate_script="${grafana_dir}/generate_dashboards.py"
    
    log_info "Running Grafana dashboard generation"
    
    # Verify the script exists
    if [[ ! -f "${generate_script}" ]]; then
        log_error "generate_dashboards.py not found at: ${generate_script}"
        return 1
    fi
    
    # Change to the Grafana directory
    local original_dir=$(pwd)
    cd "${grafana_dir}"
    
    log_info "Changed to Grafana directory: ${grafana_dir}"
    log_info "Executing: python generate_dashboards.py"
    
    # Create a temporary file to capture stderr
    STDERR_FILE=$(mktemp)
    python generate_dashboards.py 2> "${STDERR_FILE}"
    EXIT_CODE=$?

    # Read stderr content
    STDERR_OUTPUT=$(<"${STDERR_FILE}")
    rm -f "${STDERR_FILE}"

    if [[ -n "${STDERR_OUTPUT}" ]]; then
        log_warning "${STDERR_OUTPUT}"
    fi

    # Return to original directory
    cd "${original_dir}"

    if [[ ${EXIT_CODE} -eq 0 ]]; then
        log_success "Grafana dashboard generation completed successfully"
    else
        log_error "Grafana dashboard generation failed with exit code ${EXIT_CODE}"
        return ${EXIT_CODE}
    fi
    
    return 0
}

# Set default values for environment variables if not provided
VOLTTRON_CAMPUS=${VOLTTRON_CAMPUS:-"PNNL"}
VOLTTRON_BUILDING=${VOLTTRON_BUILDING:-"ROB"}
VOLTTRON_PREFIX=${VOLTTRON_PREFIX:-"rtu"}
VOLTTRON_GATEWAY_ADDRESS=${VOLTTRON_GATEWAY_ADDRESS:-"192.168.0.1"}
VOLTTRON_TIMEZONE=${VOLTTRON_TIMEZONE:-"America/Los_Angeles"}
VOLTTRON_NUM_CONFIGS=${VOLTTRON_NUM_CONFIGS:-"1"}
OUTPUT_DIR=${OUTPUT_DIR:-"/home/user/configs"}
# Legacy support for NUM_CONFIGS (use VOLTTRON_NUM_CONFIGS if available)
NUM_CONFIGS=${VOLTTRON_NUM_CONFIGS:-${NUM_CONFIGS:-"1"}}

# Grafana DB settings
GRAFANA_DB_NAME=${GRAFANA_DB_NAME:-""}
GRAFANA_DB_USER=${GRAFANA_DB_USER:-""}
GRAFANA_DB_PASSWORD=${GRAFANA_DB_PASSWORD:-""}
GRAFANA_DB_HOST=${GRAFANA_DB_HOST:-""}
GRAFANA_DB_PORT=${GRAFANA_DB_PORT:-""}
# Grafana API settings
GRAFANA_URL=${GRAFANA_URL:-""}
GRAFANA_USERNAME=${GRAFANA_USERNAME:-""}
GRAFANA_PASSWORD=${GRAFANA_PASSWORD:-""}
GRAFANA_VERIFY_SSL=${GRAFANA_VERIFY_SSL:-"false"}

# Base directories
BASE_DIR="/home/user"
CONFIGURATIONS_DIR="${BASE_DIR}/configurations"
GRAFANA_DIR="${CONFIGURATIONS_DIR}/grafana"

# Lock files for tracking completion status
GRAFANA_LOCK_FILE="${OUTPUT_DIR}/.grafana_setup_complete"

log_info "Starting Grafana AEMS Edge Setup (Grafana Only)"

# Check setup completion status
GRAFANA_COMPLETED=false

# Check if Grafana setup is already completed
if [[ -f "${GRAFANA_LOCK_FILE}" ]]; then
    log_info "Grafana setup lock file found at: ${GRAFANA_LOCK_FILE}"
    GRAFANA_COMPLETED=true
    log_info "Grafana setup already completed - nothing to do"
fi

# Exit if Grafana is already completed
if [[ "${GRAFANA_COMPLETED}" == "true" ]]; then
    log_success "Grafana setup has already been completed. Nothing to do."
    log_info "To force re-run Grafana: delete ${GRAFANA_LOCK_FILE}"
    exit 0
fi

log_info "Configuration parameters:"
log_info "  Campus: ${VOLTTRON_CAMPUS}"
log_info "  Building: ${VOLTTRON_BUILDING}"
log_info "  Prefix: ${VOLTTRON_PREFIX}"
log_info "  Gateway Address: ${VOLTTRON_GATEWAY_ADDRESS}"
log_info "  Timezone: ${VOLTTRON_TIMEZONE}"
log_info "  Output Directory: ${OUTPUT_DIR}"
log_info "  Number of Configs: ${NUM_CONFIGS}"
log_info "  Grafana DB Name: ${GRAFANA_DB_NAME}"
log_info "  Grafana DB User: ${GRAFANA_DB_USER}"
log_info "  Grafana DB Host: ${GRAFANA_DB_HOST}"
log_info "  Grafana DB Port: ${GRAFANA_DB_PORT}"

# === GRAFANA SETUP SECTION ===
if [[ -d "${GRAFANA_DIR}" ]]; then
    log_info "=== Starting Grafana Setup ==="
    
    # Install Grafana dependencies
    install_grafana_dependencies "${GRAFANA_DIR}"
    if [[ $? -ne 0 ]]; then
        log_error "Failed to install Grafana dependencies"
        exit 1
    fi
    
    # Generate config.ini with environment variables
    GRAFANA_CONFIG_FILE="${GRAFANA_DIR}/config.ini"
    generate_grafana_config "${GRAFANA_CONFIG_FILE}" "${VOLTTRON_CAMPUS}" "${VOLTTRON_BUILDING}" "${VOLTTRON_PREFIX}" "${NUM_CONFIGS}" "${VOLTTRON_GATEWAY_ADDRESS}" "${VOLTTRON_TIMEZONE}"
    if [[ $? -ne 0 ]]; then
        log_error "Failed to generate Grafana config.ini"
        exit 1
    fi
    
    # Run dashboard generation
    run_grafana_dashboard_generation "${GRAFANA_DIR}"
    if [[ $? -eq 0 ]]; then
        log_success "Grafana dashboard generation completed successfully"
        
        # Copy dashboard URLs file to configs directory for other containers to access
        URLS_SOURCE_FILE="${GRAFANA_DIR}/output/${VOLTTRON_CAMPUS}_${VOLTTRON_BUILDING}_dashboard_urls.json"
        URLS_TARGET_FILE="${OUTPUT_DIR}/${VOLTTRON_CAMPUS}_${VOLTTRON_BUILDING}_dashboard_urls.json"
        
        if [[ -f "${URLS_SOURCE_FILE}" ]]; then
            log_info "Copying dashboard URLs file to configs directory"
            cp "${URLS_SOURCE_FILE}" "${URLS_TARGET_FILE}"
            if [[ $? -eq 0 ]]; then
                log_success "Dashboard URLs file copied to: ${URLS_TARGET_FILE}"
            else
                log_warning "Failed to copy dashboard URLs file to configs directory"
            fi
        else
            log_warning "Dashboard URLs file not found at: ${URLS_SOURCE_FILE}"
        fi
        
        # Create Grafana completion lock file
        log_info "Creating Grafana setup completion lock file: ${GRAFANA_LOCK_FILE}"
        echo "Grafana setup completed on $(date)" > "${GRAFANA_LOCK_FILE}"
        echo "Campus: ${VOLTTRON_CAMPUS}" >> "${GRAFANA_LOCK_FILE}"
        echo "Building: ${VOLTTRON_BUILDING}" >> "${GRAFANA_LOCK_FILE}"
        echo "Grafana DB Name: ${GRAFANA_DB_NAME}" >> "${GRAFANA_LOCK_FILE}"
        echo "Grafana DB User: ${GRAFANA_DB_USER}" >> "${GRAFANA_LOCK_FILE}"
        echo "Grafana DB Host: ${GRAFANA_DB_HOST}" >> "${GRAFANA_LOCK_FILE}"
        echo "Grafana DB Port: ${GRAFANA_DB_PORT}" >> "${GRAFANA_LOCK_FILE}"
        
        # Add dashboard URLs file location to lock file if it exists
        if [[ -f "${URLS_TARGET_FILE}" ]]; then
            echo "Dashboard URLs file: ${URLS_TARGET_FILE}" >> "${GRAFANA_LOCK_FILE}"
        fi
        
        if [[ $? -eq 0 ]]; then
            log_success "Grafana setup completed and lock file created"
            GRAFANA_COMPLETED=true
        else
            log_warning "Failed to create Grafana lock file, but setup completed successfully"
            GRAFANA_COMPLETED=true
        fi
    else
        log_error "Grafana dashboard generation failed"
        exit 1
    fi
else
    log_error "Grafana directory not found at: ${GRAFANA_DIR}"
    log_error "Cannot proceed with Grafana dashboard generation"
    exit 1
fi

log_success "Grafana AEMS Edge setup process completed!"
log_info "Grafana dashboards generated in: ${GRAFANA_DIR}"
