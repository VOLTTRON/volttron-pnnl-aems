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

# used for healthcheck
RUN apk add --no-cache curl

# setup yarn
RUN corepack enable
RUN if [ -n "$HTTP_PROXY" ]; then yarn config set proxy "$HTTP_PROXY"; fi
RUN if [ -n "$HTTPS_PROXY" ]; then yarn config set https-proxy "$HTTPS_PROXY"; fi
RUN if [ -n "$NO_PROXY" ]; then yarn config set no-proxy "$NO_PROXY"; fi
RUN yarn config set "strict-ssl" false

# Install dependencies and build server application
FROM base AS builder
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy pre-built prisma library (dist + prisma directory + package files)
COPY prisma/package.json prisma/yarn.lock prisma/.yarnrc.yml ./prisma/
COPY prisma/dist/ ./prisma/dist/
COPY prisma/prisma/ ./prisma/prisma/

# Copy pre-built common library (dist + package files)
COPY common/package.json common/yarn.lock common/.yarnrc.yml ./common/
COPY common/dist/ ./common/dist/

# Install server dependencies
WORKDIR /app/server
COPY server/package.json server/yarn.lock server/.yarnrc.yml ./
RUN yarn install

# Copy server source and build
COPY server/ ./
RUN yarn nest build

# Production image
FROM base AS runner

WORKDIR /app/server

# Copy pre-built libraries
COPY --from=builder /app/prisma/ /app/prisma/
COPY --from=builder /app/common/ /app/common/

# Copy server build artifacts and dependencies
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules
COPY server/.env ./

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "./dist/main.js"]
