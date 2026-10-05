# background

**State:** built

## Contract

Which server process runs which background service. It guarantees each background role runs in
exactly one worker while request handlers scale freely. It does not own what any service does.

## Claims

- `INSTANCE_TYPE` is read by every background service at start: `*` runs all, a name runs that service,
  `!name` excludes it, and unset runs none.
- A single `^name` runs that one service and then the process exits.
- The deployment runs server with `none`, services with `*,!seed,!synth`, seeders with `^seed` and
  synth-worker with `synth`.

## Dependencies

stack

## Scenarios

| Name | Proves |
|---|---|
| `instance-type-grammar` | `*`, names, `!name`, unset |
| `instance-type-run-once` | `^name` runs and exits |
| `instance-type-deployed-values` | the compose values |
