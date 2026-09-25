#!/bin/sh
# Prisma's dotenv loader reads prisma/.env and overwrites process env, so
# exporting DATABASE_URL alone is not enough — write the resolved URL directly
# into .env so Prisma picks up DATABASE_PASSWORD from the environment.
printf 'DATABASE_URL="postgresql://%s:%s@%s:%s/%s?schema=%s&connection_limit=5"\n' \
  "$DATABASE_USERNAME" "$DATABASE_PASSWORD" \
  "$DATABASE_HOST" "$DATABASE_PORT" \
  "$DATABASE_NAME" "$DATABASE_SCHEMA" \
  > .env
exec yarn migrate:deploy
