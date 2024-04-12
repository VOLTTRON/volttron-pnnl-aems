FROM node:20
# if prisma engines provided locally
# ENV PRISMA_QUERY_ENGINE_LIBRARY=./lib/libquery_engine.so.node
# ENV PRISMA_SCHEMA_ENGINE_BINARY=./lib/schema-engine
# ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
# may be necessary for proxy with self signed cert
# ENV NODE_TLS_REJECT_UNAUTHORIZED=0
# RUN npm config set strict-ssl false
# RUN yarn config set "strict-ssl" false
# useful for debugging inside container
RUN apt-get update -y && apt-get install -y dtrx nano && apt-get clean
# setup
RUN mkdir /app
# dependencies
COPY ./app/yarn.*lock ./app/package.json /app/
# copy source
COPY ./app /app
# build
WORKDIR /app
RUN corepack enable
RUN yarn install
RUN yarn compile
# certs library install
RUN npm install -g mkcert
# external declarations
EXPOSE 80 443
VOLUME "/home/root/"
# start app
WORKDIR /app