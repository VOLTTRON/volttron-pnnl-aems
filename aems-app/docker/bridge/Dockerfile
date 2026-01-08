FROM alpine:latest

# Update package repositories and install socat with retry logic
RUN apk update --no-cache || apk update --no-cache && \
    apk add --no-cache socat

# Copy the script and set execute permissions
COPY volttron-socat.sh /proxy/volttron-socat.sh
RUN chmod +x /proxy/volttron-socat.sh

# Set the default command
CMD ["/proxy/volttron-socat.sh"]
