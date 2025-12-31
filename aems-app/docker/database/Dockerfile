# Custom PostgreSQL with PostGIS for ARM64 compatibility
FROM postgres:16

# Install PostGIS and related packages on Debian-based image
# Using the Debian-based postgres image ensures extension control files
# are installed into the same PostgreSQL installation used by the image.
RUN set -eux; \
    export DEBIAN_FRONTEND=noninteractive; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        gnupg2 \
        lsb-release \
        postgis \
        postgresql-16-postgis-3 \
        postgresql-16-postgis-3-scripts \
        postgresql-server-dev-16 \
        proj-bin \
        proj-data \
        libproj-dev \
        gdal-bin \
        gdal-data \
        libgdal-dev \
        libgeos-dev \
        libgeos-c1v5 \
        python3-gdal \
        libspatialite-dev \
        spatialite-bin \
    ; \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*;

# Copy custom initialization scripts into the image so they run at first DB init
COPY ./ /docker-entrypoint-initdb.d/

# Ensure all shell scripts are executable
# Use explicit chmod command and verify the result
RUN chmod +x /docker-entrypoint-initdb.d/*.sh && \
    ls -la /docker-entrypoint-initdb.d/
