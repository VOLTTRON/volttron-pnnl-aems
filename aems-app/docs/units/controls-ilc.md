# controls-ilc

**State:** built

## Contract

Intelligent Load Control for one building. Setup makes the building's control from its ILC file (see
site-model). When whole-building power crosses the demand limit, VOLTTRON's ILC agent sheds load by
curtailing the control's participating units; the curtailing is the agent's, not the app's. This unit
owns what the app sends that agent, and when.

## Claims

- A push renders every `.json` template under `SERVICE_SETUP_TEMPLATE_PATHS` with the control and its
  units, keyed by file name. It sends the result to `agent.ilc` through `update_configurations`.
- A push moves the control to Process, then to Complete. On failure it moves to Fail instead, with the
  error as its message, cut to 1024 characters.
- A push fails, and sends nothing, when any template fails to parse or render, listing every error.
  It fails the same way when none of the template paths exist.
- A unit marked as not participating in grid services (`peakLoadExclude`) is left out of its control's
  configuration. A control marked that way is sent with no units.
- A new control is pushed as soon as setup creates it.
- Saving a control, or changing any unit in it, marks the control for a push. A change to `stage`,
  `message` or `correlation` alone marks none.

## Dependencies

site-model

## Scenarios

| Name | Proves |
|---|---|
| `ilc-push-renders-templates` | every template rendered with the control and units, sent by file name |
| `ilc-push-stages` | Process then Complete; Fail with the cut message on error |
| `ilc-render-error-sends-nothing` | a parse or render error, or no template path, fails with nothing sent |
| `unit-participation-honoured` | an excluded unit is absent from the config; an excluded control sends none |
| `new-control-pushed` | a control setup creates is pushed without an edit |
| `unit-edit-marks-control` | a unit change marks its control; metadata alone marks none |
