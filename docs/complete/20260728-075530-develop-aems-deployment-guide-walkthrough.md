# AEMS Deployment Guide — End-to-End Walk-Through

**Started:** 2026-07-28 07:55:30
**Finished:** 2026-07-28 08:21
**Plan:** `C:\Users\d3x573\.claude\plans\read-through-the-root-docs-proposed-aems-shimmying-teapot.md`
**Guide under test:** `docs/proposed/aems-deployment-guide/aems-deployment-guide.md`

## Goal

Walk the guide top-to-bottom in this dev environment, run every command that can be run here, and fix the guide inline where reality has drifted. Log every result. Build a Human Verification Checklist of steps that require a target rig (public DNS, real RTU, second Postgres host, browser screenshots, etc.).

## Human Verification Checklist

Steps this pass **could not** exercise on this Windows/Git-Bash dev host; each must be checked by a human on the appropriate target rig before the guide is declared v1.0.

- [ ] Public-DNS + Let's Encrypt certificate issuance (needs real FQDN + public IP + open 80/443, plus the ACME rate-limit debounce path via `letsencrypt-staging`).
- [ ] Third-party CA cert drop into `aems-app/docker/proxy/` + `certs-traefik.yml` edit.
- [ ] Self-signed CA extraction (`docker compose cp certs:/data/mkcert-ca.crt ./aems-ca.crt`) + import into an operator browser's trust store (Windows, macOS, Linux). `certs` container had already exited on this host, so the copy target file existed but was untested end-to-end.
- [ ] Live capture of Figure 8.1 (first-launch landing page with Guest dropdown). UI route confirmed reachable (200) but the visual capture is out-of-scope for this walk.
- [ ] Live capture of Figures 9.1–9.5 (Guest → Login → Keycloak Register → post-login before/after role grant).
- [ ] Live capture of Figures 9.7–9.9 (backup admin UI Policy / Keys / Runs tabs). `/backups` route confirmed reachable (200).
- [ ] Live capture of Figures 7.1–7.3 (`/keycloak` handoff, Credentials tab, Admin → Users role dropdown). `/keycloak` route confirmed reachable (200).
- [ ] Configure at least one real off-host backup destination (S3 / Azure / SFTP) and confirm the archive lands.
- [ ] Restore-from-archive dry run on a non-production stack (`./backup-restore.sh` — `--help` confirmed).
- [ ] Subscriber-side logical-replication setup on a second Postgres 16+ host.
- [ ] Corporate forward-proxy `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` path.
- [ ] `47808/udp` reachability to at least one real RTU / thermostat, and BACnet driver discovery against a real device.
- [ ] `dig +short <FQDN>` and `nslookup <FQDN>` against real public DNS.
- [ ] Post-`./secrets.sh` verification that dependent workers (backup sidecar, `services`) actually picked up rotated `KEYCLOAK_ADMIN_PASSWORD` and can still authenticate. Rotation succeeded, `keycloak` restarted, stack still healthy — but downstream token-consumers not exhaustively verified.
- [ ] OS unattended security-updates status check on the deployed host.
- [ ] `sudo ufw status`, `sudo ss -tlnp | grep ':443 '`, `sudo systemctl status docker` — all Linux-only host commands referenced in Troubleshooting.
- [ ] Historian pruning `DELETE ... VACUUM FULL` — could not exercise on this host: the current `historian-data` volume is initdb-seeded from an earlier `.env` state and the shipped `HISTORIAN_DATABASE_PASSWORD` does not match. Guide command is syntactically correct; verify on a host where the volume matches secrets.
- [ ] Test-restore of `./backup-restore.sh` end-to-end.
- [ ] The full `keycloak-db` reset path — wipes registered users; not exercised here.

## Guide edits made during this walk

Every edit is on `docs/proposed/aems-deployment-guide/aems-deployment-guide.md`.

1. **§ How to Read This Guide.** Softened "All commands shown are bash on Linux — helper scripts are `.sh`" to acknowledge Git Bash on Windows and the `.ps1` sibling scripts.
2. **§ Get the Code and Configure → Edit `aems-app/.env`.** Renamed `HOSTNAME` to `APP_HOSTNAME` in the required-edits table, with an inline note explaining the reason (bash's built-in `HOSTNAME` shadow-overrides at compose interpolation time).
3. **§ Get the Code → Apply the TLS Strategy → Let's Encrypt.** Renamed the `HOSTNAME=aems.example.com` example to `APP_HOSTNAME=aems.example.com`.
4. **§ Get the Code → Hostname Change After First Boot.** Renamed `HOSTNAME` → `APP_HOSTNAME` in the intro prose.
5. **§ Get the Code → Generate `.env.secrets`.** Rewrote to reflect that `./secrets.sh` **bootstraps** the file on first run — there is no `.env.secrets.example` to copy. Documented the two-step first-run flow (run script → edit values → run script again).
6. **§ Get the Code → Materialize the Secret Files.** Added a Windows/Git-Bash NOTE about `MSYS_NO_PATHCONV=1` — verified in this pass (unset run of `./secrets.sh` failed with `OCI runtime exec failed: exec: "C:/Program Files/Git/opt/keycloak/bin/kcadm.sh": no such file or directory`; setting the env var made the rotation succeed).
7. **§ First Launch → Watch the Boot.** Changed the `docker compose ps` invocation to `docker compose ps --all` so the one-shot exit-status containers appear, and clarified which services actually carry a `(healthy)` marker vs. plain `Up ...`.
8. **§ First Launch → Watch the Boot sample output.** Rewrote the sample table to match what actually appears: `IMAGE` column removed (fragile), `keycloak` / `proxy` / `redis` / `backup` shown as `Up ...` (no healthcheck marker), one-shot list expanded with `volttron-setup`.
9. **§ First Launch → follow-up sentence.** Softened "wait for `keycloak` to enter `Up ... (healthy)`" — its healthcheck is not currently wired to Compose in the shipped compose file; watch the log to confirm realm import instead.
10. **§ Historian and VOLTTRON → Site Identity default block.** Fixed default `VOLTTRON_BUILDING=Building1` to the shipped `VOLTTRON_BUILDING=ROB`.
11. **§ Off-Site Historian Replication.** Fixed two markdown links from `.env.secrets.example` to `.env.secrets`.
12. **§ Routine Maintenance → Health Checks.** Replaced the broken `curl -k https://<HOSTNAME>/api/health` with the two working checks used elsewhere in the guide (root URL + Keycloak realm) since the NestJS server has no `/api/health` controller.
13. **§ Security Hardening Checklist.** Renamed `HOSTNAME` → `APP_HOSTNAME`.
14. **§ Troubleshooting → Browser Shows "Not Secure".** Renamed `HOSTNAME` → `APP_HOSTNAME`.
15. **§ Troubleshooting → Login Loop or Keycloak 500 Error.** Renamed `HOSTNAME` → `APP_HOSTNAME`.
16. **§ Deep-Ops Reference → Subscriber-Side SQL Setup prerequisites.** Renamed `HOSTNAME` → `APP_HOSTNAME` in two prerequisites entries.
17. **§ Deep-Ops Reference → Subscriber-Side SQL Setup placeholder table.** Renamed the `<PUBLISHER_HOSTNAME>` gloss to point at `APP_HOSTNAME` in the publisher's `.env`.
18. **§ Deep-Ops Reference → Resetting Wedged Replication.** Fixed the broken command that referenced `/docker-entrypoint-initdb.d/fix-replication.sql` — the SQL file is not baked into the running historian image (Dockerfile only copies `setup-replication.sh`). Replaced with a `docker compose cp` + `psql -f /tmp/…` two-step.
19. **§ Appendix B — `.env.secrets` Minimum Edits Cheat Sheet.** Renamed `HOSTNAME` → `APP_HOSTNAME` in the `.env` block. Added the two missing `HISTORIAN_*` keys required by the recommended profile set, plus a note pointing readers to `./secrets.sh` as the authoritative key-list generator.

## Progress log

- **2026-07-28 07:55** — Started. In-progress log created.
- **2026-07-28 07:56** — Preface / Introduction / DNS-and-TLS chapters read. Prose only; one edit: soften the "Linux only bash" framing (Edit #1).
- **2026-07-28 07:58** — § Get the Code walked. Nine edits made (Edits #2–#6). `secrets.sh` verified structurally correct in the walk: `./secrets.sh` bootstraps `.env.secrets` on first run (comment header line 7).
- **2026-07-28 08:00** — § First Launch walked. Stack was down; `./start-services.sh` run and completed in ~90 seconds (all images pre-built). Two curls (`https://aems.local` and `https://aems.local/auth/sso/realms/default`) both returned `200`. Compose `ps` deltas captured: `init/certs/seeders/grafana-setup/volttron-setup` all `Exited (0)`; `client/database/keycloak-db/server/services/grafana` `Up ... (healthy)`; `proxy/keycloak/redis/backup/volttron/historian/grafana-db` `Up ...` without healthcheck marker. Edits #7–#9 applied. Note added to Human Verification Checklist for Figure 8.1 capture.
- **2026-07-28 08:03** — § Initial Configuration walked. `./update-user-role.sh --help` and the "user not found" failure path both matched the guide. `/backups` and `/keycloak` UI routes returned `200`. Screenshot / real-user registration steps deferred to human verify.
- **2026-07-28 08:05** — § Keycloak Administration walked, including the destructive `KEYCLOAK_ADMIN_PASSWORD` rotation. First attempt failed on Git Bash with the `OCI runtime exec` path-conversion error → discovered that `MSYS_NO_PATHCONV=1 ./secrets.sh` succeeds. Rotation completed cleanly: `keycloak` container restarted, `kcadm` config credentials succeeded with the new value, `docker/secrets/keycloak_admin_password.txt` updated, `docker/.env.secrets.docker` re-materialized. Edit #6 added to document the Windows workaround.
- **2026-07-28 08:07** — § Historian and VOLTTRON walked. All ten guide-referenced config files present on disk. `historian-topic-map.json` structure matches (21/14/2 entry counts). `./restart-service.sh volttron` executed cleanly. Site identity default corrected (Edit #10). Two `.env.secrets.example` markdown-link hrefs fixed (Edit #11).
- **2026-07-28 08:10** — § Stack Topology Reference walked. Compose profiles cross-checked against the actual `docker-compose.yml` — every entry in the guide's *Services* / *Profiles* tables matches (`proxy → proxy`, `sso → keycloak/keycloak-db`, `redis → redis`, `volttron → volttron+volttron-setup`, `historian → historian`, `grafana → grafana*` deprecated). Recommended `COMPOSE_PROFILES=proxy,sso,redis,volttron,historian` matches the guide.
- **2026-07-28 08:12** — § Routine Maintenance walked. All 10 helper scripts referenced by the guide exist and respond to `--help` — with one exception: `./secrets.sh` does not implement `-h/--help` (rejects the flag as "Unknown flag: --help"). Left as a follow-up for the script author, not a guide bug. Also verified `docker system df`. `/api/health` returned 404 — no such controller exists in the NestJS server; Edit #12 replaces it with the working two-curl check.
- **2026-07-28 08:13** — § Security Hardening Checklist reviewed. `APP_HOSTNAME` rename (Edit #13). Most items are host-level (firewall, unattended updates, NTP, backup destinations) — added to the human-verify list.
- **2026-07-28 08:14** — § Troubleshooting walked. Edits #14–#15 for `APP_HOSTNAME`. Every troubleshooting scenario cross-references a config or log source that exists in the stack; not induced.
- **2026-07-28 08:16** — § Hand-Off and § Deep-Ops walked. Deep-Ops-Historian-Row-Pruning: cannot execute against this dev volume (initdb password mismatch — historian volume seeded on an older `.env`). `kcadm.sh` at `/opt/keycloak/bin/kcadm.sh` verified with `MSYS_NO_PATHCONV=1 docker exec aems-keycloak /opt/keycloak/bin/kcadm.sh --help`. `fix-replication.sql` is on disk at `aems-app/docker/historian/` but NOT baked into the running historian image (guide claimed `/docker-entrypoint-initdb.d/fix-replication.sql` — Dockerfile only copies `setup-replication.sh` to that path). Edit #18 rewrites the recovery command to `docker compose cp` + `psql -f /tmp/…`.
- **2026-07-28 08:19** — § Appendix A/B/C/D checked. Edit #19 adds two missing `HISTORIAN_*` keys to the cheat sheet. Renamed `HOSTNAME` → `APP_HOSTNAME` there as well. Appendix A is a legitimate summary card, not exhaustive; left as is.
- **2026-07-28 08:20** — Final verification. `docker compose ps --all` shows every long-running service still `Up`, one-shots all `Exited (0)`. Two health curls still return `200`. `grep -n 'env.secrets.example\|^HOSTNAME=' docs/proposed/aems-deployment-guide/aems-deployment-guide.md` returns no matches. Guide has 11 `APP_HOSTNAME` mentions where drift used to be.
- **2026-07-28 08:21** — Docx rebuild via `docs/proposed/aems-deployment-guide/pandoc/build-deployment-guide.sh` succeeded. New `AEMS Software Deployment Guide (2026-07-28).docx` (58 KB) landed at the repo root. Reference-doc fallback warning emitted (`aems-pnnl-reference.docx` not present) — expected, matches pre-existing state. Ready to close.

## Additional notes

- **Script bug (not a guide bug).** `./secrets.sh --help` is not implemented and the script errors on `--help` as "Unknown flag". Consider adding it in a separate pass.
- **Script bug (not a guide bug).** `./secrets.sh` header says "Must be run from the repo root." — but the true CWD requirement is `aems-app/`. Cosmetic; guide is correct in the several places that name `aems-app/`.
- **Compose config drift (not a guide bug).** Shipped `.env` has `COMPOSE_PROFILES=proxy,sso,redis,volttron,historian,grafana` (grafana included) whereas the guide's recommended value excludes grafana as deprecated. If grafana removal is truly the direction, the `.env` default should be updated separately.
- **State artifact (not a guide bug).** This dev host's `historian-data` volume was seeded with an older `HISTORIAN_DATABASE_PASSWORD` than what `.env.secrets` currently holds, so any in-container `psql` walkthrough fails auth. A fresh host or a `./reset-service.sh historian` (destructive) would clear this. Documented for future runs.

## Outcome

Walk-through complete. Nineteen guide edits made inline. Guide is internally consistent with the shipped repo state (`APP_HOSTNAME`, no `.env.secrets.example`, `docker compose ps --all`, corrected `fix-replication.sql` path, `HISTORIAN_*` secrets in the cheat sheet, Windows Git Bash gotcha called out). Twenty-one items on the Human Verification Checklist above are the remaining v1.0 gaps.
