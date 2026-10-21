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
- Against the platform the `volttron` profile deploys, through whichever API it serves, a pushed unit
  reaches Complete and its `manager.<system>` agent's configuration store then holds what was sent;
  a pushed control reaches Complete through `agent.ilc`.
- Any failed call on a unit's push moves the unit to Fail instead, with the error as its message, cut
  to 1024 characters. A failed `set_service_schedule` is the exception: it is logged and the push
  carries on.
- A platform that refuses the connection or the login moves nothing to Fail: every unit and control
  marked for a push stays marked, with the error as its message, and is pushed once the platform answers.
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
| `push-reaches-platform` | *(owed)* on the deployed `volttron` container, unmocked: a unit pushed to Complete, its agent's store holding the values sent; a control pushed to Complete |
| `unit-push-fail-message` | a failed call gives Fail with the cut message; service schedule alone does not |
| `unreachable-platform-waits` | *(owed)* connection or login refused: no unit or control moves to Fail, each marked one stays marked with the error as its message, then reaches Complete once the login succeeds |
| `fail-not-retried` | a Fail unit or control is not pushed again without an edit or push |
| `edit-during-push-repushed` | an edit saved mid-push is pushed after; the push does not mark it Complete |
| `startup-repush` | the startup flag marks every unit |
