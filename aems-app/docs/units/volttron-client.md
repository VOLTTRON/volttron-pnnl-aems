# volttron-client

**State:** built

## Contract

How the server talks to the VOLTTRON web service: the API a call goes through, the shape of a call,
which failures are retried, and mocking. What is pushed, when, and the stages a push moves a unit or
control through are volttron-sync.

## Claims

- Each agent call is a POST to VOLTTRON's VUI API,
  `<SERVICE_CONFIG_API_URL>/vui/platforms/<SERVICE_CONFIG_PLATFORM>/agents/<identity>/rpc/<method>`,
  with the payload as the method's `data` argument and the access token from `/authenticate` as a
  bearer header. The response body is the agent's return value. The retired `/gs` JSON-RPC gateway
  is never used; a base URL that still ends in `/gs` is accepted, with a warning, as the base URL.
- A call VOLTTRON could not complete, a network error, a 5xx or a non-JSON response, is tried up to
  three times, 1 s then 2 s apart. A call VOLTTRON refused with a 4xx, or that the agent answered
  with `false`, fails at once and is not retried.
- With `VOLTTRON_MOCKED` on, no request leaves the server, and every call succeeds.

## Dependencies

stack

## Scenarios

| Name | Proves |
|---|---|
| `volttron-rpc-via-vui` | the VUI rpc URL, the `data` body, the bearer header, the raw return; a `/gs` base URL is tolerated |
| `volttron-call-retried` | three tries with backoff on 5xx or non-JSON |
| `volttron-refusal-not-retried` | a 4xx or a `false` return fails on the first try |
| `mocked-sends-nothing` | the mocked flag sends no request and succeeds |
