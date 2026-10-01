# System overview

Skeleton is a full-stack TypeScript monorepo: PostGIS-backed Prisma data layer, NestJS + Pothos GraphQL API, Next.js 14 + Blueprint client, and a Docker Compose deployment with Traefik, Keycloak, Redis, and optional map / wiki services.

## Module dependencies

```
              ┌──────────┐
              │  prisma  │  ← root of the build chain
              └────┬─────┘
                   │ portal: (resolves to dist/, not src/)
       ┌───────────┴───────────┐
       │                       │
       ▼                       ▼
  ┌─────────┐            ┌──────────┐
  │ common  │ ─portal:─▶ │  server  │ ─── HTTP/WS ───▶ ┌────────┐
  └────┬────┘            └────┬─────┘                  │ client │
       │ portal:              │                        └────┬───┘
       ▼                      ▼                             │
  ┌─────────┐            (postgres,                          │
  │ client  │ ◀───── HTTP/WS via Traefik ─── Apollo Client ──┘
  └─────────┘             redis)
```

- `prisma`, `common`, `server`, `client` are sibling Yarn workspaces. They consume each other through Yarn `portal:` links to **built `dist/`** — not source.
- `prisma` is the root: it owns the schema, the Prisma Client, the JSON-column types, and the Pothos type bindings. Everything downstream imports from `@local/prisma`.
- `common` is isomorphic — its modules execute in both Node and the browser. It depends on `@local/prisma` and is safe to consume from either server or client.
- `server` and `client` both depend on `prisma` and `common`, but never on each other directly. They communicate over GraphQL (HTTP + WS).

## Request lifecycle

### Production (full Docker stack)

```
Browser → :443 Traefik (TLS termination)
  /               → client container (Next.js)
  /graphql        → server container (Apollo)
  /api/*          → server container (NestJS REST)
  /ext/*          → server container (role-gated reverse proxy)
  /auth/sso/*     → keycloak container  [keycloak profile only]
→ NestJS middleware pipeline
    1. JSON parser, trust proxy (main.ts)
    2. AuthjsMiddleware  → populates req.user
    3. ExtRewriteMiddleware  → checks roles, forwards /ext/* to external services
→ Apollo / NestJS controller
    GraphQL:  Pothos resolver → PrismaService → PostGIS Postgres
    REST:     Controller → PrismaService → PostGIS Postgres
```

### Dev (hybrid: local client + Docker services)

```
Browser → https://<HOSTNAME>:3000 (local Next.js dev server)
  Next.js rewrites (/graphql, /api, /ext, /authjs) → Docker server container
  Everything else served by local Next.js
```

The hostname **must not be `localhost`** — session cookies and OAuth redirects require a real hostname. See [auth.md](auth.md) for the four dev-session requirements.

## WebSocket / subscription lifecycle

```
Browser opens WebSocket to wss://<HOST>/graphql
  → graphql-ws handshake (connection_init)
  → pothos.module.ts onConnect handler
      → WebSocketAuthService.authenticateWebSocket(request)
          dispatches to AuthjsMiddleware or PassportMiddleware based on AUTH_FRAMEWORK
      → stores authenticated user on extra.socket.user
  → GraphQL context factory reads extra.socket.user (or req.user for HTTP)
  → scope-auth plugin checks authScopes (authorizeOnSubscribe: true)
  → SubscriptionService.asyncIterator(topic)
      Redis PubSub (production) / Prisma PubSub / in-memory PubSub
  → events published via SubscriptionService.publish(topic, payload)
```

Both `graphql-ws` (current) and `subscriptions-transport-ws` (legacy) are supported and share the same auth path.

## Build → run lifecycle

1. **Generate**: in `prisma/`, `prisma generate` runs all three generators (Prisma Client, JSON types, Pothos types). Outputs go to `prisma/src/` (`pothos.ts`) and `prisma/node_modules/.prisma/`.
2. **Build**: `prisma/` compiles `src/` to `dist/`. Then `common/` builds. Then `server/` and `client/`. The top-level [build.sh](../../build.sh) / [build.ps1](../../build.ps1) orchestrate this.
3. **Run**:
   - Full Docker: `docker compose up -d` from the repo root.
   - Hybrid dev: Docker for backing services + server, local `yarn dev` for client.

## Auth at altitude

- **AuthJS** is the default framework, configurable via `AUTH_FRAMEWORK` in `server/.env`.
- Alternatives — Passport, Local, Bearer, Keycloak, Super — coexist as siblings under [server/src/auth/](../../server/src/auth/), selectable at boot.
- **Both `AuthjsModule` and `PassportModule` are always loaded** in the NestJS DI graph — `AUTH_FRAMEWORK` governs runtime behavior, not module inclusion.
- **GraphQL** auth uses Pothos `scope-auth`: roles flow from `context.user.authRoles` into field-level scope checks.
- **REST** auth uses `@Roles(...)` + `RolesGuard`. `@PublicRoute()` opts a route out of auth.
- **WebSocket** auth runs at connection time via `WebSocketAuthService.authenticateWebSocket()` in `onConnect`.
- See [auth.md](auth.md) for details.

## Geospatial baked in

- Postgres image is custom and includes PostGIS — see [docker/database/Dockerfile](../../docker/database/Dockerfile).
- Geometry/geography columns are declared via Prisma `Unsupported(...)` types and queried with raw SQL helpers.
- Optional services: an OSM tile server (`map` profile), a Nominatim geocoder (`nominatim` profile). Both are reverse-proxied through `server/src/ext/` so role checks happen before tiles flow.

## Environment boundary map

```
Public (internet-facing via Traefik)
  :443  →  client, server (/graphql, /api, /ext), keycloak (/auth/sso)
  :80   →  HTTP → HTTPS redirect

Internal compose network (skeleton_net)
  DNS: database.skeleton, redis.skeleton, server.skeleton, client.skeleton
  Services communicate by hostname; no direct port exposure to host

External (optional, outside the compose stack)
  Keycloak:  /auth/sso/*      → keycloak container  [keycloak profile]
  Map tiles: /ext/map/*       → map container        [map profile]
  Geocoding: /ext/nominatim/* → nominatim container  [nominatim profile]
```

## Pointers

- Root orientation: [CLAUDE.md](../../CLAUDE.md)
- Build details: [build-system.md](build-system.md)
- Per-area deep dives: [prisma.md](prisma.md), [server.md](server.md), [client.md](client.md), [graphql.md](graphql.md), [auth.md](auth.md), [docker.md](docker.md)
