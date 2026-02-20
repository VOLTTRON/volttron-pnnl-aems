# PostgreSQL with Logical Replication for Historian
FROM postgres:16-alpine

# Copy PostgreSQL configuration files
COPY postgresql.conf /etc/postgresql/postgresql.conf
COPY pg_hba.conf /etc/postgresql/pg_hba.conf

# Copy custom entrypoint wrapper for SSL certificate setup
COPY docker-entrypoint-wrapper.sh /usr/local/bin/docker-entrypoint-wrapper.sh

# Copy replication setup script
COPY setup-replication.sh /docker-entrypoint-initdb.d/setup-replication.sh

# Ensure scripts are executable and configs have proper permissions
RUN chmod 755 /usr/local/bin/docker-entrypoint-wrapper.sh && \
    chmod 755 /docker-entrypoint-initdb.d/setup-replication.sh && \
    chmod 644 /etc/postgresql/postgresql.conf && \
    chmod 644 /etc/postgresql/pg_hba.conf

# Use custom entrypoint that sets up SSL before starting PostgreSQL
ENTRYPOINT ["/usr/local/bin/docker-entrypoint-wrapper.sh"]

# Set PostgreSQL to use custom configuration
CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf", "-c", "hba_file=/etc/postgresql/pg_hba.conf"]
