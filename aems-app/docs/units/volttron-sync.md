# volttron-sync

**State:** built

## Contract

Carrying each unit's configuration to the VOLTTRON edge platform, and recording who changed what.
What a unit's configuration says, and the form it takes, belong to setpoints-schedules. The ILC
configuration a control sends belongs to controls-ilc. The stages a push moves a unit or control
through belong here.

## Claims

- The server reads ILC templates from the volttron-setup image every 10 seconds, and on demand for
  the Admin → Templates preview, so an edited template appears after re-running `start-services`.
- Every 10 seconds the services process pushes each unit marked Update or Process. The unit moves to
  Process, then the server calls `manager.<system>` with `set_temperature_setpoints`,
  `set_occupancy_override`, `set_holidays`, `set_schedule`, `set_service_schedule`,
  `set_optimal_start`, `set_configurations` and `set_location`, in that order. The unit then moves to
  Complete.
- Any failed call moves the unit to Fail instead, with the error as its message, cut to 1024
  characters. A failed `set_service_schedule` is the exception: it is logged and the push carries on.
- Each call to VOLTTRON is tried up to three times, 1 s then 2 s apart. A non-2xx or non-JSON
  response is a failure, and so is a result that is missing or a string.
- A unit or control in Fail stays there until someone edits it or pushes it again. Nothing retries it.
- An edit saved while its unit or control is being pushed is pushed afterward. A push marks Complete
  only the state it sent, and leaves anything edited during it marked for another push.
- With `SERVICE_CONFIG_STARTUP` on, every unit is marked for a push when the services process starts.
- With `VOLTTRON_MOCKED` on, no request leaves the server, and every call succeeds.
- Every edit to a unit, configuration, setpoint, schedule, occupancy, holiday, location or control
  writes one change record. It names the user, table, key and mutation, and holds the data.
- Only the server creates change records. No API edits one, and an admin may delete one.

## Dependencies

site-model, background

## Scenarios

| Name | Proves |
|---|---|
| `ilc-templates-reread` | templates re-read on the cron and on preview |
| `unit-push-sequence` | Process, the eight calls in order, then Complete |
| `unit-push-fail-message` | a failed call gives Fail with the cut message; service schedule alone does not |
| `volttron-call-retried` | three tries with backoff; bad status, content type or result fails |
| `fail-not-retried` | a Fail unit or control is not pushed again without an edit or push |
| `edit-during-push-repushed` | an edit saved mid-push is pushed after; the push does not mark it Complete |
| `startup-repush` | the startup flag marks every unit |
| `mocked-sends-nothing` | the mocked flag sends no request and succeeds |
| `edit-writes-change` | each tracked edit writes one change record with user, table, key, mutation, data |
| `change-log-guarded` | createChange and updateChange do not exist; an admin may delete |
