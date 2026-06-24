# Architecture design docs

Per-area design notes for the Skeleton monorepo. Each doc explains **why** a subsystem looks the way it does — the rules and load-bearing patterns that aren't obvious from the file tree alone. Treat these as the long-form companion to the per-module [CLAUDE.md](../../CLAUDE.md) files.

When something architectural changes, update the relevant doc here. New subsystem? Add a new doc and link it from this index.

## Index

- [overview.md](overview.md) — system at altitude: monorepo layout, request lifecycle, module-dependency diagram.
- [build-system.md](build-system.md) — Yarn 4 + portal links, why the build order is `prisma → common → server → client`, and what every `yarn` script does.
- [prisma.md](prisma.md) — schema layout, the three generators, PostGIS, migration workflow.
- [common.md](common.md) — what belongs in the shared library and what doesn't.
- [server.md](server.md) — NestJS module tree, GraphQL wiring, REST/ext routing, services.
- [client.md](client.md) — Next.js App Router, providers, Apollo + codegen, custom HTTPS dev server.
- [graphql.md](graphql.md) — code-first GraphQL with Pothos: builders, plugins, regen pipeline.
- [auth.md](auth.md) — multi-strategy auth, GraphQL `scope-auth` vs REST `@Roles`, session sharing in dev.
- [docker.md](docker.md) — compose topology, profiles, secrets layer, Traefik routing.
- [testing.md](testing.md) — Jest topology, env per module, the `--forceExit` reason on the server.
- [deployment.md](deployment.md) — `INSTANCE_TYPE`, backup/restore, secret bootstrap, `start-services` flow.

## How these docs are organized

Each doc:

1. **Purpose** — 2-3 sentences on what this subsystem is for.
2. **Layout** — file/folder map with relative links.
3. **Patterns** — the load-bearing conventions: how things are wired up, what depends on what, the rules a new contribution must follow.
4. **Gotchas** — non-obvious failure modes (stale generated code, hostname requirements, hidden ordering).
5. **Pointers** — links to the per-module [CLAUDE.md](../../CLAUDE.md) and to relevant entry-point files.

If you find yourself duplicating a per-module CLAUDE.md, link to it instead.
