# common/ — shared library

Utilities, constants, and types shared by [server/](../../server/) and [client/](../../client/). Published as `@local/common` via Yarn `portal:`. Depends on `@local/prisma` and re-exports Prisma enums/types where useful.

## Layout

- [common/src/index.ts](../../common/src/index.ts) — barrel export. Everything public must be re-exported here.
- [common/src/constants/](../../common/src/constants/) — app-wide constants: `Role`, `Log`, `HttpStatus`, `FeedbackStatus`, `Frequency`, `Normalization`.
- [common/src/utils/](../../common/src/utils/) — pure utilities: type guards (`types.ts`), math (`lerp`, `clamp`, `range` — `math.ts`), tree builders (`buildTree`, `deepFreeze` — `tree.ts`), object utilities (`getDifference`), parsing utilities (`util.ts`), color helpers (`color.ts`), lodash-compatible array/object/string/function helpers (`lodash.ts`).
- [common/src/index.test.ts](../../common/src/index.test.ts) — smoke test that the public surface stays exported.

## The isomorphic constraint

Modules in `common/` are pulled into **both** the Nest server bundle and the Next.js client bundle. That means:

- **No Node-only APIs**: no `fs`, no `path`, no `process` calls at module load time.
- **No browser-only APIs**: no `window`, no `document`, no DOM types.
- **No top-level side effects**: anything that runs on import fires in both environments.
- **Minimal runtime deps**: anything new gets bundled into the client. Current deps: `lodash`, `regex`, `@local/prisma`.

If a utility can't satisfy these, it doesn't belong here — put it in the workspace that actually uses it.

## Decision rule for "where does this go?"

| Used by... | Goes in... |
|---|---|
| Both server and client | `common/` |
| Prisma-shaped type that's safe in both | `common/` (depends on `@local/prisma`) |
| Server only (Node APIs, NestJS decorators, Prisma queries) | `server/src/utils/` |
| Client only (React hooks, Browser APIs, Next.js APIs) | `client/src/utils/` |
| Touches Nest, React, or runtime specifics | NOT `common/` |

## Role hierarchy

`common/src/constants/role.ts` defines the `Role` class with the project's authorization model:

```
super > admin (grants user) > user
```

Key API: `Role.granted(required, ...userRoles): boolean`

Returns `true` if the user has any role that satisfies `required`. Because `admin` grants `user`, a user with role `admin` passes a `Role.granted("user", "admin")` check. This same class is used in:
- **Server**: `scope-auth` plugin — `authScopes: { user: true }` evaluates via `Role.granted`
- **Client**: `isGranted(route, current)` in `template.tsx`
- **REST**: `RolesGuard` compares `@Roles()` decorator values against `req.user.role`

## Workflow

| Command | Effect |
|---|---|
| `yarn build` | `tsc --project tsconfig.build.json` → `dist/`. **Required** after edits before server/client see the change. |
| `yarn check` | Type-check without emit. |
| `yarn test` / `yarn test:cov` | Jest (Node env). Tests colocate as `*.test.ts` next to source. |
| `yarn lint` | ESLint with `--fix`. |

Because `common` is a `portal:` dep, server/client resolve the **built** output from `dist/`. Edit `src/`, forget to `yarn build`, and consumers silently use the old code.

## Adding a new export

1. Create or edit the file in `src/constants/` or `src/utils/`.
2. Add the export to `src/index.ts`.
3. Run `cd common && yarn build`.
4. Verify with `yarn check` in server and client — both must compile.

## Conventions

- **Re-export through [common/src/index.ts](../../common/src/index.ts)** only. Consumers import from `@local/common`, not deep-import from `@local/common/src/utils/foo`.
- **Named exports** preferred over default for utilities; constants exported by name.
- **Tests colocate** next to source.

## Gotchas

- Adding a Node API (e.g., `crypto.randomUUID` from `node:crypto`) breaks the client bundle silently — it'll polyfill unexpectedly or fail at runtime. Use Web APIs that work in both environments.
- A new `dependencies` entry in [common/package.json](../../common/package.json) ships to the client. Audit bundle size impact before adding.

## Pointers

- Per-module: [common/CLAUDE.md](../../common/CLAUDE.md)
- Build chain: [build-system.md](build-system.md)
