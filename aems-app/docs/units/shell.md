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
- A route's `scope` names a role (`user`, `admin` or `keycloak`) and admits only a user whose roles
  grant it, so `keycloak` admits no one but a Keycloak user. A route without one is public.
- A route nested in a pathless group (`manage`, `admin`) resolves to itself, never to the group or to
  `/`, so it keeps its own scope wherever it is declared.
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
| `route-resolves-through-groups` | every route resolves to its own node, the Admin group's included |
| `route-display-rules` | display semantics |
| `hidden-routes-reachable` | hidden from nav, still reachable |
| `preferences-persist-sync` | localStorage and server sync |
| `first-load-no-console-errors` | clean first load |
