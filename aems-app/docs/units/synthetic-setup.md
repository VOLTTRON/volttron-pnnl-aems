# synthetic-setup

**State:** unbuilt

## Contract

Demo data, and the pages around the units. The `synth` service builds a demo site with units and
historian data, all prefixed `SYNTHETIC_CAMPUS_PREFIX` (`DEMO_`). `/setup` is the Units editor, where a
unit's configuration, holidays, occupancies, equipment fields and location are edited and saved.
`/welcome` is the landing page, and `/dev` and `/demo` are developer tools. What the saved values mean
belongs to setpoints-schedules and site-model, and pushing them belongs to volttron-sync.

Implemented today in `server/src/services/synthetic/` and `client/src/app/{setup,welcome,dev,demo}/`.

## Claims

- The demo topology is 2 campuses × 3 buildings × 3 units, each building with a location and a
  control, upserted by fixed ids. A rerun resets each demo unit's configuration, control and location.
- Demo historian values are a function of `SYNTHETIC_SEED`, unit and minute. The same seed gives the
  same values, and a different seed gives different ones.
- On each start, every demo topic is filled from its latest row to now, so restarts leave no gap. The
  ticker keeps no more than `SYNTHETIC_HISTORIAN_DAYS` of demo history.
  **Open:** `server/src/services/synthetic/synthetic.service.ts:136-139` — if any row older than one hour exists for a topic, `backfill` increments `skipped` and returns 0, so a restart with real backfill data skips the topic entirely rather than filling from its latest row to now. The window is always `[now − historianDays × 86400000, now]` (lines 99-101), not `[latest row, now]`. Nothing in `synthetic.service.ts` or `synthetic-ticker.service.ts` prunes old rows: `tickInsert` (`historian.writer.ts:119-131`) inserts without a cap. Does the claim still hold, and if so, where do gap-filling and pruning live?
- The seeder retries until the historian accepts connections, and does not give up after one try.
  **Open:** `server/src/services/synthetic/synthetic.service.ts:73-87` — `execute()` is scheduled by `@Timeout(1000)` and runs `task()` exactly once; the finally block resolves `backfillReady` and clears `running`, with no retry on failure. `writer.ensureTopics` (`historian.writer.ts:39-56`) calls `pool.connect()` which throws if the historian is not up; the error propagates to `task()`'s caller and the seeder gives up. Does the claim still hold, and if so where does the retry live?
- `synth` refuses to run when the prefix is empty. It never writes to a topic or row of a unit whose
  campus lacks the prefix.
- Demo units and controls are never pushed to VOLTTRON.
  **Open:** `server/src/services/synthetic/topology.service.ts:168-184` upserts demo controls without setting `stage`, so each defaults to `ModelStage.Create` (`prisma/models/control.prisma:5`); `server/src/services/control/control.service.ts:30-54` picks up every control whose stage is in `[Create, Update, Process]` and calls `volttronService.makeApiCall('agent.ilc', 'update_configurations', token, data)` (line 107), with no prefix or `isSynthetic` filter. The `isSynthetic` guard in `services/setup/setup.service.ts:469-472` protects demo rows from deletion only. Does the claim still hold, and if so, which layer refuses the push — topology (set a non-push stage), control.service (filter demo controls out of the pending list), or volttron.service?
- A Units-editor save writes the unit's holidays, occupancies and location before marking it for a
  push.
- The Units and ILC pages report a save as successful only when every write in it succeeded.
  Otherwise they name what failed and keep the edits.
- Changing a unit's location never deletes a location another unit still uses.
  **Open:** `client/src/app/setup/page.tsx:259-266` — on every save with a changed location, the client unconditionally calls `deleteLocation({ where: { id: unit.location.id } })` before creating the new row, with no check that the old location is unused. `server/src/graphql/location/mutate.service.ts:124-154` deleteLocation is `user`-scoped and calls `prisma.location.delete({ where })` directly, with no check for other units referencing it; `Unit.location` is `onDelete: SetNull` (`prisma/models/unit.prisma`), so a shared location's deletion silently nulls every other unit's `locationId`. Does the claim still hold, and if so, which side enforces it — the client (skip the delete when other units reference), the server (refuse `deleteLocation` while units reference), or both?
- `/dev` and `/demo` admit only admins.

## Dependencies

site-model, background

## Scenarios

| Name | Proves |
|---|---|
| `demo-topology-upserted` | the 2×3×3 shape with fixed ids; a rerun resets demo wiring only |
| `demo-values-follow-seed` | same seed same values, different seed different values |
| `demo-history-gapless-bounded` | a restart fills the gap; history older than the window is pruned |
| `seeder-waits-for-historian` | a historian that starts late is still seeded |
| `synth-confined-to-prefix` | empty prefix refused; a real unit's topics are never written |
| `demo-never-pushed` | marked demo units and controls make no VOLTTRON call |
| `unit-save-order` | holidays, occupancies and location land before the push mark |
| `save-failure-reported` | a failed write is named, the edits kept, no success shown |
| `shared-location-kept` | changing one unit's location leaves its sibling's |
| `dev-demo-admin-only` | a user is refused `/dev` and `/demo`; an admin is admitted |
