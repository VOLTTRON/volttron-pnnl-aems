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
- The seeder retries until the historian accepts connections, and does not give up after one try.
- `synth` refuses to run when the prefix is empty. It never writes to a topic or row of a unit whose
  campus lacks the prefix.
- Demo units and controls are never pushed to VOLTTRON.
- A Units-editor save writes the unit's holidays, occupancies and location before marking it for a
  push.
- The Units and ILC pages report a save as successful only when every write in it succeeded.
  Otherwise they name what failed and keep the edits.
- Changing a unit's location never deletes a location another unit still uses.
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
