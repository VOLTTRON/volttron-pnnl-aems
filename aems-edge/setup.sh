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

# Set default values for environment variables if not provided
VOLTTRON_CAMPUS=${VOLTTRON_CAMPUS:-"PNNL"}
VOLTTRON_BUILDING=${VOLTTRON_BUILDING:-"ROB"}
VOLTTRON_PREFIX=${VOLTTRON_PREFIX:-"rtu"}
VOLTTRON_GATEWAY_ADDRESS=${VOLTTRON_GATEWAY_ADDRESS:-"192.168.0.1"}
VOLTTRON_TIMEZONE=${VOLTTRON_TIMEZONE:-"America/Los_Angeles"}
OUTPUT_DIR=${OUTPUT_DIR:-"/home/user/configs/"}
NUM_CONFIGS=${NUM_CONFIGS:-"1"}

# Base directories
BASE_DIR="/home/user"
CONFIGURATIONS_DIR="${BASE_DIR}/configurations"
DOCKER_DIR="${CONFIGURATIONS_DIR}/docker"
SITE_JSON="${CONFIGURATIONS_DIR}/site.json"
TEMPLATES_DIR="${CONFIGURATIONS_DIR}/templates"
LOCK_FILE="${OUTPUT_DIR}/.setup_complete"

log_info "Starting Volttron AEMS Edge Setup"

# Check if setup has already been completed
if [[ -f "${LOCK_FILE}" ]]; then
    log_info "Setup lock file found at: ${LOCK_FILE}"
    log_success "Setup has already been completed. Skipping setup process."
    log_info "To force re-run setup, delete the lock file: ${LOCK_FILE}"
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

# Verify required directories exist
if [[ ! -d "${DOCKER_DIR}" ]]; then
    log_error "Docker configuration directory not found: ${DOCKER_DIR}"
    exit 1
fi

if [[ ! -f "${SITE_JSON}" ]]; then
    log_error "Site configuration file not found: ${SITE_JSON}"
    exit 1
fi

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
else
    log_warning "requirements.txt not found, skipping dependency installation"
fi

# Create output directory if it doesn't exist
log_info "Creating output directory: ${OUTPUT_DIR}"
mkdir -p "${OUTPUT_DIR}"

# Execute the Volttron configuration generation
log_info "Executing Volttron configuration generation"
python generate_configs.py \
    -n "${NUM_CONFIGS}" \
    --output-dir "${OUTPUT_DIR}" \
    --campus "${VOLTTRON_CAMPUS}" \
    --building "${VOLTTRON_BUILDING}" \
    --prefix "${VOLTTRON_PREFIX}" \
    -g "${VOLTTRON_GATEWAY_ADDRESS}" \
    -t "${VOLTTRON_TIMEZONE}"

if [[ $? -eq 0 ]]; then
    log_success "Configuration generation completed successfully"
else
    log_error "Configuration generation failed"
    exit 1
fi

# Copy site.json to the output directory
log_info "Copying site.json to output directory"
cp "${SITE_JSON}" "${OUTPUT_DIR}/"
if [[ $? -eq 0 ]]; then
    log_success "site.json copied successfully"
else
    log_error "Failed to copy site.json"
    exit 1
fi

# Copy templates directory to the output directory
log_info "Copying templates directory to output directory"
cp -r "${TEMPLATES_DIR}" "${OUTPUT_DIR}/"
if [[ $? -eq 0 ]]; then
    log_success "Templates directory copied successfully"
else
    log_error "Failed to copy templates directory"
    exit 1
fi

# Create lock file to indicate successful completion
log_info "Creating setup completion lock file: ${LOCK_FILE}"
echo "Setup completed on $(date)" > "${LOCK_FILE}"
echo "Campus: ${VOLTTRON_CAMPUS}" >> "${LOCK_FILE}"
echo "Building: ${VOLTTRON_BUILDING}" >> "${LOCK_FILE}"
echo "Prefix: ${VOLTTRON_PREFIX}" >> "${LOCK_FILE}"
echo "Gateway Address: ${VOLTTRON_GATEWAY_ADDRESS}" >> "${LOCK_FILE}"
echo "Timezone: ${VOLTTRON_TIMEZONE}" >> "${LOCK_FILE}"
echo "Number of Configs: ${NUM_CONFIGS}" >> "${LOCK_FILE}"

if [[ $? -eq 0 ]]; then
    log_success "Lock file created successfully"
else
    log_warning "Failed to create lock file, but setup completed successfully"
fi

# List the contents of the output directory for verification
log_info "Setup completed. Output directory contents:"
ls -la "${OUTPUT_DIR}"

log_success "Volttron AEMS Edge setup completed successfully!"
log_info "All configuration files have been generated and copied to: ${OUTPUT_DIR}"
log_info "Lock file created at: ${LOCK_FILE}"
