# auth

**State:** unbuilt

## Contract

Who the caller is and what they may do, for HTTP, GraphQL and WebSocket alike. It guarantees every
other unit a populated `user.authRoles` on an authenticated request and a single role model to check
against. It does not decide what any individual field or page requires — that is declared where the
field or page is.

## Claims

- `AUTH_FRAMEWORK` selects the framework, `authjs` or `passport`, and unset means `authjs`; both
  framework modules are always loaded.
- `AUTH_PROVIDERS`, a comma list, enables each of local, bearer, keycloak and super that it names,
  and no other.
  **Open:** does naming `bearer` enable it under `authjs`? There is only a passport bearer: `bearer/bearer.module.ts:35-37` returns `null` unless `AUTH_FRAMEWORK=passport`, so the default framework with `AUTH_PROVIDERS=bearer` enables nothing (measured). The other fourteen cases hold in `server/src/auth/providers.test.ts`.
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
| `framework-selected-by-env` | the framework follows `AUTH_FRAMEWORK`; unset is `authjs`; both modules load |
| `providers-selected-by-env` | each provider is enabled only when `AUTH_PROVIDERS` names it |
| `endpoints-private-by-default` | unauthenticated requests are refused without `@PublicRoute` |
| `roles-guard-admits-granted` | `@Roles` admits through `Role.granted` |
| `role-grants-table` | the grant table |
| `impersonation-super-only` | signing in as another user is refused without `super` |
| `websocket-auth-at-connect` | WS authenticates at connect |
| `session-cookie-attributes` | Secure, Domain = `APP_HOSTNAME` |
| `authjs-endpoints-answer` | signin never 500, providers never 404/502 |
| `keycloak-roles-mapped` | realm roles map onto the enum |
| `no-throttler` | no throttler module is imported or depended on |
