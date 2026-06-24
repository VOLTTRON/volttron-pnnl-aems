---
description: Assess or execute a refactor — scans for rules violations and improves code quality without changing observable behavior
---

Identify and apply internal code improvements. Assessment files go to `docs/proposed/`; active work moves through `docs/in-progress/` to `docs/complete/`. File names: `<YYYYMMDD-HHMMSS>-<label>.md`.

## No-argument behavior

When `$ARGUMENTS` is empty, produce a per-module assessment of the entire codebase:

1. Read `.claude/rules.md` and all per-module `CLAUDE.md` files.
2. For each module (`prisma`, `common`, `server`, `client`), scan source files for:
   - Naming violations (camelCase fields without `@map`, PascalCase services not matching NestJS conventions, etc.)
   - Files over 300 lines that could be split
   - Dead exports (exported symbols never imported anywhere in the monorepo)
   - Type coverage holes (`any`, untyped `Json` columns, missing return types on public functions)
   - Duplicated logic that already exists in `common/` or a shared utility
   - Coupling violations (client importing server internals, common importing node-only APIs)
   - Test files that use `// @ts-ignore` or `as any` to paper over broken types
3. Write one file per module: `docs/proposed/<YYYYMMDD-HHMMSS>-assessment-refactor-<module>.md`
   - Each finding: **File**, **Issue**, **Rule** (cite `rules.md` line or architecture doc), **Risk** (low/medium/high), **Proposed change**
4. Print a summary of all files created and total findings per module.

## With arguments

`$ARGUMENTS` is a module name (`common`, `server`, `client`, `prisma`), a file path, or a concept (e.g. `auth guards`, `file upload`).

1. Read all files in scope. Check against `.claude/rules.md` for naming, structure, coupling, dead code, and type-coverage violations. Check architecture docs for structural conventions.
2. Write `docs/proposed/<YYYYMMDD-HHMMSS>-refactor-<scope-slug>.md` with all proposed changes, their rules basis, and risk level.
3. Move the file to `docs/in-progress/` and begin executing.

## Execution workflow

Execute in safe order — lowest risk first, leaf files before entry points:

### Batch 1: Low-risk (pure rename/type improvements)
- Fix naming violations, add missing return types, annotate `Json` columns
- `yarn check` in affected module — fix any type errors introduced

### Batch 2: Medium-risk (structural changes)
- Extract duplicated logic to shared utilities, split oversized files, remove dead exports
- `yarn check` in affected module
- `yarn test` in affected module — if tests fail, fix the refactor (not the test) unless the test was itself wrong

### Batch 3: High-risk (coupling / interface changes)
- Only proceed if explicitly identified in the assessment doc
- `yarn check` across all affected modules
- `yarn test` in all affected modules

### Final
- Run `yarn check` across all workspaces in build order
- Append a completion summary to the refactor doc (total files changed, findings resolved, findings deferred)
- Move doc from `docs/in-progress/` to `docs/complete/`

## Self-guided rules

- **Never** change public API signatures, observable behavior, database schema, or generated files (`schema.graphql`, `*.generated.ts`).
- If a proposed change requires a behavior change, append it to the doc as `out-of-scope → /develop` and skip it.
- If a proposed change requires a schema change, append it as `out-of-scope → /design + /develop`.
- Do not ask for confirmation on pure internal refactors (renaming a private variable, extracting a private helper, fixing a type annotation).
- Use the current wall-clock time (`date` shell command) for the `<YYYYMMDD-HHMMSS>` prefix.
