# server/ — NestJS GraphQL API

NestJS 11 + Apollo Server 4 + Pothos (code-first GraphQL) backed by Prisma. Handles auth, GraphQL queries/mutations/subscriptions, REST controllers for file uploads, reverse-proxy to external services, and background services (seed, log pruning, backup, event).

## Layout

- [server/src/main.ts](../../server/src/main.ts) — bootstrap (HTTP + WS).
- [server/src/app.module.ts](../../server/src/app.module.ts) — root NestJS module. Wires everything together.
- [server/src/app.config.ts](../../server/src/app.config.ts) — typed env config service. **Read config through this, not `process.env`.**
- [server/src/schema.ts](../../server/src/schema.ts) — entrypoint used by `yarn compile:schema` to emit [server/schema.graphql](../../server/schema.graphql).
- [server/src/graphql/](../../server/src/graphql/) — Pothos schema builders, **one folder per aggregate**: `user/`, `backup/`, `banner/`, `comment/`, `feedback/`, `file/`, `geography/`, `log/`, `account/`, `current/`, `keycloak/`. Each typically defines object types, query inputs, mutation inputs, subscriptions.
  - [builder.service.ts](../../server/src/graphql/builder.service.ts) — the shared Pothos `SchemaBuilder` with plugins.
  - [pothos.driver.ts](../../server/src/graphql/pothos.driver.ts) — NestJS driver that feeds the Pothos schema into `@nestjs/graphql`.
  - [pothos.decorator.ts](../../server/src/graphql/pothos.decorator.ts) — `@PothosBuilder`, `@PothosObject`, `@PothosQuery`, `@PothosMutation` metadata decorators.
  - [schema.module.ts](../../server/src/graphql/schema.module.ts) — registers all aggregate services; uses `DiscoveryService` to collect decorated providers.
- [server/src/auth/](../../server/src/auth/) — multi-strategy auth stack: [authjs/](../../server/src/auth/authjs/), [passport/](../../server/src/auth/passport/), [local/](../../server/src/auth/local/), [bearer/](../../server/src/auth/bearer/), [keycloak/](../../server/src/auth/keycloak/), [super/](../../server/src/auth/super/). See [auth.md](auth.md).
  - [roles.decorator.ts](../../server/src/auth/roles.decorator.ts) + [roles.guard.ts](../../server/src/auth/roles.guard.ts) — role gating for REST.
  - Pothos `scope-auth` plugin handles GraphQL-level auth; scopes are defined in the builder.
- [server/src/api/](../../server/src/api/) — Nest REST controllers (file upload streaming). Not GraphQL.
- [server/src/ext/](../../server/src/ext/) — reverse-proxy handlers for role-gated external services (map tiles, Nominatim, wiki).
- [server/src/services/](../../server/src/services/) — background services: [backup/](../../server/src/services/backup/), [event/](../../server/src/services/event/), [log/](../../server/src/services/log/), [seed/](../../server/src/services/seed/).
- [server/src/prisma/](../../server/src/prisma/) — Prisma module + service (DI wrapper around `@local/prisma`).
- [server/src/redis.ts](../../server/src/redis.ts), [server/src/subscription/](../../server/src/subscription/) — Redis client + GraphQL pub/sub transport.
- [server/src/middleware/](../../server/src/middleware/), [server/src/logging/](../../server/src/logging/), [server/src/utils/](../../server/src/utils/).
  - [readSecret.ts](../../server/src/utils/readSecret.ts) — reads a credential from `/run/secrets/<name>` (Docker secret file) with `_FILE` env var and plain env var fallbacks. Used by `PrismaService` and `KeycloakService`.
- [server/src/graphql/keycloak/](../../server/src/graphql/keycloak/) — Keycloak Admin API aggregate. **Not** part of the OAuth2 auth strategy — this exposes realm-role management to app users holding the `keycloak` role. Files: `keycloak-admin.service.ts` (Admin REST API client), `object.service.ts` (`KeycloakRole` type), `query.service.ts`, `mutate.service.ts`. See [auth.md](auth.md) § "Keycloak Admin API" for full detail.

  GraphQL operations (all scoped `authScopes: { keycloak: true }`):

  | Operation | Type | Description |
  |-----------|------|-------------|
  | `readAvailableKeycloakRoles` | Query | Lists all realm roles |
  | `readKeycloakRoles(userId)` | Query | Lists realm roles assigned to a user |
  | `readKeycloakAdminAccess(userId)` | Query | Returns whether a user has Keycloak Admin Console access |
  | `assignKeycloakRoles` | Mutation | Assigns realm roles to a user |
  | `revokeKeycloakRoles` | Mutation | Revokes realm roles from a user |
  | `grantKeycloakAdminAccess` | Mutation | Grants `realm-management` admin role |
  | `revokeKeycloakAdminAccess` | Mutation | Revokes `realm-management` admin role |

  Additional `AppConfigService` fields for the Keycloak admin service:

  | Env var | Description | Default |
  |---------|-------------|---------|
  | `KEYCLOAK_ADMIN` | Master-realm admin username | `admin` |
  | `KEYCLOAK_ADMIN_PASSWORD` | Admin password (Docker secret: `keycloak_admin_password`) | — |
  | `KEYCLOAK_ADMIN_INTERNAL_URL` | Internal Docker URL for Admin REST calls | derived from `KEYCLOAK_ISSUER` |
  | `KEYCLOAK_ADMIN_ROLE` | `realm-management` client role name for admin access | `realm-admin` |
- [server/src/schema-app.module.ts](../../server/src/schema-app.module.ts) — minimal `SchemaAppModule` used only by the `compile:schema` entrypoint (`schema.ts`). Loads just enough to build the Pothos schema without starting HTTP/WS/background services.

## Root module tree (`app.module.ts`)

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [AppConfigToken] }),  // loads .env + .env.local
    ApiModule,                          // REST file controllers
    WorkerModule,                       // worker process
    AuthModule,                         // RolesGuard as APP_GUARD (global)
    MiddlewareModule,                   // wires auth + ext middleware
    FrameworkModule.register(),         // AuthJS + Passport + WebSocketAuthService
    LoggingModule,                      // pino structured logging
    PrismaModule,                       // PrismaService DI
    ProviderModule.register({ path: "api" }), // local/bearer/keycloak/super at /api
    PothosGraphQLModule.forRoot(),      // Apollo + Pothos schema + subscriptions
    RouterModule.register([{ path: "api", module: ApiModule }]),
    ServicesModule,                     // background services
    ThrottlerModule.forRoot([           // rate limiting: short/medium/long
      { name: "short",  ttl: 1000,  limit: 3   },
      { name: "medium", ttl: 10000, limit: 20  },
      { name: "long",   ttl: 60000, limit: 100 },
    ]),
  ],
})
```

## How the GraphQL stack is wired

```
PothosGraphQLModule.forRoot()
  → SchemaModule.register()
      → SchemaBuilderService  (@PothosBuilder)
      → DiscoveryService collects providers by @PothosObject / @PothosQuery / @PothosMutation
      → All aggregate object/query/mutate services must be listed in SchemaModule providers
  → GraphQLModule.forRootAsync()
      driver: PothosApolloDriverWrapper
        → extends PothosApolloDriver
        → ModulesContainer finds @PothosBuilder service
        → calls builder.awaitSchema() → resolves to GraphQLSchema
      → Apollo Server starts with the Pothos-built schema
```

**Critical:** `@PothosObject()`, `@PothosQuery()`, and `@PothosMutation()` decorators alone are **not sufficient**. A service must also be listed in [schema.module.ts](../../server/src/graphql/schema.module.ts) providers for `DiscoveryService` to find it. The decorator marks the class; the providers array makes it injectable and discoverable.

## Config service pattern

**Never use `process.env` directly.** Always inject `AppConfigService`:

```typescript
@Injectable()
export class MyService {
  constructor(
    @Inject(AppConfigService.Key) private configService: AppConfigService,
    private prismaService: PrismaService,
  ) {}
}
```

Use `configService.readSecret()` (or the standalone `readSecret()` from `src/utils/readSecret.ts`) for sensitive values — it reads Docker secret files when available, falling back to the env var.

## REST and reverse-proxy

- `src/api/` — Nest controllers for endpoints that don't fit GraphQL (file upload streaming). Mounted at `/api/*` via `RouterModule`.
- `src/ext/` — reverse-proxy middleware for external services (map tiles, Nominatim, wiki). Request flow: client → Traefik → Nest `ExtRewriteMiddleware` → role check → forward to upstream service. Tiles are role-gated even though the tile server has no auth of its own.

## Background services

- Selected at boot via `INSTANCE_TYPE` env var. Examples: `seed`, `log`, `*` (all), `*,!event` (all except event).
- The `start:redis` npm script launches the Redis subscriber entry point separately (used by the compose `services` container).
- Wired through [server/src/services/services.module.ts](../../server/src/services/services.module.ts).
- Scheduling via `@nestjs/schedule` (`@Cron`).

## Subscription service

Three backends selectable by `GRAPHQL_PUBSUB` env:

| Value | Backend | Use case |
|-------|---------|----------|
| `redis` or `ioredis` | `graphql-redis-subscriptions` | Production — cross-instance |
| `prisma`, `database`, `postgres`, `postgresql` | `PrismaPubSub` | Single-instance; more durable |
| `memory` or unset | In-memory `PubSub` | Development only |

**Always use `SubscriptionService.publish(topic, payload)`** — never publish directly to an in-memory emitter. Topic naming: `"User"` (collection) and `"User/abc123"` (entity by ID).

## How to add a new aggregate

1. Create `prisma/prisma/models/<name>.prisma` → `cd prisma && yarn build`
2. Create `server/src/graphql/<name>/object.service.ts` decorated with `@Injectable() @PothosObject()`
3. Create `query.service.ts` with `@Injectable() @PothosQuery()`
4. Create `mutate.service.ts` with `@Injectable() @PothosMutation()` (if needed)
5. **Add all three to `SchemaModule` providers** in [schema.module.ts](../../server/src/graphql/schema.module.ts)
6. Run `cd server && yarn compile:schema` → `cd client && yarn compile:graphql`

## Conventions

- **GraphQL is code-first.** Define types via Pothos in `src/graphql/`. Never edit [schema.graphql](../../server/schema.graphql) — it's emitted by `yarn compile:schema`.
- **Use `builder.prismaObject(...)` / `prismaField(...)`** so the [prisma/src/pothos.ts](../../prisma/src/pothos.ts) bindings give you type-safe selects.
- **Subscriptions go through `graphql-redis-subscriptions`**, never an in-memory event emitter.
- **GraphQL auth via `scope-auth` plugin**, declared on fields. Don't add custom auth checks in resolvers.
- **REST auth via `@Roles(...)` + `RolesGuard`.** `@PublicRoute()` opts a route out of auth.
- **Services own business logic** reused across resolvers — not the resolvers themselves.
- **Configuration via `AppConfigService`**, not raw `process.env`.
- **Tests colocate** as `*.test.ts`. `yarn test` runs in-band with `--forceExit --detectOpenHandles`.

## Gotchas

- **Change a Prisma model? Rebuild [prisma/](../../prisma/) FIRST**, then regenerate the GraphQL schema.
- **Decorator alone is insufficient**: service must be in `SchemaModule` providers.
- **`@local/prisma` and `@local/common` resolve through `portal:`** — they must be built for imports to work.
- **WebSocket + Express session sharing is fiddly** — look at the existing `websocket.service.ts` before adding new WS auth.
- **`APP_GUARD` is global**: every new controller needs `@PublicRoute()` or `@Roles()`.

## Pointers

- Per-module: [server/CLAUDE.md](../../server/CLAUDE.md)
- GraphQL details: [graphql.md](graphql.md)
- Auth details: [auth.md](auth.md)
- Deployment / `INSTANCE_TYPE`: [deployment.md](deployment.md)
