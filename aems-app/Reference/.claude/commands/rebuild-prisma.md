---
description: Rebuild prisma/ so downstream @local/prisma types are fresh
---

Run `yarn build` in [prisma/](../../prisma/) to regenerate the Prisma Client, JSON-column types, Pothos type bindings, and `dist/`. This is the step that makes downstream typechecks in common, server, and client see schema changes.

Then run `yarn check` in [common/](../../common/), [server/](../../server/), and [client/](../../client/) (in that order) and report any remaining type errors with file:line citations. Stop at the first module that fails.

If a typecheck fails, summarize the failure category (missing exported member, narrowed type mismatch, etc.) and suggest whether the next step is a code change or a further regen (`compile:schema`, `compile:graphql`).
