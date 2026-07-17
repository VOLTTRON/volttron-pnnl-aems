# Testing

Jest per workspace, colocated `*.test.ts` files, environment varies by module. The top-level [test.sh](../../test.sh) / [test.ps1](../../test.ps1) runs `lint → check → test:cov` across all four workspaces in build order.

## Per-workspace configuration

| Workspace | Jest env | Extra flags | Notes |
|---|---|---|---|
| `prisma/` | Node | — | Tests for hand-authored helpers. Schema itself isn't unit-tested. |
| `common/` | Node | — | Pure utilities. Smoke test in [common/src/index.test.ts](../../common/src/index.test.ts) ensures the public surface stays exported. |
| `server/` | Node | `--runInBand --forceExit --detectOpenHandles` | See "Why `--forceExit`" below. |
| `client/` | `jest-environment-jsdom` | — | `@testing-library/react` for component tests. Don't move to Node env. |

Coverage reporters for all: `json`, `text`, `lcov`, `clover`, `cobertura`. Output: `<workspace>/coverage/` (gitignored).

## File conventions

- **Colocate**: `foo.ts` next to `foo.test.ts` / `foo.service.ts` next to `foo.service.test.ts`.
- **Naming**: `*.test.ts` (unit) or `*.test.tsx` (React component).
- **`describe` + `it`** naming: `describe("UserQueryService")` → `it("returns users for admin scope")`.
- Don't put test files in a top-level `__tests__/` folder.

## The open-handle problem (server)

NestJS tests leave long-lived resources open. Without `--forceExit`, Jest hangs. Without `--detectOpenHandles`, you can't tell what's leaking.

| Resource | Why it leaks | Fix |
|---|---|---|
| Redis / ioredis | Connection pool stays open | `afterAll(() => redis.quit())` |
| NestJS app | Apollo / HTTP server left running | `afterAll(async () => app.close())` |
| `@nestjs/schedule` intervals | Cron jobs still ticking | `afterAll(() => schedulerRegistry.stop())` |
| Prisma connection pool | Stays open across suites | `afterAll(async () => prisma.$disconnect())` |

**Rule**: every test file that creates a NestJS testing module or opens a long-lived resource must call `await app.close()` in `afterAll`. If you add a new service with a long-lived resource, add `onModuleDestroy()` to the service.

## NestJS testing module pattern

Use a partial-app pattern — only the services under test plus direct dependencies. Don't use `AppModule` in unit tests.

```typescript
let module: TestingModule;
let service: UserQueryService;

beforeAll(async () => {
  module = await Test.createTestingModule({
    imports: [PrismaModule],
    providers: [UserQueryService, SchemaBuilderService],
  }).compile();

  service = module.get(UserQueryService);
  await module.init();
});

afterAll(async () => {
  await module.close();
});
```

Look at existing tests in `server/src/graphql/*/` for the exact patterns used in this repo.

## Mock vs integration strategy

| Scenario | Strategy |
|---|---|
| `common/` utilities | Unit test — no infra, no mocks needed |
| Server GraphQL resolvers | NestJS testing module + **real** Postgres in CI |
| Server REST controllers | NestJS testing module + supertest |
| Client components | `jest-environment-jsdom` + `@testing-library/react` |
| Client hooks (Apollo) | `MockedProvider` from `@apollo/client/testing` |

**Don't mock `@local/prisma` without a strong reason.** Real Postgres catches schema drift that mocks miss. CI runs Postgres as a service container.

## Client: Blueprint wrapping

Any test that renders a Blueprint component must wrap it in `BlueprintProvider`:

```typescript
import { BlueprintProvider } from "@blueprintjs/core";

const renderWithBlueprint = (ui: React.ReactElement) =>
  render(<BlueprintProvider>{ui}</BlueprintProvider>);
```

See existing component tests in `client/src/app/components/` for the helper used in this repo.

## Top-level runner

[test.sh](../../test.sh) / [test.ps1](../../test.ps1):

- Sets `NODE_OPTIONS=--max-old-space-size=8192` (server test suite is memory-hungry).
- Runs `yarn lint`, `yarn check`, `yarn test:cov` per module in build order.
- `-c/--skip-coverage` skips the coverage step.
- Respects `SKIP_COVERAGE` env var.

**Fast inner loop**: run `yarn test` directly inside the workspace you're editing — the top-level script is intentionally thorough and slow.

## Conventions

- **Test what you ship**, not what you wish you'd shipped — integration over heavy mocking.
- **Clean up resources** in `afterAll`/`afterEach` for the server.
- **Don't disable `--forceExit`** without first finding and fixing the open handle.
- **`schema.graphql` regen**: when a test depends on a fresh schema, run `yarn compile:schema` (server) before `yarn test`.

## Gotchas

- **Server tests "pass" but CI fails** — usually a leaked handle that `--forceExit` masks locally. Run with `--detectOpenHandles` and clean up.
- **Client tests need `jsdom`** — don't move them to Node env; React Testing Library will throw.
- **Client test throws "must use within Provider"?** → Component needs `BlueprintProvider`, `GraphqlProvider`, or another provider. Check the provider stack in [client.md](client.md).
- **Coverage on portal-linked code** — `server/` / `client/` won't reflect changes made in `prisma/src/` or `common/src/` until you `yarn build` in the upstream workspace.
- **`Cannot find module '@local/common'`** → Upstream `dist/` is missing. Build `common` first.

## Pointers

- Per-module CLAUDE.md files: [server/CLAUDE.md](../../server/CLAUDE.md), [client/CLAUDE.md](../../client/CLAUDE.md), [common/CLAUDE.md](../../common/CLAUDE.md), [prisma/CLAUDE.md](../../prisma/CLAUDE.md)
- Build order context: [build-system.md](build-system.md)
