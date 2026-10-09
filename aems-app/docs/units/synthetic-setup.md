# synthetic-setup

**State:** built

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
- On each start, every demo topic is filled from its latest row, or from the window's start where that
  is later, to now: a restart leaves no gap and keeps earlier rows. The window is
  `SYNTHETIC_HISTORIAN_DAYS`, and each tick deletes the demo rows older than it.
- While the historian refuses connections the seeder waits and runs again, and does not give up after
  one try. The ticker starts after the run that succeeds.
- `synth` refuses to run when the prefix is empty. It never writes to a topic or row of a unit whose
  campus lacks the prefix.
- Demo units and controls are never pushed to VOLTTRON. The unit and control push jobs select no row
  whose campus or name carries the prefix, by the one test setup uses to keep demo rows, and an empty
  prefix marks no row as demo.
- A Units-editor save writes the unit's holidays, occupancies and location before marking it for a
  push.
- The Units and ILC pages report a save as successful only when every write in it succeeded.
  Otherwise they name what failed and keep the edits.
- Changing a unit's location on the Units or ILC page connects the new one and deletes none, and
  `deleteLocation` refuses a location any unit still uses.
- `/dev` admits only admins, and `/demo` any signed-in user.

## Dependencies

site-model, background

## Scenarios

| Name | Proves |
|---|---|
| `demo-topology-upserted` | the 2×3×3 shape with fixed ids; a rerun resets demo wiring only |
| `demo-values-follow-seed` | same seed same values, different seed different values |
| `demo-history-gapless-bounded` | a restart over earlier rows fills only the gap; a tick prunes rows older than the window |
| `seeder-waits-for-historian` | a historian refusing connections at first is still seeded; the ticker waits for it |
| `synth-confined-to-prefix` | empty prefix refused; a real unit's topics are never written |
| `demo-never-pushed` | demo units and controls, new or edited, make no VOLTTRON call; an empty prefix spares none |
| `unit-save-order` | holidays, occupancies and location land before the push mark |
| `save-failure-reported` | a failed write is named, the edits kept, no success shown |
| `shared-location-kept` | a location change on either page deletes none; deleting one a unit uses is refused |
| `dev-admin-only` | a user is refused `/dev`; an admin is admitted |
| `demo-user-scoped` | *(owed)* a user is admitted to `/demo` and its books; an anonymous visitor is refused |
