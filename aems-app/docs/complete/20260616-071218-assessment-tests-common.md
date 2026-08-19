# Coverage Assessment: common

**Date**: 2026-06-16  
**Run**: `yarn test:cov`

---

## Coverage summary

| Metric | % |
|--------|---|
| Statements | 98.86 |
| Branches | 90.94 |
| Functions | 96.83 |
| Lines | 98.71 |

15 test suites, 529 tests — all pass. Every source file has at least one test file.

---

## Uncovered files

None — all 16 source files are covered.

---

## Partial coverage

Files with branch or function gaps:

| File | Stmts | Branch | Funcs | Uncovered lines |
|------|-------|--------|-------|-----------------|
| `src/constants/normalization.ts` | 95.23 | 93.93 | 88.88 | 81, 87-88 |
| `src/constants/role.ts` | 96 | 100 | 90 | 31 |
| `src/utils/color.ts` | 98.78 | 88 | 96.87 | 249, 613 |
| `src/utils/tree.ts` | 98.03 | 90.9 | 100 | 49 |
| `src/utils/util.ts` | 100 | 89.39 | 100 | 104, 112, 141, 149-154, 163 |

### Notable gaps

**`src/utils/util.ts`** — branch coverage 89.39%, lines 104, 112, 141, 149-154, 163 uncovered. These are likely null/undefined guard branches and error paths in utility functions. Low risk but easy wins.

**`src/utils/color.ts`** — branch coverage 88%, lines 249 and 613. Likely edge-case colour parsing paths (malformed input, out-of-range values).

**`src/constants/normalization.ts`** — function coverage 88.88%, lines 81, 87-88. Likely an uncommon normalisation path or a fallback case.

---

## Recommended next tests

Priority ordered by risk:

1. **`src/utils/util.ts` — error/null branches** (medium priority)  
   Add tests for the uncovered branches at lines 104, 112, 141, 149-154, 163. These are likely guard clauses for null input or boundary conditions in utility functions used widely across the stack. Pattern: pure unit test, no mocks.

2. **`src/utils/color.ts` — malformed input paths** (low priority)  
   Lines 249 and 613 suggest parsing edge cases. Add tests for invalid colour strings, out-of-range channel values, and fallback paths in `Color.build()` or similar factory.

3. **`src/constants/normalization.ts` — untested function overload / fallback** (low priority)  
   Line 81 and 87-88 are the only uncovered statements. Likely a rarely-used normalisation variant. Add one test per uncovered branch.

4. **`src/constants/role.ts` — untested function at line 31** (low priority)  
   One function not reached. Add a test for the edge-case role check.

Overall: the common module is in excellent shape. These are all minor branch-coverage improvements on an already well-tested utility library.
