# Backport applicable changes to base Skeleton project

Applying generic pieces of `c2178efb` (reset-service shared volumes) and `04230867` (docker secrets for historian/grafana) to `C:\Users\d3x573\Projects\skeleton`. Only `c2178efb` has generic content; `04230867` is fully AEMS-specific.

Plan: `C:\Users\d3x573\.claude\plans\apply-applicable-changes-to-twinkly-chipmunk.md`

## Progress log

### 2026-08-14 10:34:12 — start
- Skeleton repo on `develop`, clean tree, byte-identical to `aems-app/reset-service.{sh,ps1}` at `c2178efb^`. Diff will apply cleanly.
- 04230867 assessed: all changes tied to historian/grafana/volttron services not present in Skeleton. Nothing to backport.

### 2026-08-14 10:34:30 — applied
- Skeleton branch `feature/reset-service-shared-volumes` created off `develop`.
- Copied `reset-service.sh` and `reset-service.ps1` from `aems-app/` into Skeleton root.
- `git diff` in Skeleton reports `2 files changed, 250 insertions(+), 106 deletions(-)` — byte-identical patch content to c2178efb (verified via unified-diff cross-check; only shorthashes differ).
- Committed as `1e69b0c` in Skeleton with message reusing the c2178efb intent and citing the source commit for provenance.
- Not pushed. Local branch only; user reviews before any push/PR.

### Verification
- Diff cross-check against upstream c2178efb: PASS (see above).
- Runtime verification (help output, list services, dry-run with/without --include-shared) deferred to user in the Skeleton repo, per plan.

