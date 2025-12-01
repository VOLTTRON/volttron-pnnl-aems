#!/bin/bash

# Volttron AEMS Edge Setup Script
# This script executes the Volttron setup command and copies necessary configuration files

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

# Function to generate site.json dynamically
generate_site_json() {
    local output_dir="$1"
    local campus="$2"
    local building="$3"
    local prefix="$4"
    local num_configs="$5"
    
    log_info "Generating site.json with campus: ${campus}, building: ${building}, prefix: ${prefix}, configs: ${num_configs}"
    log_info "Output directory: ${output_dir}"
    
    # Validate inputs
    if [[ -z "${output_dir}" || -z "${campus}" || -z "${building}" || -z "${prefix}" || -z "${num_configs}" ]]; then
        log_error "Missing required parameters for site.json generation"
        log_error "output_dir='${output_dir}', campus='${campus}', building='${building}', prefix='${prefix}', num_configs='${num_configs}'"
        return 1
    fi
    
    # Ensure output directory exists
    if [[ ! -d "${output_dir}" ]]; then
        log_error "Output directory does not exist: ${output_dir}"
        return 1
    fi
    
    # Start building the systems array
    local systems_array=""
    for ((i=1; i<=num_configs; i++)); do
        local device_name="${prefix}$(printf "%02d" $i)"
        if [[ $i -eq 1 ]]; then
            systems_array="\"${device_name}\""
        else
            systems_array="${systems_array}, \"${device_name}\""
        fi
    done
    
    log_info "Generated systems array: [${systems_array}]"
    
    # Generate the site.json content
    local site_json_path="${output_dir}/site.json"
    log_info "Writing site.json to: ${site_json_path}"
    
    cat > "${site_json_path}" << EOF
{
  "campus": "${campus}",
  "building": "${building}",
  "systems": [
    ${systems_array}
  ]
}
EOF
    
    local result=$?
    if [[ $result -eq 0 ]]; then
        log_info "site.json file created successfully"
        if [[ -f "${site_json_path}" ]]; then
            log_info "Verifying site.json content:"
            cat "${site_json_path}"
        else
            log_error "site.json file was not created despite successful return code"
            return 1
        fi
    else
        log_error "Failed to create site.json file, return code: ${result}"
        return $result
    fi
    
    return 0
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
VOLTTRON_WEATHER_STATION=${VOLTTRON_WEATHER_STATION:-""}
VOLTTRON_REGISTRY_FILE_PATH=${VOLTTRON_REGISTRY_FILE_PATH:-""}
VOLTTRON_BACNET_ADDRESS=${VOLTTRON_BACNET_ADDRESS:-""}
VOLTTRON_ILC=${VOLTTRON_ILC:-"false"}
OUTPUT_DIR=${OUTPUT_DIR:-"/home/user/configs/"}
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
# Legacy support for NUM_CONFIGS (use VOLTTRON_NUM_CONFIGS if available)
NUM_CONFIGS=${VOLTTRON_NUM_CONFIGS:-${NUM_CONFIGS:-"1"}}

# Base directories
BASE_DIR="/home/user"
CONFIGURATIONS_DIR="${BASE_DIR}/configurations"
DOCKER_DIR="${CONFIGURATIONS_DIR}/docker"
SITE_JSON="${CONFIGURATIONS_DIR}/site.json"
TEMPLATES_DIR="${CONFIGURATIONS_DIR}/templates"
GRAFANA_DIR="${CONFIGURATIONS_DIR}/grafana"

# Lock files for tracking completion status
VOLTTRON_LOCK_FILE="${OUTPUT_DIR}/.volttron_setup_complete"
GRAFANA_LOCK_FILE="${OUTPUT_DIR}/.grafana_setup_complete"
# Legacy lock file for backward compatibility
LEGACY_LOCK_FILE="${OUTPUT_DIR}/.setup_complete"

log_info "Starting Volttron AEMS Edge Setup"

# Check setup completion status
VOLTTRON_COMPLETED=false
GRAFANA_COMPLETED=false

# Check for legacy lock file and migrate to new system
if [[ -f "${LEGACY_LOCK_FILE}" ]]; then
    log_info "Legacy setup lock file found at: ${LEGACY_LOCK_FILE}"
    log_info "Migrating from legacy setup to new separate lock file system..."
    
    # Create Volttron lock file from legacy setup (assume Volttron was completed)
    log_info "Creating Volttron setup completion lock file from legacy setup: ${VOLTTRON_LOCK_FILE}"
    echo "Volttron setup completed (migrated from legacy) on $(date)" > "${VOLTTRON_LOCK_FILE}"
    echo "Campus: ${VOLTTRON_CAMPUS}" >> "${VOLTTRON_LOCK_FILE}"
    echo "Building: ${VOLTTRON_BUILDING}" >> "${VOLTTRON_LOCK_FILE}"
    echo "Prefix: ${VOLTTRON_PREFIX}" >> "${VOLTTRON_LOCK_FILE}"
    echo "Gateway Address: ${VOLTTRON_GATEWAY_ADDRESS}" >> "${VOLTTRON_LOCK_FILE}"
    echo "Timezone: ${VOLTTRON_TIMEZONE}" >> "${VOLTTRON_LOCK_FILE}"
    echo "Number of Configs: ${NUM_CONFIGS}" >> "${VOLTTRON_LOCK_FILE}"
    echo "Migrated from: ${LEGACY_LOCK_FILE}" >> "${VOLTTRON_LOCK_FILE}"
    
    if [[ $? -eq 0 ]]; then
        log_success "Volttron lock file created from legacy setup"
        VOLTTRON_COMPLETED=true
        
        # Optionally remove or rename legacy lock file after successful migration
        mv "${LEGACY_LOCK_FILE}" "${LEGACY_LOCK_FILE}.migrated"
        log_info "Legacy lock file renamed to: ${LEGACY_LOCK_FILE}.migrated"
    else
        log_warning "Failed to create Volttron lock file from legacy setup"
        log_info "Keeping legacy lock file and exiting to prevent issues"
        log_info "To force re-run, delete the lock file: ${LEGACY_LOCK_FILE}"
        exit 1
    fi
    
    log_info "Legacy migration completed. Will continue with Grafana setup if needed."
fi

# Check individual component completion
if [[ -f "${VOLTTRON_LOCK_FILE}" ]]; then
    log_info "Volttron setup lock file found at: ${VOLTTRON_LOCK_FILE}"
    VOLTTRON_COMPLETED=true
    log_info "Volttron setup already completed - will skip Volttron tasks"
fi

if [[ -f "${GRAFANA_LOCK_FILE}" ]]; then
    log_info "Grafana setup lock file found at: ${GRAFANA_LOCK_FILE}"
    GRAFANA_COMPLETED=true
    log_info "Grafana setup already completed - will skip Grafana tasks"
fi

# Exit if both components are already completed
if [[ "${VOLTTRON_COMPLETED}" == "true" && "${GRAFANA_COMPLETED}" == "true" ]]; then
    log_success "Both Volttron and Grafana setup have already been completed. Nothing to do."
    log_info "To force re-run Volttron: delete ${VOLTTRON_LOCK_FILE}"
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

# === VOLTTRON SETUP SECTION ===
if [[ "${VOLTTRON_COMPLETED}" == "false" ]]; then
    log_info "=== Starting Volttron Setup ==="
    
    # Verify required directories exist
    if [[ ! -d "${DOCKER_DIR}" ]]; then
        log_error "Docker configuration directory not found: ${DOCKER_DIR}"
        exit 1
    fi

    # Note: site.json will be generated dynamically, so no need to check for its existence

    if [[ ! -d "${TEMPLATES_DIR}" ]]; then
        log_error "Templates directory not found: ${TEMPLATES_DIR}"
        exit 1
    fi

    # Change to the docker configuration directory
    log_info "Changing to docker configuration directory: ${DOCKER_DIR}"
    cd "${DOCKER_DIR}"

    # Verify generate_configs.py exists
    if [[ ! -f "generate_configs.py" ]]; then
        log_error "generate_configs.py not found in ${DOCKER_DIR}"
        exit 1
    fi

    # Verify requirements.txt exists and install dependencies
    if [[ -f "requirements.txt" ]]; then
        log_info "Installing Python dependencies from requirements.txt"
        STDERR_FILE=$(mktemp)
        pip install -r requirements.txt 2> "${STDERR_FILE}"
        EXIT_CODE=$?

        STDERR_OUTPUT=$(<"${STDERR_FILE}")
        rm -f "${STDERR_FILE}"

        if [[ -n "${STDERR_OUTPUT}" ]]; then
            log_warning "${STDERR_OUTPUT}"
        fi

        if [[ ${EXIT_CODE} -ne 0 ]]; then
            log_error "pip install failed with exit code ${EXIT_CODE}"
            exit 1
        fi
    else
        log_warning "requirements.txt not found, skipping dependency installation"
    fi

    # Clean and create output directory
    if [ -d "${OUTPUT_DIR}" ]; then
        log_info "Cleaning output directory: ${OUTPUT_DIR}"
        rm -rf "${OUTPUT_DIR:?}"/*
    else
        log_info "Creating output directory: ${OUTPUT_DIR}"
        mkdir -p "${OUTPUT_DIR}"
    fi

    # Execute the Volttron configuration generation
    log_info "Executing Volttron configuration generation"

    # Build the command with conditional arguments
    GENERATE_CMD="python generate_configs.py \
        -n \"${NUM_CONFIGS}\" \
        --output-dir \"${OUTPUT_DIR}\" \
        --campus \"${VOLTTRON_CAMPUS}\" \
        --building \"${VOLTTRON_BUILDING}\" \
        --prefix \"${VOLTTRON_PREFIX}\" \
        -g \"${VOLTTRON_GATEWAY_ADDRESS}\" \
        -t \"${VOLTTRON_TIMEZONE}\""

    # Add optional arguments if they are provided
    if [[ -n "${VOLTTRON_WEATHER_STATION}" ]]; then
        GENERATE_CMD="${GENERATE_CMD} --weather-station \"${VOLTTRON_WEATHER_STATION}\""
    fi

    if [[ -n "${VOLTTRON_REGISTRY_FILE_PATH}" ]]; then
        GENERATE_CMD="${GENERATE_CMD} --registry-file-path \"${VOLTTRON_REGISTRY_FILE_PATH}\""
    fi

    if [[ -n "${VOLTTRON_BACNET_ADDRESS}" ]]; then
        GENERATE_CMD="${GENERATE_CMD} --bacnet-address \"${VOLTTRON_BACNET_ADDRESS}\""
    fi

    if [[ "${VOLTTRON_ILC}" == "true" ]]; then
        GENERATE_CMD="${GENERATE_CMD} --ilc"
    fi

    # Add Grafana DB arguments if they are provided
    if [[ -n "${GRAFANA_DB_NAME}" ]]; then
        GENERATE_CMD="${GENERATE_CMD} --db-name \"${GRAFANA_DB_NAME}\""
    fi
    if [[ -n "${GRAFANA_DB_USER}" ]]; then
        GENERATE_CMD="${GENERATE_CMD} --db-user \"${GRAFANA_DB_USER}\""
    fi
    if [[ -n "${GRAFANA_DB_PASSWORD}" ]]; then
        GENERATE_CMD="${GENERATE_CMD} --db-password \"${GRAFANA_DB_PASSWORD}\""
    fi
    if [[ -n "${GRAFANA_DB_HOST}" ]]; then
        GENERATE_CMD="${GENERATE_CMD} --db-address \"${GRAFANA_DB_HOST}\""
    fi
    if [[ -n "${GRAFANA_DB_PORT}" ]]; then
        GENERATE_CMD="${GENERATE_CMD} --db-port \"${GRAFANA_DB_PORT}\""
    fi

    # Log the command, obfuscating the password
    LOG_CMD=${GENERATE_CMD}
    if [[ -n "${GRAFANA_DB_PASSWORD}" ]]; then
        LOG_CMD=$(echo "${GENERATE_CMD}" | sed -e "s/--db-password \"[^\"]*\"/--db-password \"\*\*\*\"/")
    fi
    log_info "Command: ${LOG_CMD}"

    # Create a temporary file to capture stderr
    STDERR_FILE=$(mktemp)
    eval "${GENERATE_CMD}" 2> "${STDERR_FILE}"
    EXIT_CODE=$?

    # Read stderr content
    STDERR_OUTPUT=$(<"${STDERR_FILE}")
    rm -f "${STDERR_FILE}"

    if [[ -n "${STDERR_OUTPUT}" ]]; then
        log_warning "${STDERR_OUTPUT}"
    fi

    if [[ ${EXIT_CODE} -eq 0 ]]; then
        log_success "Configuration generation completed successfully"
    else
        log_error "Configuration generation failed with exit code ${EXIT_CODE}"
        exit 1
    fi

    # Generate site.json with dynamic values
    log_info "Generating site.json with dynamic values"
    generate_site_json "${OUTPUT_DIR}" "${VOLTTRON_CAMPUS}" "${VOLTTRON_BUILDING}" "${VOLTTRON_PREFIX}" "${NUM_CONFIGS}"
    if [[ $? -eq 0 ]]; then
        log_success "site.json generated successfully"
    else
        log_error "Failed to generate site.json"
        exit 1
    fi

    # Copy templates directory to the output directory
    log_info "Copying templates directory to output directory"
    if [ -d "${OUTPUT_DIR}/templates" ]; then
        log_info "Cleaning existing templates directory"
        rm -rf "${OUTPUT_DIR:?}/templates"
    fi
    cp -r "${TEMPLATES_DIR}" "${OUTPUT_DIR}/"
    if [[ $? -eq 0 ]]; then
        log_success "Templates directory copied successfully"
    else
        log_error "Failed to copy templates directory"
        exit 1
    fi

    # Create Volttron completion lock file
    log_info "Creating Volttron setup completion lock file: ${VOLTTRON_LOCK_FILE}"
    echo "Volttron setup completed on $(date)" > "${VOLTTRON_LOCK_FILE}"
    echo "Campus: ${VOLTTRON_CAMPUS}" >> "${VOLTTRON_LOCK_FILE}"
    echo "Building: ${VOLTTRON_BUILDING}" >> "${VOLTTRON_LOCK_FILE}"
    echo "Prefix: ${VOLTTRON_PREFIX}" >> "${VOLTTRON_LOCK_FILE}"
    echo "Gateway Address: ${VOLTTRON_GATEWAY_ADDRESS}" >> "${VOLTTRON_LOCK_FILE}"
    echo "Timezone: ${VOLTTRON_TIMEZONE}" >> "${VOLTTRON_LOCK_FILE}"
    echo "Number of Configs: ${NUM_CONFIGS}" >> "${VOLTTRON_LOCK_FILE}"

    if [[ $? -eq 0 ]]; then
        log_success "Volttron setup completed and lock file created"
        VOLTTRON_COMPLETED=true
    else
        log_warning "Failed to create Volttron lock file, but setup completed successfully"
        VOLTTRON_COMPLETED=true
    fi
else
    log_info "=== Skipping Volttron Setup (already completed) ==="
fi

# === GRAFANA SETUP SECTION ===
if [[ "${GRAFANA_COMPLETED}" == "false" ]]; then
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
            
            # Create Grafana completion lock file
            log_info "Creating Grafana setup completion lock file: ${GRAFANA_LOCK_FILE}"
            echo "Grafana setup completed on $(date)" > "${GRAFANA_LOCK_FILE}"
            echo "Campus: ${VOLTTRON_CAMPUS}" >> "${GRAFANA_LOCK_FILE}"
            echo "Building: ${VOLTTRON_BUILDING}" >> "${GRAFANA_LOCK_FILE}"
            echo "Grafana DB Name: ${GRAFANA_DB_NAME}" >> "${GRAFANA_LOCK_FILE}"
            echo "Grafana DB User: ${GRAFANA_DB_USER}" >> "${GRAFANA_LOCK_FILE}"
            echo "Grafana DB Host: ${GRAFANA_DB_HOST}" >> "${GRAFANA_LOCK_FILE}"
            echo "Grafana DB Port: ${GRAFANA_DB_PORT}" >> "${GRAFANA_LOCK_FILE}"
            
            if [[ $? -eq 0 ]]; then
                log_success "Grafana setup completed and lock file created"
                GRAFANA_COMPLETED=true
            else
                log_warning "Failed to create Grafana lock file, but setup completed successfully"
                GRAFANA_COMPLETED=true
            fi
        else
            log_warning "Grafana dashboard generation failed, but continuing with setup"
        fi
    else
        log_warning "Grafana directory not found at: ${GRAFANA_DIR}"
        log_warning "Skipping Grafana dashboard generation"
    fi
else
    log_info "=== Skipping Grafana Setup (already completed) ==="
fi

# === FINAL SUMMARY ===
log_info "=== Setup Summary ==="
log_info "Volttron setup completed: ${VOLTTRON_COMPLETED}"
log_info "Grafana setup completed: ${GRAFANA_COMPLETED}"

if [[ "${VOLTTRON_COMPLETED}" == "true" ]]; then
    log_info "Volttron lock file: ${VOLTTRON_LOCK_FILE}"
fi

if [[ "${GRAFANA_COMPLETED}" == "true" ]]; then
    log_info "Grafana lock file: ${GRAFANA_LOCK_FILE}"
fi

# List the contents of the output directory for verification if Volttron was processed
if [[ "${VOLTTRON_COMPLETED}" == "true" ]]; then
    log_info "Output directory contents:"
    ls -la "${OUTPUT_DIR}"
fi

log_success "Volttron AEMS Edge setup process completed!"
if [[ "${VOLTTRON_COMPLETED}" == "true" ]]; then
    log_info "Volttron configuration files generated and copied to: ${OUTPUT_DIR}"
fi
if [[ "${GRAFANA_COMPLETED}" == "true" ]]; then
    log_info "Grafana dashboards generated in: ${GRAFANA_DIR}"
fi
