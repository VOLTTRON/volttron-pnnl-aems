#!/bin/bash
# Script to prepare Grafana build by copying CA certificate from certs volume

set -e

echo "Preparing Grafana build..."

# Get the certs volume name from docker-compose
VOLUME_NAME=$(docker volume ls -q --filter name=certs-data | head -n 1)

if [ -z "$VOLUME_NAME" ]; then
    echo "Error: certs-data volume not found. Please run 'docker-compose up certs' first."
    exit 1
fi

echo "Found certs volume: $VOLUME_NAME"

# Create a temporary container to copy the CA certificate
echo "Copying CA certificate from volume..."
docker run --rm \
    -v "$VOLUME_NAME:/certs:ro" \
    -v "$(pwd):/output" \
    alpine:latest \
    sh -c "cp /certs/ca.crt /output/ca.crt && chmod 644 /output/ca.crt"

echo "CA certificate copied successfully to $(pwd)/ca.crt"
echo "You can now build Grafana with: docker-compose build grafana"
