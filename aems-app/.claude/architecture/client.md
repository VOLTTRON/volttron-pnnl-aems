# client/ — Next.js frontend

Next.js 14 (App Router) + React 18 + TypeScript + Blueprint.js + SCSS modules. Consumes the server's GraphQL API via Apollo Client with typed operations produced by GraphQL Codegen.

## Layout

- [client/src/app/](../../client/src/app/) — Next App Router tree. Route-per-folder with `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `template.tsx`.
  - Feature routes: `about/`, `auth/`, `backups/`, `banners/`, `demo/`, `feedback/`, `keycloak/`, `logs/`, `users/`.
  - [components/common/](../../client/src/app/components/common/) — shared UI (banner, echarts, file, loading, navbar, navigation, notice, notification, paging, palette, preferences, search, table, texticon, theme).
  - [components/providers/](../../client/src/app/components/providers/) — context providers (current user, GraphQL/Apollo, loading, logging, notification, preferences, routing, screen size).
  - [components/feedback/](../../client/src/app/components/feedback/) — feedback widget.
  - [api/](../../client/src/app/api/) — Next route handlers (server-side within the client).
  - [routes.ts](../../client/src/app/routes.ts) — route constants. **Use these; don't hardcode paths.**
- [client/src/queries/](../../client/src/queries/) — `.graphql` files grouped by aggregate. **Edit these**, then regenerate hooks.
- [client/src/graphql-codegen/](../../client/src/graphql-codegen/) — generated types + Apollo hooks. **Don't hand-edit.**
- [client/src/utils/](../../client/src/utils/) — client-side helpers (palette, colors, filter/search).
- [client/next.config.js](../../client/next.config.js), [client/codegen.ts](../../client/codegen.ts) — Next + codegen config.
- [client/server.cjs](../../client/server.cjs) — custom HTTPS dev server. `yarn dev` / `yarn dev:https` runs this; `yarn dev:http` uses plain `next dev`.
- [client/copy-certs.cjs](../../client/copy-certs.cjs) — pulls TLS certs from the `skeleton-proxy` Docker container.
- [client/schema.graphql](../../client/schema.graphql) — **copy of the server's schema** used for codegen. Regenerated; don't hand-edit.

## Provider stack

`layout.tsx` wraps the entire app in providers in this exact order (order matters — each can consume context from providers above it):

```
LoggingProvider          → pino logger with HTTP transport
  BlueprintProvider      → Blueprint.js theming root (required by all Blueprint components)
    Suspense
      GraphqlProvider    → Apollo Client (HTTP + WebSocket split link)
        RouteProvider    → static route tree, current route resolution
          NotificationProvider  → toast/notification state
            LoadingProvider     → global + local loading states
              PreferencesProvider  → user preferences (localStorage + server sync)
                ScreenSizeProvider  → viewport size context
                  CurrentProvider  → authenticated user data (ReadCurrent query)
                    Theme          → Blueprint theme switcher
                      {children}
                      Notice / Banner / Notification / GlobalLoading
```

**What breaks without each provider:**

| Provider removed | Symptom |
|---|---|
| `BlueprintProvider` | All Blueprint components fail to render |
| `GraphqlProvider` | All Apollo hooks throw |
| `RouteProvider` | `template.tsx` breaks; navigation throws |
| `CurrentProvider` | Auth guard in `template.tsx` breaks |

## Template.tsx — auth guard

`template.tsx` re-renders on every navigation. It performs the only client-side auth check:

```typescript
if (loading) {
  return <GlobalLoading />;
} else if (!route) {
  return <NotFound />;
} else if (current && !isGranted(route, current)) {
  return router.push("/auth/denied");
} else if (!current && !isGranted(route, {})) {
  return router.push(`/auth/login?redirect=${findPath(route)}...`);
}
```

Individual pages do **not** need to recheck auth — `template.tsx` handles it.

## Route system

Routes are defined in [routes.ts](../../client/src/app/routes.ts) as a flat array that `buildTree()` (from `@local/common`) assembles into a tree.

Key fields:

| Field | Purpose |
|---|---|
| `id` | Unique identifier |
| `parentId` | Parent route ID |
| `path` | URL segment (`Dynamic` sentinel for `[param]` segments) |
| `scope` | Required role (`"user"`, `"admin"`, `"super"`). Undefined = public |
| `display` | `true` = always show in nav; `"admin"` = show only for admins; `"keycloak"` = show only when Keycloak auth is enabled (detected via `useIsKeycloakEnabled`); `false` = hide |
| `components` | Navbar/navigation components to render for this route |

`isGranted(route, user)` calls `Role.granted(route.scope, user.role)` from `@local/common`. `NEXT_PUBLIC_HIDDEN_ROUTES` env var hides routes from navigation at build time (they still exist and are accessible).

## Custom HTTPS dev server

Why this exists: session cookies and Keycloak OAuth redirects require a consistent hostname **and TLS** between the Dockerized client (behind Traefik) and the local dev client.

What `server.cjs` does:
1. Runs `copy-certs.cjs` → `docker cp` from the `skeleton-proxy` container into the repo root as `mkcert-*.crt`/`mkcert-*.key`.
2. Boots Next as an HTTPS server on the configured hostname:port.
3. Ensures `https://<HOSTNAME>:3000` (local) shares the same cert chain as `https://<HOSTNAME>` (Dockerized).

`server.cjs` and `copy-certs.cjs` are **CommonJS despite `"type": "module"`** in [package.json](../../client/package.json). Keep the `.cjs` extension.

## Apollo + codegen

Operation files under `client/src/queries/`: `account.graphql`, `backup.graphql`, `banner.graphql`, `comment.graphql`, `feedback.graphql`, `file.graphql`, `geography.graphql`, `keycloak.graphql`, `log.graphql`, `user.graphql`, and others. Add a new `.graphql` file per aggregate.

```
client/src/queries/*.graphql        ← you edit these (operations)
client/schema.graphql                ← copy of server's schema (regenerated, don't edit)
        │
        │  yarn compile:graphql (graphql-codegen)
        ▼
client/src/graphql-codegen/          ← generated hooks, types, fragment-masking
        │
        ▼
import { useUserQuery } from "@/graphql-codegen/..."
```

The Apollo Client uses an HTTP + WebSocket split link: queries and mutations go over HTTP (credentials: include), subscriptions go over WebSocket (`graphql-ws`).

**Don't use inline `gql` tagged templates** — the codegen path is the source of truth.

## Keycloak-aware UI

The `/keycloak` admin page ([client/src/app/keycloak/page.tsx](../../client/src/app/keycloak/page.tsx)) is gated to users holding the `keycloak` role. It provides:
- A button linking to the Keycloak Admin Console.
- Links to Keycloak Server Administration and Securing Applications documentation.
- A User Role Management card: select any app user, view their current realm roles as tags, and click Assign/Revoke per role.
- An Admin Console Access toggle: grants or revokes the `realm-admin` client role in Keycloak, giving the selected user direct Admin Console access via their SSO session.

**`useIsKeycloakEnabled`** ([client/src/app/components/hooks/useIsKeycloakEnabled.ts](../../client/src/app/components/hooks/useIsKeycloakEnabled.ts)): fetches `/api/auth` once (module-level cache) and returns `true` if `keycloak` is in the enabled providers list. Used to conditionally render Keycloak-specific UI throughout the app.

**`keycloakAdminUrl()`** ([client/src/utils/client.tsx](../../client/src/utils/client.tsx)): derives the Keycloak Admin Console URL from `NEXT_PUBLIC_KEYCLOAK_ISSUER_URL` or falls back to `NEXT_PUBLIC_KEYCLOAK_ADMIN_URL`.

**`users/dialog.tsx` Keycloak-aware changes:** When Keycloak is enabled, the password field in the user create/update dialogs shows a helper note directing SSO users to manage their password in the Keycloak Admin Console. The `keycloak` role checkbox is hidden when Keycloak is not enabled.

**Client env vars added for Keycloak admin:**

| Var | Description | Default |
|-----|-------------|---------|
| `NEXT_PUBLIC_KEYCLOAK_ADMIN_URL` | Base path for the Keycloak Admin Console link | `/auth/sso/admin` |

## How to add a new page/route

1. Add an entry to [routes.ts](../../client/src/app/routes.ts) with `id`, `parentId`, `path`, `scope`, `display`, `components`.
2. Create `src/app/<path>/page.tsx` (add `"use client"` if it uses hooks or Blueprint).
3. If it needs GraphQL: write operations in `src/queries/<aggregate>.graphql` → `yarn compile:graphql` → import generated hooks.
4. The `scope` field handles auth gating automatically via `template.tsx`.

## Server Components vs Client Components

- **Server Components** are the default in App Router. Data fetching can run server-side.
- **Apollo hooks need `"use client"`** — components that use them must be client components.
- **Blueprint components are client-only** in this codebase — wrap them in `"use client"` files.

## Conventions

- **Styling**: SCSS modules (`*.module.scss`). Use `clsx` for conditional classes. Global styles in `global.module.scss` / `page.module.scss` / `template.module.scss`.
- **UI components**: Blueprint.js. Prefer Blueprint primitives over rolling your own.
- **Maps**: `maplibre-gl` + `react-map-gl` + `deck.gl`. **Charts**: `echarts`.
- **Types from the GraphQL schema**: via codegen. Prefer codegen types for anything crossing the wire.
- **File naming**: React components `PascalCase.tsx`, utilities camelCase, SCSS `*.module.scss`.

## Workflow

- `yarn dev` / `yarn dev:https` — custom HTTPS dev server.
- `yarn dev:http` — plain `next dev` on `0.0.0.0` (no TLS — don't use when you need session continuity with Docker).
- `yarn compile` → `yarn compile:graphql` — regenerate hooks from `.graphql` files + schema.
- `yarn build` — `compile` + `next build`.

## Gotchas

- **Apollo types look wrong?** Codegen is stale. Server must run `yarn compile:schema` first, then `yarn compile:graphql` here.
- **ESLint here is `next lint` — legacy config**, not flat config like the other modules.
- **Client `schema.graphql` drift** — gets out of sync with [server/schema.graphql](../../server/schema.graphql) easily. Check [codegen.ts](../../client/codegen.ts) for which file it reads.
- **The hostname trap**: `localhost` in `.env` breaks OAuth + session cookies. Use a real hostname.
- **useContext throws?** — Component is mounted above the provider. Check the provider stack nesting in [layout.tsx](../../client/src/app/layout.tsx).

## Pointers

- Per-module: [client/CLAUDE.md](../../client/CLAUDE.md)
- GraphQL details: [graphql.md](graphql.md)
- Auth / session sharing: [auth.md](auth.md)
