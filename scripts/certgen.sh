#!/bin/bash

# Variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT_DIR="$SCRIPT_DIR/../certs"
CA_PRIVATE_KEY="$CERT_DIR/ca_private.key"
CA_CERTIFICATE="$CERT_DIR/ca_certificate.crt"
DAYS_VALID_CA=3650  # 10 years for CA certificate
DAYS_VALID_CERT=3650  # 10 years for issued certificates

# Function to generate a CA certificate
generate_ca_cert() {
  mkdir -p "$CERT_DIR"
  # Generate CA private key
  openssl genpkey -algorithm RSA -out "$CA_PRIVATE_KEY"
  # Generate CA certificate
  openssl req -x509 -new -key "$CA_PRIVATE_KEY" -out "$CA_CERTIFICATE" -days $DAYS_VALID_CA -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=MyCA"
  echo "CA certificate generated at $CA_CERTIFICATE"
}

# Function to check if common name is a valid domain or IP
is_valid_domain_or_ip() {
  local domain_or_ip="$1"
  local DOMAIN_REGEX="^(([a-zA-Z0-9](-*[a-zA-Z0-9])*).)+([A-Za-z]{2,})$"
  local IP_REGEX="^([0-9]{1,3}\.){3}[0-9]{1,3}$"
  [[ $domain_or_ip =~ $DOMAIN_REGEX || $domain_or_ip =~ $IP_REGEX ]]
}

# Function to generate a new certificate signed by the CA
generate_signed_cert() {
  # Check if common name and IP are provided
  if [ -z "$1" ]; then
    echo "Usage: $0 generate <common_name> [--client|--server] [--ip <ip_address>]"
    exit 1
  fi

  LOCAL_COMMON_NAME=$1
  CERT_TYPE=${2:-"--client"}
  LOCAL_IP_ADDRESS=$4  # Assuming --ip is provided as the fourth argument if present

  # Validate common name format
  if ! is_valid_domain_or_ip "$LOCAL_COMMON_NAME"; then
    echo "Error: Common name '$LOCAL_COMMON_NAME' is not a valid domain or IP address format."
    exit 1
  fi

  # Define dynamic file paths based on the common name
  NEW_PRIVATE_KEY="$CERT_DIR/${LOCAL_COMMON_NAME}_private.key"
  NEW_CERTIFICATE="$CERT_DIR/${LOCAL_COMMON_NAME}_certificate.crt"
  CSR_FILE="$CERT_DIR/${LOCAL_COMMON_NAME}_request.csr"

  # Check if CA certificate exists
  if [ ! -f "$CA_CERTIFICATE" ]; then
    echo "CA certificate not found at $CA_CERTIFICATE. Please generate the CA certificate first."
    exit 1
  fi
  mkdir -p "$CERT_DIR"

  # Generate new private key
  openssl genpkey -algorithm RSA -out "$NEW_PRIVATE_KEY"

  # Prepare extensions for SAN
  SAN_EXT="DNS:$LOCAL_COMMON_NAME"
  if [ -n "$LOCAL_IP_ADDRESS" ]; then
    if [[ $LOCAL_IP_ADDRESS =~ $IP_REGEX ]]; then
      SAN_EXT="$SAN_EXT,IP:$LOCAL_IP_ADDRESS"
    else
      echo "Error: IP address '$LOCAL_IP_ADDRESS' is not valid."
      exit 1
    fi
  fi

  # Generate certificate signing request (CSR) with appropriate extensions
  openssl req -new -key "$NEW_PRIVATE_KEY" -out "$CSR_FILE" -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=$LOCAL_COMMON_NAME" -addext "subjectAltName=$SAN_EXT" -addext "keyUsage=digitalSignature,keyEncipherment" -addext "extendedKeyUsage=${CERT_TYPE#--}Auth"

  # Sign the CSR with the CA certificate
  openssl x509 -req -in "$CSR_FILE" -CA "$CA_CERTIFICATE" -CAkey "$CA_PRIVATE_KEY" -CAcreateserial -out "$NEW_CERTIFICATE" -days $DAYS_VALID_CERT
  echo "Certificate generated for $LOCAL_COMMON_NAME at $NEW_CERTIFICATE with type $CERT_TYPE and validity of 10 years"
}

# Main script logic
if [ "$1" == "ca" ]; then
  generate_ca_cert
elif [ "$1" == "generate" ] && [ -n "$2" ]; then
  generate_signed_cert "$2" "$3" "$4" "$5"
else
  echo "Usage: $0 ca | generate <common_name> [--client|--server] [--ip <ip_address>]"
  exit 1
fi
