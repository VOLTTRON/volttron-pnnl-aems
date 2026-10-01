# graphql

**State:** unbuilt

## Contract

The GraphQL platform every aggregate is built on: the Pothos builder and its plugins, query limits,
field authorisation, and live updates. It guarantees aggregates a uniform API shape and a publish path
that works across instances. It does not own any aggregate's data.

## Claims

- The schema builder uses the prisma, relay, scope-auth, complexity and smart-subscriptions plugins.
- A query over complexity 5000 or depth 10 is refused.
- A field whose `authScopes` the caller does not satisfy is refused as unauthorised; an anonymous
  caller is evaluated with the default roles.
- Every aggregate exposes `page`, `read`, `reads`, `count` and `group` under those names.
- A subscription is authorised once, when it is opened, and re-resolves its query each time a topic it
  watches is published.
- `GRAPHQL_PUBSUB` selects the pub/sub backend among Redis, Postgres and in-memory.
  **Open:** the backend is in-memory when `GRAPHQL_PUBSUB` is unset, while the previous documents
  required Redis for every subscription so that a second instance sees the publish.
- `{ __typename }` answers through the proxy.

## Dependencies

auth

## Scenarios

| Name | Proves |
|---|---|
| `builder-plugins` | the plugin set |
| `query-limits-refuse` | complexity and depth limits |
| `field-scopes-refuse` | `authScopes` refusal and the anonymous default |
| `aggregate-query-names` | the standard query names |
| `subscription-reresolves` | authorise once, re-resolve on publish |
| `pubsub-backend-selected` | `GRAPHQL_PUBSUB` selection |
| `typename-through-proxy` | `{ __typename }` answers |
