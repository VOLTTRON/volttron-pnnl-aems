#!/bin/bash

# Script to add client roles mapper to Keycloak grafana-oauth client
# This enables Grafana to receive RTU-specific roles in the JWT token

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f "docker/.env.keycloak" ]; then
    source docker/.env.keycloak
else
    echo -e "${RED}Error: docker/.env.keycloak not found${NC}"
    exit 1
fi

# Configuration
KEYCLOAK_URL="${KEYCLOAK_URL:-http://keycloak:8080/auth/sso}"
KEYCLOAK_REALM="${KEYCLOAK_REALM:-default}"
KEYCLOAK_ADMIN="${KEYCLOAK_ADMIN:-admin}"
KEYCLOAK_ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD}"
CLIENT_ID="grafana-oauth"

echo -e "${BLUE}=== Keycloak Grafana Client Mapper Configuration ===${NC}"
echo "Keycloak URL: $KEYCLOAK_URL"
echo "Realm: $KEYCLOAK_REALM"
echo "Client ID: $CLIENT_ID"
echo ""

# Get admin token
echo -e "${BLUE}[1/5]${NC} Authenticating with Keycloak..."
TOKEN_RESPONSE=$(curl -s -X POST \
    "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=${KEYCLOAK_ADMIN}" \
    -d "password=${KEYCLOAK_ADMIN_PASSWORD}" \
    -d "grant_type=password" \
    -d "client_id=admin-cli")

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')

if [ "$ACCESS_TOKEN" == "null" ] || [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${RED}Failed to authenticate with Keycloak${NC}"
    echo "Response: $TOKEN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Authenticated successfully${NC}"

# Get grafana-oauth client UUID
echo -e "${BLUE}[2/5]${NC} Finding grafana-oauth client..."
CLIENTS_RESPONSE=$(curl -s -X GET \
    "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/clients?clientId=${CLIENT_ID}" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}")

CLIENT_UUID=$(echo "$CLIENTS_RESPONSE" | jq -r '.[0].id')

if [ "$CLIENT_UUID" == "null" ] || [ -z "$CLIENT_UUID" ]; then
    echo -e "${RED}Failed to find grafana-oauth client${NC}"
    echo "Response: $CLIENTS_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Found client UUID: ${CLIENT_UUID}${NC}"

# Check if mapper already exists
echo -e "${BLUE}[3/5]${NC} Checking for existing client roles mapper..."
MAPPERS_RESPONSE=$(curl -s -X GET \
    "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/clients/${CLIENT_UUID}/protocol-mappers/models" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}")

EXISTING_MAPPER=$(echo "$MAPPERS_RESPONSE" | jq -r '.[] | select(.name == "grafana client roles") | .id')

if [ "$EXISTING_MAPPER" != "null" ] && [ -n "$EXISTING_MAPPER" ]; then
    echo -e "${YELLOW}⚠ Client roles mapper already exists (ID: ${EXISTING_MAPPER})${NC}"
    echo -e "${YELLOW}  Deleting existing mapper...${NC}"
    
    DELETE_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE \
        "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/clients/${CLIENT_UUID}/protocol-mappers/models/${EXISTING_MAPPER}" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}")
    
    HTTP_CODE=$(echo "$DELETE_RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" -eq 204 ]; then
        echo -e "${GREEN}✓ Deleted existing mapper${NC}"
    else
        echo -e "${RED}Failed to delete existing mapper (HTTP $HTTP_CODE)${NC}"
    fi
fi

# Create new protocol mapper for client roles
echo -e "${BLUE}[4/5]${NC} Creating client roles protocol mapper..."

MAPPER_CONFIG='{
  "name": "grafana client roles",
  "protocol": "openid-connect",
  "protocolMapper": "oidc-usermodel-client-role-mapper",
  "consentRequired": false,
  "config": {
    "claim.name": "roles",
    "jsonType.label": "String",
    "id.token.claim": "true",
    "access.token.claim": "true",
    "userinfo.token.claim": "true",
    "multivalued": "true",
    "usermodel.clientRoleMapping.clientId": "grafana-oauth"
  }
}'

CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/clients/${CLIENT_UUID}/protocol-mappers/models" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$MAPPER_CONFIG")

HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$CREATE_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}✓ Protocol mapper created successfully${NC}"
else
    echo -e "${RED}Failed to create protocol mapper (HTTP $HTTP_CODE)${NC}"
    echo "Response: $RESPONSE_BODY"
    exit 1
fi

# Verify the mapper was created
echo -e "${BLUE}[5/5]${NC} Verifying mapper configuration..."
VERIFY_RESPONSE=$(curl -s -X GET \
    "${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/clients/${CLIENT_UUID}/protocol-mappers/models" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}")

MAPPER_EXISTS=$(echo "$VERIFY_RESPONSE" | jq -r '.[] | select(.name == "grafana client roles") | .name')

if [ "$MAPPER_EXISTS" == "grafana client roles" ]; then
    echo -e "${GREEN}✓ Mapper verified successfully${NC}"
else
    echo -e "${RED}Failed to verify mapper${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=== Configuration Complete ===${NC}"
echo ""
echo -e "${YELLOW}Important:${NC} Users must log out and log back in to Grafana for the new roles to take effect."
echo "The JWT token needs to be refreshed to include the client roles."
echo ""
echo "Next steps:"
echo "1. Log out of Grafana"
echo "2. Log back in"
echo "3. Test dashboard access with RTU-specific roles"
