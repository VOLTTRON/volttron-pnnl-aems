# Prisma & data layer

The root of the build chain. Owns the database schema, the Prisma Client, the JSON-column types, and the Pothos type bindings consumed by the server.

## Layout

- [prisma/prisma/schema.prisma](../../prisma/prisma/schema.prisma) — datasource + generators only. Minimal.
- [prisma/prisma/models/](../../prisma/prisma/models/) — one `.prisma` file per aggregate: `account`, `backup`, `banner`, `comment`, `event`, `feedback`, `file`, `geography`, `log`, `seed`, `session`, `user`, `verificationtoken`. Prisma stitches them together at `generate` time.
- [prisma/prisma/migrations/](../../prisma/prisma/migrations/) — applied migrations. **Never edit one in place** — create a new migration instead.
- [prisma/src/index.ts](../../prisma/src/index.ts) — public entry: re-exports the generated Prisma Client + hand-authored helpers.
- [prisma/src/pothos.ts](../../prisma/src/pothos.ts) — **generated** Pothos type bindings. Don't hand-edit. The server's `builder.service.ts` consumes this file.
- [prisma/scripts/](../../prisma/scripts/) — migration / seed helpers.

## Generators

Three run on `prisma generate`:

1. **`prisma-client-js`** — the standard Prisma Client. Output goes to `prisma/node_modules/.prisma/client/`.

2. **`prisma-json-types-generator`** — emits TS types for `Json` columns by reading `/// @type(TypeName)` doc-comments on the line above the field. Without the comment, you get `unknown`. Example:

   ```prisma
   model User {
     /// @type(UserPreferences)
     preferences Json @default("{}")
   }
   ```

   At compile time `user.preferences` has type `PrismaJson.UserPreferences` instead of `JsonValue`. Define the TypeScript type in `common/src/` or `prisma/src/` and register it in the generator config.

3. **`prisma-pothos-types`** — emits [prisma/src/pothos.ts](../../prisma/src/pothos.ts), which the server's Pothos `SchemaBuilder` uses to derive type-safe selects from Prisma model definitions.

Preview features enabled (in [schema.prisma](../../prisma/prisma/schema.prisma)): `relationJoins`, `postgresqlExtensions`, `views`. PostGIS is declared as a Postgres extension on the datasource. Views are **read-only** — no create/update/delete.

## Model authoring conventions

- **Field naming**: camelCase in Prisma schema; mapped to snake_case columns via `@map`. Table names via `@@map`.
- **Types**: `@db.VarChar(N)` for strings (don't use unbounded `String`), `@db.Timestamptz(6)` for timestamps (always timezone-aware).
- **Index naming**: `@@index([field], name: "<model>_<field>")` — e.g., `@@index([userId], name: "comment_user_id")`.
- **JSON columns**: `/// @type(TypeName)` doc-comment on the line above the `Json` field is mandatory for type emission.
- **No `.ts` files under [prisma/prisma/](../../prisma/prisma/)** — that tree is for Prisma DSL + SQL only. TypeScript belongs under `prisma/src/`.
- **Models split by aggregate** — don't fold them back into one schema file.

## PostGIS & geospatial

- Geometry/geography columns are declared with `Unsupported("geography(GEOMETRY,4326)")` because Prisma doesn't natively model them.
- Reads/writes go through raw SQL helpers; see [prisma/prisma/models/geography.prisma](../../prisma/prisma/models/geography.prisma) and the server's geography service.
- The DB Docker image is custom ([docker/database/Dockerfile](../../docker/database/Dockerfile)) and pre-installs PostGIS. **Don't substitute vanilla `postgres:16`.**

## Workflow

| Action | Command (in `prisma/`) |
|---|---|
| Edit schema | edit files in [prisma/models/](../../prisma/prisma/models/) |
| Create a new migration | `yarn migrate:create` (= `prisma migrate dev`) |
| Apply in prod / CI | `yarn migrate:deploy` |
| Reset dev DB (destructive) | `yarn migrate:reset` |
| Regenerate types only | `yarn prisma generate` |
| Full rebuild for downstream | `yarn build` (= `prisma generate` + `tsc`) |

The `postinstall` hook also runs `prisma generate`, so `yarn install` produces a usable client — but `yarn build` is still required before downstream typechecks pass.

## How to add a new model

1. Create `prisma/prisma/models/<name>.prisma` with the model definition.
2. Run `cd prisma && yarn build` — regenerates Prisma Client and Pothos bindings.
3. Run `yarn migrate:create` — review and commit the generated SQL.
4. The `<Name>` model is now available as `prismaService.prisma.<name>` in the server and as `PrismaTypes["Name"]` in the Pothos builder.
5. To expose it via GraphQL, see [server.md § How to add a new aggregate](server.md).

## Gotchas

- **Stale `dist/` is the #1 source of confusing errors downstream.** Always `yarn build` after schema edits, before expecting server/client to typecheck.
- **`@prisma/client` singleton**: installing a second copy in server/client produces two PrismaClient classes that don't share the connection pool — symptoms include connection pool exhaustion under load.
- **`previewFeatures = ["views"]`** means `view` blocks in the schema are supported; treat them as read-only (no write operations).
- **Migrations are append-only**: editing an applied migration desyncs CI/prod. Always create a new one.

## Pointers

- Per-module: [prisma/CLAUDE.md](../../prisma/CLAUDE.md)
- Build chain: [build-system.md](build-system.md)
- How the server consumes Pothos types: [graphql.md](graphql.md), [server.md](server.md)
