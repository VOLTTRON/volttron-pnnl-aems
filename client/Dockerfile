FROM node:22.14.0-alpine AS base
# arguments
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}
ENV NO_PROXY=${NO_PROXY}

# build output type
ENV BUILD_OUTPUT=standalone

# may be necessary for proxy with self signed cert
RUN npm config set strict-ssl false

# used for healthcheck
RUN apk add --no-cache curl

# setup yarn
RUN corepack enable
RUN yarn config set proxy $HTTP_PROXY
RUN yarn config set https-proxy $HTTPS_PROXY
RUN yarn config set no-proxy $NO_PROXY
RUN yarn config set "strict-ssl" false

# Build the client (and its workspace dependencies) from source.
#
# Portal-symlink layout (created by `yarn install` in each workspace):
#   client/node_modules/@local/prisma       -> /app/prisma
#   client/node_modules/@local/common       -> /app/common
#   client/node_modules/@prisma/client      -> /app/prisma/node_modules/@prisma/client
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
# junctions in common/node_modules and client/node_modules get copied
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
COPY client/ ./client/

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

# Install client dependencies and build. Portal deps on @local/prisma,
# @local/common, and @prisma/client all resolve because the targets are
# already present on disk from the steps above. Next.js's standalone
# output traces these symlinks and inlines the referenced files into
# .next/standalone, so the runner stage doesn't need /app/prisma or
# /app/common.
WORKDIR /app/client

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

RUN yarn install
RUN yarn build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app/client

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/client/public ./public

# Create pre-render cache
RUN mkdir .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/client/.next/standalone ./
COPY --from=builder /app/client/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
