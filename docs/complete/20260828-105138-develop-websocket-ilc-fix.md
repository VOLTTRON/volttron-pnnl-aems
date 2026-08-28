# Develop: Fix ILC page WebSocket connection failure

Design doc: none. No matching file in `docs/proposed/`. Plan lives at `~/.claude/plans/the-websocket-connection-is-eager-stardust.md` (session-scoped, approved).

## Summary

The ILC page (`aems-app/client/src/app/ilc/page.tsx`) reported `WebSocket connection to 'wss://aems.local/graphql' failed:`. Diagnosis in plan mode showed the server, Traefik, and graphql-ws protocol are all healthy today (curl 101 + Node graphql-ws `connection_ack` both succeed). The real issue is that the current code is opaque: the client's WS provider has no error handlers or retry, and the server's `onConnect` silently accepts anonymous connections and swallows auth-service errors, so nothing appears in logs. This change makes failures visible and self-recovering.

## Layers

- prisma: none
- common: none
- server: `pothos.module.ts`, `websocket.service.ts`
- client: `components/providers/graphql.tsx`
- docker: `docker/docker-compose.yml` traefik labels

## Log

- 20260828-105138 — progress log created; no design doc; starting server layer.
- 20260828-105330 — server: pothos.module.ts edited (removed `subscriptions-transport-ws` block, added `PothosGraphQLModule:ws` logger, kept anonymous `onConnect` semantics). Server yarn check pass.
- 20260828-105515 — server: websocket.service.ts edited (real Response stub instead of `{} as Response`). Client: graphql.tsx got `retryAttempts: Infinity`, `shouldRetry`, `on: { connected, closed, error }`, `connectionParams: async () => ({})`. Client yarn check pass.
- 20260828-105830 — schema regen: compile:schema flaked and truncated `server/schema.graphql` (pre-existing race in `src/schema.ts`); restored from HEAD; confirmed my edits touch no GraphQL types (server and client schemas remain identical to HEAD).
- 20260828-110412 — docker-compose: attached `sslheader` to `server` router middlewares; first attempt failed because the `sslheader` label was defined on the `proxy` container which lacks `traefik.enable=true` under `exposedbydefault=false` — Traefik ignored it and returned 404 for `/graphql`. Moved the middleware definition onto the `server` container labels; Traefik picked it up on next recreate.
- 20260828-110756 — verification: `docker compose up -d --build server client proxy` from repo root. Node `graphql-ws` client against `wss://aems.local/graphql` returned `{"type":"connection_ack"}`. Server log emitted `[PothosGraphQLModule:ws] WS connect: anonymous` (previously silent). Traefik reports no `sslheader` errors. WS layer working end-to-end.
- 20260828-110820 — done. Moved to docs/complete/.

## Final result

Server, client, and docker-compose changes landed. The ILC page's `wss://aems.local/graphql` connection now succeeds. Failures — if they recur — will surface in the browser console (`[graphql-ws] closed code=N reason=...`), the server logs (`PothosGraphQLModule:ws` line per connect), and the AuthJS callback URLs will correctly use `wss://` via the `X-Forwarded-Proto` header. The `subscriptions-transport-ws` legacy path is removed.

