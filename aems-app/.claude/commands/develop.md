---
description: Implement a feature end-to-end following the prisma → common → server → client build order, with progress tracked in docs/
---

Implement features by walking the strict build chain. Progress is tracked in dated files under `docs/in-progress/`; completion moves them to `docs/complete/`. File names: `<YYYYMMDD-HHMMSS>-<label>.md`.

## No-argument behavior

When `$ARGUMENTS` is empty:

1. **Check for in-progress work first**: Glob `docs/in-progress/*develop*.md`. If any files exist, list each with its filename and first non-heading line as a summary. Ask the user: resume one of these, or start something new?

2. **If starting new**: Glob `docs/proposed/*design*.md`. List each file with its filename and the **Problem** line from its content as a summary. Ask the user which one to work on.

3. Move the chosen design doc from `docs/proposed/` to `docs/in-progress/` before beginning.

## With arguments

`$ARGUMENTS` is a feature slug, description, or path to a design doc.

1. Locate the design doc: search `docs/proposed/` for a file matching `*design*<slug>*`. If found, move it to `docs/in-progress/`. If not found, proceed without one and note the absence in the progress log.

2. Create `docs/in-progress/<YYYYMMDD-HHMMSS>-develop-<slug>.md` as a running progress log. Append a timestamped entry after each layer completes or fails.

## Implementation workflow

Work through layers in strict order. Stop at the first layer that fails after two fix attempts — log the error and ask the user before continuing.

### Prisma layer (if schema changes needed)
- Edit model files under `prisma/prisma/models/`
- Run `yarn migrate:create --name <slug>` from `prisma/`
- Run `yarn build` in `prisma/`
- **STOP** if the migration is destructive (contains `DROP TABLE`, `DROP COLUMN`, or data-loss operations) — show the generated SQL and ask the user to confirm before proceeding
- Log: files changed, migration name, pass/fail

### Common layer (if shared types/utilities needed)
- Edit files under `common/src/`
- Run `yarn build` then `yarn check` in `common/`
- Log: files changed, pass/fail

### Server layer
- Edit Pothos builders in `server/src/graphql/<aggregate>/` and services
- Run `yarn compile:schema` in `server/` to regenerate `server/schema.graphql`
- Run `yarn check` in `server/`
- Log: files changed, schema diff summary, pass/fail

### Client layer
- Add/update `.graphql` operation files in `client/src/queries/`
- Run `yarn compile:graphql` in `client/` to regenerate Apollo hooks
- Add/update pages and components in `client/src/app/`
- Run `yarn check` in `client/`
- Log: files changed, new hooks generated, pass/fail

### Final
- Run `yarn check` across all workspaces in build order (prisma → common → server → client)
- Log final pass/fail

## Completion

- Move the progress log from `docs/in-progress/` to `docs/complete/`
- Move the design doc (if one was used) from `docs/in-progress/` to `docs/complete/`
- Print a one-paragraph summary of what was implemented

## Self-guided rules

- Proceed through all layers without asking unless: a migration is destructive, a layer fails to compile after two attempts, or a design decision has no answer in the codebase or docs.
- Never hand-edit `server/schema.graphql` or `client/schema.graphql` — they are generated.
- Use the current wall-clock time (`date` shell command) for the `<YYYYMMDD-HHMMSS>` prefix.
- If no design doc exists, still create the progress log and document decisions made inline.
