#!/bin/sh
# Read DATABASE_PASSWORD from Docker secret file if present, then run migrations.
SECRET_FILE="/run/secrets/database_password"
if [ -s "$SECRET_FILE" ]; then
  DATABASE_PASSWORD=$(cat "$SECRET_FILE")
  export DATABASE_PASSWORD
fi
# Prisma's dotenv loader reads prisma/.env and overwrites process env, so exporting
# DATABASE_URL alone is not enough — the .env file would stomp it. Write the resolved
# URL directly into the .env file so Prisma picks up the secret-resolved password.
printf 'DATABASE_URL="postgresql://%s:%s@%s:%s/%s?schema=%s&connection_limit=5"\n' \
  "$DATABASE_USERNAME" "$DATABASE_PASSWORD" \
  "$DATABASE_HOST" "$DATABASE_PORT" \
  "$DATABASE_NAME" "$DATABASE_SCHEMA" \
  > .env
exec yarn migrate:deploy
