# Build system

Yarn 4 workspaces with `portal:` links and a strict build order. Understanding this is the difference between "my typecheck fails for no reason" and "I know exactly which `dist/` is stale."

## Workspaces and portal links

The repo has four workspaces — `prisma`, `common`, `server`, `client` — and the [docker/](../../docker/) tree (not a workspace, just compose configs).

Inter-workspace dependencies are declared as Yarn **`portal:` links**, e.g.:

```jsonc
// server/package.json
"@local/prisma": "portal:../prisma",
"@local/common": "portal:../common"
```

A `portal:` dep resolves to the target workspace's **`main` entry** as compiled, which means:

- Server/client import `@local/prisma` → resolves to `prisma/dist/index.js` (built output), not `prisma/src/index.ts`.
- If `prisma/dist/` is stale or missing, downstream typechecks fail with confusing "module has no exported member ..." errors.
- `yarn install` does NOT fix this; only `yarn build` in the upstream workspace does.
- The `@prisma/client` singleton: don't install a second copy in `server/` or `client/` — it breaks the shared Prisma Client instance.

**Implication for any change that crosses workspace boundaries**: rebuild upstream first.

## Build order

```
prisma  →  common  →  server  →  client
```

Why this exact order:

- `common` re-exports types from `@local/prisma`, so `prisma/dist/` must exist first.
- `server` and `client` both depend on `@local/prisma` and `@local/common`, so both upstreams must be built.
- `server` and `client` don't depend on each other, so they could parallelize — the build scripts run them serially for log clarity.

## What changed — minimum commands to fix

| What you changed | Minimum to fix downstream typechecks |
|-----------------|--------------------------------------|
| `prisma/prisma/models/*.prisma` | `cd prisma && yarn build` → then rebuild server + client |
| `common/src/**` | `cd common && yarn build` |
| `server/src/graphql/**` | `cd server && yarn compile:schema` → `cd client && yarn compile:graphql` |
| `server/src/**` (non-GraphQL) | `cd server && yarn build` (or `yarn check`) |
| `client/src/queries/*.graphql` | `cd client && yarn compile:graphql` |
| `client/src/**` | `cd client && yarn build` (or `yarn check`) |
| Full rebuild from scratch | `./build.sh` from repo root |

## The two regen pipelines

**Prisma → downstream types** is one pipeline. **GraphQL schema → client codegen** is a separate pipeline that lives downstream of it.

```
edit prisma/prisma/models/*.prisma
  └─▶ yarn build (in prisma/)            ← regenerates Prisma Client + Pothos bindings
        └─▶ yarn check / yarn build      (in common, server, client)
              └─▶ yarn compile:schema    (in server)   ← emits server/schema.graphql
                    └─▶ yarn compile:graphql (in client)  ← regenerates Apollo hooks
```

Skipping any step leaves the next step looking at stale types. If a downstream typecheck fails after a Prisma edit, you forgot one of these.

**`autoSchemaFile` note:** In non-production (`NODE_ENV != "production"`), `PothosGraphQLModule` configures `autoSchemaFile: "../client/schema.graphql"` — this writes the client's schema copy directly when the server starts (or when `yarn compile:schema` runs via `schema.ts`). In production this is disabled; you must copy the schema manually or it happens during the Docker image build.

## Per-workspace scripts

| Script | What it does |
|---|---|
| `yarn build` | Compile `src/` to `dist/`. In `prisma`, also `prisma generate`. In `client`, also `next build`. In `server`, also `nest build`. |
| `yarn check` | `tsc --noEmit` — type check only, no output. Fast. |
| `yarn lint` | ESLint with `--fix`. |
| `yarn test` | Jest (server: `--runInBand --forceExit --detectOpenHandles`). |
| `yarn test:cov` | Jest with coverage. |
| `yarn compile` | In `server`: `yarn compile:schema`. In `client`: `yarn compile:graphql`. |
| `yarn start:dev` | Dev server (client and server only). |
| `yarn migrate:create` | Create a new Prisma migration (prisma only). |
| `yarn migrate:deploy` | Apply pending migrations (prisma only). |

## Top-level orchestrators

**`./build.sh` / `.\build.ps1`** — full chain build

| Flag | Effect |
|------|--------|
| `-c` / `--clean-build` | Remove `dist/` (and optionally `node_modules`) before building |
| `-d` / `--skip-dependencies` | Skip `yarn install` in each workspace |
| `-m` / `--skip-migrations` | Skip `yarn migrate:deploy` after building prisma |

The script removes portal symlinks (`node_modules/@local`, `node_modules/@prisma/client`) before each `yarn install` to avoid Yarn 4 EEXIST errors on CI cache restores.

**`./test.sh` / `.\test.ps1`** — runs `lint → check → test:cov` for all workspaces in build order, with `NODE_OPTIONS=--max-old-space-size=8192`. Pass `-c` / `SKIP_COVERAGE=true` to run `yarn test` instead.

## Yarn specifics

- **Yarn 4** with PnP-style resolution + portal links. Don't `npm install` or `pnpm install`; the lockfile and `portal:` semantics are Yarn-specific.
- **`postinstall`** in `prisma/` runs `prisma generate`, so a fresh `yarn install` produces a usable `node_modules/.prisma`. But it does NOT compile `src/` to `dist/` — you still need `yarn build` for downstream typecheck.
- **`@prisma/client` is a `peerDependency`** of `prisma`, consumed by downstream via `portal:../prisma/node_modules/@prisma/client`. Don't install a second copy.

## Debugging checklist

**"Module '@local/prisma' has no exported member 'X'"**
→ `dist/` in `prisma/` is stale. Run `cd prisma && yarn build`.

**"Pothos types are wrong or missing"**
→ Same as above — Pothos bindings in `prisma/dist/pothos.js` are stale.

**"Cannot find module '@local/common'"**
→ `common/dist/` is missing or stale. Run `cd common && yarn build`.

**"Apollo generated hooks don't match the current schema"**
→ Run `cd server && yarn compile:schema`, then `cd client && yarn compile:graphql`.

**"Pothos field/type registered but not appearing in schema"**
→ The service has the `@PothosObject()` / `@PothosQuery()` / `@PothosMutation()` decorator but is not listed in `SchemaModule`'s providers array in [server/src/graphql/schema.module.ts](../../server/src/graphql/schema.module.ts).

**"Yarn install fails with EEXIST on portal symlink"**
→ Run `rm -rf node_modules/@local node_modules/@prisma/client` in the workspace before `yarn install` (or use `build.sh -c`).

## Pointers

- Root orientation: [CLAUDE.md](../../CLAUDE.md)
- Workspace-specific docs: [prisma.md](prisma.md), [common.md](common.md), [server.md](server.md), [client.md](client.md)
