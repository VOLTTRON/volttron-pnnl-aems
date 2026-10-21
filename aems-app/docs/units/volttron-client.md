# volttron-client

**State:** built

## Contract

How the server talks to the VOLTTRON web service: the API a call goes through, the shape of a call,
which failures are retried, and mocking. What is pushed, when, and the stages a push moves a unit or
control through are volttron-sync.

## Claims

- A push asks the platform which API it serves, once, after `/authenticate`: `GET <base>/vui` with the
  access token as a bearer header. A 2xx sends the push's calls through the VUI API, a 404 through the
  `/gs` gateway, and any other answer fails the push with it. `<base>` is `SERVICE_CONFIG_API_URL`
  with any trailing `/gs` dropped.
- Through the VUI API, an agent call is a POST to
  `<base>/vui/platforms/<SERVICE_CONFIG_PLATFORM>/agents/<identity>/rpc/<method>`, with the payload
  as the method's `data` argument and the access token as a bearer header. The response body is the
  agent's return value, and `false` is the agent refusing.
- Through the `/gs` gateway, an agent call is a JSON-RPC 2.0 POST to `<base>/gs` with the identity as
  its `id`, the method, and `params` holding the access token as `authentication` and the payload as
  `data`. A result that is missing or a string is the agent refusing.
- A call VOLTTRON could not complete, a network error, a 5xx or a non-JSON response, is tried up to
  three times, 1 s then 2 s apart. A call VOLTTRON refused with a 4xx, or that the agent refused,
  fails at once and is not retried.
- With `VOLTTRON_MOCKED` on, no request leaves the server, and every call succeeds.
- The server calls the platform by the name and web user it is deployed with: volttron-setup renders
  `platform_config.yml`'s `instance-name` from `VOLTTRON_PLATFORM` and its web user from
  `VOLTTRON_USERNAME` and `VOLTTRON_PASSWORD`, the values `SERVICE_CONFIG_PLATFORM`,
  `SERVICE_CONFIG_USERNAME` and `SERVICE_CONFIG_PASSWORD` carry to the server.
- `VOLTTRON_PASSWORD` is a secret: the tracked `.env` holds the sentinel for it.
- The services process reaches the platform the `volttron` profile deploys on every host the README
  supports, Docker Desktop included. `host-gateway` is not that address on Docker Desktop: it names
  the Windows host, not the namespace a `network_mode: host` container listens in.

## Dependencies

stack

## Scenarios

| Name | Proves |
|---|---|
| `volttron-rpc-via-vui` | the VUI rpc URL, the `data` body, the bearer header, the raw return; a `/gs` base URL is tolerated |
| `volttron-api-detected` | one `GET <base>/vui` per push: a 2xx sends its calls through VUI, a 404 through `/gs`, any other answer fails the push |
| `volttron-rpc-via-gs` | the `/gs` JSON-RPC body with the token and payload in `params`; a missing or string result fails on the first try |
| `volttron-call-retried` | three tries with backoff on 5xx or non-JSON |
| `volttron-refusal-not-retried` | a 4xx or a `false` return fails on the first try |
| `mocked-sends-nothing` | the mocked flag sends no request and succeeds |
| `platform-identity-one-source` | rendered with non-default `VOLTTRON_PLATFORM`, `_USERNAME`, `_PASSWORD`: `platform_config.yml`'s instance name and web user are those values, and so are the server's `SERVICE_CONFIG_*` |
| `volttron-password-sentinel` | the tracked `.env` holds the sentinel for `VOLTTRON_PASSWORD`; tier E's platform, deployed with it, accepts it at `/authenticate` |
| `platform-reachable` | *(owed)* on tier E's host, from inside the services container, `SERVICE_CONFIG_AUTH_URL` and `SERVICE_CONFIG_API_URL` reach the deployed platform |
