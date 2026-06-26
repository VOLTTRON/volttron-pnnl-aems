# Figures — AEMS Software Deployment Guide

Drop PNG figures into this directory using the filenames below. The Markdown source references figures by caption rather than by inline image tag in the current draft; once captures exist, add inline `![](filename.png)` references at the cited figure points in `../aems-deployment-guide.md`.

## Required captures

| Filename | Section | Description |
|----------|---------|-------------|
| `fig-1.2-lifecycle.png` | §1.2 | Lifecycle diagram: Plan → Install (this guide) → Site Config (Installer Guide) → Operation (Owner Guide). New Mermaid → PNG. |
| `fig-1.3-topology.png` | §1.3 | Deployment topology: one host, one Compose project. Trimmed restatement of the diagram in `aems-app/README.md`. New Mermaid → PNG. |
| `fig-2.1-pi5-bom.png` | §2.3 | Pi 5 BOM stack (Pi + active cooler + M.2 HAT+ + NVMe + PSU). Vendor render or photo. |
| `fig-4.1-os-decision-tree.png` | §4.1 | OS decision tree: standard PC vs Pi 5 vs Windows. New Mermaid → PNG. |
| `fig-4.2-ubuntu-installer.png` | §4.2.2 | Ubuntu Server 24.04 installer "Featured Server Snaps" / SSH-enabled screen. Capture from VM install. |
| `fig-4.3-pi-imager.png` | §4.3.1 | Raspberry Pi Imager OS-customisation pane (SSH + user + Wi-Fi). |
| `fig-4.4-docker-desktop-wsl2.png` | §4.4.2 | Docker Desktop Settings → General → "Use WSL 2 based engine" checkbox. |
| `fig-6.1-tls-decision-tree.png` | §6.1 | TLS strategy decision tree: Let's Encrypt vs third-party vs self-signed. New Mermaid → PNG. |
| `fig-8.1-landing-guest.png` | §8.4 | First-launch landing page with **Guest** dropdown highlighted top-right. Live capture. |
| `fig-9.1-guest-login.png` | §9.1 step 2 | Guest → Login menu open. Live capture. |
| `fig-9.2-keycloak-login-register.png` | §9.1 step 3 | Keycloak login screen with **Register** link circled. Live capture. |
| `fig-9.3-keycloak-register.png` | §9.1 step 4 | Keycloak registration form filled in. Live capture. |
| `fig-9.4-ui-before-role.png` | §9.1 step 5 | Authenticated UI, no admin nav visible. Live capture. |
| `fig-9.5-ui-after-role.png` | §9.1 step 7 | Authenticated UI after `update-user-role.sh`, admin nav visible. Live capture. |
| `fig-9.6-keycloak-mfa.png` | §9.2 | Keycloak admin → Authentication → Required Actions → "Configure OTP" enabled and set as default. Live capture. |
| `fig-9.7-backups-policy.png` | §9.4 step 2 | Backups admin UI — Policy tab with cron + retention set. Live capture. |
| `fig-9.8-backups-keys.png` | §9.4 step 4 | Backups admin UI — Keys tab with "Download active private key" highlighted. Live capture. |
| `fig-9.9-backups-runs.png` | §9.4 step 5 | Backups admin UI — Runs tab with a Succeeded manual run. Live capture. |

## Notes

- **PNNL cover-page logo:** lives at `aems-app/client/public/images/PNNL_Centered_Logo_Color_RGB.png`. The pandoc reference doc embeds it on the cover; do not duplicate it here.
- **Existing repo screenshots under `aems-app/docs/setup-keycloak_01-08.PNG` are stale** — they describe the older manual realm/client creation procedure. The current deployment auto-imports `default-realm.json`, so do not reuse them for the §9 registration flow. They can still serve as historical reference if showing the Keycloak admin console UI itself.
- **Capture in one session.** Take all §8–§9 figures against a freshly-booted stack in one continuous browser session to keep UI chrome and version numbers consistent.
- **Mermaid → PNG.** Generate Mermaid diagrams with `mmdc -i diagram.mmd -o diagram.png -t neutral -b transparent --width 1600` (mermaid-cli). Source `.mmd` files can also live in this directory next to the rendered PNG.
