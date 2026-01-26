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
RUN corepack prepare yarn@4.1.0 --activate

# Install dependencies only when needed
FROM base AS deps

# Copy and build prisma
WORKDIR /prisma
COPY / ./
RUN yarn install

# Rebuild the source code only when needed
FROM base AS runner
WORKDIR /prisma
COPY --from=deps /prisma/node_modules/ ./node_modules/
COPY . .

# Build the application
RUN yarn build

# Production image, run migration
WORKDIR /prisma

CMD ["yarn", "migrate:deploy"]
