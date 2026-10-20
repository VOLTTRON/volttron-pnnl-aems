# change-log

**State:** built

## Contract

Recording who changed what in a site's configuration. Which edits there are belongs to the units that
own them; the record each one leaves belongs here.

## Claims

- Every edit to a unit, configuration, setpoint, schedule, occupancy, holiday, location or control
  writes one change record. It names the user, table, key and mutation, and holds the data.
- Only the server creates change records. No API edits one, and an admin may delete one.

## Dependencies

site-model, graphql

## Scenarios

| Name | Proves |
|---|---|
| `edit-writes-change` | each tracked edit writes one change record with user, table, key, mutation, data |
| `change-log-guarded` | createChange and updateChange do not exist; an admin may delete |
