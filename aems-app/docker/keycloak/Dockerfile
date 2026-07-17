# Pin to a specific version when quay.io is reachable (target: 26.6.2).
# Currently left at :latest because the build network cannot reach quay.io
# directly — Docker pulls the cached local image. To lock the version,
# configure a Docker daemon proxy for quay.io or mirror the image to the
# local registry and update this line to the pinned digest/tag.
FROM quay.io/keycloak/keycloak:26.6.3

# Copy custom entrypoint script and realm configuration
COPY entrypoint.sh /docker-entrypoint-scripts.d/entrypoint.sh
COPY init-keycloak.sh /docker-entrypoint-scripts.d/init-keycloak.sh
COPY default-realm.json /opt/keycloak/data/import/default-realm.json

# Make scripts executable and set proper permissions
USER root
RUN chmod +x /docker-entrypoint-scripts.d/entrypoint.sh && \
    chmod +x /docker-entrypoint-scripts.d/init-keycloak.sh && \
    chown keycloak:keycloak /docker-entrypoint-scripts.d/entrypoint.sh && \
    chown keycloak:keycloak /docker-entrypoint-scripts.d/init-keycloak.sh && \
    chown keycloak:keycloak /opt/keycloak/data/import/default-realm.json && \
    chmod 644 /opt/keycloak/data/import/default-realm.json

# Install curl if not available (needed for health checks in scripts)
# Most tools we need should already be available in the Keycloak image
RUN which curl > /dev/null 2>&1 || \
    (command -v microdnf > /dev/null 2>&1 && microdnf install -y curl && microdnf clean all) || \
    (command -v yum > /dev/null 2>&1 && yum install -y curl && yum clean all) || \
    (command -v apt-get > /dev/null 2>&1 && apt-get update && apt-get install -y curl && apt-get clean) || \
    (command -v apk > /dev/null 2>&1 && apk add curl) || \
    echo "curl already available or could not be installed"

# Use custom entrypoint
ENTRYPOINT ["/docker-entrypoint-scripts.d/entrypoint.sh"]