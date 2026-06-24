FROM node:22.14.0-alpine AS base
# arguments
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}
ENV NO_PROXY=${NO_PROXY}

ENV NODE_ENV=production

# may be necessary for proxy with self signed cert
RUN npm config set strict-ssl false

# used for healthcheck (curl) and backup discovery's env-file diff
# check against the workspace repo at runtime (git).
RUN apk add --no-cache curl git

# setup yarn
RUN corepack enable
RUN yarn config set proxy $HTTP_PROXY
RUN yarn config set https-proxy $HTTPS_PROXY
RUN yarn config set no-proxy $NO_PROXY
RUN yarn config set "strict-ssl" false

# Install dependencies and build server application.
#
# Portal-symlink layout (created by `yarn install` in each workspace):
#   server/node_modules/@local/prisma       -> /app/prisma
#   server/node_modules/@local/common       -> /app/common
#   server/node_modules/@prisma/client      -> /app/prisma/node_modules/@prisma/client
#   common/node_modules/@prisma/client      -> /app/prisma/node_modules/@prisma/client
#   common/node_modules/@local/prisma       -> /app/prisma
#
# For these yarn-portal symlinks to resolve at compile time, every portal
# target must be in its final on-disk location BEFORE the consuming
# workspace runs `yarn install`. We therefore copy all three workspace
# source trees up front, then install/build in dependency order.
#
# The root-level .dockerignore excludes **/node_modules from the build
# context, which is essential on Windows hosts: without it, host NTFS
# junctions in common/node_modules and server/node_modules get copied
# into the image as Linux symlinks pointing at Windows paths (e.g.
# C:/Users/.../prisma), and yarn refuses to overwrite the broken links
# during `yarn install`.
FROM base AS builder
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy all workspace sources up front so portal targets are in their
# final locations when any `yarn install` runs.
COPY prisma/ ./prisma/
COPY common/ ./common/
COPY server/ ./server/

# Build prisma from source. Its postinstall runs `prisma generate`,
# populating /app/prisma/node_modules/@prisma/client; then tsc emits
# /app/prisma/dist.
WORKDIR /app/prisma
RUN yarn install
RUN yarn build

# Build common from source. Its portal dep on @prisma/client resolves
# to /app/prisma/node_modules/@prisma/client (populated above); tsc
# emits /app/common/dist.
WORKDIR /app/common
RUN yarn install
RUN yarn build

# Install server dependencies and build. Portal deps on @local/prisma,
# @local/common, and @prisma/client all resolve because the targets are
# already present on disk from the steps above.
WORKDIR /app/server
RUN yarn install
RUN yarn nest build

# Production image
FROM base AS runner

WORKDIR /app/server

# Copy built workspace libraries. The portal symlinks in
# /app/server/node_modules/@local/* and /app/server/node_modules/@prisma/client
# point at these directories, so they must be present at runtime for
# `require('@local/common')` / `require('@prisma/client')` to resolve.
COPY --from=builder /app/prisma/ /app/prisma/
COPY --from=builder /app/common/ /app/common/

# Copy server build artifacts and installed node_modules (which contains
# the portal symlinks into /app/prisma and /app/common).
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules
COPY server/.env ./

RUN mkdir -p /app/server/upload && chown -R node:node /app
USER node

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "./dist/main.js"]
