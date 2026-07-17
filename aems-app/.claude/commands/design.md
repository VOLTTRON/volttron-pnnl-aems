---
description: Design a feature or assess the codebase for design gaps — writes dated docs to docs/proposed/
---

Produce structured design documents in `docs/proposed/` using the naming convention `<YYYYMMDD-HHMMSS>-<label>.md`. The folder a file lives in is its status: `proposed/` → `in-progress/` → `complete/`.

## No-argument behavior

When `$ARGUMENTS` is empty:

1. Scan the codebase for design gaps:
   - Read `.claude/rules.md` and all per-module `CLAUDE.md` files for stated conventions.
   - Glob and grep across `prisma/`, `common/src/`, `server/src/`, `client/src/` for:
     - Large service files (>300 lines) with no clear separation of concerns
     - Exported functions in `common/` with no JSDoc or type narrowing
     - GraphQL resolvers that inline business logic instead of delegating to a service
     - Prisma models with `Json` columns that lack a type annotation via `prisma-json-types-generator`
     - Client pages that fetch data outside Apollo (raw fetch/axios)
   - Each gap found becomes its own dated file: `docs/proposed/<YYYYMMDD-HHMMSS>-assessment-design-<slug>.md`

2. Each assessment file contains:
   - **Gap** — one sentence describing the problem
   - **Location** — file path(s)
   - **Rule** — which convention from `rules.md` or architecture docs it violates
   - **Suggested approach** — concrete next step (e.g. "extract to a service", "add Pothos type", "add JSON type annotation")

3. Print a summary listing all files created and the gap they document.

## With arguments

`$ARGUMENTS` is treated as a feature name or description.

1. **Explore** the codebase for everything the feature would touch:
   - Grep for related model names, field names, resolver names, component names across all layers.
   - Glob for related files in `server/src/graphql/`, `client/src/app/`, `client/src/queries/`, `common/src/`, `prisma/prisma/models/`.

2. **Identify blast radius** — determine which layers are affected:
   - `prisma/` — new model fields or relations → migration needed
   - `common/` — new shared types or utility functions
   - `server/` — new resolvers, mutations, services, auth scopes
   - `client/` — new `.graphql` operations, pages, components

3. **Write** `docs/proposed/<YYYYMMDD-HHMMSS>-design-<slug>.md` with these sections:
   - **Problem** — what this feature solves or enables
   - **Affected layers** — list of prisma / common / server / client with specific file paths
   - **Prisma changes** — model edits needed, suggested migration name
   - **Common changes** — new shared types or utilities
   - **Server changes** — resolvers, services, auth scope required
   - **Client changes** — queries (.graphql files), pages, components
   - **Build steps** — ordered sequence (migrate → rebuild-prisma → regen-graphql → check-all)
   - **Open questions** — blockers that need a human decision before implementation starts

4. Print the doc path and any open questions.

## Self-guided rules

- Write freely to `docs/proposed/` — no approval needed.
- Only pause to ask the user when a genuine architectural fork exists that cannot be resolved from the codebase, `rules.md`, or architecture docs.
- Never edit source code — this command is read-only on the source tree.
- Use the current wall-clock time (via `date` shell command) to generate the `<YYYYMMDD-HHMMSS>` prefix.
