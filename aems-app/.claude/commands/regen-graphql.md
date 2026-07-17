---
description: Regenerate GraphQL schema (server) and Apollo codegen (client)
---

Run the GraphQL regen pipeline:

1. `cd server && yarn compile:schema` — emits [server/schema.graphql](../../server/schema.graphql).
2. `cd client && yarn compile:graphql` — regenerates typed Apollo hooks in [client/src/graphql-codegen/](../../client/src/graphql-codegen/) from `client/src/queries/*.graphql` against the schema.

After both succeed, `git diff -- server/schema.graphql client/schema.graphql client/src/graphql-codegen/` and summarize what changed (added/removed types, fields, operations) so I can sanity-check.

If `compile:schema` fails, the typical cause is a stale `prisma/dist/` — suggest running `/rebuild-prisma` first.

If `compile:graphql` fails on missing types, check whether `server/schema.graphql` and `client/schema.graphql` are in sync (per [client/codegen.ts](../../client/codegen.ts)) — the client copy can drift.
