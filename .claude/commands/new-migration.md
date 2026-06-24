---
description: Create a new Prisma migration from the current model files
---

The user is creating a new Prisma migration. The migration name should come from $ARGUMENTS — if it's empty, ask the user for a short kebab-case name describing the change before proceeding.

Steps:

1. **Read the current model state**: identify what `.prisma` files under [prisma/prisma/models/](../../prisma/prisma/models/) have been edited since the last migration. Check `git status` and `git diff -- prisma/prisma/models/` to see what's pending.
2. **Confirm with the user** what the migration will capture (one-line summary of fields/relations changed). Don't proceed if uncertain.
3. **Run** `cd prisma && yarn migrate:create --name "<arguments-as-kebab-case>"` — this is `prisma migrate dev --name ...`, which generates SQL, applies it to the dev DB, and rebuilds the client.
4. **Inspect the generated SQL** under [prisma/prisma/migrations/](../../prisma/prisma/migrations/) and summarize it. Flag anything destructive (DROP COLUMN, DROP TABLE, NOT NULL on existing column, etc.) and ask the user to confirm.
5. **Remind** the user: never edit applied migrations; if this one is wrong, create a new one.
6. **Run** `yarn build` in [prisma/](../../prisma/) so downstream typechecks see the new types, then run `yarn check` in server/client to confirm no breakage.

If the dev DB is in an unmigratable state (drift detected), STOP and surface the prisma error — don't reset without explicit user approval.
