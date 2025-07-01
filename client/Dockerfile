ARG IMAGE=common
ARG TAG=latest
FROM ${IMAGE}:${TAG} AS base
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

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

# Install dependencies
WORKDIR /app/client
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app/client
COPY --from=deps /app/client/node_modules/ ./node_modules/
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN yarn build

# If using npm comment out above and use below instead
# RUN npm run build

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
