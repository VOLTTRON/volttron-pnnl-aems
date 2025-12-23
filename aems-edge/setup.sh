#!/bin/bash

# AEMS Edge Setup Router Script
# This script determines which setup to run based on SETUP_MODE environment variable

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

# Set default value for SETUP_MODE
SETUP_MODE=${SETUP_MODE:-"both"}

log_info "Starting AEMS Edge Setup Router"
log_info "Setup Mode: ${SETUP_MODE}"

# Base directory
BASE_DIR="/home/user"

# Determine which setup script to run based on SETUP_MODE
case "${SETUP_MODE}" in
    "volttron")
        log_info "=== Running Volttron-only Setup ==="
        if [[ -f "${BASE_DIR}/setup-volttron.sh" ]]; then
            chmod +x "${BASE_DIR}/setup-volttron.sh"
            exec "${BASE_DIR}/setup-volttron.sh"
        else
            log_error "Volttron setup script not found at: ${BASE_DIR}/setup-volttron.sh"
            exit 1
        fi
        ;;
    "grafana")
        log_info "=== Running Grafana-only Setup ==="
        if [[ -f "${BASE_DIR}/setup-grafana.sh" ]]; then
            chmod +x "${BASE_DIR}/setup-grafana.sh"
            exec "${BASE_DIR}/setup-grafana.sh"
        else
            log_error "Grafana setup script not found at: ${BASE_DIR}/setup-grafana.sh"
            exit 1
        fi
        ;;
    "both")
        log_info "=== Running Both Volttron and Grafana Setup (Legacy Mode) ==="
        log_warning "Using legacy 'both' mode - consider using separate containers with SETUP_MODE=volttron and SETUP_MODE=grafana for better separation"
        
        # Run Volttron setup first
        if [[ -f "${BASE_DIR}/setup-volttron.sh" ]]; then
            log_info "Running Volttron setup..."
            chmod +x "${BASE_DIR}/setup-volttron.sh"
            "${BASE_DIR}/setup-volttron.sh"
            VOLTTRON_EXIT_CODE=$?
            if [[ ${VOLTTRON_EXIT_CODE} -ne 0 ]]; then
                log_error "Volttron setup failed with exit code ${VOLTTRON_EXIT_CODE}"
                exit ${VOLTTRON_EXIT_CODE}
            fi
        else
            log_error "Volttron setup script not found at: ${BASE_DIR}/setup-volttron.sh"
            exit 1
        fi
        
        # Run Grafana setup second
        if [[ -f "${BASE_DIR}/setup-grafana.sh" ]]; then
            log_info "Running Grafana setup..."
            chmod +x "${BASE_DIR}/setup-grafana.sh"
            "${BASE_DIR}/setup-grafana.sh"
            GRAFANA_EXIT_CODE=$?
            if [[ ${GRAFANA_EXIT_CODE} -ne 0 ]]; then
                log_warning "Grafana setup failed with exit code ${GRAFANA_EXIT_CODE}, but continuing"
            else
                log_success "Grafana setup completed successfully"
            fi
        else
            log_warning "Grafana setup script not found at: ${BASE_DIR}/setup-grafana.sh, skipping Grafana setup"
        fi
        
        log_success "Both Volttron and Grafana setup completed!"
        ;;
    *)
        log_error "Invalid SETUP_MODE: ${SETUP_MODE}"
        log_error "Valid values are: volttron, grafana, both"
        exit 1
        ;;
esac
