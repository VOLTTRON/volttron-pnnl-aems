# volttron-sync

**State:** unbuilt
**Contract:** none — how configuration reaches VOLTTRON and how changes are tracked was never
documented; the claims beyond the one below are to be derived with the owner.

## Contract

Pushing the app's configuration to the VOLTTRON edge platform and tracking each change until it is
applied.

Implemented today in `server/src/services/volttron.service.ts`, `server/src/services/config/`,
`server/src/change/`, `server/src/graphql/change/` and `client/src/app/changes/`.

## Claims

- The server reads ILC templates from the volttron-setup image every 10 seconds, and on demand for
  the Admin → Templates preview, so an edited template appears after re-running `start-services`.

## Dependencies

site-model, background

## Scenarios

| Name | Proves |
|---|---|
| `ilc-templates-reread` | templates re-read on the cron and on preview |
