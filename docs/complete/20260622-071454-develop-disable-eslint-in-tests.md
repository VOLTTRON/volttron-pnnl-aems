# disable-eslint-in-tests

## Summary

Disabled ESLint for all test files across every sub-project and removed the ~209 inline eslint-disable comments that had accumulated in those files.

## Changes

### ESLint config updates
- `prisma/eslint.config.mjs` — added `"**/*.test.ts", "**/*.spec.ts"` to ignores
- `common/eslint.config.mjs` — added `"**/*.test.ts", "**/*.spec.ts"` to ignores
- `server/eslint.config.mjs` — added `"**/*.test.ts", "**/*.spec.ts"` to ignores
- `client/.eslintrc.json` — added `"ignorePatterns": ["**/*.test.ts", "**/*.spec.ts"]`

### Inline comment removal
- Stripped all `/* eslint-disable ... */`, `/* eslint-enable ... */`, and `// eslint-disable-next-line ...` lines from 59 test files across server/, common/, and client/.

## Completed: 2026-06-22T07:14:54Z
