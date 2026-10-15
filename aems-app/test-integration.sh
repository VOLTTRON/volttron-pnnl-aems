#!/bin/bash

# Build, start, and test the Docker Compose stack using the standard project scripts,
# then stop the stack. Exercises start-services.sh and stop-services.sh end-to-end.
#
# Usage: ./test-integration.sh [OPTIONS]
#
# Options:
#   --skip-install    Skip npm install + playwright install (faster on repeat runs)
#   --no-start        Don't start the stack (assume it's already running)
#   --no-stop         Don't stop the stack after tests (useful for debugging failures)
#   -h, --help        Show this help message

SKIP_INSTALL=false
NO_START=false
NO_STOP=false
NO_BUILD=false
STACK_STARTED=false

for arg in "$@"; do
    case "$arg" in
        -h|--help)
            echo -e "\033[1;33mUsage: test-integration.sh [OPTIONS]\033[0m"
            echo ""
            echo "Start the Docker Compose stack, run Playwright integration tests,"
            echo "write an HTML report, then stop the stack."
            echo ""
            echo "Options:"
            echo "  --skip-install    Skip npm install + playwright install (faster on repeat runs)"
            echo "  --no-build        Skip 'docker compose build' (use existing images)"
            echo "  --no-start        Don't start the stack (assume it's already running)"
            echo "  --no-stop         Don't stop the stack after tests (useful for debugging)"
            echo "  -h, --help        Show this help message"
            echo ""
            echo "Reads from:"
            echo "  .env              APP_HOSTNAME, KEYCLOAK_ADMIN"
            echo "  .env.secrets      KEYCLOAK_ADMIN_PASSWORD (preferred over .env)"
            echo ""
            echo "Output:"
            echo "  scripts/playwright-report/index.html"
            exit 0
            ;;
        --skip-install) SKIP_INSTALL=true ;;
        --no-build)     NO_BUILD=true ;;
        --no-start)     NO_START=true ;;
        --no-stop)      NO_STOP=true ;;
        *) echo -e "\033[1;31mUnknown option: $arg\033[0m"; echo "Use -h for help"; exit 1 ;;
    esac
done

STARTING_PATH=$(pwd)
TEST_EXIT=0

print_blue()   { echo -e "\033[1;34m$1\033[0m"; }
print_cyan()   { echo -e "\033[1;36m$1\033[0m"; }
print_green()  { echo -e "\033[1;32m$1\033[0m"; }
print_yellow() { echo -e "\033[1;33m$1\033[0m"; }
print_red()    { echo -e "\033[1;31m$1\033[0m"; }

# ── Cleanup on exit ────────────────────────────────────────────────────────────

cleanup() {
    cd "$STARTING_PATH"
    if [ "$STACK_STARTED" = true ] && [ "$NO_STOP" = false ]; then
        print_blue "Stopping Docker Compose stack..."
        ./stop-services.sh || true
    fi
}
trap cleanup EXIT

# ── Load environment ───────────────────────────────────────────────────────────

read_env_var() {
    local file="$1" key="$2"
    grep "^${key}=" "$file" 2>/dev/null | head -1 | cut -d'=' -f2- | tr -d '"' | sed "s/^'//;s/'$//"
}

APP_HOSTNAME=""
KEYCLOAK_ADMIN="admin"
KEYCLOAK_ADMIN_PASSWORD=""

for env_file in "server/.env" ".env"; do
    [ -f "$env_file" ] || continue
    val=$(read_env_var "$env_file" "APP_HOSTNAME");   [ -n "$val" ] && APP_HOSTNAME="$val"
    val=$(read_env_var "$env_file" "KEYCLOAK_ADMIN"); [ -n "$val" ] && KEYCLOAK_ADMIN="$val"
done

for secrets_file in ".env.secrets" "server/.env.secrets"; do
    [ -f "$secrets_file" ] || continue
    val=$(read_env_var "$secrets_file" "KEYCLOAK_ADMIN_PASSWORD")
    [ -n "$val" ] && KEYCLOAK_ADMIN_PASSWORD="$val"
done
if [ -z "$KEYCLOAK_ADMIN_PASSWORD" ]; then
    val=$(read_env_var ".env" "KEYCLOAK_ADMIN_PASSWORD")
    case "$val" in SeT_tHiS_iN*) ;; *) KEYCLOAK_ADMIN_PASSWORD="$val" ;; esac
fi

if [ -z "$APP_HOSTNAME" ]; then
    print_red "Error: APP_HOSTNAME is not set in .env"; exit 1
fi
if [ -z "$KEYCLOAK_ADMIN_PASSWORD" ]; then
    print_red "Error: KEYCLOAK_ADMIN_PASSWORD is not set in .env.secrets or .env"; exit 1
fi

print_blue "Integration test configuration:"
print_cyan "  APP_HOSTNAME:  $APP_HOSTNAME"
print_cyan "  Report:        scripts/playwright-report/index.html"

# ── Install test dependencies ──────────────────────────────────────────────────

cd scripts
if [ "$SKIP_INSTALL" = false ]; then
    print_blue "Installing test dependencies..."
    npm install
    npx playwright install chromium --with-deps
fi
cd "$STARTING_PATH"

# ── Start the stack ────────────────────────────────────────────────────────────

if [ "$NO_START" = false ]; then
    print_blue "Starting Docker Compose stack..."
    if [ "$NO_BUILD" = true ]; then
        ./start-services.sh --no-build
    else
        ./start-services.sh
    fi
    STACK_STARTED=true
fi

# ── Wait for Keycloak ──────────────────────────────────────────────────────────

wait_for_url() {
    local url="$1" label="$2" timeout="${3:-600}"
    local elapsed=0 http_code
    print_blue "Waiting for $label to be ready..."
    print_cyan "  URL: $url"
    until http_code=$(curl --silent --insecure --max-time 5 -o /dev/null -w "%{http_code}" "$url" 2>/dev/null) && \
          [ -n "$http_code" ] && [ "$http_code" -lt 500 ] && [ "$http_code" -gt 0 ]; do
        if [ "$elapsed" -ge "$timeout" ]; then
            print_red "Timed out waiting for $label after ${timeout}s"
            print_yellow "Last HTTP status: ${http_code:-none}"
            print_yellow "To debug: curl -v --insecure '$url'"
            exit 1
        fi
        sleep 5
        elapsed=$((elapsed + 5))
        if [ -n "$http_code" ] && [ "$http_code" -gt 0 ]; then
            print_cyan "  ...waiting (${elapsed}s, HTTP ${http_code})"
        else
            print_cyan "  ...waiting (${elapsed}s, no response)"
        fi
    done
    print_green "$label is ready (HTTP ${http_code})."
}

KEYCLOAK_URL="https://${APP_HOSTNAME}/auth/sso/realms/default/.well-known/openid-configuration"
wait_for_url "$KEYCLOAK_URL" "Keycloak" 600

APP_URL="https://${APP_HOSTNAME}/"
wait_for_url "$APP_URL" "App" 300

# ── Copy mkcert CA cert for Node TLS verification ─────────────────────────────

COMPOSE_PROJECT_NAME=$(grep "^COMPOSE_PROJECT_NAME=" .env 2>/dev/null | head -1 | cut -d'=' -f2- | tr -d '"' | sed "s/^'//;s/'$//")
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-skeleton}"
PROXY_CONTAINER="${COMPOSE_PROJECT_NAME}-proxy"
CA_CERT_PATH="scripts/.auth/mkcert-ca.crt"

mkdir -p scripts/.auth
print_blue "Copying mkcert CA cert from ${PROXY_CONTAINER}..."
if docker cp "${PROXY_CONTAINER}:/etc/certs/mkcert-ca.crt" "$CA_CERT_PATH" 2>/dev/null; then
    print_green "CA cert copied to ${CA_CERT_PATH}."
else
    print_yellow "Warning: could not copy CA cert from ${PROXY_CONTAINER} - Node fetch() may fail TLS verification."
fi

# ── Run tests ──────────────────────────────────────────────────────────────────

print_blue "Running integration tests..."
cd scripts
APP_HOSTNAME="$APP_HOSTNAME" \
KEYCLOAK_ADMIN="$KEYCLOAK_ADMIN" \
KEYCLOAK_ADMIN_PASSWORD="$KEYCLOAK_ADMIN_PASSWORD" \
NODE_EXTRA_CA_CERTS="../${CA_CERT_PATH}" \
npx playwright test
TEST_EXIT=$?
cd "$STARTING_PATH"

# ── Report ─────────────────────────────────────────────────────────────────────

if [ $TEST_EXIT -eq 0 ]; then
    print_green "All integration tests passed."
else
    print_red "Some integration tests failed (exit $TEST_EXIT)."
fi
print_cyan "Report: scripts/playwright-report/index.html"
print_cyan "To open: cd scripts && npx playwright show-report"

exit $TEST_EXIT
