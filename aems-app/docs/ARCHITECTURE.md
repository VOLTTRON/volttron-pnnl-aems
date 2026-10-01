# AEMS app — architecture

This document outranks every other document in the repository. The trap list is
[TRAPS.md](TRAPS.md); the units and their state are in [roster.md](roster.md); how the work is verified
is `process.json` at the repository root.

## 1. The loop

An operator configures and controls building RTUs and HVAC at VOLTTRON edge sites — setpoints,
schedules, occupancy, holidays, ILC — from one web app, and sees the result come back through the
historian and Grafana. A change that does not make that loop more correct, more reliable or easier to
operate is not on the path.

## 2. Layers

`prisma → common → server`, and `prisma → common → client`. Nothing points the other way.

- **server and client never import each other.** They meet over GraphQL — HTTP for queries and
  mutations, WebSocket (graphql-ws) for subscriptions — and nowhere else.
- **Downstream consumes `@local/prisma` and `@local/common` through Yarn `portal:` links to the built
  `dist/`, never `src/`.** An upstream edit is invisible downstream until the upstream is built.
- **common is isomorphic.** No Node or DOM APIs, no import-time side effects, and a new runtime
  dependency ships in the client bundle. Everything public goes through `common/src/index.ts`;
  consumers never deep-import.
- **Where code goes:** used by both server and client → common; used by one → stays there; Nest- or
  React-specific → never common.
- **The edge (`aems-edge/`) is a peer, not a layer.** The app reaches it through VOLTTRON and the
  historian database, never through imports.

## 3. The contracts that cross everything

- **GraphQL is code-first.** Pothos builds the schema; `server/schema.graphql`,
  `client/schema.graphql` and `client/src/graphql-codegen/` are generated and never hand-edited. An
  aggregate is a folder under `server/src/graphql/<agg>/` with a module and object, query and mutate
  services, built with `prismaObject`/`prismaField`, registered in SchemaModule, and its module wired
  into `app.module.ts`. Decorated but unregistered is absent.
- **Authorisation has exactly two mechanisms.** GraphQL fields declare `authScopes`; REST handlers
  declare `@Roles` or `@PublicRoute`. No auth check is written inside a resolver or handler. The
  `Role` class in `@local/common` is the single source that scope-auth, RolesGuard and the client's
  route guard all read.
- **Every mutation publishes** through SubscriptionService on topics `Model` and `Model/id`. Nothing
  uses an in-memory emitter directly — it breaks the moment there is a second instance.
- **Business logic lives in services**, not resolvers or controllers.
- **Server configuration is read through AppConfigService**, never `process.env`. The browser reads
  only `NEXT_PUBLIC_*`; secrets stay server-side.
- **Client operations live in `client/src/queries/*.graphql`** and are used through generated hooks;
  never an inline `gql`. Anything crossing the wire uses codegen types, not `@local/prisma` types.
- **Prisma:** one model file per aggregate under `prisma/prisma/models/`; camelCase fields mapped to
  snake_case with `@map`; every Json column carries `/// @type(...)` or it types as `unknown`; no
  `.ts` under `prisma/prisma/`; migrations are append-only.

## 4. Verification

The tier commands are in `process.json`; this says what each is for.

| Tier | Catches | Blind to |
|---|---|---|
| A types | stale upstream `dist/`, type drift across the portal chain — it rebuilds prisma and common first so it can never check against a stale chain | runtime behaviour |
| B lint | rule violations, without `--fix` | anything the rules do not name |
| C unit tests | behaviour of common, server and client in isolation | prisma (no tests), wiring, the deployed stack |
| D build | nest build, next build, and a generated schema that differs from the committed one | everything that only happens in Docker |
| E stack | the deployed stack end to end through Traefik, Keycloak and a browser | how it looks; Windows-only |
| F owner | how it looks and feels, TLS trust in a real browser | — |

Nothing runs in CI for aems-app; the only workflows are aems-edge's. **The class that survives every
tier is the edge loop** — a setpoint written here and never applied at a site — because no tier drives
a real VOLTTRON platform.

## 5. Hard constraints

- **The database is the custom PostGIS image.** Geography columns are `Unsupported(...)` and queried
  with raw SQL; vanilla `postgres:16` cannot run the migrations.
- **A real hostname, never localhost.** Session cookies carry a Domain and OAuth callbacks a host;
  localhost holds neither.
- **Compose runs from `aems-app/`.** The shim there is what loads the right `.env`.
- **Yarn 4, never npm**, in prisma, common, server and client — lockfiles and portal links are
  Yarn's. `scripts/` is the one npm package.
- **Never log credentials, tokens or cookies.** The logger writes to a database table.
- **Profile gating is load-bearing.** It is what makes a minimal deployment possible.
- **Strict TypeScript everywhere**; no module relaxes it.
- **Ask before anything destructive** — `migrate:reset`, `down -v`, a force-push, a deletion — and do
  not build what was not asked for.

## Roster

Every unit, its state and what it depends on, is in the roster `process.json` names.
