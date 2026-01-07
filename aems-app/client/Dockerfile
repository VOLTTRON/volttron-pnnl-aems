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
RUN if [ -n "$HTTP_PROXY" ]; then yarn config set proxy "$HTTP_PROXY"; fi
RUN if [ -n "$HTTPS_PROXY" ]; then yarn config set https-proxy "$HTTPS_PROXY"; fi
RUN if [ -n "$NO_PROXY" ]; then yarn config set no-proxy "$NO_PROXY"; fi
RUN yarn config set "strict-ssl" false

# Install client dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy pre-built prisma library (dist + prisma directory + package files)
COPY prisma/package.json prisma/yarn.lock prisma/.yarnrc.yml ./prisma/
COPY prisma/dist/ ./prisma/dist/
COPY prisma/prisma/ ./prisma/prisma/

# Copy pre-built common library (dist + package files)
COPY common/package.json common/yarn.lock common/.yarnrc.yml ./common/
COPY common/dist/ ./common/dist/

# Install client dependencies
WORKDIR /app/client
COPY client/package.json client/yarn.lock client/.yarnrc.yml ./
RUN yarn install

# Build the client application
FROM base AS builder
WORKDIR /app/client
COPY --from=deps /app/client/node_modules/ ./node_modules/
COPY --from=deps /app/prisma/ /app/prisma/
COPY --from=deps /app/common/ /app/common/
COPY client/ ./

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
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
