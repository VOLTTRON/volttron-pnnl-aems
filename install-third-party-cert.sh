#!/bin/sh
#
# Install a third-party TLS certificate into the Skeleton Traefik proxy.
#
# Copies cert / key / (optional) CA bundle into the `certs-data` Docker volume
# where Traefik reads them from /etc/certs/, rewrites
# docker/proxy/certs-traefik.yml to reference the new filenames (with a
# timestamped backup), and restarts the proxy service.
#
# The deployment guide's "Third-Party Certificate" section instructs
# operators to drop cert files into docker/proxy/ and edit the YAML by hand,
# but docker/proxy/ is not bind-mounted as a directory into the Traefik
# container -- only individual YAML files inside it are. Certs live in the
# certs-data named volume. This script bridges that gap.
#
# Usage:
#   ./install-third-party-cert.sh --cert server.crt --key server.key
#   ./install-third-party-cert.sh --cert server.crt --key server.key \
#       --ca-bundle chain.crt --name my-domain
#   ./install-third-party-cert.sh --cert ... --key ... --dry-run
#
# Must be run from the skeleton/ repo root. Requires docker on PATH.

set -e

ENV_FILE=".env"
YAML_FILE="docker/proxy/certs-traefik.yml"

# -- arg parsing --------------------------------------------------------------
CERT_PATH=""
KEY_PATH=""
CA_BUNDLE=""
NAME="custom"
SKIP_RESTART=0
FORCE=0
DRY_RUN=0

usage() {
  cat <<'EOF'
Usage:
  ./install-third-party-cert.sh --cert <path> --key <path> [options]
  ./install-third-party-cert.sh -h | --help

Required:
  --cert <path>        PEM-encoded server certificate (leaf + optional chain).
  --key  <path>        PEM-encoded private key that matches --cert.

Optional:
  --ca-bundle <path>   PEM CA / intermediate chain (installed as <slug>-ca.crt).
  --name <slug>        Filename slug in the volume. Default: custom. Legal:
                       [A-Za-z0-9._-]+; may not start with "mkcert-".
  --skip-restart       Copy + rewrite YAML, but do not restart the proxy.
  --force              Rewrite YAML even if it's not in the shipped form.
  --dry-run            Print every mutating action without executing it.
  -h, --help           Show this help and exit.
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --cert)       CERT_PATH="$2"; shift 2 ;;
    --key)        KEY_PATH="$2"; shift 2 ;;
    --ca-bundle)  CA_BUNDLE="$2"; shift 2 ;;
    --name)       NAME="$2"; shift 2 ;;
    --skip-restart) SKIP_RESTART=1; shift ;;
    --force)      FORCE=1; shift ;;
    --dry-run)    DRY_RUN=1; shift ;;
    -h|--help)    usage; exit 0 ;;
    *) printf 'Unknown argument: %s\n\n' "$1" >&2; usage >&2; exit 1 ;;
  esac
done

# -- color helpers ------------------------------------------------------------
if [ -t 1 ]; then
  GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'
  BLUE='\033[0;34m'; BOLD='\033[1m'; RESET='\033[0m'
else
  GREEN=''; YELLOW=''; RED=''; BLUE=''; BOLD=''; RESET=''
fi

info() { printf "${BLUE}  ->${RESET}  %s\n" "$1"; }
ok()   { printf "${GREEN}  v${RESET}   %s\n" "$1"; }
warn() { printf "${YELLOW}  !${RESET}   %s\n" "$1"; }
err()  { printf "${RED}  x${RESET}   %s\n" "$1" >&2; }
dry()  { printf "${YELLOW}  [dry-run]${RESET} %s\n" "$1"; }

# -- helpers ------------------------------------------------------------------
get_value() {
  grep -v '^\s*#' "$1" | grep "^${2}=" | head -1 | sed 's/^[^=]*=//'
}

run_or_dry() {
  if [ "$DRY_RUN" = 1 ]; then dry "$*"; else eval "$@"; fi
}

# Convert a host directory path for use with docker -v on Git Bash / MSYS,
# where drive letters and forward slashes get mangled without help.
docker_host_path() {
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -w "$1" 2>/dev/null || printf '%s' "$1"
  else
    printf '%s' "$1"
  fi
}

# Resolve a possibly-relative path to absolute. Portable across Linux/macOS.
abspath() {
  case "$1" in
    /*|[A-Za-z]:*) printf '%s' "$1" ;;
    *) printf '%s/%s' "$(pwd)" "$1" ;;
  esac
}

# -- CLI validation -----------------------------------------------------------
if [ -z "$CERT_PATH" ] || [ -z "$KEY_PATH" ]; then
  err "--cert and --key are required."
  printf '\n' >&2
  usage >&2
  exit 1
fi

case "$NAME" in
  mkcert-*|ca|hostname)
    err "Slug \"$NAME\" is reserved (used by the certs init container)."
    err "Pick a different --name, e.g. --name my-domain."
    exit 1
    ;;
esac
if ! printf '%s' "$NAME" | grep -Eq '^[A-Za-z0-9._-]+$'; then
  err "Slug must match [A-Za-z0-9._-]+; got \"$NAME\"."
  exit 1
fi

# -- pre-flight ---------------------------------------------------------------
if [ ! -f "$ENV_FILE" ]; then
  err "$ENV_FILE not found -- run from the skeleton/ repo root."
  exit 2
fi
if [ ! -f "$YAML_FILE" ]; then
  err "Expected file $YAML_FILE not found -- is this the Skeleton repo?"
  exit 2
fi

# COMPOSE_PROJECT_NAME resolution matches docker compose itself: shell env wins.
PROJECT="${COMPOSE_PROJECT_NAME:-$(get_value "$ENV_FILE" "COMPOSE_PROJECT_NAME")}"
PROJECT="${PROJECT:-skeleton}"
VOLUME_NAME="${PROJECT}_certs-data"
PROXY_CONTAINER="${PROJECT}-proxy"
CERTS_CONTAINER="${PROJECT}-certs"

DRY_LABEL=""
[ "$DRY_RUN" = 1 ] && DRY_LABEL=" ${YELLOW}(dry-run)${RESET}"
printf "\n${BOLD}Install third-party TLS certificate${RESET}${DRY_LABEL}\n\n"

info "Project:        $PROJECT"
info "Volume:         $VOLUME_NAME"
info "Slug:           $NAME"
info "Cert:           $CERT_PATH"
info "Key:            $KEY_PATH"
[ -n "$CA_BUNDLE" ] && info "CA bundle:      $CA_BUNDLE"
printf "\n"

if ! command -v docker >/dev/null 2>&1; then
  err "docker CLI not found on PATH."
  exit 4
fi
if ! docker info >/dev/null 2>&1; then
  err "Docker daemon not reachable. Start Docker Desktop / systemctl start docker."
  exit 4
fi

for f in "$CERT_PATH" "$KEY_PATH"; do
  if [ ! -f "$f" ]; then
    err "File not found: $f"
    exit 3
  fi
  if [ ! -s "$f" ]; then
    err "File is empty: $f"
    exit 3
  fi
done
if [ -n "$CA_BUNDLE" ]; then
  if [ ! -s "$CA_BUNDLE" ]; then
    err "CA bundle file not found or empty: $CA_BUNDLE"
    exit 3
  fi
fi

# -- input validation (openssl) -----------------------------------------------
if command -v openssl >/dev/null 2>&1; then
  info "Verifying cert / key pair with openssl..."
  CERT_HASH=$(openssl x509 -noout -pubkey -in "$CERT_PATH" 2>/dev/null | openssl sha256 2>/dev/null | awk '{print $NF}')
  KEY_HASH=$(openssl pkey -pubout -in "$KEY_PATH" 2>/dev/null | openssl sha256 2>/dev/null | awk '{print $NF}')

  if [ -z "$CERT_HASH" ]; then
    err "Could not parse $CERT_PATH as PEM (openssl returned empty)."
    err "Expected file to contain -----BEGIN CERTIFICATE-----."
    exit 3
  fi
  if [ -z "$KEY_HASH" ]; then
    err "Could not parse $KEY_PATH as PEM (openssl returned empty)."
    err "Expected file to contain -----BEGIN PRIVATE KEY----- or similar."
    exit 3
  fi
  if [ "$CERT_HASH" != "$KEY_HASH" ]; then
    err "Certificate and private key do not match."
    err "  cert pubkey sha256: $CERT_HASH"
    err "  key  pubkey sha256: $KEY_HASH"
    exit 3
  fi
  ok "Cert / key pair verified"

  info "Certificate details:"
  openssl x509 -in "$CERT_PATH" -noout -subject -issuer -dates 2>/dev/null | sed 's/^/       /'
  SAN=$(openssl x509 -in "$CERT_PATH" -noout -ext subjectAltName 2>/dev/null | grep -v 'X509v3' | tr -s ' ' | sed 's/^[[:space:]]*//')
  [ -n "$SAN" ] && printf '       SAN: %s\n' "$SAN"

  # Expiry warning
  if openssl x509 -in "$CERT_PATH" -checkend 2592000 >/dev/null 2>&1; then
    :
  else
    if openssl x509 -in "$CERT_PATH" -checkend 0 >/dev/null 2>&1; then
      warn "Certificate expires within the next 30 days."
    else
      warn "Certificate is ALREADY EXPIRED. Traefik will still serve it but browsers will reject."
    fi
  fi

  if [ -n "$CA_BUNDLE" ]; then
    if openssl verify -CAfile "$CA_BUNDLE" "$CERT_PATH" >/dev/null 2>&1; then
      ok "Certificate verified against CA bundle"
    else
      warn "openssl verify against $CA_BUNDLE failed (private CAs sometimes trip this; not fatal)."
    fi
  fi
else
  warn "openssl not on PATH -- skipping cert/key match verification."
fi

# -- volume existence ---------------------------------------------------------
if docker volume inspect "$VOLUME_NAME" >/dev/null 2>&1; then
  ok "Volume $VOLUME_NAME exists"
else
  warn "Volume $VOLUME_NAME does not exist yet (normal on first-time deploy)."
  info "Pre-creating so files can be seeded before 'docker compose up -d'."
  if [ "$DRY_RUN" = 0 ]; then
    if ! docker volume create "$VOLUME_NAME" >/dev/null; then
      err "Failed to create volume $VOLUME_NAME."
      exit 5
    fi
  else
    dry "docker volume create $VOLUME_NAME"
  fi
fi

# -- certs init container race check ------------------------------------------
if docker ps --format '{{.Names}}' | grep -q "^${CERTS_CONTAINER}$"; then
  info "Certs init container is running -- waiting up to 30s for it to exit."
  i=0
  while [ "$i" -lt 30 ]; do
    docker ps --format '{{.Names}}' | grep -q "^${CERTS_CONTAINER}$" || break
    sleep 1
    i=$((i + 1))
  done
  if docker ps --format '{{.Names}}' | grep -q "^${CERTS_CONTAINER}$"; then
    err "Certs init container did not exit in 30s. Aborting to avoid a race."
    err "Check its logs: docker compose logs certs"
    exit 5
  fi
  ok "Certs init container has exited."
fi

# -- YAML state detection -----------------------------------------------------
# Three states based on grep counts in the current file:
#   pristine   -- 2x mkcert-local.crt and 2x mkcert-local.key (shipped form)
#   same-slug  -- 2x <slug>.crt and 2x <slug>.key (previously installed)
#   other      -- anything else (hand-edited)
PRIST_CRT=$(grep -c "mkcert-local\.crt" "$YAML_FILE" || true)
PRIST_KEY=$(grep -c "mkcert-local\.key" "$YAML_FILE" || true)
SLUG_CRT=$(grep -c "${NAME}\.crt" "$YAML_FILE" || true)
SLUG_KEY=$(grep -c "${NAME}\.key" "$YAML_FILE" || true)

YAML_STATE="other"
if [ "$PRIST_CRT" -ge 2 ] && [ "$PRIST_KEY" -ge 2 ] && [ "$SLUG_CRT" = 0 ] && [ "$SLUG_KEY" = 0 ]; then
  YAML_STATE="pristine"
elif [ "$SLUG_CRT" -ge 2 ] && [ "$SLUG_KEY" -ge 2 ] && [ "$PRIST_CRT" = 0 ] && [ "$PRIST_KEY" = 0 ]; then
  YAML_STATE="same-slug"
fi

case "$YAML_STATE" in
  pristine)
    ok "$YAML_FILE is in the shipped form -- will rewrite for slug \"$NAME\"."
    ;;
  same-slug)
    ok "$YAML_FILE already references slug \"$NAME\" -- rotation mode, YAML rewrite will be skipped."
    ;;
  other)
    if [ "$FORCE" = 1 ]; then
      warn "$YAML_FILE has been hand-edited; --force given, will rewrite anyway."
    else
      err "$YAML_FILE has been modified from its shipped form."
      err "The script would replace mkcert-local.crt/.key with ${NAME}.crt/.key,"
      err "but the file contains neither pattern in the expected count."
      err "Re-run with --force to rewrite anyway (a timestamped backup is still written),"
      err "or restore certs-traefik.yml from the last .bak.<timestamp> and try again."
      err "The volume copy has NOT been performed yet."
      exit 6
    fi
    ;;
esac

# -- copy files into the volume ----------------------------------------------
copy_into_volume() {
  SRC="$1"
  DEST_NAME="$2"
  MODE="$3"

  SRC_ABS=$(abspath "$SRC")
  SRC_DIR=$(dirname "$SRC_ABS")
  SRC_FILE=$(basename "$SRC_ABS")
  SRC_DIR_DOCKER=$(docker_host_path "$SRC_DIR")

  info "Copying $SRC_FILE into ${VOLUME_NAME}:/certs/$DEST_NAME (mode $MODE)"
  if [ "$DRY_RUN" = 1 ]; then
    dry "docker run --rm -v \"${VOLUME_NAME}:/certs\" -v \"${SRC_DIR_DOCKER}:/src:ro\" alpine:3 sh -c \"cp /src/${SRC_FILE} /certs/${DEST_NAME} && chmod ${MODE} /certs/${DEST_NAME} && chown root:root /certs/${DEST_NAME}\""
    return 0
  fi

  MSYS_NO_PATHCONV=1 docker run --rm \
    -v "${VOLUME_NAME}:/certs" \
    -v "${SRC_DIR_DOCKER}:/src:ro" \
    alpine:3 \
    sh -c "cp /src/${SRC_FILE} /certs/${DEST_NAME} && chmod ${MODE} /certs/${DEST_NAME} && chown root:root /certs/${DEST_NAME}" \
    || {
      err "Failed to copy $SRC_FILE into volume."
      exit 5
    }
}

copy_into_volume "$CERT_PATH" "${NAME}.crt" 644
copy_into_volume "$KEY_PATH"  "${NAME}.key" 600
if [ -n "$CA_BUNDLE" ]; then
  copy_into_volume "$CA_BUNDLE" "${NAME}-ca.crt" 644
fi

FILES_LIST="${NAME}.crt (644), ${NAME}.key (600)"
[ -n "$CA_BUNDLE" ] && FILES_LIST="${FILES_LIST}, ${NAME}-ca.crt (644)"
ok "Files installed in ${VOLUME_NAME}: ${FILES_LIST}"

# -- YAML rewrite -------------------------------------------------------------
BAK_PATH=""
if [ "$YAML_STATE" = "pristine" ] || { [ "$YAML_STATE" = "other" ] && [ "$FORCE" = 1 ]; }; then
  BAK_STAMP=$(date -u +"%Y%m%dT%H%M%SZ")
  BAK_PATH="${YAML_FILE}.bak.${BAK_STAMP}"

  info "Backing up $YAML_FILE to $BAK_PATH"
  run_or_dry "cp '$YAML_FILE' '$BAK_PATH'"

  info "Rewriting $YAML_FILE (mkcert-local.* -> ${NAME}.*)"
  if [ "$DRY_RUN" = 1 ]; then
    dry "sed -e 's|mkcert-local\\.crt|${NAME}.crt|g' -e 's|mkcert-local\\.key|${NAME}.key|g' '$YAML_FILE' > '${YAML_FILE}.tmp' && mv '${YAML_FILE}.tmp' '$YAML_FILE'"
  else
    sed -e "s|mkcert-local\.crt|${NAME}.crt|g" \
        -e "s|mkcert-local\.key|${NAME}.key|g" \
        "$YAML_FILE" > "${YAML_FILE}.tmp"
    mv "${YAML_FILE}.tmp" "$YAML_FILE"
  fi
  ok "Rewrote $YAML_FILE"
fi

# -- restart proxy ------------------------------------------------------------
RESTARTED=0
if [ "$SKIP_RESTART" = 1 ]; then
  info "--skip-restart given; leaving proxy alone."
  info "  Run 'docker compose restart proxy' from the repo root when ready."
elif ! docker ps -a --format '{{.Names}}' | grep -q "^${PROXY_CONTAINER}$"; then
  info "Proxy container $PROXY_CONTAINER does not exist yet."
  info "  The certificate is already in the volume; run 'docker compose up -d' when ready."
elif ! docker ps --format '{{.Names}}' | grep -q "^${PROXY_CONTAINER}$"; then
  info "Proxy container is stopped; starting: docker compose up -d proxy"
  run_or_dry "docker compose up -d proxy"
  RESTARTED=1
else
  info "Restarting proxy: docker compose restart proxy"
  run_or_dry "docker compose restart proxy"
  RESTARTED=1
fi

# -- verification -------------------------------------------------------------
if [ "$RESTARTED" = 1 ] && [ "$DRY_RUN" = 0 ]; then
  info "Waiting 3s for proxy to settle..."
  sleep 3

  LOGS=$(docker compose logs --tail 50 proxy 2>&1 || true)

  if printf '%s' "$LOGS" | grep -Eq 'level=error|level=fatal'; then
    err "Proxy logs contain errors after restart:"
    printf '%s\n' "$LOGS" | grep -E 'level=error|level=fatal' | head -10 | sed 's/^/       /'
    err "Full logs: docker compose logs proxy"
    err "Cert files are already in the volume. To revert the YAML:"
    [ -n "$BAK_PATH" ] && err "  cp $BAK_PATH $YAML_FILE && docker compose restart proxy"
    exit 7
  fi
  if printf '%s' "$LOGS" | grep -Eq 'Configuration loaded|Starting provider'; then
    ok "Proxy reloaded configuration."
  else
    warn "Could not confirm reload from logs. Check: docker compose logs proxy"
  fi

  APP_HOSTNAME=$(get_value "$ENV_FILE" "APP_HOSTNAME")
  if [ -n "$APP_HOSTNAME" ] && command -v openssl >/dev/null 2>&1; then
    info "Fetching live cert from https://${APP_HOSTNAME}:443 ..."
    LIVE=$(echo | openssl s_client -connect "${APP_HOSTNAME}:443" -servername "${APP_HOSTNAME}" 2>/dev/null | openssl x509 -noout -subject -issuer -dates 2>/dev/null || true)
    if [ -n "$LIVE" ]; then
      printf '%s\n' "$LIVE" | sed 's/^/       /'
    else
      warn "Could not fetch live cert (hostname may not resolve locally, or firewall blocks 443)."
    fi
  fi
fi

# -- summary ------------------------------------------------------------------
printf "\n"
ok "Third-party certificate installed"
printf "     Slug:         %s\n" "$NAME"
printf "     Volume:       %s (at /etc/certs/ inside Traefik)\n" "$VOLUME_NAME"
printf "     Files:        %s\n" "$FILES_LIST"
if [ -n "$BAK_PATH" ]; then
  printf "     YAML backup:  %s\n" "$BAK_PATH"
fi
if [ "$RESTARTED" = 1 ]; then
  printf "     Proxy:        restarted (%s)\n" "$PROXY_CONTAINER"
fi
APP_HOSTNAME=$(get_value "$ENV_FILE" "APP_HOSTNAME")
[ -n "$APP_HOSTNAME" ] && printf "     Test:         https://%s\n" "$APP_HOSTNAME"
if [ -n "$BAK_PATH" ]; then
  printf "\n     Revert with:\n"
  printf "       cp %s %s && docker compose restart proxy\n" "$BAK_PATH" "$YAML_FILE"
fi
printf "\n"
