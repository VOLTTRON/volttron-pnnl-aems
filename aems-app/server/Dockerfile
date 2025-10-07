ARG COMPOSE_PROJECT_NAME=skeleton
ARG TAG=latest
FROM ${COMPOSE_PROJECT_NAME}/common:${TAG} AS common-base
FROM node:22.14.0-alpine AS base

# Copy shared libraries from common image
COPY --from=common-base --chmod=755 /app /app
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
RUN yarn config set proxy $HTTP_PROXY
RUN yarn config set https-proxy $HTTPS_PROXY
RUN yarn config set no-proxy $NO_PROXY
RUN yarn config set "strict-ssl" false

# Install dependencies only when needed
FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

# Install dependencies
WORKDIR /app/server
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install

FROM base AS runner
WORKDIR /app/server
COPY ./.env ./
COPY --chmod=755 ./dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "./dist/main.js"]
