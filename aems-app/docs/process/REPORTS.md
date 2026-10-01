# Reports

## Adoption, 2026-10-01

The previous workflow is tagged `pre-reach-20261001` and archived whole in
[Reference/](../../Reference/). Every claim in it went to the spine, [TRAPS.md](../TRAPS.md), a unit
document or `process.json`, was dropped for a reason below, or is flagged below.

**Dropped — the code already teaches it.** Prettier settings; file, component and enum naming; clsx,
Blueprint primitives, SCSS modules; implicit typing, short argument names, functional components; the
`@/*` alias; `_`-prefixed unused variables; no code in READMEs; the DRY bullets; no `any`, prefer
`unknown`; explicit codegen imports; commit-message and branch naming.

**Dropped — derivable from the tree, and stale everywhere.** Every directory map and every list of
routes, query files, models, aggregates, services, plugins and compose services.

**Dropped — the structure it maintained is gone.** Read the module CLAUDE.md first; keep `.clinerules`
in sync; update the architecture docs; module CLAUDE.md wins on conflict.

**Dropped — false against the code.** `docker/secrets/*.txt` and Docker-secret mounts (removed); a
`skeleton_net` network and `*.skeleton` hostnames; the root shim's `project_directory` and
`required: false`; the `subscriptions-transport-ws` protocol; Yarn PnP (every workspace uses
`node-modules`); profile names `keycloak` and `nominatim`; Redis as a core service; "no host ports"
(5432 and 6379 are published); `INSTANCE_TYPE` parsed in `services.module.ts` (it is `BaseService`);
a CI Postgres (no CI runs aems-app); `docker compose restart skeleton-server`; the client needing a
running server for its schema; Docker needing built modules. "PRs target `develop`" was false and is
true again — it lives in `process.json` as `integration.branch`.

**Contradictions in the code, carried as Open questions** rather than resolved: the `super` role's
grants, the throttle with no guard, the `AUTH_FRAMEWORK` fallback (all in `units/auth.md`); the query
complexity limits and the in-memory pub/sub default (in `units/graphql.md`).

**Commands, agents and the hook — all retired.** design, develop, coverage and refactor are
`/reach:ideate` and `/reach:build`; check-all and full-build are tiers A and D; verify is tier E and the
cold-deploy walkthrough; analyze, new-migration, regen-graphql, rebuild-prisma and docker-up carried
their traps into TRAPS.md. The four subagents' knowledge is in the spine, TRAPS.md and the units. The
prisma rebuild reminder printed to stdout and exited 0, which never reaches the model, and tier A
rebuilds prisma itself. verify.md had three defects, recorded here and not fixed: the missing-secrets
check could never fail, an absent `check-env` read as FAIL, and live rotation replaced
`SESSION_SECRET` with a new random value instead of restoring it.

**Flagged, not placed — still in the archive.** Throttling advice and "PrismaPubSub is more durable"
(meaning unclear); "back up snapshots and volumes"; "service-specific `.env.*` files override defaults",
which the secrets branch resolves.

**Not documented anywhere before adoption:** the AEMS domain. Six units — site-model,
setpoints-schedules, controls-ilc, volttron-sync, historian-dashboards, synthetic-setup — and
content-admin declare `**Contract:** none` until their claims are written with the owner.

**Outside the scope, excluded from link checking, not fixed.** The repository-root `README.md` links to
`aems-app/.env.secrets.example`, deleted in July, and describes the retired `docker/secrets/` model
around it; `aems-edge/` and the root `docs/` are not aems-app's. All three are listed under
`unmaintained` in `process.json`.

**Verified at adoption.** `prove`: 24 gate and 35 lane controls. Negative control: `auth` flipped to
built went red on ClaimsAreProven and green on restore. Tiers A–D pass. Tier E fails: Traefik serves
the localhost certificate for `APP_HOSTNAME` — `certs-traefik.yml` never loads `mkcert-hostname.crt` —
so Playwright's setup is refused before any test runs. Carried as `tls-cert-names-hostname` in `stack`.
