#!/bin/sh
# Initialize the Bookstack wiki container using this script.
#
# Runs as a linuxserver custom-cont-init.d script before BookStack starts.
# APP_KEY arrives as an env var from .env.wiki; persist it into the
# linuxserver env file so the s6-overlay init sequence inherits it.

if [ -n "$APP_KEY" ]; then
  echo "APP_KEY=${APP_KEY}" >> /etc/s6-overlay/s6-rc.d/init-bookstack-config/up
fi
