FROM node:22.14.0-alpine AS base
# arguments
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}
ENV NO_PROXY=${NO_PROXY}

# may be necessary for proxy with self signed cert
RUN npm config set strict-ssl false

# setup yarn
RUN corepack enable
RUN if [ -n "$HTTP_PROXY" ]; then yarn config set proxy "$HTTP_PROXY"; fi
RUN if [ -n "$HTTPS_PROXY" ]; then yarn config set https-proxy "$HTTPS_PROXY"; fi
RUN if [ -n "$NO_PROXY" ]; then yarn config set no-proxy "$NO_PROXY"; fi
RUN yarn config set "strict-ssl" false

# Install dependencies only when needed
FROM base AS deps

# Copy and build prisma
WORKDIR /app/prisma
COPY /prisma ./
RUN yarn install
RUN yarn build

# Copy and build common
WORKDIR /app/common
COPY /common ./
RUN yarn install
RUN yarn build

# Rebuild the source code only when needed
FROM base AS runner

# Copy the local prisma library
WORKDIR /app/prisma
COPY --from=deps /app/prisma/package.json ./
COPY --from=deps /app/prisma/dist/ ./dist/
COPY --from=deps /app/prisma/prisma/ ./prisma/

# Copy the local common library
WORKDIR /app/common
COPY --from=deps /app/common/package.json ./
COPY --from=deps /app/common/dist/ ./dist/

# Production image
WORKDIR /app

CMD ["echo", "This is a common library image. It should not be run directly, but may show up in the list of containers when using Docker Compose."]
