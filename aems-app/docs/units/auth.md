# auth

**State:** unbuilt

## Contract

Who the caller is and what they may do, for HTTP, GraphQL and WebSocket alike. It guarantees every
other unit a populated `user.authRoles` on an authenticated request and a single role model to check
against. It does not decide what any individual field or page requires — that is declared where the
field or page is.

## Claims

- `AUTH_FRAMEWORK` selects the runtime strategy among authjs, passport, local, bearer, keycloak and
  super; both framework modules are always loaded, and unset means `authjs`.
  **Open:** `AUTH_FRAMEWORK` only ever chooses between `authjs` and `passport` (`server/src/app.config.ts:374`, `auth/framework.module.ts`); local, bearer, keycloak and super are providers chosen by `AUTH_PROVIDERS` (`app.config.ts:375`) and each module decides on `providers.includes(...)` (`auth/super/super.module.ts`), so `AUTH_FRAMEWORK=local` selects nothing.
- Every HTTP endpoint requires an authenticated user unless it carries `@PublicRoute`; the global
  guards are AuthenticatedGuard and RolesGuard.
- `@Roles(...)` on a REST handler admits a user whose roles satisfy it through `Role.granted`.
- `Role.granted`: `super` and `keycloak` each grant `admin` and `user`; `admin` grants `user`; `user`
  grants nothing. Only `super` may sign in as another user.
- A WebSocket connection is authenticated once, at connect, by the same framework as HTTP.
- The Auth.js session cookie is `Secure` and scoped to `APP_HOSTNAME`.
- `/authjs/signin` never answers 500, and `/authjs/providers` never answers 404 or 502.
- With `KEYCLOAK_PASS_ROLES=true`, Keycloak realm roles map onto the `Role` enum.
- The server does no request rate limiting and carries no throttler module or dependency.

## Dependencies

stack

## Scenarios

| Name | Proves |
|---|---|
| `framework-selected-by-env` | the strategy follows `AUTH_FRAMEWORK`; unset is `authjs` |
| `endpoints-private-by-default` | unauthenticated requests are refused without `@PublicRoute` |
| `roles-guard-admits-granted` | `@Roles` admits through `Role.granted` |
| `role-grants-table` | the grant table |
| `impersonation-super-only` | signing in as another user is refused without `super` |
| `websocket-auth-at-connect` | WS authenticates at connect |
| `session-cookie-attributes` | Secure, Domain = `APP_HOSTNAME` |
| `authjs-endpoints-answer` | signin never 500, providers never 404/502 |
| `keycloak-roles-mapped` | realm roles map onto the enum |
| `no-throttler` | no throttler module is imported or depended on |
