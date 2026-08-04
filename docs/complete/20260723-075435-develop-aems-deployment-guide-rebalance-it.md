# AEMS Deployment Guide — Rebalance for IT Audience

**Started:** 2026-07-23 07:54:35
**Pre-edit line count:** 1200
**Plan:** `C:\Users\d3x573\.claude\plans\the-aems-deployment-guide-binary-avalanche.md`

## Goal

Rebalance the guide for a sysadmin audience — trim developer/DBA depth, relocate SQL walkthroughs and direct-kcadm commands into a new *Deep-Ops Reference* chapter, rewrite Keycloak Administration for the Keycloak Admin Console UI (screenshots to follow), and add IT-procedural verification steps where the current text leaves the reader without a check.

## Progress log

- **2026-07-23 07:54** — Started. Progress log created. Pre-edit line count: 1200.
- **2026-07-23 07:55** — New chapter *Deep-Ops Reference* inserted between Hand-Off and Appendix A. Four subsections: Historian Row Pruning, Subscriber-Side SQL Setup, Resetting Wedged Replication, Direct kcadm Recovery. Each carries the developer/DBA-depth procedure the main flow now delegates to. Complete with WARNING callouts and prerequisite context so a reader arriving mid-chapter has enough to act.
- **2026-07-23 07:57** — Trimmed *Historian and VOLTTRON → Historian Topic Map → Full field reference*: `aggregation` / `transform` / `format` tables now describe *what* each option does (plain English) instead of the SQL function and JavaScript reduction that implement it. Dropped the *Defaults* paragraph and JSON-form footnote. Kept `topic`, `aggregation`, `transform`, `format`, `prefix`, `suffix` as the six-field vocabulary the sysadmin might tune; kept the "picking values by metric semantics" quick reference intact.
- **2026-07-23 07:58** — Trimmed *BACnet Driver — Host Interface*: dropped the Who-Is / I-Am name-drop, the "22-bit unsigned integer" ID-range trivia, and the foreign-device-registration jargon. Kept the operational essentials: BACnet is UDP on 47808, host and RTUs share a broadcast domain or a BBMD bridges them; `VOLTTRON_GATEWAY_ADDRESS` in `.env`; `ip -4 addr show` verification. Framed device-ID conventions as "your building installer will pick one; document it in `topic_watcher.config`" — the sysadmin does not pick.
- **2026-07-23 07:59** — Trimmed *Historian Retention*: kept the WARNING, the growth ballpark, and the vertical-scale alternative. Replaced the `psql DELETE ... VACUUM FULL` procedure with a pointer to *Deep-Ops Reference → Historian Row Pruning*.
- **2026-07-23 08:00** — Trimmed *Off-Site Historian Replication → Subscriber Side*: reduced from ~110 lines to a prerequisites list and a pointer to *Deep-Ops Reference → Subscriber-Side SQL Setup*. Kept the "Live UI at `https://<PUBLISHER_HOSTNAME>/historian`" pointer. Similarly reduced *Break-Glass: Resetting Wedged Replication* to a pointer to *Deep-Ops Reference → Resetting Wedged Replication*.
- **2026-07-23 08:01** — Trimmed *Configure Backups* preamble: collapsed the three-bullet architecture ("Encrypt then upload / Manage the keypair / Run on a schedule") into two sentences. Dropped `age` vs `gpg` fallback specifics and the `backup-secrets` volume name. Kept the four-tab UI reference and the five-step configuration intact.
- **2026-07-23 08:02** — Rewrote *Keycloak Administration* for the Keycloak Admin Console UI. *Resetting a Realm User's Password* is now a seven-step UI walkthrough (open console → switch realm → Users → search → Credentials tab → Set password with Temporary toggle → Save). *Promoting a User to Keycloak Admin* uses the AEMS UI's Admin → Users page (which the AEMS `syncAdminRole` code keeps in sync with Keycloak on save). *Rotating the Master-Realm Admin Password* stays scripted via `./secrets.sh` — the only path that keeps the mounted secret file and the live database in lockstep. All direct-kcadm blocks moved to *Deep-Ops Reference → Direct kcadm Recovery*. Screenshot placeholders (Figure 7.1, 7.2, 7.3) inserted for later drop-in.
- **2026-07-23 08:03** — Expanded *First Launch → Watch the Boot* with a sample `docker compose ps` output showing expected `Exited (0)` and `Up ... (healthy)` states, and added a `docker compose logs init | tail -50` follow-up for non-zero exits. Expanded *Health Check* with a second `curl` that hits `https://<HOSTNAME>/auth/sso/realms/default` so the reader can isolate AEMS-vs-Keycloak failures.
- **2026-07-23 08:04** — Expanded *Configure Backups* step 5 with an explicit "verify the archive landed at the destination" step (`ls -la` for Local Disk, `aws s3 ls` for S3), and a size expectation ("a few tens of megabytes for a fresh deployment").
- **2026-07-23 08:05** — Expanded *Troubleshooting → Login Loop or Keycloak 500 Error*: added a Diagnose step before the destructive `reset-service.sh` calls, with two `docker compose logs` commands and per-symptom criteria for which of `certs` and `keycloak-db` to reset. Added a warning that `keycloak-db` reset wipes locally-created Keycloak users.
- **2026-07-23 08:06** — Expanded *Routine Maintenance → Cadence Checklist*: added a "How" column with per-task pointers (UI navigation, log-grep commands, section cross-references).
- **2026-07-23 08:07** — Verification. `grep -E '§|README\.md|architecture/'` returns no matches. Post-edit line count: 1290 (+90 from 1200; within the plan's expected range given the "some things need more depth" expansions). DOCX rebuilt successfully via `md_to_docx.py` with `Report Template.docx`. ToC includes the new *Deep-Ops Reference* chapter positioned after Hand-Off and before Appendix A.

## Outcome

Rebalance complete. Guide reads as a sysadmin-facing checklist through §1–§10 (Hand-Off), with the developer/DBA-depth procedures collected into *Deep-Ops Reference* at the end. Keycloak Administration is now UI-driven with screenshot anchors in place. The main flow contains no `psql DELETE`, no `CREATE SUBSCRIPTION` SQL, and no `kcadm.sh` commands — those live in the reference chapter, which the main flow links to by section name.

