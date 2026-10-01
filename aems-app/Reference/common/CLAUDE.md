# common/ — Shared library

Utilities, constants, and types shared by [server/](../server/) and [client/](../client/). Published as `@local/common` via Yarn `portal:` link. Depends on `@local/prisma` (and therefore re-exports Prisma enums/types where useful).

## Layout

- [src/index.ts](src/index.ts) — main barrel export. Everything public should be re-exported here.
- [src/constants/](src/constants/) — app-wide constants (roles, route names, enum-like string unions).
- [src/utils/](src/utils/) — pure utilities (formatting, validation, predicates). Isomorphic — must work in both Node (server) and browser (client).
- [src/index.test.ts](src/index.test.ts) — smoke test that the public surface stays exported.

## Rules

- **Isomorphic only.** No Node-only APIs (`fs`, `path`, `process.env` at module load), no browser-only APIs (`window`, `document`). If it can't run in both environments, it doesn't belong here.
- **No side effects at import time.** Modules in `common` get pulled into both the Next.js bundle and the Nest server; top-level side effects will fire in both.
- **Keep deps minimal.** Runtime deps are `lodash`, `regex`, and the prisma portal. Adding a new runtime dep means it gets bundled into the client too — justify it.
- **Re-export through [src/index.ts](src/index.ts)**, not deep imports. Consumers import from `@local/common`, not `@local/common/src/utils/foo`.
- **Tests colocate** next to the source (`*.test.ts`). Jest runs from `src/` as `rootDir`.

## Workflow

- `yarn build` — `tsc --project tsconfig.build.json` → `dist/`. Required after edits before server/client will see the change.
- `yarn check` — type check without emit.
- `yarn test` / `yarn test:cov` — Jest.
- `yarn lint` — ESLint with `--fix`.

Because this is a `portal:` dep, server/client resolve the **built** output from `dist/`. If you edit `src/` but forget to `yarn build`, consumers will silently use the old code.

## When to put something here vs. elsewhere

- Used by **both** server and client → `common/`.
- Used by only one → keep it in that module.
- Tied to Prisma model shapes but reusable → `common/` (depends on `@local/prisma`).
- Touches Nest/React/runtime specifics → not here.

## Further reading

- Architecture: [../.claude/architecture/common.md](../.claude/architecture/common.md), [../.claude/architecture/build-system.md](../.claude/architecture/build-system.md).
- Project rules: [../.claude/rules.md](../.claude/rules.md).
