FROM grafana/grafana-oss:10.2.2

# Switch to root to set up the entrypoint
USER root

# Copy the custom entrypoint script
COPY entrypoint.sh /usr/local/bin/custom-entrypoint.sh
RUN chmod +x /usr/local/bin/custom-entrypoint.sh

# Switch back to grafana user for security
USER grafana

# Set the custom entrypoint
ENTRYPOINT ["/usr/local/bin/custom-entrypoint.sh"]

# Default command (can be overridden)
CMD []
