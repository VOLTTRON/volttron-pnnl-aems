#!/bin/sh
# Initialize the Bookstack wiki container using this script.
#
# Runs as a linuxserver custom-cont-init.d script before BookStack starts.
# Injects APP_KEY from the docker secret file when present so the value is
# never exposed as a plain environment variable in production.

SECRET_FILE="/run/secrets/bookstack_session_secret"

if [ -f "$SECRET_FILE" ]; then
  APP_KEY=$(cat "$SECRET_FILE")
  export APP_KEY
  # Persist into the linuxserver env file so the main process inherits it
  echo "APP_KEY=${APP_KEY}" >> /etc/s6-overlay/s6-rc.d/init-bookstack-config/up
fi