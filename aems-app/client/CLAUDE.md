# client/ — Next.js frontend

Next.js 14 (App Router) + React 18 + TypeScript + Blueprint.js + SCSS modules. Consumes the server's GraphQL API via Apollo Client with typed operations produced by GraphQL Codegen.

## Layout

- [src/app/](src/app/) — Next App Router tree. Route-per-folder with `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `template.tsx`.
  - Feature routes: [about/](src/app/about/), [auth/](src/app/auth/), [backups/](src/app/backups/), [banners/](src/app/banners/), [demo/](src/app/demo/), [feedback/](src/app/feedback/), [logs/](src/app/logs/), [users/](src/app/users/).
  - [components/](src/app/components/) — shared UI: [common/](src/app/components/common/), [providers/](src/app/components/providers/), [feedback/](src/app/components/feedback/).
  - [api/](src/app/api/) — Next route handlers (server-side within the client).
  - [routes.ts](src/app/routes.ts) — route constants. Use these, don't hardcode paths.
- [src/queries/](src/queries/) — `.graphql` files grouped by aggregate (`user.graphql`, `backup.graphql`, etc.). **Edit these**, then regenerate typed hooks.
- [src/graphql-codegen/](src/graphql-codegen/) — generated types + Apollo hooks. **Don't hand-edit.**
- [src/utils/](src/utils/) — client-side helpers.
- [src/instrumentation.ts](src/instrumentation.ts) — Next instrumentation hook.
- [next.config.js](next.config.js), [codegen.ts](codegen.ts) — Next and codegen config.
- [server.cjs](server.cjs) — custom HTTPS dev server (uses `mkcert-*` certs next to it). `yarn dev` / `yarn dev:https` runs this; `yarn dev:http` uses plain `next dev`.
- [schema.graphql](schema.graphql) — **copy of the server's schema** used for codegen. Regenerated; don't hand-edit.

## Conventions

- **Styling**: SCSS modules with `*.module.scss`. Global styles in [global.module.scss](src/app/global.module.scss) / [page.module.scss](src/app/page.module.scss) / [template.module.scss](src/app/template.module.scss). Use `clsx` for conditional classes.
- **UI components**: Blueprint.js (`@blueprintjs/core`, `icons`, `select`, `table`, `datetime2`). Prefer Blueprint primitives over rolling your own.
- **Maps**: `maplibre-gl` + `react-map-gl` + `deck.gl`. Charts: `echarts`.
- **Data fetching**: Apollo Client. Write queries in `src/queries/*.graphql`, run `yarn compile:graphql`, then import the generated hook from [src/graphql-codegen/](src/graphql-codegen/). Don't use `gql` tagged templates inline — the codegen path is the source of truth.
- **Subscriptions** use `graphql-ws`.
- **Types from Prisma**: available via `@local/prisma`; from the GraphQL schema via codegen. Prefer the codegen types for anything crossing the wire.
- **Server Components vs Client Components**: respect the App Router split. Data fetching can run server-side; Apollo hooks need `"use client"`.
- **File naming**: React components `PascalCase.tsx`, utilities camelCase, SCSS `*.module.scss`.

## Workflow

- `yarn dev` / `yarn dev:https` — custom HTTPS dev server (reads `mkcert-*.crt/key` in repo root — regenerate with `copy-certs` script if missing).
- `yarn dev:http` — plain `next dev` on `0.0.0.0`.
- `yarn compile` → `yarn compile:graphql` — regenerate hooks from `.graphql` files + schema. Run this after server schema changes.
- `yarn build` — compile + `next build`.
- `yarn check`, `yarn test`, `yarn lint` — as expected. Testing uses `jest-environment-jsdom` + `@testing-library/react`.

## Gotchas

- If Apollo types look wrong, your codegen is stale. Server must have run `yarn compile:schema` first, then `yarn compile:graphql` here.
- ESLint here is `next lint` — legacy config, not flat config like the other modules. Don't propagate flat-config changes from server/common here without testing.
- `server.cjs` and `copy-certs.cjs` are CommonJS despite `"type": "module"` in [package.json](package.json). Keep the `.cjs` extension.
- The client's [schema.graphql](schema.graphql) gets out of sync with [../server/schema.graphql](../server/schema.graphql) — codegen pulls from one of them per [codegen.ts](codegen.ts). Check the config before assuming which.
- Images, fonts, and static assets live in [public/](public/).

## Further reading

- Architecture: [../.claude/architecture/client.md](../.claude/architecture/client.md), [../.claude/architecture/graphql.md](../.claude/architecture/graphql.md).
- Project rules: [../.claude/rules.md](../.claude/rules.md).
