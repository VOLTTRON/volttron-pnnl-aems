#!/bin/sh
#
# Install the mkcert CA from the running proxy container into the system and
# browser trust stores so that https://<APP_HOSTNAME> works without warnings.
#
# Run once after the first `docker compose up -d`, and again any time the
# certs-data volume is recreated (e.g. after `docker compose down -v`).
#
# Usage:
#   ./trust-ca.sh            # auto-detect proxy container from .env
#   ./trust-ca.sh --dry-run  # print what would be done without executing
#
# Must be run from the repo root. Requires sudo on Linux for system store.

set -e

ENV_FILE=".env"
CA_CERT_PATH="/etc/certs/mkcert-ca.crt"
TMP_CA="/tmp/mkcert-ca.crt"

# ── arg parsing ────────────────────────────────────────────────────────────────
DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h|--help)
      printf 'Usage: ./trust-ca.sh [--dry-run]\n\n'
      printf 'Install the mkcert CA certificate from the running proxy container\n'
      printf 'into the system trust store so that https://<APP_HOSTNAME> works\n'
      printf 'without certificate warnings in browsers.\n\n'
      printf 'Run once after first deploy, and again after docker compose down -v.\n'
      exit 0
      ;;
    *) printf 'Unknown argument: %s\n' "$arg" >&2; exit 1 ;;
  esac
done

# ── color helpers ──────────────────────────────────────────────────────────────
if [ -t 1 ]; then
  GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'
  BLUE='\033[0;34m'; BOLD='\033[1m'; RESET='\033[0m'
else
  GREEN=''; YELLOW=''; RED=''; BLUE=''; BOLD=''; RESET=''
fi

info() { printf "${BLUE}  →${RESET}  %s\n" "$1"; }
ok()   { printf "${GREEN}  ✓${RESET}  %s\n" "$1"; }
warn() { printf "${YELLOW}  !${RESET}  %s\n" "$1"; }
err()  { printf "${RED}  ✗${RESET}  %s\n" "$1" >&2; }
dry()  { printf "${YELLOW}  [dry-run]${RESET} %s\n" "$1"; }

# ── helpers ────────────────────────────────────────────────────────────────────
get_value() {
  grep -v '^\s*#' "$1" | grep "^${2}=" | head -1 | sed 's/^[^=]*=//'
}

run_or_dry() {
  if [ "$DRY_RUN" = 1 ]; then dry "$*"; else eval "$@"; fi
}

# ── pre-flight ─────────────────────────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  err "$ENV_FILE not found — run from the repo root."
  exit 1
fi

PROJECT=$(get_value "$ENV_FILE" "COMPOSE_PROJECT_NAME")
PROJECT="${PROJECT:-skeleton}"
PROXY_CONTAINER="${PROJECT}-proxy"

printf "\n${BOLD}Install mkcert CA${RESET}"
[ "$DRY_RUN" = 1 ] && printf " ${YELLOW}(dry-run)${RESET}"
printf "\n\n"

# ── check proxy container is running ──────────────────────────────────────────
info "Looking for container: $PROXY_CONTAINER"
if ! docker ps --format '{{.Names}}' | grep -q "^${PROXY_CONTAINER}$"; then
  err "Container $PROXY_CONTAINER is not running."
  printf "\n  Start the stack first:\n    docker compose up -d\n\n"
  exit 1
fi
ok "Container running"

# ── copy CA cert from container ───────────────────────────────────────────────
info "Copying CA from ${PROXY_CONTAINER}:${CA_CERT_PATH}"
if [ "$DRY_RUN" = 0 ]; then
  docker cp "${PROXY_CONTAINER}:${CA_CERT_PATH}" "$TMP_CA"
fi
ok "CA cert extracted to $TMP_CA"

# ── detect OS and install ──────────────────────────────────────────────────────
OS=$(uname -s)

case "$OS" in
  Darwin)
    # macOS — add to login keychain (no sudo needed), mark as always trusted
    info "macOS detected — installing into login keychain"
    run_or_dry "security add-trusted-cert -d -r trustRoot -k ~/Library/Keychains/login.keychain-db '$TMP_CA'"
    ok "Installed into macOS login keychain"
    printf "\n  Restart Chrome/Edge to pick up the new CA.\n"
    printf "  Firefox: import manually via Settings → Privacy → Certificates → View Certificates → Authorities.\n\n"
    ;;

  Linux)
    info "Linux detected — detecting distribution"

    if [ -f /etc/debian_version ] || [ -f /etc/ubuntu-release ] || \
       { [ -f /etc/os-release ] && grep -qi "debian\|ubuntu\|mint" /etc/os-release; }; then
      # Debian / Ubuntu
      STORE_DIR="/usr/local/share/ca-certificates"
      info "Debian/Ubuntu — installing to $STORE_DIR"
      run_or_dry "sudo cp '$TMP_CA' '${STORE_DIR}/mkcert-skeleton-ca.crt'"
      run_or_dry "sudo update-ca-certificates"
      ok "System trust store updated"

    elif [ -f /etc/redhat-release ] || \
         { [ -f /etc/os-release ] && grep -qi "rhel\|centos\|fedora\|rocky\|alma" /etc/os-release; }; then
      # RHEL / CentOS / Fedora
      STORE_DIR="/etc/pki/ca-trust/source/anchors"
      info "RHEL/Fedora — installing to $STORE_DIR"
      run_or_dry "sudo cp '$TMP_CA' '${STORE_DIR}/mkcert-skeleton-ca.crt'"
      run_or_dry "sudo update-ca-trust extract"
      ok "System trust store updated"

    elif [ -f /etc/arch-release ] || \
         { [ -f /etc/os-release ] && grep -qi "arch\|manjaro" /etc/os-release; }; then
      # Arch Linux
      STORE_DIR="/etc/ca-certificates/trust-source/anchors"
      info "Arch Linux — installing to $STORE_DIR"
      run_or_dry "sudo cp '$TMP_CA' '${STORE_DIR}/mkcert-skeleton-ca.crt'"
      run_or_dry "sudo trust extract-compat"
      ok "System trust store updated"

    else
      warn "Unrecognised Linux distribution."
      warn "Copy $TMP_CA into your distro's CA trust anchor directory"
      warn "and run the appropriate update command (e.g. update-ca-certificates)."
    fi

    # Chrome/Chromium on Linux uses the NSS shared DB
    if command -v certutil > /dev/null 2>&1; then
      info "Installing into Chrome/Chromium NSS databases"
      INSTALLED=0
      for NSS_DB in \
        "$HOME/.pki/nssdb" \
        "$HOME/snap/chromium/current/.pki/nssdb" \
        "$HOME/.config/google-chrome/NSSCertificateDB"
      do
        if [ -d "$NSS_DB" ]; then
          run_or_dry "certutil -A -n 'mkcert-skeleton-ca' -t 'CT,,' -i '$TMP_CA' -d 'sql:${NSS_DB}'"
          ok "Installed into NSS DB: $NSS_DB"
          INSTALLED=$((INSTALLED + 1))
        fi
      done
      if [ "$INSTALLED" = 0 ]; then
        warn "No Chrome/Chromium NSS DB found — Chrome may still show a warning."
        warn "Create the DB with: mkdir -p ~/.pki/nssdb && certutil -N -d sql:~/.pki/nssdb --empty-password"
        warn "Then re-run this script."
      fi
    else
      warn "certutil not found — Chrome/Chromium NSS store not updated."
      warn "Install libnss3-tools (Debian/Ubuntu) or nss-tools (RHEL) and re-run."
    fi

    printf "\n  Restart Chrome/Edge to pick up the new CA.\n"
    printf "  Firefox: import manually via Settings → Privacy → Certificates → View Certificates → Authorities.\n\n"
    ;;

  *)
    err "Unsupported OS: $OS"
    printf "\n  Copy $TMP_CA into your system trust store manually.\n\n"
    exit 1
    ;;
esac

ok "Done — https://$(get_value "$ENV_FILE" "APP_HOSTNAME") should now be trusted."
printf "\n"
