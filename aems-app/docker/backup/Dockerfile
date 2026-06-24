# syntax=docker/dockerfile:1.6
#
# Sidecar image: polls the server's internal /worker/backup API for queued
# BackupRuns, executes backup.sh against the project's docker-compose.yml,
# and streams NDJSON progress back via HTTP.
#
# The image deliberately stays small: it runs the existing shell pipeline from
# /workspace and only adds the HTTP poller on top. No Postgres client ships
# in the image — the sidecar holds no DB credentials.

FROM node:22.14.0-alpine

ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

ENV HTTP_PROXY=${HTTP_PROXY:-} \
    HTTPS_PROXY=${HTTPS_PROXY:-} \
    NO_PROXY=${NO_PROXY:-}

# System dependencies:
#   docker-cli  - required to talk to /var/run/docker.sock (compose/exec/run)
#   tar, gzip   - archive creation
#   bash        - shell pipeline uses [[ ]], arrays, etc.
#   coreutils   - GNU-style `date -u +%Y-..`, sha256sum used by discover.sh/init
#   python3     - manifest generation + JSON plan parsing in backup.sh
#   age         - default encryption
#   gnupg       - optional encryption mode
#   aws-cli     - s3 destination uploads and pruning
#   curl, jq    - diagnostics
#   git         - GIT_SHA capture in manifest
RUN apk add --no-cache \
        bash \
        coreutils \
        docker-cli \
        docker-cli-compose \
        tar \
        gzip \
        python3 \
        age \
        gnupg \
        aws-cli \
        curl \
        jq \
        git \
        tzdata

WORKDIR /app
COPY worker/package.json worker/package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund

COPY worker/ ./
COPY init-keys.sh /usr/local/bin/init-keys.sh
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/init-keys.sh /usr/local/bin/entrypoint.sh

# Add node user to the docker group so it can use the mounted Docker socket.
# Try gid 999 first (conventional docker gid on many Linux hosts); fall back
# to any available gid if 999 is taken; skip if the group already exists.
# addgroup <user> <group> is the correct Alpine syntax for supplementary groups.
RUN (addgroup -g 999 docker 2>/dev/null || addgroup docker 2>/dev/null || true) \
    && addgroup node docker

# Pre-create mount-point directories with correct ownership so init-keys.sh
# can write into them when running as node (bind mounts land on top of these).
RUN mkdir -p /host-secrets /var/lib/backup/staging /var/lib/backup/pending \
    && chown -R node:node /host-secrets /var/lib/backup

USER node

# The sidecar expects the repo root to be mounted at /workspace (read-only)
# and the backup secrets directory at /run/secrets/backup.
WORKDIR /workspace

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "/app/index.js"]
