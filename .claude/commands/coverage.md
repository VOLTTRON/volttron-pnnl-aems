---
description: Write or assess tests — coverage gaps go to docs/proposed/, active test writing tracked in docs/in-progress/
---

Identify and fill test gaps following each module's existing Jest patterns. Assessment files land in `docs/proposed/`; active work moves to `docs/in-progress/` then `docs/complete/`. File names: `<YYYYMMDD-HHMMSS>-<label>.md`.

## No-argument behavior

When `$ARGUMENTS` is empty, produce a coverage assessment for each module:

1. For each module (`prisma`, `common`, `server`, `client`), run `yarn test:cov` and capture the coverage summary.
2. Parse the output to identify:
   - Files with 0% statement coverage
   - Exported functions/classes with no corresponding `.test.ts` file
   - Files where only the happy path is tested (single `it` block per exported function)
3. Write one file per module: `docs/proposed/<YYYYMMDD-HHMMSS>-assessment-tests-<module>.md`
   - Sections: **Coverage summary** (overall %), **Uncovered files**, **Partial coverage** (files with tests but missing branches/edge cases), **Recommended next tests** (prioritized by risk)
4. Print a summary of all assessment files created.

## With arguments

`$ARGUMENTS` is a module name (`common`, `server`, `client`), a file path, a feature slug, or `coverage` (re-run assessment for all modules).

1. **Learn the module's test style**: Read 2–3 existing `.test.ts` files in the target module. Note:
   - `describe`/`it` naming convention
   - Factory patterns or fixture helpers used
   - How mocks are set up (jest.mock, manual mocks, NestJS testing module, etc.)
   - Assertion style (jest matchers, custom matchers)
   - Read the module's `CLAUDE.md` for any testing-specific guidance

2. **Identify gaps**: For the scope, list which exported symbols lack tests or have only happy-path coverage. Check for untested error branches, edge cases (empty input, null, boundary values), and auth/permission paths in resolvers.

3. **Write a plan**: Create `docs/in-progress/<YYYYMMDD-HHMMSS>-tests-<scope-slug>.md` listing each planned test with: target function/resolver, test case description, setup required.

4. **Write tests**: Add colocated test files (`<source-file>.test.ts` beside the source). Follow existing patterns exactly:
   - Do **not** introduce new testing utilities, mocking libraries, or Jest plugins unless they are already used in the module
   - Server tests: use NestJS `Test.createTestingModule`, follow the `--forceExit --detectOpenHandles` requirement
   - Client tests: follow the existing React Testing Library or component test pattern in the module
   - Common tests: pure unit tests, no mocks needed for pure functions

5. **Run**: `yarn test` in the affected module. Fix any failures in the new test code (not in the source). Re-run until all tests pass.

6. Append to the plan doc: coverage delta (before/after), remaining gaps, any issues deferred as refactor candidates. Move doc to `docs/complete/`.

## Self-guided rules

- No `// @ts-ignore`, `as any` in new test files unless the existing tests already use that pattern.
- Do not disable ESLint rules in tests to make them compile.
- If source code must change to be testable (e.g. extract a private dependency for injection), document it in the test doc as a **refactor candidate** and skip the change — use `/refactor` to address it separately.
- Only pause to ask the user if: real infrastructure (Postgres, Redis) appears to be down and tests require it, or if a test requires knowing behavior that is ambiguous from reading the source.
- Use the current wall-clock time (`date` shell command) for the `<YYYYMMDD-HHMMSS>` prefix.
