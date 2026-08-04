# AEMS Deployment Guide — Restructure and Self-Contain

**Slug:** aems-deployment-guide-self-contain
**Started:** 2026-07-22 08:56:36
**Plan:** `C:\Users\d3x573\.claude\plans\the-aems-deployment-guide-binary-avalanche.md`

## Goal

Restructure `docs/proposed/aems-deployment-guide/aems-deployment-guide.md`:

1. Delete duplicate hardware/OS chapters (§3–§6).
2. Rewrite §1–§2 to reflect the reduced scope.
3. Expand §10 Initial Configuration and §11 Historian/VOLTTRON with inline content — no back-references to source documents.
4. Add a new Keycloak Administration chapter after §10.
5. Strip every reference to any README or architecture document in the repo. Guide must be fully self-contained.

No prisma / common / server / client build steps — this is a documentation-only change.

## Progress log

- **2026-07-22 08:56** — Started. In-progress log created.
- **2026-07-22 08:57** — §1 Preface (Audience/Scope, How to Read) and §2 Introduction (What This Guide Does bullet, architecture-doc pointer) rewritten to reflect reduced scope.
- **2026-07-22 08:58** — §3–§6 (Hardware BoM, Pre-Deployment Planning Checklist, Host OS Install, Docker Install) deleted. No content preserved — hardware/OS setup is covered by a separate guide.
- **2026-07-22 08:59** — Cross-references fixed: all §-refs rewritten to name sections by title. §13.8 Pi 5 troubleshooting entry deleted. Troubleshooting subsection headings had their manual `13.x` prefixes removed so Pandoc auto-numbering renders correctly.
- **2026-07-22 09:00** — §10.2 Configure Backups expanded: inlined backup-sidecar behavior, admin-UI tab reference, and restore path. Dropped pointers to `backup/README.md` and the seed-file path. §10.3 Site Customization Defaults expanded to cover `VOLTTRON_CAMPUS`/`_BUILDING`/`_TIMEZONE` env vars and a self-contained overview of `historian-topic-map.json`.
- **2026-07-22 09:01** — New chapter *Keycloak Administration* inserted between Initial Configuration and Historian/VOLTTRON. Four subsections: Resetting a Realm User's Password, Promoting a User to Keycloak Admin, Rotating the Master-Realm Admin Password, Advanced Configuration (points at three keycloak.org documentation URLs). Verified command syntax against `update-user-role.sh` and `secrets.sh`.
- **2026-07-22 09:02** — §11 expansions: §11.2 Historian Topic Map — full field reference inlined (six fields, aggregation/transform/format enum tables with SQL, picking-values quick reference). §11.3 BACnet Driver — LAN topology, BBMD, host-interface binding, device-ID conventions, site-facing config files. §11.4 Weather Agent — four-step station-selection procedure via forecast.weather.gov, poll interval, 14 published metrics, outbound-firewall troubleshooting. §11.9 Subscriber Side — full walkthrough (schema DDL, `CREATE SUBSCRIPTION`, monitoring, retirement, break-glass).
- **2026-07-22 09:03** — §12 Stack Topology: profiles subsection tightened; §12.3 "Where Configuration Lives" removed (had been a pointer to `aems-app/README.md`).
- **2026-07-22 09:04** — §14 Security Hardening: opening sentence rewritten to stand alone; `pg_hba.conf` link converted to plain monospace. §15 Troubleshooting: chapter intro rewritten to keep companion `.docx` user-guide reference but soften the "see it there" framing; BACnet troubleshooting tail sentence dropped.
- **2026-07-22 09:05** — Appendix A: trailing "full reference in `README.md § Managing the Stack`" sentence removed.
- **2026-07-22 09:06** — Verification. `grep -E 'README\.md|README\)|docker/README|backup/README|proxy/README|seed/README|\\.claude/architecture'` returns no matches. `grep '§'` returns no matches. `sed` scan of §10–§11 for `see .* README|documented at|full reference|described in the Installer` returns clean.

## Outcome

Guide rewrite complete. Documentation-only change — no prisma/common/server/client build chain triggered.
