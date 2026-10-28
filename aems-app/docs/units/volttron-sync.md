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
- Against the platform the `volttron` profile deploys, unmocked, through whichever API it serves, a
  pushed control reaches Complete through `agent.ilc`. A pushed unit's `set_temperature_setpoints`
  reaches its `manager.<system>` agent, whose configuration store then holds the setpoints sent; with
  no RTU answering the agent's writes, the unit moves to Fail with the platform's error.
- Any failed call on a unit's push moves the unit to Fail instead, with the error as its message, cut
  to 1024 characters. A failed `set_service_schedule` is the exception: it is logged and the push
  carries on.
- A platform that does not answer moves nothing to Fail: a refused login, or a connection refused,
  reset or timed out at the login or at any call of a push once its tries are spent. The unit or
  control being pushed, and every other one marked, stays marked with the error as its message; the
  push goes no further that cycle, and each is pushed once the platform answers. A call the platform
  does answer, with an error status, a body that is not JSON or the agent's refusal, is a failed call.
- A unit or control in Fail stays there until someone edits it or pushes it again. Nothing retries it.
- An edit saved while its unit or control is being pushed is pushed afterward. A push marks Complete
  only the state it sent, and leaves anything edited during it marked for another push.
- With `SERVICE_CONFIG_STARTUP` on, every unit and every control is marked for a push when the
  services process starts.

## Dependencies

site-model, background, volttron-client

## Scenarios

| Name | Proves |
|---|---|
| `ilc-templates-reread` | templates re-read on the cron and on preview |
| `unit-push-sequence` | Process, the eight calls in order, then Complete |
| `push-reaches-platform` | on the deployed `volttron` container, unmocked, no RTU: a control pushed to Complete; a unit pushed to Fail with the platform's error, its agent's store holding the setpoints sent |
| `unit-push-fail-message` | a failed call gives Fail with the cut message; service schedule alone does not |
| `unreachable-platform-waits` | connection or login refused: no unit or control moves to Fail, each marked one stays marked with the error as its message, then reaches Complete once the login succeeds |
| `mid-push-no-answer-waits` | *(owed)* login succeeds, then the connection is refused or reset at a unit's call and at a control's `update_configurations`: neither moves to Fail, both and every other marked one stay marked with the error, then reach Complete once the platform answers; a 5xx or the agent's `false` at the same call still gives Fail |
| `fail-not-retried` | a Fail unit or control is not pushed again without an edit or push |
| `edit-during-push-repushed` | an edit saved mid-push is pushed after; the push does not mark it Complete |
| `startup-repush` | the startup flag marks every unit |
| `startup-repushes-controls` | the startup re-push marks every unit and control |
