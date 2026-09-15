# Historian backlog SSL/auth fix

Bug: pasting the CREATE SUBSCRIPTION / backfill SQL from the historian page into
pgAdmin fails with a two-legged libpq error:

```
FATAL:  password authentication failed for user "replicator"
FATAL:  pg_hba.conf rejects connection for host "172.18.0.1", user "replicator", database "historian", no encryption
```

Root cause split into two independent defects, both in
[aems-app/server/src/historian/historian.service.ts](../../server/src/historian/historian.service.ts):

1. `sslMode` defaults to `prefer` when the reverse-proxy cert is self-signed /
   unreachable — but the publisher's pg_hba only permits `replicator` via
   `hostssl`, so the plaintext fallback leg is always rejected.
2. `YOUR_REPLICATOR_PASSWORD` is inline and repeated (3× in the backfill card,
   1× in the CREATE SUBSCRIPTION card) with no header telling the operator to
   replace every occurrence — a partial replace leaves the walreceiver failing
   auth.

Design doc: none; bug isolated during a live troubleshooting session. Plan file:
`C:\Users\d3x573\.claude\plans\starting-the-historian-backlog-fluttering-sky.md`.

## Layers touched

- **Server only.** No prisma/common/client changes required — the client already
  renders whatever the server emits.

## Progress

### 2026-09-15 09:04 — server layer

Two edits in [server/src/historian/historian.service.ts](../../server/src/historian/historian.service.ts):

1. **sslMode default** (line 2820): `isSelfSigned ? "prefer" : "require"` →
   `isSelfSigned ? "require" : "verify-full"`. Comment added explaining why
   `prefer` is invalid against the publisher's `hostssl`-only pg_hba.
2. **Warning banners** prepended to two SQL templates:
   - `createSubscriptionSql` (Path A CREATE SUBSCRIPTION card): 6-line banner
     naming the 1 occurrence of `YOUR_REPLICATOR_PASSWORD` and the source file
     under `docker/secrets/`.
   - `backfillProcedureSql` (Path A backfill procedure card): 6-line banner
     for 3 occurrences (2 active `CREATE`/`CALL`, 1 commented "RESUME" example).

No prisma/common/client changes. No `schema.graphql` change — the edits are
inside a method body that returns strings, not a Pothos type / resolver
signature.

### 2026-09-15 09:05 — verification

- `cd aems-app/server && yarn check` — pass (exit 0).
- Full-chain `yarn check` in build order:
  - prisma: pass (exit 0)
  - common: pass (exit 0)
  - server: pass (exit 0, above)
  - client: pass (exit 0)

Remaining verification is runtime and belongs to the operator (see plan
verification section): rebuild the server image, reload the historian page,
confirm the emitted SQL contains the banner + `sslmode=require` (or
`verify-full`), and re-run the CREATE SUBSCRIPTION card in pgAdmin.

## Outcome

Complete. Two-line-and-two-banner server edit; typecheck clean across all
workspaces.

### 2026-09-15 09:20 — psql sslmode wiring across all scripts

Follow-up review of the historian-page-rendered scripts found a shared
correctness bug: `psql --set=sslmode=X` sets a psql *script variable*, not a
libpq connection option, so every pre-check and copy call was silently
running with libpq's default (`prefer`). Fixed by moving sslmode into the
`PGSSLMODE` environment variable alongside `PGPASSWORD` on every psql /
pg_dump invocation.

Files changed:

- [server/src/historian/templates/subscribe-historian.sh](../../server/src/historian/templates/subscribe-historian.sh)
  — `publisher_psql` / `subscriber_psql` helpers plus every raw `psql`/`pg_dump`
  invocation (steps 1, 2, and 5).
- [server/src/historian/templates/subscribe-historian.ps1](../../server/src/historian/templates/subscribe-historian.ps1)
  — `Invoke-PubPsql` / `Invoke-SubPsql` and the raw `& psql` / `& pg_dump`
  invocations in steps 1, 2, and 5. `PGSSLMODE` is cleared in the same
  `finally` / cleanup block as `PGPASSWORD`.
- [server/src/historian/historian.service.ts](../../server/src/historian/historian.service.ts)
  — Path B one-liners at lines ~3000-3060: `createTablesCmd{Sh,Ps1}`,
  `createConstraintsCmd{Sh,Ps1}`, `createIndexesCmd{Sh,Ps1}`,
  `createSubscriptionCmd{Sh,Ps1}`. Publisher-side calls get
  `PGSSLMODE=${sslMode}` (matches the CONNECTION-string sslmode already
  emitted); subscriber-side calls hardcode `PGSSLMODE=prefer` (bare Postgres
  subscriber, permissive defaults expected).

`cd aems-app/server && yarn check` — pass (exit 0).

### 2026-09-15 09:50 — autocommit guidance + Card 5 warning parity

User hit `SQLSTATE 2D000 "invalid transaction termination"` running the
backfill procedure in pgAdmin. Cause: the procedure uses per-chunk `COMMIT`
(design requirement for cellular-disconnect resumability), which Postgres
forbids inside a caller-opened transaction. Not a code bug — a pgAdmin
autocommit setting — but the failure mode was invisible from the page.

Also flagged: Card 4 has a WARNING Callout naming the password placeholder,
but Card 5 only had a PRIMARY (info) Callout that mentioned the password at
the end. Parity gap.

Changes:

- [server/src/historian/historian.service.ts](../../server/src/historian/historian.service.ts)
  — expanded `backfillProcedureSql` header banner to a two-item required list:
  (1) replace all 3 password placeholders, (2) run the final CALL in
  autocommit mode (pgAdmin Query Tool → Query menu → Auto-commit; psql is
  autocommit by default), citing the exact SQLSTATE for the wrapping-in-a-txn
  failure so future readers can grep for it.
- [client/src/app/historian/page.tsx](../../client/src/app/historian/page.tsx)
  — Card 5 now renders two Callouts: a new `Intent.WARNING` covering the
  password count and the autocommit requirement, followed by the pre-existing
  `Intent.PRIMARY` note about `dblink` / resumability / idempotency (with the
  now-duplicated "edit password" clause trimmed).

Type-check: server pass (exit 0), client pass (exit 0).

### 2026-09-15 10:30 — Card 5 split into 5A/5B (autocommit alone was not enough)

User reported the `SQLSTATE 2D000` still fired even with pgAdmin autocommit
enabled. Root cause is deeper: libpq's simple-query protocol executes a
multi-statement query buffer as **one implicit transaction**, regardless of
the client's autocommit setting. pgAdmin sends the whole SQL card as one
buffer, so the `CREATE PROCEDURE ... $BODY$ ... COMMIT ... $BODY$` and the
subsequent `CALL` share one transaction — and the per-chunk `COMMIT` inside
the procedure can't complete that caller-controlled transaction.

Fix: split Card 5 into two independently-copiable cards so the CALL always
ships in its own query buffer. Adjacent type changes required.

- [common/src/types/historian.ts](../../common/src/types/historian.ts):
  `backfillProcedureSql` field removed; replaced by `backfillSetupSql` (DDL +
  one-shot topics INSERT) and `backfillRunSql` (CALL + commented RESUME +
  operator-visibility SELECTs). Comment above the fields records the
  transactional reason for the split.
- [server/src/historian/historian.service.ts](../../server/src/historian/historian.service.ts):
  `backfillProcedureSql` template split into two `const`s of the same names.
  5A header banner covers the 1 password placeholder + "safe as a batch";
  5B header banner covers 2 password placeholders + "run alone" + the
  SQLSTATE 2D000 grep hook. `subscriberSetupSql` return object emits both
  new fields.
- [client/src/app/historian/page.tsx](../../client/src/app/historian/page.tsx):
  `sqlCards` grew from 5 to 6 entries — the last two are titled *"5A.
  Backfill setup (DDL + one-shot topics copy)"* and *"5B. Backfill run
  (must be executed alone)"*. Callout logic updated: `i === 4` (5A) now
  carries a plain WARNING about the 1 password + batch-safety; `i === 5`
  (5B) carries the elaborate WARNING (must-run-alone + 2D000 hint) plus the
  pre-existing PRIMARY dblink/resumability note.

Build chain: `common && yarn build` (exit 0), `server && yarn check` (exit
0), `client && yarn check` (exit 0). No graphql-codegen regeneration needed
— `SubscriberSetupSql` is an opaque scalar; only the shape of the JSON blob
changed, not the GraphQL schema.

After redeploying, run Card 5A once (idempotent), then paste Card 5B into a
fresh Query Tool tab, replace both password placeholders, and Execute.
