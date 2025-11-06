FROM node:22.14.0-alpine
# arguments
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}
ENV NO_PROXY=${NO_PROXY}

# may be necessary for proxy with self signed cert
RUN npm config set strict-ssl false

# setup npm
RUN corepack enable
RUN npm config set proxy $HTTP_PROXY
RUN npm config set https-proxy $HTTPS_PROXY

# Install mkcert for self-signed certs
RUN npm install -g mkcert

# Copy the script
WORKDIR /usr/local/bin/
COPY ./mkcert.sh /usr/local/bin/mkcert.sh
RUN chmod +x /usr/local/bin/mkcert.sh

CMD ["/bin/sh", "mkcert.sh"]
