# develop: increase-the-test-coverage

Started: 2026-08-05 08:47:29

## Objective

Fill the largest coverage gaps in the codebase without changing any production code.

## Analysis

| Workspace | Before | Gap identified |
|---|---|---|
| server/src/graphql/keycloak/ | 0 % statements | All 4 service files untested; every other aggregate was covered |
| client/src/app/components/hooks/useIsKeycloakEnabled.ts | 0 % | Module-level cache made it tricky to test |

## Files created

```
server/src/graphql/keycloak/object.service.test.ts     (4 tests)
server/src/graphql/keycloak/keycloak-admin.service.test.ts  (37 tests)
server/src/graphql/keycloak/query.service.test.ts      (6 tests)
server/src/graphql/keycloak/mutate.service.test.ts     (11 tests)
client/src/app/components/hooks/useIsKeycloakEnabled.test.tsx  (4 tests)
```

## Implementation notes

- Server tests use direct `new Service(deps)` instantiation (no NestJS TestingModule), consistent with the existing user/account/etc. test pattern.
- Keycloak services use `t.field` (not `t.prismaField`), so resolver signature is `(root, args, ctx)` — not `(query, root, args, ctx)`. Initial attempt passed args in the wrong positions; fixed after first test run.
- `KeycloakAdminService` uses `fetch` directly; mocked via direct `global.fetch` assignment since `jest.spyOn(global, "fetch")` fails when `fetch` isn't already a property of the jsdom global.
- `useIsKeycloakEnabled` has module-level `cachedProviders`; `jest.resetModules()` + dynamic import approach failed because `@testing-library/react` registers jest hooks at import time (inside `beforeEach` → wrong circus context). Solution: tests run in declared order, sequentially observing the cache state progression (null → populated → reused).

## Results

```
server keycloak suite: 54 tests PASS
client hook suite:      4 tests PASS
```

## Status

COMPLETE — 2026-08-05
