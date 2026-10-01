# Traps

Things that fail in a way the code does not warn about. Each one cost someone time; read this before
working on the area it names.

## Build chain

- **Stale `dist/` is the usual cause of "has no exported member".** `yarn install` does not fix it;
  only `yarn build` in the upstream workspace does. A local typecheck can pass against an old `dist/`
  while a clean build fails.
- **A Prisma model edit is three steps, in order:** `yarn build` in prisma, then `yarn compile:schema`
  in server, then `yarn compile:graphql` in client. Skip one and the next sees stale types.
- **`postinstall` runs `prisma generate` but does not build `dist/`.**
- **A second `@prisma/client` means two connection pools.** It is a peerDependency reached through the
  portal; never install it again downstream.
- **EEXIST on install is a stale portal symlink.** `build.sh -c` clears them.
- **A Pothos service that is decorated but not in SchemaModule's providers is silently absent** from
  the schema.
- **`autoSchemaFile` writes `client/schema.graphql` only outside production**, and the client copy can
  drift from the server's — `client/codegen.ts` decides which one codegen reads.

## Lint and tests

- **`yarn lint` rewrites source** in prisma, common and server: their scripts pass `--fix`. Use
  `yarn eslint src` to check without changing anything. Client's `next lint` does not fix.
- **Prisma has no tests**, and its jest runs with `--passWithNoTests`, so `yarn test` there exits 0
  having run nothing.
- **Nest tests leak handles** (Redis, the app, cron, Prisma). Close them in `afterAll`; the server's
  `--forceExit` hides the leak rather than fixing it.
- **A Blueprint component renders only inside BlueprintProvider** in tests.
- **Client ESLint is the legacy `next lint` config**; the flat config the other workspaces use does not
  apply there.
- **`client/server.cjs` and `copy-certs.cjs` stay `.cjs`** despite `"type": "module"`.
- **Apollo hooks and Blueprint components need `"use client"`.**

## Compose, containers and secrets

- **Running compose from `docker/`, or with `-f docker/docker-compose.yml`, loads `docker/.env`** — the
  wrong variables, silently.
- **`docker compose restart` reuses the container's cached environment.** To apply a changed variable,
  `up -d --no-deps <service>`.
- **Container names carry `COMPOSE_PROJECT_NAME` (`aems`)** — `aems-proxy`, not `skeleton-proxy`.
  Scripts must read it, not hard-code it.
- **Two containers with `INSTANCE_TYPE=*` race for the same locks.** One worker per role.
- **`down -v` deletes the database volume.**
- **Images build with the repository root as context**, because the portal chain needs every workspace.
- **Traefik is v3** (the tag is pinned in `docker/docker-compose.yml`); v2 label syntax does not work.
- **Edge ILC template changes** (`aems-edge/configurations/templates/`) reach the app by re-running
  `start-services` from `aems-app/`: the volttron-setup image layer is invalidated and its setup
  re-copies them. Never bind-mount templates from the host (ownership, SELinux). If BuildKit keeps the
  old layer, `docker compose build --no-cache volttron-setup`.
- **Compose only interpolates `.env.secrets` when `COMPOSE_ENV_FILES=.env,.env.secrets` is set**; the
  shim's `include: env_file:` does not feed interpolation, and an unset value resolves to the
  `.env` sentinel. `start-services` and `secrets` export it; a hand-typed `docker compose` must too.
  *Superseded on the secrets branch by the `.env`-single-input model; replaced when that branch lands.*

## Dev sessions

- **localhost cannot hold a Domain cookie** — the user always looks logged out.
- **The Docker stack and the local client (`yarn dev`, :3000) must share one hostname and both have
  valid TLS**, or OAuth calls back to the wrong place and the cookie is rejected. `dev:http` has no TLS
  and loses the session.
- **WebSocket and Express session sharing is fragile.** Read `server/src/auth/websocket.service.ts`
  before touching WS auth; every new auth strategy also needs a case there.
- **scope-auth sees no user if `req.user` was never set** — a new auth middleware must be registered in
  MiddlewareModule.

## Reach on this repository

- **The shim is `scripts/reach.ps1`, lowercase.** The plugin documents `Scripts/`; this repository
  already had `scripts/`, which is the same directory on Windows and a different one on Linux.
- **Run it with `powershell` (5.1)**; PowerShell 7 is not installed here.
- **`reach.ps1 prove` aborts under 5.1 when git warns about CRLF** — 5.1 turns native stderr into a
  terminating error. Run it with `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.autocrlf GIT_CONFIG_VALUE_0=false`.
- **Every tier `run` and `requires` is wrapped `( … ) 2>&1`** for the same reason: the first `npm notice`
  or Node warning on stderr otherwise aborts the tier before it has run. Keep the wrapper on new tiers.
