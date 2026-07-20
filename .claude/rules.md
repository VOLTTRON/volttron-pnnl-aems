# Project rules — Skeleton

The project rules of the road. Companion to [CLAUDE.md](../CLAUDE.md), which is auto-loaded into every Claude Code session and lays out the orientation. This file is the long form: every rule the codebase actually enforces, in one place.

If a rule here conflicts with a per-module [CLAUDE.md](../CLAUDE.md), the per-module file wins for that module.

For deeper "why does it look this way" explanations of each subsystem, see [architecture/](architecture/).

---

## Build & dependency rules

- **Yarn 4.x only**. Never `npm install`, never `npm run`. Lockfiles and `portal:` links are Yarn-specific; mixing in npm corrupts the workspace.
- **Node 22.x**. Match this in dev and CI.
- **Build order is `prisma → common → server → client`**. Use the top-level [build.sh](../build.sh) / [build.ps1](../build.ps1) — do not rebuild sub-projects individually unless you know the upstream is current.
- **`portal:` links resolve `dist/`, not `src/`**. If you edit `prisma/src/` or `common/src/` and don't `yarn build`, downstream modules silently use the old code or fail to typecheck.
- **After editing any file under [prisma/prisma/](../prisma/prisma/)**, run `yarn build` in [prisma/](../prisma/) (or `yarn compile` from the root) before expecting server/client to typecheck.
- **`@prisma/client` is a peerDependency**. It's consumed via `portal:../prisma/node_modules/@prisma/client` — do not install a second copy in common/server/client.

## TypeScript

- **Strict everywhere**: `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`. No new modules with these relaxed.
- **Path alias**: `@/*` → `src/*` in every module. Use it for intra-module imports rather than long relative paths.
- **No plain JS in `src/`**. The only `.cjs` files allowed are [client/server.cjs](../client/server.cjs) and [client/copy-certs.cjs](../client/copy-certs.cjs) — they need to stay CommonJS despite `"type": "module"`.
- **Module format**: server/common/prisma → `commonjs` + `ES2021`. Client → `ESNext` + bundler resolution.

## Code style & formatting

- **Prettier**: tab width 2, print width 120, double quotes, trailing commas on all multiline. Don't change these.
- **ESLint**:
  - server / common / prisma → flat config ([eslint.config.mjs](../server/eslint.config.mjs)).
  - client → Next's legacy config (`next lint`). Don't propagate flat-config changes here without testing.
- **`no-floating-promises` is warn, not error** — but treat it as error when reviewing your own code.
- **Unused vars must start with `_`** to opt out of the rule.
- **`clsx` for conditional class names** in client React components. Don't roll your own.

## Naming conventions

- **React components**: PascalCase, `.tsx` (e.g., `NavbarLeft.tsx`).
- **NestJS providers / services**: kebab-case files with `.service.ts` / `.module.ts` / `.controller.ts` suffixes (e.g., `builder.service.ts`).
- **SCSS modules**: `*.module.scss`, kebab-case (e.g., `page.module.scss`).
- **GraphQL operation files**: kebab-case `.graphql` per aggregate (e.g., `user.graphql`).
- **Prisma model files**: kebab-case `.prisma` per aggregate under [prisma/prisma/models/](../prisma/prisma/models/).
- **Branches**: `feature/<kebab-case-name>` (e.g., `feature/cleanup`, `feature/backups`).
- **Commits**: `<type>(<scope>): <message>` — types observed: `feat`, `fix`, `refactor`, `Merge`. Lowercase message, imperative mood, no trailing period.
- **PR target branch**: `develop`, NOT `main`.

## GraphQL / Pothos

- **Code-first only**. Define types via Pothos builders in [server/src/graphql/](../server/src/graphql/).
- **Never hand-edit** [server/schema.graphql](../server/schema.graphql) or [client/schema.graphql](../client/schema.graphql) — both are generated.
- **Per-aggregate folder convention**: each aggregate (`user/`, `backup/`, ...) typically has `object.service.ts`, `query.service.ts`, `mutate.service.ts`, plus a module file. Mirror this when adding a new aggregate.
- **Use `builder.prismaObject(...)` and `prismaField(...)`** — not raw `objectType(...)` — so the [prisma/src/pothos.ts](../prisma/src/pothos.ts) bindings give you type-safe selects.
- **GraphQL auth via `scope-auth`** plugin — declare scopes on fields. Don't add custom auth checks inside resolvers.
- **Subscriptions go through `graphql-redis-subscriptions`** — never an in-memory event emitter, or they'll break under multi-instance deployment.
- **Complexity limits** are configured in the builder (`complexity: 500, depth: 5`). Don't disable them; refactor the query instead.
- **Regen pipeline**: server `yarn compile:schema` → client `yarn compile:graphql`. Both must run for client codegen to see new fields.
- **Client queries**: write `.graphql` files under [client/src/queries/](../client/src/queries/), then `yarn compile:graphql`. Import the generated hooks from [client/src/graphql-codegen/](../client/src/graphql-codegen/) — **never** use inline `gql` tagged templates.

## Prisma / database

- **Models split per aggregate** under [prisma/prisma/models/](../prisma/prisma/models/). Don't fold them all back into one `schema.prisma`.
- **camelCase fields, snake_case columns via `@map`** when team convention requires it — match neighbours, don't introduce a third style.
- **JSON columns must declare a TS type** with a `/// @type(TypeName)` doc-comment, or the generator emits `unknown`.
- **Three generators run on `prisma generate`**: `prisma-client-js`, `prisma-json-types-generator`, `prisma-pothos-types`. Don't disable any of them.
- **PostGIS is required** — geospatial columns use `Unsupported("geometry(...)")` / `geography(...)`. The DB image is custom ([docker/database/Dockerfile](../docker/database/Dockerfile)); plain `postgres:16` won't work.
- **Migrations are append-only** — never edit an applied migration. Create a new one with `yarn migrate:create`.
- **`yarn migrate:reset` is destructive** — never run against a DB you care about.
- **No `.ts` files under [prisma/prisma/](../prisma/prisma/)** — that tree is for Prisma DSL + SQL only.

## Testing

- **Jest per module**, colocated `*.test.ts` next to the source.
- **Environments**: client → `jest-environment-jsdom`; server / common / prisma → Node.
- **Server runs with `--forceExit --detectOpenHandles`** because Nest leaves intervals/sockets alive — clean them up in `afterAll`/`afterEach` when you add new ones.
- **Coverage**: `yarn test:cov` per module. Reports go to `coverage/`.
- **Don't mock `@local/prisma`** if you can avoid it — there's a real DB available via Docker; integration tests are preferred for resolver coverage.

## Security & secrets

- **Real secrets live in `.env.secrets` and `docker/secrets/`** — both gitignored. Never commit either.
- **Server reads env via `@nestjs/config` / [server/src/app.config.ts](../server/src/app.config.ts)** — not `process.env` directly. Typed config keeps test overrides clean.
- **Client only reads `NEXT_PUBLIC_*`** vars on the browser side. Anything secret stays server-side.
- **Auth scopes for GraphQL**: defined on the Pothos builder, applied per field via the `scope-auth` plugin.
- **Auth guards for REST**: `@Roles(...)` decorator + `RolesGuard`. The new `@PublicRoute` decorator opts a route out of auth — see commit `98d60b0`.
- **Never log credentials, JWTs, or session cookies**. The logging service has multiple transports; sensitive data leaks to the DB log table if you're sloppy.

## Docker

- **`docker compose up -d` from the repo root** — never `cd docker && ...` and never `-f docker/docker-compose.yml`. The root [docker-compose.yml](../docker-compose.yml) is a shim that `include:`s the real file with `project_directory: ./docker/`. Running from the wrong place loads the wrong `.env`.
- **Optional services hide behind compose profiles** — `proxy`, `keycloak`, `map`, `nominatim`, `wiki`. Enable with `--profile <name>`.
- **Secret files must exist before `up`** — run `./secrets.sh` (or `.\secrets.ps1`) first, then `./check-env.sh` to verify the chain. `start-services.sh` runs the check automatically.
- **When a credential changes**, re-run `./secrets.sh` (or `.\secrets.ps1`) — it detects the change, applies the ALTER ROLE / kcadm against the running container, updates the file, and restarts the service. Bypassing the script (hand-editing `docker/secrets/*.txt`, or `--force`) will cause auth failures on DB-backed services.
- **Image builds use repo root as context** so they pull sibling portal-linked modules. Don't change the build context without understanding the portal chain.
- **Custom DB image** — never replace with `postgres:16`. PostGIS will be missing.
- **Traefik v3 syntax** — different from v2; check the docs before copying old snippets.

## Common / shared library

- **Isomorphic only**. No `fs`/`path`/`process.env` at module load; no `window`/`document`. If it can't run in both Node and browser, it doesn't belong here.
- **No side effects at import time**. Top-level code fires in both the Nest server and the Next.js bundle.
- **Minimal runtime deps** — anything new gets bundled into the client. Justify before adding.
- **Re-export through [common/src/index.ts](../common/src/index.ts)**, not deep imports.

## Documentation

- **README files are documentation only** — no code examples. Code samples belong in source comments or in [CLAUDE.md](../CLAUDE.md) / `.clinerules`.
- **Per-module CLAUDE.md** is the source of truth for that module's conventions. Read it before editing.
- **`.clinerules`** (root + per-module) is the legacy Cline equivalent of CLAUDE.md. Keep them in rough sync — when you change CLAUDE.md, mirror the change in `.clinerules`.
- **Architecture design docs** for each subsystem live under [.claude/architecture/](architecture/). Add to / update these when you make a structural change worth remembering.

## Cross-cutting guardrails

- **Don't bypass Prisma rebuild after schema edits.** "It typechecks for me locally" usually means stale `dist/`; CI will fail.
- **Don't add features the task didn't ask for.** No speculative abstractions, no defensive code for cases that can't happen, no comments narrating obvious code.
- **Don't run destructive operations without asking** — `migrate:reset`, `docker compose down -v`, `git push --force`, file deletes. The user's in-progress work is everywhere; check first.
- **PRs target `develop`, not `main`.**
- **The hostname in `.env` must be a real hostname (not `localhost`)** for sessions and Keycloak OAuth redirects to work between the Docker stack and the local dev client.
