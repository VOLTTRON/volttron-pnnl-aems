# Progress: server GraphQL service tests — account, feedback, comment

**Started**: 2026-06-16  
**Completed**: 2026-06-16

---

## Layer: Server (tests only — no schema or client changes)

**Files created:**
- `server/src/graphql/account/query.service.test.ts`
- `server/src/graphql/account/mutate.service.test.ts`
- `server/src/graphql/feedback/query.service.test.ts`
- `server/src/graphql/feedback/mutate.service.test.ts`
- `server/src/graphql/comment/query.service.test.ts`
- `server/src/graphql/comment/mutate.service.test.ts`

**Test run**: 6 suites, 49 tests — all pass, 0 failed

**Pattern used**: Resolver-capture mock pattern from `banner/` tests — `makeBuilder()` intercepts `queryField`/`mutationField` calls and stores resolver functions by name; `makePrisma()` shapes a partial mock with per-model operation jest.fns; `makeSubscription()` stubs `publish`.

**Notable coverage additions:**
- account: `pageAccount`, `readAccount`, `readAccounts`, `countAccounts`, `groupAccounts` + `createAccount`, `updateAccount`, `deleteAccount`
- feedback: `pageFeedback`, `readFeedback`, `readFeedbacks`, `countFeedbacks`, `groupFeedbacks` + `createFeedback` (including auth guard + missing-create-arg error paths), `updateFeedback`, `deleteFeedback`
- comment: `pageComment`, `readComment`, `readComments`, `countComments`, `groupComments` + `createComment` (admin vs non-admin user override), `updateComment`, `deleteComment`
- Auth-context branches (admin vs non-admin `where.user` strip + `where.userId` injection) covered for account, feedback, and comment resolvers.

**Result**: pass ✓
