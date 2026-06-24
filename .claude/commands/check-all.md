---
description: yarn check across all workspaces in build order, fail-fast
---

Run `yarn check` in each workspace, in build order, and stop at the first failure:

1. `cd prisma && yarn check`
2. `cd common && yarn check`
3. `cd server && yarn check`
4. `cd client && yarn check`

For each module, surface only failures with file:line citations. Don't dump successful output.

If a module fails:

- **prisma** failing → likely a syntax error in `prisma/src/` or a missing generated file. Check whether `prisma generate` ran.
- **common** failing → usually a stale `@local/prisma`. Suggest `/rebuild-prisma`.
- **server** failing → usually a stale `@local/prisma` or `@local/common`, or a Pothos type drift. Suggest `/rebuild-prisma` first; if types reference fields that exist in Prisma, suggest `yarn compile:schema` next.
- **client** failing → usually stale codegen. Suggest `/regen-graphql`.

After the first failure, stop and report. Don't continue down the chain — later modules will produce noise based on earlier failures.
