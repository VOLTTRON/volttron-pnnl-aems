# prisma/ — Database layer

Prisma ORM, PostgreSQL 16 + PostGIS 3, migration source of truth. This module is the **root of the build chain** — `common`, `server`, and `client` all import from it via Yarn `portal:` links. Rebuilding here is what makes downstream typechecks pass.

## Layout

- [prisma/schema.prisma](prisma/schema.prisma) — datasource, generators. Minimal; actual models are split into separate files.
- [prisma/models/](prisma/models/) — one `.prisma` file per aggregate (`user`, `backup`, `banner`, `comment`, `event`, `feedback`, `file`, `geography`, `log`, `seed`, `session`, `account`, `verificationtoken`). Prisma stitches them together at generate time.
- [prisma/migrations/](prisma/migrations/) — SQL migrations; never edit an applied one. Create new migrations instead.
- [src/index.ts](src/index.ts) — re-exports the generated Prisma Client plus hand-authored helpers.
- [src/pothos.ts](src/pothos.ts) — **generated** Pothos type bindings (by `prisma-pothos-types`); used by server/common to build GraphQL types from Prisma models. Don't hand-edit.
- [scripts/](scripts/) — migration/seed helpers.

## Generators

Three generators run on `prisma generate` (see [prisma/schema.prisma](prisma/schema.prisma)):
1. `prisma-client-js` — the standard client.
2. `prisma-json-types-generator` — types for `Json` columns; respects `/// @type(...)` doc-comments in models.
3. `prisma-pothos-types` — emits [src/pothos.ts](src/pothos.ts) so the server can build Pothos types from Prisma models.

Preview features enabled: `relationJoins`, `postgresqlExtensions`, `views`. PostGIS is declared as an extension on the datasource.

## Workflow

- **Change schema**: edit files in [prisma/models/](prisma/models/).
- **Create migration**: `yarn migrate:create` (= `prisma migrate dev`). Commit the generated SQL.
- **Apply in prod / CI**: `yarn migrate:deploy`.
- **Reset dev DB**: `yarn migrate:reset` — destructive, don't run against anything you care about.
- **Regenerate client only**: `yarn prisma generate`. `postinstall` also runs this.
- **Full build**: `yarn build` (generate + `tsc`) — required before `common`/`server`/`client` will typecheck.

## Conventions

- Geospatial columns use PostGIS types via `Unsupported("geometry(...)")` or `geography(...)`. Queries against them typically go through raw SQL helpers — see [prisma/models/geography.prisma](prisma/models/geography.prisma) and the server's geography service.
- JSON columns must declare their TS type via `/// @type(TypeName)` so `prisma-json-types-generator` can emit it. Put the TS type in a file consumed by the generator's config.
- Model field naming: camelCase in Prisma schema, mapped to snake_case columns via `@map` where the team convention requires it — check neighbours before introducing a new naming style.
- Don't add `.ts` files under [prisma/prisma/](prisma/prisma/) — that tree is for Prisma DSL + SQL only.

## Gotchas

- Editing a model without regenerating will leave `@local/prisma/dist` stale; downstream typechecks will fail with confusing errors. Always `yarn build` after schema changes.
- `@prisma/client` is declared as a `peerDependency` but consumed by `common/server/client` through `portal:../prisma/node_modules/@prisma/client` — do not install a second copy in those modules.
- The `previewFeatures = ["views"]` flag means `view` blocks in the schema are supported; treat them as read-only.
