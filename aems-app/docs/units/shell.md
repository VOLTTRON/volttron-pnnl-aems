# shell

**State:** unbuilt

## Contract

The client frame every page renders inside: providers, navigation, and the route guard. It guarantees
pages a loaded current user, preferences and theme, and that a page is only shown to a user its route
admits. Pages do not re-check access.

## Claims

- The providers nest Logging outermost through Current to Theme innermost.
- On every navigation `template.tsx` shows the loading state while the user loads, NotFound for an
  unknown route, `/auth/denied` for a route the user is not granted, and `/auth/login?redirect=` for an
  anonymous user on a scoped route.
- A route's `scope` is `user`, `admin` or `super`, and a route without one is public.
  **Open:** `client/src/app/routes.ts` uses `scope: "user"`, `scope: "admin"`, and `scope: "keycloak"` (the `keycloak` route, line 339) — never `super`. `common/src/constants/role.ts` defines four roles (`super`, `admin`, `user`, `keycloak`), of which `super` and `keycloak` both grant `admin` and `user`. Is the valid scope set `{user, admin, keycloak}` (dropping `super`, which no route uses), or should the `keycloak` route use a different mechanism than scope?
- A route's `display` decides whether it appears in navigation: always, admins only, Keycloak users
  only, or never.
- `NEXT_PUBLIC_HIDDEN_ROUTES` removes routes from navigation at build time without making them
  unreachable.
- Preferences persist in localStorage and sync to the server.
- The first load of `/` logs no console errors.

## Dependencies

auth, graphql

## Scenarios

| Name | Proves |
|---|---|
| `provider-order` | provider nesting |
| `template-guard-states` | loading, not found, denied, login redirect |
| `route-scope-public-default` | scope semantics |
| `route-display-rules` | display semantics |
| `hidden-routes-reachable` | hidden from nav, still reachable |
| `preferences-persist-sync` | localStorage and server sync |
| `first-load-no-console-errors` | clean first load |
