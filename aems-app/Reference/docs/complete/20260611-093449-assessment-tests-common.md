# Test Coverage Assessment: common

**Date:** 2026-06-11  
**Run:** `yarn test:cov` — 15 test suites, 448 tests, all passing

---

## Coverage summary

| Metric     | %     |
|------------|-------|
| Statements | 93.17 |
| Branches   | 72.82 |
| Functions  | 84.17 |
| Lines      | 93.38 |

Overall strong coverage. Branch coverage (72.82%) is the weak spot — several conditional paths in `normalization.ts`, `color.ts`, `tree.ts`, and `util.ts` are not exercised.

---

## Uncovered files

None — every source file has at least a test file and meaningful statement coverage.

---

## Partial coverage

| File | Stmts | Branch | Funcs | Uncovered lines / notes |
|------|-------|--------|-------|------------------------|
| `src/constants/normalization.ts` | 93.65 | 60.6 | 85.18 | L76, 81, 87–88 — conditional branches in normalization logic |
| `src/constants/role.ts` | 96 | 100 | 90 | L31 — one function not called |
| `src/utils/color.ts` | 89.63 | 74.4 | 87.5 | L170–171, 216, 221–222, 249, 340–344, 383–397, 573, 613 — color conversion edge paths |
| `src/utils/tree.ts` | 90.19 | 86.36 | 83.33 | L24–32, 49, 166 — tree traversal edge cases |
| `src/utils/util.ts` | 84.21 | 54.54 | 56.66 | L19–20, 26, 141–163 — several utility functions untested; branch coverage at 54% |

---

## Recommended next tests

**Priority: Medium.** The module is well tested; these are polish/completeness items.

1. **`src/utils/util.ts` — missing function coverage** (highest priority in this module)  
   Branch coverage is only 54% and function coverage 56%. Lines 141–163 represent a block of utility functions with no tests. Identify which exported functions lack coverage (check against `src/utils/index.test.ts` and `src/utils/util.test.ts`) and add test cases following the existing pure-function style in `util.test.ts`.

2. **`src/utils/color.ts` — edge paths in color conversion** (medium priority)  
   Lines 340–344 and 383–397 suggest untested branches in format-conversion methods (likely hex↔rgb edge cases, out-of-range values, or alpha-channel handling). Add boundary-value tests in `color.test.ts` following the existing describe/it pattern.

3. **`src/constants/normalization.ts` — conditional branches** (low priority)  
   Lines 76–88 are likely guard clauses or null-handling branches. Add tests for inputs that trigger those paths. The existing `normalization.test.ts` has 152 lines — there is room to extend it.

4. **`src/utils/tree.ts` — tree traversal edge cases** (low priority)  
   Lines 24–32 and 49 suggest missing tests for empty-tree or single-node inputs. Lines 166 may be an error branch. Extend `tree.test.ts` with degenerate inputs.
