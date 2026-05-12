# server/ — NestJS GraphQL API

NestJS 11 + Apollo Server 4 + Pothos (code-first GraphQL) backed by Prisma. Handles auth, REST controllers for file/ext routes, GraphQL queries/mutations/subscriptions, and background services.

## Layout

- [src/main.ts](src/main.ts) — bootstrap entrypoint (HTTP + WS).
- [src/app.module.ts](src/app.module.ts), [src/app.config.ts](src/app.config.ts) — root module + env config.
- [src/schema.ts](src/schema.ts) — entrypoint used by `yarn compile:schema` to emit [schema.graphql](schema.graphql).
- [src/graphql/](src/graphql/) — **Pothos schema builders** organized per aggregate (`user/`, `backup/`, `banner/`, `comment/`, `feedback/`, `file/`, `geography/`, `log/`, `account/`, `current/`). Each folder typically defines object types, inputs, queries, mutations, subscriptions.
  - [builder.service.ts](src/graphql/builder.service.ts) — the shared Pothos `SchemaBuilder` with plugins (prisma, relay, scope-auth, complexity, smart-subscriptions).
  - [pothos.driver.ts](src/graphql/pothos.driver.ts) — NestJS driver that feeds the Pothos schema to `@nestjs/graphql`.
- [src/auth/](src/auth/) — auth stack with **multiple strategies side-by-side**: [authjs/](src/auth/authjs/) (primary), [passport/](src/auth/passport/), [local/](src/auth/local/), [bearer/](src/auth/bearer/), [keycloak/](src/auth/keycloak/), [super/](src/auth/super/). See [src/auth/README.md](src/auth/README.md).
  - [roles.decorator.ts](src/auth/roles.decorator.ts) + [roles.guard.ts](src/auth/roles.guard.ts) — role gating for REST.
  - Pothos `scope-auth` plugin handles GraphQL-level auth; scopes are defined in the builder.
- [src/api/](src/api/) — Nest REST controllers (file uploads, etc.). Not GraphQL.
- [src/ext/](src/ext/) — reverse-proxy handlers for role-gated external services (map tiles, Nominatim, wiki). Request goes through Nest so roles can be checked before forwarding.
- [src/services/](src/services/) — background services: [backup/](src/services/backup/), [event/](src/services/event/), [log/](src/services/log/), [seed/](src/services/seed/).
- [src/prisma/](src/prisma/) — Prisma module + service (DI wrapper around `@local/prisma`).
- [src/redis.ts](src/redis.ts), [src/subscription/](src/subscription/) — Redis client + GraphQL pub/sub transport.
- [src/middleware/](src/middleware/), [src/logging/](src/logging/), [src/utils/](src/utils/).

## Conventions

- **GraphQL is code-first.** Define types/queries via Pothos in [src/graphql/](src/graphql/). Do **not** edit [schema.graphql](schema.graphql) — it's emitted by `yarn compile:schema`.
- **Prisma types flow through Pothos.** Use `builder.prismaObject(...)` / `prismaField(...)` so the generated [prisma/src/pothos.ts](../prisma/src/pothos.ts) bindings give you type-safe select sets.
- **Subscriptions** use `graphql-redis-subscriptions` so they survive across instances. New subscriptions must publish through the shared pub/sub service, not an in-memory emitter.
- **Auth in GraphQL**: declare required scopes on fields via the `scope-auth` plugin — don't guard with custom resolvers.
- **Auth in REST**: use `@Roles(...)` + `RolesGuard`.
- **Services** live in [src/services/](src/services/) and are wired through [services.module.ts](src/services/services.module.ts). Business logic that's reused across resolvers goes here, not inside the resolver.
- **Configuration**: read via `@nestjs/config` / [app.config.ts](src/app.config.ts), not `process.env` directly. Typed config keeps test overrides clean.
- **Tests**: `*.test.ts` colocated. `yarn test` runs in-band with `--forceExit --detectOpenHandles` — if you add things that keep the process alive (intervals, open sockets), clean them up in teardown.

## Workflow

- `yarn start:dev` — hot-reload Nest dev server. Needs Postgres + Redis running.
- `yarn compile` → `yarn compile:schema` — regenerate [schema.graphql](schema.graphql) after touching Pothos types. Run this before the client's `yarn compile:graphql` will see changes.
- `yarn build` — compile + `nest build` → `dist/`.
- `yarn check` / `yarn test` / `yarn test:cov` — as expected.

## Gotchas

- If you change a Prisma model, rebuild [../prisma/](../prisma/) **then** regenerate the GraphQL schema here — otherwise Pothos sees stale types.
- `@local/prisma` and `@local/common` resolve through `portal:` — they must be built for imports to work.
- Adding a new sub-module? Wire it into [app.module.ts](src/app.module.ts). The project uses module-per-aggregate, mirroring the GraphQL folder layout.
- WebSocket / Socket.IO + Express session sharing is fiddly — look at the existing `websocket.service.ts` before adding new WS auth.
- `main` branch for PRs is `develop`.
