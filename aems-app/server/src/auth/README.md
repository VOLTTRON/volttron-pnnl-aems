# server/src/auth/ — Authentication strategies

This directory contains the server-side authentication stack. Multiple strategies operate side-by-side; the active providers are configured via the `AUTH_PROVIDERS` environment variable.

## Strategies

| Directory | Strategy | Notes |
|---|---|---|
| `authjs/` | Auth.js (primary) | Session middleware + JWT handling |
| `keycloak/` | Keycloak / OAuth2 SSO | Active when `AUTH_PROVIDERS` includes `keycloak` |
| `local/` | Username/password | Local credential validation |
| `bearer/` | Bearer token | API key / machine-to-machine access |
| `super/` | Super-user | Elevated internal access |
| `passport/` | Passport.js plumbing | Shared strategy wiring |

## GraphQL vs REST auth

- **GraphQL** — field-level auth is enforced by the Pothos `scope-auth` plugin, not request guards. Scopes are declared directly on fields in the Pothos builders.
- **REST** — use `@Roles(...)` decorator with `RolesGuard` on controllers.
- To mark a route public (no auth required), use the `@PublicRoute()` decorator from `auth.module.ts`.

## Further reading

Full architecture detail (session sharing, WebSocket auth, adding a new provider, Keycloak setup): [`.claude/architecture/auth.md`](../../../.claude/architecture/auth.md)
