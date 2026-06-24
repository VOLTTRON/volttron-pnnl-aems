# GraphQL

Code-first GraphQL via Pothos on the server, Apollo Client + GraphQL Codegen on the client. The schema is **never** hand-edited — it's emitted from server code, then consumed by client codegen.

## End-to-end pipeline

```
prisma/prisma/models/*.prisma
        │
        │  yarn build (in prisma/)        ← regenerates prisma/src/pothos.ts type bindings
        ▼
server/src/graphql/                       ← Pothos builders consume those bindings
   user/{object,query,mutate}.service.ts
   backup/{object,query,mutate}.service.ts
   ... per aggregate
        │
        │  yarn compile:schema (in server/)   ← writes server/schema.graphql
        │                                        (also writes client/schema.graphql in non-prod
        │                                         via autoSchemaFile: "../client/schema.graphql")
        ▼
server/schema.graphql ─────── (kept in sync with) ──▶ client/schema.graphql
                                                               │
                                                               │  yarn compile:graphql (in client/)
                                                               ▼
                                                     client/src/graphql-codegen/
                                                         (typed hooks, fragments)
                                                               │
                                                               ▼
                                                     import { useUserQuery } from "@/graphql-codegen/..."
```

If any step is skipped, the next step works against stale types. **A server schema change requires both `compile:schema` (server) and `compile:graphql` (client) before the client typechecks.**

## Server side: Pothos `SchemaBuilderService`

[server/src/graphql/builder.service.ts](../../server/src/graphql/builder.service.ts) sets up the shared `SchemaBuilder` with these plugins (order matters):

| Plugin | Purpose |
|---|---|
| `RelayPlugin` | Cursor-based pagination, `Node` interface. |
| `ScopeAuthPlugin` | Field-level auth — reads `context.user.authRoles`. |
| `PrismaPlugin` | `builder.prismaObject(...)` / `prismaField(...)` — generates type-safe selects from [prisma/src/pothos.ts](../../prisma/src/pothos.ts). |
| `PrismaUtils` | Helpers for filter / orderBy inputs. |
| `SmartSubscriptionsPlugin` | Auto-derives subscriptions from queries (paired with `SubscriptionService`). |
| `ComplexityPlugin` | Caps query complexity (500) and depth (5). |

**Scope auth config:**
```typescript
scopeAuth: {
  authorizeOnSubscribe: true,   // auth runs at subscribe time, not per-event (critical)
  treatErrorsAsUnauthorized: true,
  authScopes: (context) => context.user?.authRoles ?? new AuthUser().roles,
}
```

**Complexity limits:**
```typescript
complexity: {
  defaultComplexity: 1,
  defaultListMultiplier: 10,
  limit: { complexity: 500, depth: 5 },
}
```

**Global types registered in constructor:** `ModeType` enum, `MutationType` enum, `DateTime` scalar, `Json` scalar, `BooleanFilter`, `IntFilter`, `FloatFilter`, `StringFilter`, `DateTimeFilter`, `PagingInput`. Use these shared types in aggregate services — don't redefine them.

## Decorator-based auto-registration

[pothos.decorator.ts](../../server/src/graphql/pothos.decorator.ts) defines metadata symbols for `@PothosBuilder`, `@PothosObject`, `@PothosQuery`, `@PothosMutation`.

`SchemaModule.register()` uses `DiscoveryService` to find providers with these metadata keys. **A class must be both decorated AND listed in `SchemaModule` providers** to be discovered — the decorator alone is insufficient.

## Per-aggregate folder convention

Each aggregate under [server/src/graphql/](../../server/src/graphql/) follows the same shape:

```
server/src/graphql/<aggregate>/
  ├─ object.service.ts    ← @PothosObject: prismaObject definitions, subscribe field
  ├─ query.service.ts     ← @PothosQuery: queries, connections, query input types
  └─ mutate.service.ts    ← @PothosMutation: mutations, mutation input types
```

When adding a new aggregate, mirror this. Register all three services in [schema.module.ts](../../server/src/graphql/schema.module.ts) providers.

## Standard query types

For any aggregate, five query types cover the standard access patterns:

| Query name | Pothos pattern | Purpose |
|-----------|---------------|---------|
| `pageUser` | `prismaConnection` | Cursor-based pagination (Relay spec) |
| `readUser` | `prismaField` (single) | Fetch one by unique key |
| `readUsers` | `prismaField` (list) | List with where/orderBy/paging |
| `countUsers` | custom queryField returning Int | Count with optional where |
| `groupUsers` | custom queryField | Aggregate/group-by operations |

Not every aggregate needs all five. Add only what clients actually need.

## Subscriptions

- Use `SubscriptionService` (which wraps Redis pub/sub in production) — **never an in-memory event emitter** — they must work across multiple server instances.
- Topic naming: `"User"` (all user events) and `"User/abc123"` (events for a specific entity by ID).
- Publish after mutations: `await subscriptionService.publish("User", { topic: "User", id: user.id, mutation: Mutation.Created })`.
- The `subscribe` field on `prismaObject` wires up smart subscriptions — the query auto-re-resolves when a registered topic fires.
- `authorizeOnSubscribe: true` means auth runs once at subscription creation, not per-event.

## Auth on fields

Declare `authScopes` at the field or query level — don't add custom auth checks inside resolvers:

```typescript
builder.queryField("adminQuery", (t) =>
  t.prismaField({ authScopes: { admin: true }, ... })
);
```

Scopes compose: `{ $any: { admin: true, super: true } }` for OR semantics.

## Complexity guard

The limits (complexity 500, depth 5) prevent runaway N+1 queries. **Don't disable them** — refactor heavy queries instead. To override on a specific field: `t.prismaField({ complexity: { field: 5, multiplier: 3 }, ... })`.

## Client side: codegen + Apollo

[client/codegen.ts](../../client/codegen.ts) drives `graphql-codegen`:

- Reads `.graphql` operation files from [client/src/queries/](../../client/src/queries/).
- Reads the schema from `client/schema.graphql`.
- Writes typed hooks + types + fragment-masking helpers into [client/src/graphql-codegen/](../../client/src/graphql-codegen/).

**Use the generated hooks**, never `gql` tagged templates inline. Subscriptions on the client use `graphql-ws`.

## How to add a new client operation

1. Write the operation in `client/src/queries/<aggregate>.graphql`.
2. Run `cd client && yarn compile:graphql`.
3. Import the generated hook: `import { useReadWidgetsQuery } from "@/graphql-codegen/graphql"`.

## Conventions

- **Code-first, never SDL-first.** Don't author schema in `.graphql` files on the server.
- **Don't hand-edit `schema.graphql`** in either workspace.
- **Auth in GraphQL = `scope-auth`**, not inline checks in resolvers.
- **Subscriptions go through Redis pub/sub.**
- **Complexity limits stay** — refactor heavy queries, don't disable.
- **One `.graphql` operation file per aggregate** on the client (e.g., `user.graphql`).

## Gotchas

- **Pothos type for model missing?** → Prisma not rebuilt (`cd prisma && yarn build`).
- **Forgot `compile:schema`?** → Client codegen sees the old schema.
- **Forgot `compile:graphql`?** → Generated hooks are stale.
- **Using `gql` inline?** → No type inference. Move to `client/src/queries/*.graphql`.
- **Subscription not firing across instances?** → In-memory emitter used instead of Redis.
- **Decorated service not registering fields?** → Not listed in `SchemaModule` providers.

## Pointers

- Server details: [server.md](server.md)
- Client details: [client.md](client.md)
- Auth details: [auth.md](auth.md)
- Per-module CLAUDE.md: [server/CLAUDE.md](../../server/CLAUDE.md), [client/CLAUDE.md](../../client/CLAUDE.md)
