# Auth

Multi-strategy auth stack with strategies coexisting side-by-side under [server/src/auth/](../../server/src/auth/), selectable at runtime via the `AUTH_FRAMEWORK` env var. GraphQL auth uses Pothos `scope-auth`; REST uses `@Roles` + `RolesGuard`.

## Strategy layout

| Strategy | Folder | Module | Purpose |
|---|---|---|---|
| **AuthJS** | [authjs/](../../server/src/auth/authjs/) | `AuthjsModule` | Default. NextAuth-style sessions, Keycloak OAuth. |
| **Passport** | [passport/](../../server/src/auth/passport/) | `PassportModule` | Classic Passport pipeline, available as alternative. |
| **Local** | [local/](../../server/src/auth/local/) | via `ProviderModule` | Email/password against the local DB at `/api/providers/local`. |
| **Bearer** | [bearer/](../../server/src/auth/bearer/) | via `ProviderModule` | JWT bearer tokens at `/api/providers/bearer`. |
| **Keycloak** | [keycloak/](../../server/src/auth/keycloak/) | via `ProviderModule` | Keycloak OAuth2 at `/api/providers/keycloak`. |
| **Super** | [super/](../../server/src/auth/super/) | via `ProviderModule` | Privileged admin override. |

[server/src/auth/README.md](../../server/src/auth/README.md) is the integration guide — read it before adding a new provider.

## `FrameworkModule` wiring

**Both `AuthjsModule` and `PassportModule` are always loaded**, regardless of `AUTH_FRAMEWORK`. The env var governs runtime behavior (which middleware actually authenticates a request) — not module inclusion. `FrameworkModule.register()` is called in both `AppModule` (no path) and inside `PothosGraphQLModule.forRoot()` (to make `WebSocketAuthService` available to the context factory).

## `AuthModule`

`AuthModule` registers `RolesGuard` as a global `APP_GUARD`:

```typescript
{ provide: APP_GUARD, useClass: RolesGuard }
```

This means **every endpoint requires auth by default**. Opt out with `@PublicRoute()` — required on auth pages (`/authjs/*`, `/auth/*`), health checks, and any public endpoint. Don't comment out the guard — that's a footgun.

## GraphQL: `scope-auth`

The Pothos `scope-auth` plugin runs in [builder.service.ts](../../server/src/graphql/builder.service.ts). Scopes are derived from `context.user.authRoles` and applied per field:

```typescript
builder.queryField("adminThing", (t) => t.prismaField({
  authScopes: { admin: true },
  resolve: ...
}))
```

- **Don't roll auth checks inside resolvers** — declare `authScopes` on the field instead.
- Scopes compose: `{ $any: { admin: true, super: true } }` for OR semantics.
- `authorizeOnSubscribe: true` means subscription auth runs once at subscribe time, not per-event.
- The `Role` enum lives in `@local/common`.

## REST: `@Roles` + `RolesGuard`

For REST controllers in [server/src/api/](../../server/src/api/) and reverse-proxy handlers in [server/src/ext/](../../server/src/ext/):

```typescript
@Controller("api/files")
export class FileController {
  @Post("upload")
  @Roles("user")
  upload(...) { ... }

  @Get("public-info")
  @PublicRoute()
  publicInfo() { ... }
}
```

`RolesGuard` calls `Role.granted(requiredRole, user.role)` from `@local/common`. Because `admin` grants `user`, an admin user passes a `@Roles("user")` check.

## Role enforcement

`Role.granted(required, ...userRoles): boolean` from `@local/common`:

- `Role.granted("user", "admin")` → `true` (admin grants user)
- `Role.granted("admin", "user")` → `false`
- `Role.granted("user", "super")` → `true` (super grants admin grants user)

## WebSocket auth

`WebSocketAuthService.authenticateWebSocket()` is called in the `onConnect` handler in [pothos.module.ts](../../server/src/graphql/pothos.module.ts) for both `graphql-ws` and `subscriptions-transport-ws`:

```typescript
// websocket.service.ts
switch (this.configService.auth.framework) {
  case "authjs":   await this.authjsMiddleware.use(request, response, next); break;
  case "passport": await this.passportMiddleware.use(request, response, next); break;
  default: return undefined;
}
return request.user;
```

The authenticated user is stored on `extra.socket.user` (graphql-ws) or returned as `{ user }` context (legacy). The GraphQL context factory reads from both `req.user` (HTTP) and `extra.socket.user` (WS).

## Session sharing in dev

The recommended dev workflow runs the **client locally** at `https://<HOSTNAME>:3000` and **everything else in Docker**. For sessions and OAuth redirects to work across that boundary, all four conditions must be met:

| Requirement | Why | What breaks if violated |
|-------------|-----|------------------------|
| Real hostname (not `localhost`) | `Set-Cookie` with `Domain` can't be set on `localhost` | User always appears logged out |
| Same hostname for Docker + local client | OAuth callbacks use the hostname from the original request | OAuth redirect goes to wrong URL |
| Valid TLS on both | Secure cookies require HTTPS | `server.cjs` fails to start; browser rejects insecure cookie |
| Cookies scoped to hostname | Browser won't send cookies across different domains | Implicit once hostname matches |

[client/server.cjs](../../client/server.cjs) auto-copies mkcert certs from the `skeleton-proxy` container via [client/copy-certs.cjs](../../client/copy-certs.cjs) to satisfy the TLS requirement.

## Keycloak

Optional, gated behind the `sso` compose profile. When enabled:

- [docker/keycloak/](../../docker/keycloak/) contains the image + [default-realm.json](../../docker/keycloak/default-realm.json) + [init-keycloak.sh](../../docker/keycloak/init-keycloak.sh).
- Traefik routes `/auth/sso/*` → Keycloak.
- Set `AUTH_FRAMEWORK=authjs` and configure `KEYCLOAK_ISSUER`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`.
- `KEYCLOAK_PASS_ROLES=true` maps Keycloak realm roles to the internal `Role` enum.
- Onboarding screenshots are in [docs/](../../docs/).
- The `keycloak` role (in `RoleEnum`) grants access to the in-app admin management page (`/keycloak`) and — when synced — direct access to the Keycloak Admin Console via SSO.

### Keycloak Admin API

[server/src/graphql/keycloak/](../../server/src/graphql/keycloak/) is a GraphQL aggregate (separate from the OAuth2 auth strategy) that exposes realm-role management to privileged app users.

**KeycloakAdminService** ([keycloak-admin.service.ts](../../server/src/graphql/keycloak/keycloak-admin.service.ts)):
- Authenticates against the Keycloak **master realm** using a Resource Owner Password grant (`KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD`).
- When `KEYCLOAK_ADMIN_INTERNAL_URL` is set (e.g. `http://skeleton-keycloak:8080/auth/sso` in Docker), admin REST calls go directly to that host, bypassing the Traefik proxy.
- Key methods: `listRealmRoles`, `getUserRoles`, `assignRoles`, `revokeRoles`, `hasAdminAccess`, `assignRealmManagementRoles`, `revokeRealmManagementRoles`, `syncAdminRole`.

**Role sync (`syncAdminRole`):** Whenever the app-level `keycloak` role is granted or revoked on a user (via `createUser` / `updateUser`), `syncAdminRole` mirrors the change into Keycloak's `realm-management` client roles (default: `realm-admin`). This gives the user direct access to the Keycloak Admin Console via their existing SSO session — no separate Keycloak password needed.

**GraphQL access control:** All queries and mutations in this aggregate use `authScopes: { keycloak: true }` (enforced by the Pothos scope-auth plugin). Only users holding the `keycloak` role can invoke them.

**New env vars (consumed by `AppConfigService` on the server):**

| Var | Description | Default |
|-----|-------------|---------|
| `KEYCLOAK_ADMIN` | Master-realm admin username | `admin` |
| `KEYCLOAK_ADMIN_PASSWORD` | Admin password (also a Docker secret: `keycloak_admin_password`) | — |
| `KEYCLOAK_ADMIN_INTERNAL_URL` | Base URL for Admin REST calls in Docker (bypasses Traefik proxy) | derived from `KEYCLOAK_ISSUER` |
| `KEYCLOAK_ADMIN_ROLE` | `realm-management` client role to grant/revoke for admin console access | `realm-admin` |

## How to add a new auth provider

1. Create `server/src/auth/<name>/` with module, service, controller, middleware.
2. The middleware **must populate `req.user`** — `scope-auth` reads `context.user` which comes from `req.user`.
3. Register in `FrameworkModule.register()` (or `ProviderModule` for standalone provider endpoints).
4. Add a case to `WebSocketAuthService.authenticateWebSocket()` switch.
5. Document the `AUTH_FRAMEWORK=<name>` value in `.env.example`.

## Conventions

- **GraphQL = `scope-auth`. REST = `@Roles` + `RolesGuard`.** Don't mix.
- **`@PublicRoute()` for opt-outs.** Don't comment out the guard.
- **`Role` enum lives in `@local/common`** — single source of truth for both server and client.
- **Don't log credentials, JWTs, or session cookies.**

## Gotchas

- **`scope-auth` not seeing user?** → Provider not populating `req.user`, or middleware not wired in `MiddlewareModule`.
- **Adding a new auth strategy requires it to populate `context.user`** — `scope-auth` won't see roles otherwise.
- **WebSocket auth is fiddly** — Express session sharing into the WS handshake has subtleties. New strategy must also be added to `WebSocketAuthService.authenticateWebSocket()`.
- **`localhost` in `.env` breaks dev sessions** — see "Session sharing in dev" above.

## Pointers

- Per-module: [server/CLAUDE.md](../../server/CLAUDE.md), [server/src/auth/README.md](../../server/src/auth/README.md)
- GraphQL plugin: [graphql.md](graphql.md)
- Docker / proxy / Keycloak: [docker.md](docker.md)
