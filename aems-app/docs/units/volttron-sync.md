# volttron-sync

**State:** built

## Contract

Carrying each unit's configuration to the VOLTTRON edge platform, and the stages a push moves a unit
or control through. What a unit's configuration says, and the form it takes, belong to
setpoints-schedules; the ILC configuration a control sends, to controls-ilc; how a call reaches
VOLTTRON, to volttron-client; recording who changed what, to change-log.

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
- A unit or control in Fail stays there until someone edits it or pushes it again. Nothing retries it.
- An edit saved while its unit or control is being pushed is pushed afterward. A push marks Complete
  only the state it sent, and leaves anything edited during it marked for another push.
- With `SERVICE_CONFIG_STARTUP` on, every unit is marked for a push when the services process starts.

## Dependencies

site-model, background, volttron-client

## Scenarios

| Name | Proves |
|---|---|
| `ilc-templates-reread` | templates re-read on the cron and on preview |
| `unit-push-sequence` | Process, the eight calls in order, then Complete |
| `unit-push-fail-message` | a failed call gives Fail with the cut message; service schedule alone does not |
| `fail-not-retried` | a Fail unit or control is not pushed again without an edit or push |
| `edit-during-push-repushed` | an edit saved mid-push is pushed after; the push does not mark it Complete |
| `startup-repush` | the startup flag marks every unit |
