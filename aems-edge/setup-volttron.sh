#!/bin/bash

# Volttron AEMS Edge Setup Script - Volttron Only
# This script executes only the Volttron setup command and copies necessary configuration files

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

# Set default values for environment variables if not provided
VOLTTRON_CAMPUS=${VOLTTRON_CAMPUS:-"PNNL"}
VOLTTRON_BUILDING=${VOLTTRON_BUILDING:-"ROB"}
VOLTTRON_PREFIX=${VOLTTRON_PREFIX:-"rtu"}
VOLTTRON_RTU_OAT_SENSOR_NUMBER=${VOLTTRON_RTU_OAT_SENSOR_NUMBER:-""}
VOLTTRON_GATEWAY_ADDRESS=${VOLTTRON_GATEWAY_ADDRESS:-"192.168.0.1"}
VOLTTRON_TIMEZONE=${VOLTTRON_TIMEZONE:-"America/Los_Angeles"}
VOLTTRON_NUM_CONFIGS=${VOLTTRON_NUM_CONFIGS:-"1"}
VOLTTRON_WEATHER_STATION=${VOLTTRON_WEATHER_STATION:-""}
VOLTTRON_REGISTRY_FILE_PATH=${VOLTTRON_REGISTRY_FILE_PATH:-""}
VOLTTRON_BACNET_ADDRESS=${VOLTTRON_BACNET_ADDRESS:-""}
VOLTTRON_ILC=${VOLTTRON_ILC:-"false"}

VOLTTRON_SMTP_ADDRESS=${VOLTTRON_SMTP_ADDRESS:-""}
VOLTTRON_SMTP_USERNAME=${VOLTTRON_SMTP_USERNAME:-""}
VOLTTRON_SMTP_PASSWORD=${VOLTTRON_SMTP_PASSWORD:-""}
VOLTTRON_SMTP_PORT=${VOLTTRON_SMTP_PORT:-""}
VOLTTRON_SMTP_TLS=${VOLTTRON_SMTP_TLS:-""}
VOLTTRON_EMAIL_FROM_ADDRESS=${VOLTTRON_EMAIL_FROM_ADDRESS:-""}
VOLTTRON_EMAIL_TO_ADDRESSES=${VOLTTRON_EMAIL_TO_ADDRESSES:-""}
VOLTTRON_EMAIL_ALLOW_FREQUENCY_MINUTES=${VOLTTRON_EMAIL_ALLOW_FREQUENCY_MINUTES:-""}

VOLTTRON_METER_PREFIX=${VOLTTRON_METER_PREFIX:-""}
VOLTTRON_METER_IP=${VOLTTRON_METER_IP:-""}


# Output directory for generated configurations
OUTPUT_DIR=${OUTPUT_DIR:-"/home/user/volttron"}
SITE_JSON="${OUTPUT_DIR}/site.json"

# Legacy support for NUM_CONFIGS (use VOLTTRON_NUM_CONFIGS if available)
NUM_CONFIGS=${VOLTTRON_NUM_CONFIGS:-${NUM_CONFIGS:-"1"}}

# Historian DB settings for Volttron config generation (optional)
HISTORIAN_DB_NAME=${HISTORIAN_DB_NAME:-""}
HISTORIAN_DB_USER=${HISTORIAN_DB_USER:-""}
HISTORIAN_DB_PASSWORD=${HISTORIAN_DB_PASSWORD:-""}
HISTORIAN_DB_HOST=${HISTORIAN_DB_HOST:-""}
HISTORIAN_DB_PORT=${HISTORIAN_DB_PORT:-""}

# Base directories
BASE_DIR="/home/user/configurations"
DOCKER_DIR="${BASE_DIR}/docker"
TEMPLATES_DIR="${BASE_DIR}/templates"

# Lock files for tracking completion status
SETUP_DIR="/home/user/setup"
VOLTTRON_LOCK_FILE="${SETUP_DIR}/.setup_complete"

log_info "Starting Volttron AEMS Edge Setup (Volttron Only)"

# Check setup completion status
VOLTTRON_COMPLETED=false

# Check if Volttron setup is already completed
if [[ -f "${VOLTTRON_LOCK_FILE}" ]]; then
    log_info "Volttron setup lock file found at: ${VOLTTRON_LOCK_FILE}"
    VOLTTRON_COMPLETED=true
    log_info "Volttron setup already completed - nothing to do"
fi

# Exit if Volttron is already completed
if [[ "${VOLTTRON_COMPLETED}" == "true" ]]; then
    log_success "Volttron setup has already been completed. Nothing to do."
    log_info "To force re-run Volttron: delete ${VOLTTRON_LOCK_FILE}"
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


# === VOLTTRON SETUP SECTION ===
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
    pip install -r requirements.txt
    EXIT_CODE=$?

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
    rm -rf "${OUTPUT_DIR:?}/"*
    # Remove all files except platform_config.yml (portable approach)
    # find "${OUTPUT_DIR}" -mindepth 1 -maxdepth 1 ! -name 'platform_config.yml' -exec rm -rf {} +
else
    log_info "Creating output directory: ${OUTPUT_DIR}"
    mkdir -p "${OUTPUT_DIR}"
fi

# Execute the Volttron configuration generation
log_info "Executing Volttron configuration generation"

# Build the command with conditional arguments
GENERATE_CMD="python generate_configs.py \
    --num-configs \"${NUM_CONFIGS}\" \
    --output-dir \"${OUTPUT_DIR}\" \
    --campus \"${VOLTTRON_CAMPUS}\" \
    --building \"${VOLTTRON_BUILDING}\" \
    --prefix \"${VOLTTRON_PREFIX}\" \
    --gateway-address \"${VOLTTRON_GATEWAY_ADDRESS}\" \
    --timezone \"${VOLTTRON_TIMEZONE}\""

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
    GENERATE_CMD="${GENERATE_CMD} --generate_ilc true"
fi

if [[ -n "${VOLTTRON_RTU_OAT_SENSOR_NUMBER}" ]]; then
    GENERATE_CMD="${GENERATE_CMD} --rtu-oat-sensor \"${VOLTTRON_RTU_OAT_SENSOR_NUMBER}\""
fi

if [[ -n "${VOLTTRON_SMTP_ADDRESS}" ]]; then
    GENERATE_CMD="${GENERATE_CMD} --smtp-address \"${VOLTTRON_SMTP_ADDRESS}\""
fi

if [[ -n "${VOLTTRON_SMTP_USERNAME}" ]]; then
    GENERATE_CMD="${GENERATE_CMD} --smtp-username \"${VOLTTRON_SMTP_USERNAME}\""
fi

if [[ -n "${VOLTTRON_SMTP_PASSWORD}" ]]; then
    GENERATE_CMD="${GENERATE_CMD} --smtp-password \"${VOLTTRON_SMTP_PASSWORD}\""
fi

if [[ -n "${VOLTTRON_SMTP_PORT}" ]]; then
    GENERATE_CMD="${GENERATE_CMD} --smtp-port \"${VOLTTRON_SMTP_PORT}\""
fi

if [[ -n "${VOLTTRON_SMTP_TLS}" ]]; then
    GENERATE_CMD="${GENERATE_CMD} --smtp-tls \"${VOLTTRON_SMTP_TLS}\""
fi

if [[ -n "${VOLTTRON_EMAIL_FROM_ADDRESS}" ]]; then
    GENERATE_CMD="${GENERATE_CMD} --from-address \"${VOLTTRON_EMAIL_FROM_ADDRESS}\""
fi

if [[ -n "${VOLTTRON_EMAIL_TO_ADDRESSES}" ]]; then
    GENERATE_CMD="${GENERATE_CMD} --to-addresses ${VOLTTRON_EMAIL_TO_ADDRESSES}"
fi

if [[ -n "${VOLTTRON_EMAIL_ALLOW_FREQUENCY_MINUTES}" ]]; then
    GENERATE_CMD="${GENERATE_CMD} --allow-frequency-minutes \"${VOLTTRON_EMAIL_ALLOW_FREQUENCY_MINUTES}\""
fi

if [[ -n "${VOLTTRON_METER_IP}" ]]; then
    GENERATE_CMD="${GENERATE_CMD} --meter-ip \"${VOLTTRON_METER_IP}\""
fi

if [[ -n "${VOLTTRON_METER_PREFIX}" ]]; then
    GENERATE_CMD="${GENERATE_CMD} --meter-prefix \"${VOLTTRON_METER_PREFIX}\""
fi

# Add Historian DB arguments if they are provided
if [[ -n "${HISTORIAN_DB_NAME}" ]]; then
    GENERATE_CMD="${GENERATE_CMD} --db-name \"${HISTORIAN_DB_NAME}\""
fi
if [[ -n "${HISTORIAN_DB_USER}" ]]; then
    GENERATE_CMD="${GENERATE_CMD} --db-user \"${HISTORIAN_DB_USER}\""
fi
if [[ -n "${HISTORIAN_DB_PASSWORD}" ]]; then
    GENERATE_CMD="${GENERATE_CMD} --db-password \"${HISTORIAN_DB_PASSWORD}\""
fi
if [[ -n "${HISTORIAN_DB_HOST}" ]]; then
    GENERATE_CMD="${GENERATE_CMD} --db-address \"${HISTORIAN_DB_HOST}\""
fi
if [[ -n "${HISTORIAN_DB_PORT}" ]]; then
    GENERATE_CMD="${GENERATE_CMD} --db-port \"${HISTORIAN_DB_PORT}\""
fi

# Log the command, obfuscating the password
LOG_CMD=${GENERATE_CMD}
if [[ -n "${HISTORIAN_DB_PASSWORD}" ]]; then
    LOG_CMD=$(echo "${GENERATE_CMD}" | sed -e "s/--db-password \"[^\"]*\"/--db-password \"\*\*\*\"/")
fi
log_info "Command: ${LOG_CMD}"

# Execute the Python script, allowing all output to go to stdout/stderr
log_info "Starting Python configuration generation..."
log_info "Generate command: ${GENERATE_CMD}"
eval "${GENERATE_CMD}"
EXIT_CODE=$?

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

# Remove SSL configuration from platform_config.yml to use plain HTTP
log_info "Removing SSL configuration from platform_config.yml..."
PLATFORM_CONFIG="${OUTPUT_DIR}/configs/platform_config.yml"
if [[ -f "${PLATFORM_CONFIG}" ]]; then
    # Remove web-ssl-cert, web-ssl-key, and web-secret-key lines
    sed -i '/web-ssl-cert:/d' "${PLATFORM_CONFIG}"
    sed -i '/web-ssl-key:/d' "${PLATFORM_CONFIG}"
    sed -i '/web-secret-key:/d' "${PLATFORM_CONFIG}"
    log_success "SSL configuration removed from platform_config.yml"
    log_info "VOLTTRON will use HTTP without SSL"
else
    log_warning "platform_config.yml not found at ${PLATFORM_CONFIG}"
fi

# Create Volttron completion lock file
log_info "Creating Volttron setup completion lock file: ${VOLTTRON_LOCK_FILE}"
# Ensure the directory exists
mkdir -p "$(dirname "${VOLTTRON_LOCK_FILE}")"
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

# List the contents of the output directory for verification
log_info "Output directory contents:"
ls -la "${OUTPUT_DIR}"

log_success "Volttron AEMS Edge setup process completed!"
log_info "Volttron configuration files generated and copied to: ${OUTPUT_DIR}"
