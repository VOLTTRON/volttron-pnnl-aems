FROM alpine:latest

# Configure DNS for package installation
RUN echo "nameserver 8.8.8.8" > /etc/resolv.conf && \
    echo "nameserver 8.8.4.4" >> /etc/resolv.conf && \
    echo "nameserver 1.1.1.1" >> /etc/resolv.conf

# Install socat package
RUN apk add --no-cache socat

# Copy the script and set execute permissions
COPY volttron-socat.sh /proxy/volttron-socat.sh
RUN chmod +x /proxy/volttron-socat.sh

# Set the default command
CMD ["/proxy/volttron-socat.sh"]
