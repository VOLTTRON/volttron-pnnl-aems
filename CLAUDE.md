# Skeleton App

Full-stack TypeScript monorepo for PNNL. Next.js client, NestJS GraphQL server, Prisma/PostGIS data layer, shared common library, Dockerized deployment.

## Monorepo layout

```
prisma/   # Prisma schema, migrations, generated client + Pothos types
common/   # Shared utilities, constants, types (depends on prisma)
server/   # NestJS + Apollo + Pothos GraphQL API (depends on common, prisma)
client/   # Next.js 14 + React 18 + Blueprint.js UI (depends on common, prisma)
docker/   # docker-compose.yml + per-service Dockerfiles and configs
docs/     # Additional documentation
```

Each sub-project has its own `CLAUDE.md` — read it before making changes there.

## Build order matters

`prisma → common → server → client`. Downstream modules import `@local/prisma` and `@local/common` via Yarn `portal:` links, so the upstream `dist/` must be built first. Use the top-level [build.sh](build.sh) / [build.ps1](build.ps1) to build everything in order — do not try to build sub-projects individually unless you know the upstream is current.

After editing `prisma/prisma/schema.prisma` or any file under `prisma/prisma/models/`, run `yarn compile` (or rebuild prisma) so generated types propagate downstream. Expect server/client TypeScript errors until this is done.

## Tooling

- **Package manager**: Yarn 4.x. Never use `npm` — lockfiles and `portal:` links are Yarn-specific.
- **Node**: 22.x.
- **Language**: TypeScript everywhere — no plain JS in `src/`.
- **Testing**: Jest per module. `./test.sh` / `.\test.ps1` runs all (slow).
- **Lint**: ESLint per module (flat config `eslint.config.mjs` in server/common/prisma; Next's config in client).
- **Formatting**: Prettier.

Per-module commands (`yarn` inside the sub-project directory):
- `yarn build` — compile
- `yarn check` — `tsc --noEmit` type check
- `yarn lint` — ESLint with `--fix`
- `yarn test` / `yarn test:cov` — Jest
- `yarn start` / `yarn start:dev` — dev server (client and server only)

## Running the stack

**Recommended dev workflow** (per [README.md](README.md) → Development Setup): run the **full Docker stack** for backing services + server, then run the **client locally** against it.

1. Configure a real hostname (not `localhost`) in `.env` — either your LAN IP or a hosts-file entry like `myapp.local`. Session cookies and Keycloak OAuth redirects require a consistent hostname between the Docker client and the local dev client.
2. `docker compose up -d` — **run from the repo root**, not from `docker/`. The root [docker-compose.yml](docker-compose.yml) is a shim that `include:`s [docker/docker-compose.yml](docker/docker-compose.yml), and running from the root is what makes compose pick up the root [.env](.env). Invoking with `-f docker/docker-compose.yml` or `cd docker && docker compose up` loads `docker/.env` instead — wrong variables. Optional services (map, keycloak, wiki, nominatim) are gated behind compose profiles; see [docker/CLAUDE.md](docker/CLAUDE.md).
3. Create `client/.env.local` pointing the `REWRITE_*_URL` and `DATABASE_HOST`/`REDIS_HOST` vars at the configured hostname (see README § "Create Client Environment File").
4. `cd client && yarn dev` — starts the local HTTPS dev server. The `dev` script ([server.cjs](client/server.cjs)) auto-copies TLS certs from the `skeleton-proxy` container so the local client shares sessions with the Dockerized one.
5. Access at `https://<HOSTNAME>:3000`.

**Full Docker deploy** (no local dev client): `docker compose up -d` from the repo root — the Dockerized client serves the app behind the proxy.

**Rarely needed**: running the server locally with `yarn start:dev`. Only do this if you're specifically debugging server-side code that can't be debugged through the Docker container; it requires Postgres + Redis running somewhere and a matching `server/.env`.

## Conventions

- **GraphQL schema**: code-first via Pothos builders in [server/src/graphql/](server/src/graphql/). Do **not** hand-edit [server/schema.graphql](server/schema.graphql) or [client/schema.graphql](client/schema.graphql) — they are generated (`yarn compile:schema` in server; `yarn compile:graphql` in client runs graphql-codegen).
- **Client queries**: `.graphql` files in [client/src/queries/](client/src/queries/); codegen produces typed hooks.
- **Styles**: SCSS modules (`*.module.scss`). Blueprint.js for components.
- **Database migrations**: `yarn migrate:create` in [prisma/](prisma/) — never edit applied migrations.
- **Secrets / config**: real secrets live in `.env.secrets` (gitignored) and `docker/secrets/`. `.env` holds non-secret defaults. `docker/` env files override root defaults.

## Guardrails

- Don't add code examples to `README.md` files — they are documentation only. Code samples belong in the code.
- Respect the portal link structure: when changing `@local/prisma` or `@local/common` exports, rebuild them before the dependent module's typecheck will pass.
- PostGIS is required — the DB image is custom ([docker/database/Dockerfile](docker/database/Dockerfile)). Don't assume vanilla Postgres.
- Main branch for PRs is `develop` (not `main`).
- `.clinerules` at the root is the legacy Cline equivalent of this file — keep the two in rough sync if you change one.
