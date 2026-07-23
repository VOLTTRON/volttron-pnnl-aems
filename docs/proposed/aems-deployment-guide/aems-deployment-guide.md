---
title: "Autonomous Energy Management Software System for Small Commercial Buildings: Software Deployment Guide"
subtitle: "AEMS Stack Installation, Configuration, and Post-Launch Administration"
authors: "Srinivas Katipamula\nAmelia Bleeker"
date: "June 26, 2026"
date_iso: "2026-06-26T00:00:00"
report_number: "PNNL-XXXXX"
contract: "Prepared for the U.S. Department of Energy under Contract DE-AC05-76RL01830"
toc: true
toc-depth: 3
numbersections: true
linkcolor: blue
urlcolor: blue
---

# Preface

## Audience and Scope

This guide is for the **administrator who installs and configures the AEMS software stack** on a host computer that already has a supported Linux OS and Docker Compose v2 in place. This guide bridges the gap between that prepared host and the moment when a running web UI is reachable at `https://<HOSTNAME>` and a building installer can begin to configure VOLTTRON, BACnet drivers, and thermostats. Host hardware, operating-system install, and Docker Engine install are covered by the *AEMS Deployment Preparation Guide*; on-site VOLTTRON, BACnet, and thermostat provisioning are covered by the *AEMS Building Installer Configuration User Guide*; day-to-day web-UI operation is covered by the *AEMS Building Owner and Occupant User Guide*.

## How to Read This Guide

The sections are ordered to be followed sequentially. This guide begins at DNS and TLS on a host that already has a supported Linux OS and Docker Compose v2 installed; if that is not yet true, complete the *AEMS Deployment Preparation Guide* first. All commands shown are bash on Linux — the AEMS stack runs on Linux and the helper scripts in `aems-app/` are bash (`.sh`).

## Document Conventions

| Convention | Meaning |
|------------|---------|
| `monospace` | A literal command, file name, or value. |
| `<HOSTNAME>` | A placeholder to be replaced with a value specific to your site. |
| **NOTE** | Background context that is helpful but not required. |
| **TIP** | A recommended practice that is not strictly required. |
| **WARNING** | An action that, if skipped or done incorrectly, will cause the deployment to fail or lose data. |

## Acronyms

| Acronym | Expansion |
|---------|-----------|
| ACME | Automatic Certificate Management Environment |
| AEMS | Autonomous Energy Management System |
| API | Application Programming Interface |
| AWS | Amazon Web Services |
| BACnet | Building Automation and Control Network |
| BBMD | BACnet/IP Broadcast Management Device |
| BTO | Building Technologies Office |
| CA | Certificate Authority |
| CIDR | Classless Inter-Domain Routing |
| CPU | Central Processing Unit |
| DHCP | Dynamic Host Configuration Protocol |
| DNS | Domain Name System |
| DR | Disaster Recovery |
| FQDN | Fully Qualified Domain Name |
| GraphQL | Graph Query Language |
| HTTP | Hypertext Transfer Protocol |
| HTTPS | Hypertext Transfer Protocol Secure |
| HVAC | Heating, Ventilation, and Air Conditioning |
| ICAO | International Civil Aviation Organization |
| ILC | Intelligent Load Control |
| IP | Internet Protocol |
| KMS | Key Management Service |
| LAN | Local Area Network |
| LDAP | Lightweight Directory Access Protocol |
| METAR | Meteorological Aerodrome Report |
| MFA | Multi-Factor Authentication |
| NIC | Network Interface Card |
| NTP | Network Time Protocol |
| NVMe | Non-Volatile Memory Express |
| NWS | National Weather Service |
| OAuth | Open Authorization |
| OIDC | OpenID Connect |
| OS | Operating System |
| PEM | Privacy-Enhanced Mail |
| PNNL | Pacific Northwest National Laboratory |
| PostGIS | PostgreSQL Geographic Information System extension |
| REST | Representational State Transfer |
| RTU | Rooftop Unit |
| SAML | Security Assertion Markup Language |
| SAN | Subject Alternative Name |
| SBC | Single-Board Computer |
| SFTP | SSH File Transfer Protocol |
| SMTP | Simple Mail Transfer Protocol |
| SQL | Structured Query Language |
| SSD | Solid-State Drive |
| SSH | Secure Shell |
| SSO | Single Sign-On |
| TCP | Transmission Control Protocol |
| TLS | Transport Layer Security |
| UDP | User Datagram Protocol |
| UI | User Interface |
| UPS | Uninterruptible Power Supply |
| URL | Uniform Resource Locator |
| VLAN | Virtual Local Area Network |
| VOLTTRON | The Eclipse VOLTTRON™ distributed control platform |
| VPN | Virtual Private Network |
| WAL | Write-Ahead Log |

# Introduction

## What This Guide Does

A working AEMS deployment has three distinct phases:

1. **Software installation** — configure DNS and TLS, clone the repository, configure secrets, and launch the AEMS Docker Compose stack on a host that already has a supported Linux OS and Docker Compose v2 installed. **This guide covers phase 1.**
2. **Site configuration** — on the running stack, configure the VOLTTRON platform's BACnet driver to talk to the building's RTUs and thermostats, install the historian agent's database connection, configure the weather agent's station, and wire the target agent. *AEMS Building Installer Configuration User Guide* covers this phase.
3. **Day-to-day operation** — through the AEMS web UI, configure setpoints, occupancy schedules, holidays, optimal start, and Intelligent Load Control parameters. *AEMS Building Owner and Occupant User Guide* covers this phase.

Once you can browse to `https://<HOSTNAME>` and see the AEMS welcome screen, this guide has done its job; pick up the *AEMS Building Installer Configuration User Guide* at its **VOLTTRON Configuration** section and continue from there.

## Deployment Lifecycle

<!-- diagram: lifecycle -->

**Figure 1.2.** Where this guide fits in the AEMS deployment lifecycle.

## Architecture at a Glance

The entire AEMS stack — web UI, API, primary Postgres database with PostGIS, Redis cache, Keycloak SSO, historian database, and the VOLTTRON platform itself — is deployed as a **single Docker Compose project** rooted at `aems-app/` in the repository. The VOLTTRON edge agents (Manager, Normal Framework driver, ILC) are built into images and run as services inside that same compose project; they are not installed separately. There is no per-building install step under normal operation.

<!-- diagram: topology -->


**Figure 1.3.** AEMS deployment topology. One host, one Compose project.

# DNS and TLS Planning

This chapter is planning-only: decide the hostname and TLS strategy so you have the values ready when the next chapter clones the repository and edits its configuration files.

## Decision Tree

<!-- diagram: tls_decision -->

**Figure 6.1.** TLS strategy decision tree.

## DNS Setup

Choose an FQDN before you touch the host — the AEMS UI URL, the Keycloak realm's redirect URIs, and the TLS certificate all bind to it, and each is awkward to change after first boot.

### Public Deployment

Register a DNS A record that points your chosen FQDN at the host's public IP. Once the record is live, verify from any workstation:

```bash
dig +short <HOSTNAME>          # should return the host's public IP
nslookup <HOSTNAME>            # cross-check
```

Wait for propagation before pointing Let's Encrypt at the name — failed ACME validations count against your rate limit.

### Internal or Lab Deployment

Either add an A record to your organization's internal DNS, or add a `hosts` file entry on every operator workstation:

- Linux / macOS: append `192.0.2.10 aems.lab.example` to `/etc/hosts`.
- Windows workstation (operator browser only): append the same line to `C:\Windows\System32\drivers\etc\hosts` (run Notepad as administrator).

> **WARNING.** `localhost` will not work as a hostname. The application sets session cookies bound to the hostname and relies on a stable redirect URL through Keycloak; both break when the browser and the server disagree on the name. Use a real FQDN or a hosts-file entry, never `localhost`.

## TLS Strategy

Pick one of the three strategies below. The actual `.env` edit and any file drops happen in the next chapter, after the repository is cloned; here you only need to decide which path you are on so you know which values to have on hand.

### Let's Encrypt

The easiest path for public deployments. Ports 80/tcp and 443/tcp must be reachable from the public internet — Let's Encrypt validates via an HTTP challenge on port 80 and an in-band TLS challenge on port 443. Do not place an upstream reverse proxy in front of the AEMS host that terminates TLS itself; the stack's Traefik proxy handles termination directly.

**You need:** the FQDN and an administrator email address that will receive certificate-expiry warnings from Let's Encrypt.

### Third-Party Certificate

If your organization issues TLS certificates from an internal certificate authority (CA), obtain a certificate for the FQDN you chose above. The private key and the certificate chain will be dropped into the stack's proxy configuration in the next chapter.

**You need:** the FQDN, the PEM-encoded server certificate (with intermediate chain), and the corresponding PEM-encoded private key.

### Self-Signed (Default)

If you leave the TLS resolver setting empty and provide no third-party cert, the stack's initialization step generates a self-signed CA and a host certificate on first boot. Operator browsers will see a "Not secure" warning until you import the generated CA certificate into each browser's trust store.

**You need:** nothing at planning time. The CA and host certificates are generated automatically at first launch, and the next chapter documents how to extract the CA for browser import.

# Get the Code and Configure

## Clone the Repository

```bash
git clone https://github.com/VOLTTRON/volttron-pnnl-aems.git
cd volttron-pnnl-aems/aems-app
```

All subsequent commands in this guide are run from `aems-app/`.

## Edit `aems-app/.env`

Open [`aems-app/.env`](../../../aems-app/.env) in your editor. The minimum required edits:

| Variable | Required value |
|----------|----------------|
| `HOSTNAME` | Your FQDN (matches the DNS record configured in *DNS and TLS*). |
| `ADMIN_EMAIL` | Your administrator email (also used for Let's Encrypt registration). |
| `CERT_RESOLVER` | `letsencrypt`, or leave empty for self-signed / third-party. |
| `COMPOSE_PROFILES` | Leave at the default `proxy,sso,redis,volttron,historian` unless you have a reason to deviate. |

If your network requires a forward proxy to reach the internet, also set:

```ini
HTTP_PROXY=http://proxy.example.com:3128
HTTPS_PROXY=http://proxy.example.com:3128
NO_PROXY=*.example.com,127.0.0.1
```

## Site Identity

`VOLTTRON_CAMPUS`, `VOLTTRON_BUILDING`, and `VOLTTRON_TIMEZONE` in `aems-app/.env` are the canonical site identity. They template-fill `aems-app/docker/volttron/setup/site.json` at container startup, and every historian topic is built as `{campus}/{building}/…`. Defaults are:

```ini
VOLTTRON_CAMPUS=PNNL
VOLTTRON_BUILDING=Building1
VOLTTRON_TIMEZONE=America/Los_Angeles
```

Edit `aems-app/.env` (**not** the rendered `site.json` — it is overwritten on the next rebuild).

> **WARNING.** Changing `VOLTTRON_CAMPUS` or `VOLTTRON_BUILDING` after telemetry has begun flowing does **not** rewrite the historian rows that were already collected. Pre-rename rows stay filed under the old `{campus}/{building}` pair, so the dashboard will present them as a separate site until you re-file or drop them. Decide these values now, before the first `./start-services.sh`.

## Apply the TLS Strategy

Complete the step below that matches the strategy you picked in *DNS and TLS Planning*.

### Let's Encrypt

Set the three variables in `aems-app/.env`:

```ini
HOSTNAME=aems.example.com
ADMIN_EMAIL=admin@example.com
CERT_RESOLVER=letsencrypt
```

Traefik will request a certificate on first launch through the ACME HTTP-01 challenge on port 80. If you hit Let's Encrypt's production rate limit while debugging, temporarily set `CERT_RESOLVER=letsencrypt-staging` and re-run `./start-services.sh`; switch back once the deployment is stable.

### Third-Party Certificate

Leave `CERT_RESOLVER=` empty in `aems-app/.env` so Traefik does not attempt ACME. Copy the certificate chain and private key into `aems-app/docker/proxy/`, then edit `aems-app/docker/proxy/certs-traefik.yml` to point the `tls.certificates` list at the new filenames.

### Self-Signed

Leave `CERT_RESOLVER=` empty in `aems-app/.env` and add no cert files to `docker/proxy/`. On first launch, the `certs` initialization container generates a self-signed CA and a host certificate and writes them to the `certs-data` Docker volume. Operator browsers will see a "Not secure" warning until you import the generated CA into each browser's trust store. To extract the CA after the stack is running:

```bash
docker compose cp certs:/data/mkcert-ca.crt ./aems-ca.crt
```

Distribute `aems-ca.crt` to every operator workstation and import it as a trusted root authority.

## Hostname Change After First Boot

If you change `HOSTNAME` in `aems-app/.env` after the stack has booted at least once, both the generated certificates and the Keycloak realm's redirect URIs still reference the old name. Reset the affected services from `aems-app/`:

```bash
./reset-service.sh certs                # regenerate certs for the new hostname
```

If Keycloak login still fails afterwards, also reset `keycloak-db` — this wipes the Keycloak database and causes the container to re-import the default realm from its baked-in `default-realm.json` on the next boot:

```bash
./reset-service.sh keycloak-db
```

## Generate `.env.secrets`

```bash
cp .env.secrets.example .env.secrets
```

Open `.env.secrets` and replace every `your_*_here` placeholder with a strong, unique value. For opaque secrets, generate with `openssl rand -hex 32`. For administrator passwords (`KEYCLOAK_ADMIN_PASSWORD`), prefer a strong passphrase you can record in a password manager.

> **WARNING.** Never commit `.env.secrets`. The file and the `docker/secrets/` directory it generates are already in `.gitignore`. Treat the file with the same care as your SSH private keys.

## Materialize the Secret Files

Run the secrets script to write per-secret files under `docker/secrets/` and generate `docker/.env.secrets.docker`:

```bash
./secrets.sh
```

Re-run this command any time you edit `.env.secrets`.

## Critical: Where to Run `docker compose` From

> **WARNING.** Always invoke `docker compose` from `aems-app/`, never from `aems-app/docker/` and never with `-f aems-app/docker/docker-compose.yml`. The root [`aems-app/docker-compose.yml`](../../../aems-app/docker-compose.yml) is a shim that `include:`s [`aems-app/docker/docker-compose.yml`](../../../aems-app/docker/docker-compose.yml); running from `aems-app/` is what makes Compose pick up `aems-app/.env`. Running from `aems-app/docker/` loads `aems-app/docker/.env` instead — wrong variables, broken stack.

# First Launch

## Build and Start

```bash
./start-services.sh
```

This wraps:

```bash
docker compose build
docker compose up -d
```

The first run pulls base images, builds the AEMS images locally, generates self-signed certs (if applicable), runs database migrations through the `init` container, imports the Keycloak realm, and starts the full default profile set. Expect ten to twenty minutes on a first run; subsequent runs are much faster due to layer caching.

## Watch the Boot

In a separate terminal:

```bash
docker compose ps
docker compose logs -f init certs database keycloak server
```

A healthy stack, once boot completes, produces `docker compose ps` output that looks like this — one-shot containers show `Exited (0)`, long-running containers show `Up ... (healthy)`:

```
NAME              IMAGE                 STATUS
aems-init         aems-init             Exited (0) 3 minutes ago
aems-certs        aems-certs            Exited (0) 3 minutes ago
aems-seeders      aems-seeders          Exited (0) 3 minutes ago
aems-database     postgis/postgis:16    Up 3 minutes (healthy)
aems-keycloak-db  postgres:16-alpine    Up 3 minutes (healthy)
aems-keycloak     aems-keycloak         Up 3 minutes (healthy)
aems-redis        redis:7-alpine        Up 3 minutes (healthy)
aems-server       aems-server           Up 3 minutes (healthy)
aems-services     aems-services         Up 3 minutes (healthy)
aems-client       aems-client           Up 3 minutes (healthy)
aems-backup       aems-backup           Up 3 minutes (healthy)
aems-proxy        traefik:v3            Up 3 minutes (healthy)
aems-volttron     aems-volttron         Up 3 minutes
aems-historian    aems-historian        Up 3 minutes (healthy)
```

Wait for `init` and `certs` to reach `Exited (0)`, and for `keycloak` and `server` to enter `Up ... (healthy)`. If either one-shot container exits with a **non-zero** code (`Exited (1)`, `Exited (137)`, etc.), inspect its log immediately — the stack will not recover on its own:

```bash
docker compose logs init | tail -50       # or: certs, seeders
```

## Health Check

Check the AEMS UI and Keycloak separately so you can isolate which side is at fault if the browser fails to load:

```bash
# AEMS UI — expect 200
curl -k -o /dev/null -s --max-time 10 -w "%{http_code}\n" https://<HOSTNAME>

# Keycloak realm endpoint — expect 200
curl -k -o /dev/null -s --max-time 10 -w "%{http_code}\n" \
  https://<HOSTNAME>/auth/sso/realms/default
```

`200` is the healthy result for both. `503` from the AEMS URL typically means a downstream service is still booting — wait a minute and try again. `404` or `500` from the Keycloak URL after `keycloak` has been `Up ... (healthy)` for more than a minute points at a stuck realm import; see the *Login Loop or Keycloak 500 Error* troubleshooting entry.

## Open the UI

Open `https://<HOSTNAME>` in a browser. You should see the AEMS landing page with a **Guest** menu in the top-right corner.

**Figure 8.1.** Expected first-launch landing page, with the Guest dropdown in the top-right.

## Common First-Launch Problems

If the UI does not load, cross-reference the *Troubleshooting (Deployment Phase)* chapter:

- Hostname does not resolve → *Site Unreachable*.
- "Port already in use" on 80 or 443 → *Site Unreachable*.
- Let's Encrypt rate-limit error in `proxy` logs → *Let's Encrypt "Too Many Failed Validations"*.
- Corporate forward proxy intercepting image pulls → re-check the `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` block in `.env`.

# Initial Configuration

## Create the First Administrator User

> **WARNING.** Use the **in-app registration flow** described below to create the first administrator. Do **not** create users directly in the Keycloak admin console — those users will not have a corresponding row in the AEMS application database and the role grant step will fail.

1. Open `https://<HOSTNAME>` in a browser.
2. In the top-right user menu (currently showing **Guest**), click **Login**. You will be redirected to the Keycloak login screen.
3. On the Keycloak login screen, click the **Register** link.
4. Complete the registration form with the administrator's email, name, and a strong password. Submit.
5. You will land back in the AEMS UI as an authenticated user **with no application role**. You can see the UI but cannot perform administrative actions.
6. On the host, grant the new user the `admin` role:

   ```bash
   ./update-user-role.sh admin@example.com admin
   ```

7. Reload the page in the browser. Administrative navigation items appear.

> **NOTE.** Two application roles grant administrative capability. The `admin` role granted above covers everything the administrator does inside the AEMS UI — backups, users, historian dashboards, site configuration. The `keycloak` role is a superset of `admin` that also grants Keycloak Admin Console access, which is what lets the holder reset another user's password or promote another operator to Keycloak admin. For a single-administrator deployment, grant `keycloak` instead of `admin` on step 6 so the first administrator can perform their own password recovery without a second operator. The details of the `keycloak` role's Keycloak-side privileges and the operations it enables are in the next chapter, *Keycloak Administration*.

**Figures 9.1–9.5.** Guest menu → Keycloak Register link → registration form → post-login UI before role grant → post-login UI after role grant.

## Configure Backups

Backups are mandatory for any production deployment. The `backup` sidecar service takes an encrypted archive of both databases and any bind-mounted config files, then uploads it to every configured destination on the schedule you set below. Archives are encrypted before they leave the host so a compromised destination cannot leak the data — the sidecar holds the live encryption keypair and the admin UI's **Keys** tab is the only place the private key ever gets copied off the host.

The admin UI at `https://<HOSTNAME>/backups` has four tabs:

- **Policy** — the cron schedule and the retention window in days. The service ships with a default nightly policy at `0 2 * * *` and 30-day retention, seeded on first boot.
- **Destinations** — one or more upload targets. Supported destinations are **Local Disk** (a volume-mounted path on the host), **S3-Compatible** (AWS S3 or any provider with the S3 API — MinIO, Backblaze B2, Wasabi, Cloudflare R2), **Azure Blob**, and **SFTP** (`ssh` key or password auth).
- **Keys** — the encryption keypair. **Download active private key** exports the current private key as an `age`-formatted text file. Rotation generates a new keypair; the old public key is retained so archives already encrypted with it remain decryptable, but new archives use the new key.
- **Runs** — the archive history. Each run row shows start time, end time, size, per-destination upload status, and a **Trigger manual run** button.

Walk this five-step configuration before declaring the deployment production-ready:

1. Open `https://<HOSTNAME>/backups` (administrator UI).
2. In the **Policy** tab, set the cron schedule (e.g. `0 2 * * *` for 02:00 nightly) and retention in days. The service ships with a sensible default nightly policy; review it and adjust for your environment.
3. In the **Destinations** tab, add at least one off-host destination. For production, an S3 bucket in a separate AWS account (or an equivalent isolated destination on another provider) is strongly recommended so that a total host loss does not also take the archive with it.
4. In the **Keys** tab, click **Download active private key** and store the file offline. Possibilities include a sealed envelope in a fireproof safe, a corporate KMS, or a password manager with a hardware-key second factor. This is the only place the private key ever gets copied off the host — without it, a total host loss makes every archive permanently unreadable, regardless of how many off-host copies exist.

   > **WARNING.** **You cannot decrypt backup archives without the active age private key.** If you rotate keys, keep an offline copy of every key that was active at the time of any archive you might need to restore. The single largest cause of unrestorable backups is a lost key.

5. In the **Runs** tab, click **Trigger manual run**. Wait for the run to reach **Succeeded** in the UI, then confirm the archive file actually landed at each destination — the Runs row reports success once the sidecar hands the archive to the destination client, but a destination whose credentials or bucket permissions are wrong may reject the upload silently. For a Local Disk destination, `ls -la` the mounted path from the host and confirm you see a new `.age` (or `.gpg`) file. For an S3-compatible destination, `aws s3 ls s3://<bucket>/<prefix>/` (or the equivalent provider CLI). A fresh deployment's first archive is typically **a few tens of megabytes** — growth beyond that is dominated by the historian volume as telemetry accumulates.

**Figures 9.7–9.9.** Backups admin UI — Policy tab, Keys tab with the download button highlighted, Runs tab with a successful manual run.

**Restoring from an archive.** Use `./backup-restore.sh` from `aems-app/` to decrypt and unpack an archive on the current host. The script needs (a) the archive file itself and (b) the `age` private key that was active when the archive was created. It restores the AEMS Postgres database, the historian database (if present in the archive), and any bind-mounted config the policy included. Test-restore into a non-production stack on a regular cadence — an untested backup is not a backup.

# Keycloak Administration

Keycloak is the identity provider for AEMS. On first boot, the `keycloak` service imports the `default` realm — creating the realm, its OIDC clients, and the master-realm bootstrap admin (`KEYCLOAK_ADMIN`, default `admin`). Nothing in this chapter is required to bring the stack up; it covers the routine post-launch operations an administrator performs against the running Keycloak.

The recommended way into the Keycloak Admin Console is to sign into the AEMS UI as an administrator, navigate to **`https://<HOSTNAME>/keycloak`**, and click the **Open Keycloak Admin Console** button on that page. The button hands off to the Admin Console at `https://<HOSTNAME>/auth/sso/admin/` under the same browser session, so you do not have to sign in a second time. Every operation in this chapter starts from there. If the AEMS UI is unreachable, the Admin Console URL can also be opened directly and signed into with the master-realm `admin` user or any user holding the AEMS `keycloak` role (see *Promoting a User to Keycloak Admin* below). The AEMS realm the console will land you in is called **`default`**.

## Resetting a Realm User's Password

Use this when a user has forgotten their AEMS password. The user must already exist in Keycloak, which means they must have completed the Guest → Login → Register flow at least once.

1. Sign into the AEMS UI as an administrator, browse to `https://<HOSTNAME>/keycloak`, and click **Open Keycloak Admin Console**.
2. In the top-left realm dropdown (which reads **master** immediately after sign-in), switch to **default**.
3. In the left-hand navigation, choose **Users**. Enter the target user's email into the search box and press Enter.
4. Click the user's row to open their profile, then select the **Credentials** tab.
5. Under **Set password**, enter a new temporary password in both the **Password** and **Password confirmation** fields.
6. Leave the **Temporary** toggle **on** so Keycloak forces the user to change the password on their next login.
7. Click **Set password**, then click **Save password** in the confirmation dialog.

Communicate the temporary password to the user out-of-band (not through the email address attached to the AEMS account).

**Figure 7.1.** The AEMS `/keycloak` page with the **Open Keycloak Admin Console** button highlighted.

**Figure 7.2.** Keycloak Admin Console with the realm switcher expanded, showing `master` and `default`.

**Figure 7.3.** The Credentials tab for a user, with the Set password fields and the Temporary toggle highlighted.

> **NOTE.** Keycloak enforces the realm's password policy on **Set password**. If the policy has been tightened — for example, minimum length 12, one special character required — a weak new password is rejected and the dialog stays open with a validation error. Choose a password that satisfies the policy.

## Promoting a User to Keycloak Admin

Two AEMS user roles are relevant:

- **`admin`** — grants the user the full set of application-scoped administrative capabilities inside the AEMS UI (backups, users, historian dashboards, site configuration). Does **not** grant access to the Keycloak Admin Console.
- **`keycloak`** — everything `admin` grants, **plus** access to the Keycloak Admin Console (the same UI you use for password resets above). Assigning this role in AEMS also grants the Keycloak-side `realm-management/realm-admin` client role in the `default` realm, so the user can manage realm roles, clients, and other users from the Admin Console without a separate sign-in.

**Preferred path — the AEMS UI.** From the AEMS UI, signed in as an existing administrator:

1. Open `https://<HOSTNAME>` and sign in as a current administrator (a user who already holds `admin` or `keycloak`).
2. Navigate to **Admin → Users**.
3. Find the target user in the list, then click their row to open the edit dialog.
4. Change the **Role** dropdown from `guest` / `admin` to **`keycloak`**.
5. Click **Save**.

The AEMS UI updates the user's `User.role` in the AEMS database and — because the new role contains `keycloak` — simultaneously grants the Keycloak-side `realm-management/realm-admin` client role in the `default` realm. Both sides stay in sync. To revoke, change the role back to `admin` (or `guest`); the AEMS UI removes the Keycloak-side privilege in the same step.

The target user must have signed into the AEMS UI at least once before they appear in the **Admin → Users** list — the row is created on first login.

**Figure 7.4.** The AEMS **Admin → Users** page showing the Edit User dialog with the Role dropdown set to `keycloak`.

> **NOTE.** Granting the `realm-management/realm-admin` role directly in the Keycloak Admin Console (bypassing the AEMS UI) does **not** update the AEMS `User.role` column — the AEMS UI will still show the user as their previous role and the two sides will drift. Always promote through the AEMS UI so the AEMS database and Keycloak stay in agreement.

For a recovery path that does not require the AEMS UI or a signed-in administrator — for example, when the first-ever administrator needs to be promoted and no one else can grant them the role yet — see *Deep-Ops Reference → Direct kcadm Recovery* at the end of this guide.

## Rotating the Master-Realm Admin Password

The master-realm admin password (`KEYCLOAK_ADMIN_PASSWORD` in `aems-app/.env.secrets`) is what internal automation (backups, helper scripts) uses to authenticate against Keycloak. It is **not** rotated through the Keycloak Admin Console — a scripted rotation is required because the mounted secret file on disk and the password inside the running `keycloak-db` database must stay in lockstep. Editing one and not the other leaves subsequent authentications broken.

Rotate on a normal cadence and immediately whenever an operator with knowledge of the password leaves the team.

1. Edit `aems-app/.env.secrets` and set the new value:

   ```ini
   KEYCLOAK_ADMIN_PASSWORD=<new-strong-passphrase>
   ```

2. From `aems-app/`, run:

   ```bash
   ./secrets.sh
   ```

`./secrets.sh` detects the changed value and, in one atomic run, authenticates against Keycloak using the **old** password, sets the new password on the master realm's admin user inside the container, overwrites the mounted secret file at `aems-app/docker/secrets/keycloak_admin_password.txt`, and queues a restart of the `keycloak` service so any dependent workers pick up the new value.

If the container is not running when you invoke `./secrets.sh`, the script refuses (`container aems-keycloak is not running`) and leaves both the live Keycloak state and the secret file untouched. Start the stack first, then rotate.

> **WARNING.** Do **not** rotate `KEYCLOAK_ADMIN_PASSWORD` by hand-editing `aems-app/docker/secrets/keycloak_admin_password.txt` and restarting the container. The mounted secret is only read by Keycloak on **first boot** to seed the master admin — on subsequent boots Keycloak keeps whatever password is stored inside the `keycloak-db` database. Writing a new value to the mounted file without also changing the database causes the two to drift, and every subsequent `./secrets.sh`, `./update-user-role.sh`, and internal-automation login will fail with `401 Unauthorized`. Always use `./secrets.sh` so the file and the database stay in sync.

For a recovery path when `./secrets.sh` cannot be run — for example, an on-disk secrets layout that has diverged from the live database — see *Deep-Ops Reference → Direct kcadm Recovery* at the end of this guide.

## Advanced Configuration

Anything not covered above — password-policy tightening, MFA, custom identity providers (LDAP, SAML, OIDC federation), authentication-flow customization, per-realm branding — is standard Keycloak administration. Consult Keycloak's official documentation:

- Overview and getting started: <https://www.keycloak.org/documentation>
- Server Administration Guide (realms, clients, roles, users, groups, policies): <https://www.keycloak.org/docs/latest/server_admin/>
- Securing Applications and Services (adapters, OIDC/OAuth flows): <https://www.keycloak.org/docs/latest/securing_apps/>

The Keycloak version deployed by AEMS is pinned in `aems-app/docker/keycloak/`. When following third-party guides, cross-check the guide against that same version — Keycloak has changed both its Admin REST API and its admin console layout between major releases.

# Historian and VOLTTRON Configuration

This chapter covers the host-side configuration files an administrator edits before the on-site BACnet wiring begins. The reload command for each file appears alongside the description; live-mounted files pick up edits on a service restart, while files baked into the historian image require a rebuild.

## Configuration File Map

The table below lists every site-customizable file under [`aems-app/docker/historian/`](../../../aems-app/docker/historian/) and [`aems-app/docker/volttron/setup/configs/`](../../../aems-app/docker/volttron/setup/configs/). Reload commands fall into three classes:

- **Live-mount reload** — `docker compose restart volttron` picks up the change. All files under `volttron/setup/configs/` are bind-mounted into the container.
- **Image-baked reload** — `./start-services.sh` rebuilds the historian image and rolls the container. Required for files copied in at image build time (`pg_hba.conf`, `postgresql.conf`).
- **Volume-reset reload** — `./reset-service.sh historian` is destructive. Required only when first-boot state is corrupt and a clean slate is needed.

| File | Purpose | Reload |
|------|---------|--------|
| [historian-topic-map.json](../../../aems-app/docker/historian/historian-topic-map.json) | VOLTTRON-topic → historian-column mapping, aggregation, units. | `docker compose restart historian server` |
| [pg_hba.conf](../../../aems-app/docker/historian/pg_hba.conf) | Host-based authentication. Restrict the replication subscriber range here. | Image-baked reload (`./start-services.sh`). |
| [postgresql.conf](../../../aems-app/docker/historian/postgresql.conf) | Postgres tunables: WAL, replication, resource limits. | Image-baked reload (`./start-services.sh`). |
| [bacnet.config](../../../aems-app/docker/volttron/setup/configs/bacnet.config) | BACnet driver — host NIC and device ID. | Live-mount reload. |
| [bacnet_proxy.config](../../../aems-app/docker/volttron/setup/configs/bacnet_proxy.config) | BACnet proxy agent — gateway address and object ID. | Live-mount reload. |
| [driver.config](../../../aems-app/docker/volttron/setup/configs/driver.config) | Platform-driver polling floor and publish depth. | Live-mount reload. |
| [weather.config](../../../aems-app/docker/volttron/setup/configs/weather.config) | weather.gov station code and poll interval. | Live-mount reload. |
| [emailer.config](../../../aems-app/docker/volttron/setup/configs/emailer.config) | Optional SMTP alerting (off by default). | Live-mount reload. |
| [topic_watcher.config](../../../aems-app/docker/volttron/setup/configs/topic_watcher.config) | Per-RTU heartbeat-watch groups. | Live-mount reload. |
| [site.json](../../../aems-app/docker/volttron/setup/site.json) | Site identity — campus, building, timezone. | Live-mount reload. |

## Historian Topic Map

[historian-topic-map.json](../../../aems-app/docker/historian/historian-topic-map.json) controls how VOLTTRON topics are bucketed into the historian database — what each metric is called, how multiple samples in a binning window collapse into one value, and how that value is rendered in the dashboard. Most installs accept the defaults; this subsection covers customizing the entries that already exist (topic name, aggregation, transform, suffix).

> **NOTE.** Adding a brand-new metric to this file is not supported. The dashboard renders only the metric enum values it knows about at build time; an entry for a metric the dashboard does not recognize will be stored in the historian but never displayed. Use this file to retune existing entries, not to extend the metric set.

The file has three top-level sections:

| Section | Purpose |
|---------|---------|
| `templates` | Topic-path patterns for each device class. `{campus}/{building}/{system}/{metric}` for units, `{campus}/{building}/weather/{metric}` for weather, `{campus}/{building}/meter/{metric}` for meters. The braced tokens fill in from [site.json](../../../aems-app/docker/volttron/setup/site.json) and the metric's `topic` field. |
| `unitMetrics` | Per-RTU metrics (zone temperature, setpoints, fan status, etc.) — 21 entries by default. |
| `weatherMetrics` | Weather.gov-sourced observations — 14 entries by default. |
| `meterMetrics` | Building-power-meter readings — 2 entries by default. |

Each metric entry uses these fields:

| Field | Purpose | Common values |
|-------|---------|---------------|
| `topic` | VOLTTRON topic segment substituted into the template. | `"ZoneTemperature"`, `"air_temperature"` |
| `aggregation` | How samples collapse into one value per bin. | `mean` (continuous measurements), `max` (state codes / peaks), `last` (heartbeats, counters) |
| `transform` | Server-side numeric rounding applied to every returned value. | `decimal1` (temperatures, humidity), `decimal2` (power), `integer` (state codes) |
| `suffix` | Free text appended when the value is rendered (no auto-spacing). | `"°F"`, `"%"`, `" W"` |

### Example: change aggregation for peak-comfort reporting

To report the warmest zone temperature in each bin (instead of the bin's mean), change the `aggregation` for `ZoneTemperature` from `"mean"` to `"max"`:

```json
"ZoneTemperature": { "topic": "ZoneTemperature", "aggregation": "max", "transform": "decimal1", "suffix": "°F" }
```

Reload with `docker compose restart historian server`. The change takes effect immediately for new queries; previously-binned data already in the dashboard's cache is not retroactively recomputed.

### Example: relabel a metric's unit suffix

If your dashboard audience prefers SI units, override `WindSpeed`'s suffix from `" mph"` to `" km/h"` (the value is still whatever the weather agent publishes; only the rendered text changes):

```json
"WindSpeed": { "topic": "wind_speed", "aggregation": "mean", "transform": "decimal1", "suffix": " km/h" }
```

Reload as above. Convert the value upstream if you also need a unit conversion, not just a label change.

### Full field reference

Each metric entry may be either a **bare-string form** (`"topic-name"`, uses per-metric defaults for every other field) or an **object form** (recommended). The object form has six fields, all optional; any field omitted falls back to the built-in default:

```json
"ZoneTemperature": {
  "topic":       "ZoneTemperature",
  "aggregation": "mean",
  "transform":   "decimal1",
  "format":      "none",
  "prefix":      "",
  "suffix":      "°F"
}
```

**`topic`** — the VOLTTRON topic segment substituted into the template.

**`aggregation`** — how the raw samples that fall inside one binning window collapse into a single value:

| Value | Meaning | Use for |
|-------|---------|---------|
| `min` | Smallest sample in the window. | Trough-of-interest signals. |
| `max` | Largest sample in the window. | Peaks (demand kW, wind gusts) and stage / command / flag codes. |
| `mean` (default) | Arithmetic average of samples. | Continuous measurements — temperature, humidity, demand %. |
| `mode` | Most frequent sample. | State codes where the majority sample matters. |
| `median` | 50th-percentile sample. | Continuous signals where outliers should not skew the value. |
| `sum` | Total of all samples in the window. | Accumulators. |
| `count` | Number of samples in the window. | Sample-count metrics. |
| `first` | First non-null sample. | Bin-opening samples. |
| `last` | Last non-null sample. | Heartbeats, running totals, period-accumulated values (precipitation-per-hour). |

**`transform`** — numeric rounding applied after aggregation. Every consumer — charts, gauges, tooltips, and exports — sees the same already-rounded number.

| Value | Meaning | Use for |
|-------|---------|---------|
| `none` (default) | No rounding. | Values you don't want touched. |
| `integer` | Round to a whole number. | Boolean, state, and command codes. |
| `decimal1` | Round to one decimal place. | Temperatures, humidity %, wind speed. |
| `decimal2` | Round to two decimal places. | Power, energy, monetary readings. |
| `decimal3` | Round to three decimal places. | Fine-grained sensor values. |
| `floor` | Round down to the next integer. | Counts that must never report a fractional bin. |
| `ceiling` | Round up to the next integer. | Ceilings on demand or capacity metrics. |

**`format`** — how the number is rendered as text in the dashboard.

| Value | Rendered as | Use for |
|-------|-------------|---------|
| `none` (default) | Plain digits (`12345.67`). | Everyday measurements. |
| `thousands` | Grouped digits (`12,345.67`). | Large meter readings, currency-style amounts. |
| `compact` | Compact notation (`12345` → `12.3K`). | Headline KPIs in small spaces. |
| `scientific` | Scientific notation (`12345` → `1.23e+4`). | Very small or very large dimensionless values. |

**`prefix`, `suffix`** — verbatim strings placed before and after the rendered value. **No auto-spacing** is applied — include a leading space in `suffix` if you want one. Examples: `prefix: "$"`, `suffix: ""` renders as `"$12.34"`; `suffix: "%"` renders as `"12.34%"` (no space); `suffix: " mph"` renders as `"12.3 mph"` (one space). Percent is a suffix, not a format — values are **not** multiplied by 100.

**Picking values by metric semantics.** A quick reference for common cases:

- Continuous measurements (temperature, humidity, demand %) → `aggregation: mean`, `transform: decimal1`, `format: none`.
- Peak-of-interest signals (wind gusts, demand kW peaks) → `aggregation: max`.
- Counters, heartbeats, running totals → `aggregation: last`, `transform: integer`.
- Period-accumulated values (precipitation per hour) → `aggregation: last`.
- State / command / stage / flag codes → `aggregation: max` (or `mode`), `transform: integer`.
- Power / energy / monetary readings → `transform: decimal2`, optionally `format: thousands`.

The 37 baseline metrics that ship with the file are already tuned for the Schneider SE8650 thermostat, the weather.gov station, and a building power meter. The customization use case is retuning an existing entry (change aggregation, relabel a suffix) — not writing new ones from scratch.

## BACnet Driver — Host Interface

**BACnet LAN topology.** BACnet/IP is a UDP-broadcast protocol on port 47808. The AEMS host and the RTUs / thermostats must share a broadcast domain — either the same physical LAN or the same tagged VLAN — or a **BBMD** (BACnet/IP Broadcast Management Device) on the RTU LAN must bridge broadcasts to the AEMS host. A dedicated NIC or a tagged VLAN is strongly preferred over sharing the operator LAN.

**Host-interface binding.** The IP/CIDR of the host NIC that faces the BACnet LAN is set by `VOLTTRON_GATEWAY_ADDRESS` (and the related `VOLTTRON_BACNET_ADDRESS`) in `aems-app/.env`. These variables template-fill `bacnet.config` and `bacnet_proxy.config` at container startup — edit `.env`, not the rendered files, or your edits will be overwritten on the next rebuild.

Verify the NIC exists on the host before starting:

```bash
ip -4 addr show     # confirm the intended NIC and its IP/CIDR
```

The default `172.31.32.1/24` is PNNL's lab network and must be changed for any other deployment.

**Device-ID conventions.** Your building installer will pick a device-ID convention for the site — either a serial-number encoding (the last 5 digits of each thermostat's serial number, the Schneider SE8650 default) or an address-based encoding like `<building><rtu>` (e.g. `10101` for building 1, RTU 01). Either works; the sysadmin's job is to make sure the mapping is documented in `topic_watcher.config` comments so an on-site technician can identify a device from its topic path.

**Site-facing configuration files.** All three files below live under `aems-app/docker/volttron/setup/configs/`, are bind-mounted into the VOLTTRON container, and reload with `docker compose restart volttron`:

- `bacnet.config` — the driver's own interface binding and BACnet object identifier.
- `bacnet_proxy.config` — the proxy agent's gateway address and object identifier. When a BBMD is in use, this is where the proxy points at it.
- `driver.config` — the platform driver's polling floor and publish depth (see *Driver Polling and Per-RTU Watch Groups* below).

> **WARNING.** An incorrect `local_interface` is the most common cause of "no points in the historian" at first boot. Verify with `ip -4 addr show` on the host that the chosen interface actually exists on the BACnet-side VLAN before starting the stack. See the *VOLTTRON Cannot Reach RTUs* troubleshooting entry for the full diagnostic.

## Weather Agent — Station Code

The weather agent is a VOLTTRON agent that polls the U.S. National Weather Service (`api.weather.gov`) at a fixed interval and publishes observations onto the VOLTTRON message bus under `{campus}/{building}/weather/{metric}`. Stations are identified by 4-character ICAO codes — e.g. `KPDX` for Portland OR, `KTRI` for Tri-Cities WA.

**Selecting a station for a deployment:**

1. Open <https://forecast.weather.gov/> and enter the building's ZIP code or street address.
2. On the returned forecast page, scroll to the **Current conditions** box in the upper-right. The station name and its ICAO code (in parentheses) appear immediately below the temperature — for example *Pasco Tri-Cities Airport, WA (KPSC)*.
3. Prefer a station within 10 miles of the building; airports are the safest choice because they publish METAR observations at least hourly and have long historical continuity. Avoid personal weather stations and any station whose forecast page shows *"Observations are not currently available"*.
4. If several candidate stations are roughly equidistant, prefer the one at similar elevation to the building — a 500-ft elevation delta biases air temperature by roughly 1.5 °F on average.

**Setting the station.** `VOLTTRON_WEATHER_STATION` in `aems-app/.env` template-fills `weather.config` at container startup. Edit `.env`, then reload:

```bash
docker compose restart volttron
```

**Poll interval.** `VOLTTRON_WEATHER_POLL_INTERVAL_SECONDS` in `.env` (default 3600, i.e. one hour) controls how often the agent hits the NWS API. NWS caches observations and returns a `Cache-Control` header; lowering below 900 seconds is discouraged (no fresher data, wasted requests). Raising above 3600 seconds risks stale data on cold-air or humidity events that drive optimal-start decisions.

**Published metrics.** By default the agent publishes 14 weather metrics: `AirTemperature`, `DewPointTemperature`, `HeatIndex`, `WindChill`, `AirPressure`, `AirPressureAtMeanSeaLevel`, `WindSpeed`, `WindSpeedOfGust`, `WindFromDirection`, `PrecipitationLastHour`, `PrecipitationLast3Hours`, `RelativeHumidity`, and `VisibilityInAir`. The mapping from NWS field names (`air_temperature`, `relative_humidity`, `wind_speed`, …) to these AEMS metric names lives in the `weatherMetrics` section of `historian-topic-map.json`.

**Troubleshooting.** If no weather points appear in the historian within one poll cycle after startup, check the container log:

```bash
docker compose logs volttron | grep -i weather
```

The two common failure modes are (a) a typo in the station code — the NWS API returns 404 for unknown stations, and (b) the site's outbound firewall blocking `api.weather.gov`. The NWS API is on the public internet and requires no key, but many operator LANs block outbound HTTPS by default.

## SMTP Alerting (Optional)

[emailer.config](../../../aems-app/docker/volttron/setup/configs/emailer.config) ships **disabled**: `smtp-username`, `smtp-password`, and `to-addresses` are empty. The agent loads but sends nothing.

To activate it, set `VOLTTRON_SMTP_*` and `VOLTTRON_EMAIL_*` in [`aems-app/.env`](../../../aems-app/.env). `VOLTTRON_SMTP_PASSWORD` must be sourced from [`aems-app/.env.secrets`](../../../aems-app/.env.secrets.example) and propagated by `./secrets.sh` like every other credential — never paste a real SMTP password directly into `emailer.config` or `.env`.

The `allow-frequency-minutes` setting (default 1440 = once per day) throttles duplicate alerts for the same condition. Lowering it makes the agent more noisy; raising it can mask repeated failures.

## Driver Polling and Per-RTU Watch Groups

Two related knobs not covered by the existing PNNL guides:

- `minimum_polling_interval` in [driver.config](../../../aems-app/docker/volttron/setup/configs/driver.config) (default 10 seconds) — the global floor on BACnet poll rate enforced across every device the platform driver manages. Higher values reduce BACnet network traffic and CPU load on the historian; lower values give faster setpoint and sensor feedback. Do not drop below 5 s on a Pi 5 host.
- Per-RTU `*_group` entries in [topic_watcher.config](../../../aems-app/docker/volttron/setup/configs/topic_watcher.config) (default 600 seconds) — the heartbeat-watch interval per device. If a unit stops publishing its `HeartBeat` topic for longer than the group's value, the watcher flags it as unreachable. When you scale beyond the default 5 RTUs, add a `rtu0N_group` entry mirroring the existing rows. Match the group value to roughly 6× your `minimum_polling_interval` so transient packet loss does not trigger spurious alarms.

## Site Identity

`VOLTTRON_CAMPUS`, `VOLTTRON_BUILDING`, and `VOLTTRON_TIMEZONE` in [`aems-app/.env`](../../../aems-app/.env) are the canonical site identity; they template-fill [site.json](../../../aems-app/docker/volttron/setup/site.json) at container startup. Edit `.env`, not the rendered file.

> **WARNING.** The campus and building names are baked into every historian topic (`{campus}/{building}/...`). Changing them after data collection has started means pre-rename rows stay filed under the old name in the historian volume — the dashboard will see them as a separate site until you rewrite or drop them.

## Historian Retention

> **WARNING.** The historian has **no automatic retention pruning** today. The Postgres `data` table grows indefinitely until disk fills. Plan retention manually until automatic pruning is added.

A rough growth estimate: one row per (point, poll) tuple. For the default 5-RTU deployment, ~21 unit metrics × 5 RTUs × ~14 weather metrics × ~2 meter metrics ≈ 120 polled points. At a 10-second `minimum_polling_interval` and 24-hour-a-day operation, that is roughly 1 million rows per day, or ~30 million rows per month. Each row is small (a timestamp, a topic id, a value), so storage usage is on the order of gigabytes per year for a typical small-building deployment.

Two practical options today:

1. **Manual periodic prune.** In a scheduled maintenance window, run the SQL prune-and-reclaim recipe in *Deep-Ops Reference → Historian Row Pruning* at the end of this guide. It's a Postgres operation that takes an exclusive lock on the `data` table for the duration of the reclaim.
2. **Vertical scale.** Provision a larger NVMe SSD on the AEMS host and migrate the `historian-data` volume to it. See *Routine Maintenance → Disk-Space Monitoring* for the inspection commands.

Automatic retention is a known gap. Plan to revisit this section once retention tooling lands.

## Off-Site Historian Replication

A second AEMS host (or an analytics warehouse) can subscribe to this stack's historian and receive a live copy of telemetry via PostgreSQL logical replication. Use this for disaster recovery, multi-site aggregation, or read-only analytics that should not compete with the live VOLTTRON write path.

### Publisher Side (This Stack)

The publisher is configured automatically. On first boot of the `historian` profile, [docker-entrypoint-wrapper.sh](../../../aems-app/docker/historian/docker-entrypoint-wrapper.sh) runs [setup-replication.sh](../../../aems-app/docker/historian/setup-replication.sh), which:

- Creates a `replicator` Postgres role with read-only `SELECT` grants (no `SUPERUSER`, no `CREATEDB`, no `CREATEROLE`).
- Adds primary keys to the `data` and `topics` tables if VOLTTRON has not yet created them (primary keys are required for logical replication to handle `UPDATE` operations).
- Creates a `historian_pub` publication covering all tables in the historian database.

No manual run is required. The replicator's password is `HISTORIAN_REPLICATOR_PASSWORD` in [`aems-app/.env.secrets`](../../../aems-app/.env.secrets.example); set it before first launch.

What you **do** need to edit is [pg_hba.conf](../../../aems-app/docker/historian/pg_hba.conf). The shipped file allows replication from `0.0.0.0/0` (any IP) because the replicator role still requires the password and TLS. For production, narrow this to your subscriber's address:

```
hostssl replication     replicator      <SUBSCRIBER_IP>/32       scram-sha-256
hostssl historian       replicator      <SUBSCRIBER_IP>/32       scram-sha-256
```

`pg_hba.conf` is baked into the historian image, so apply the edit and rebuild with `./start-services.sh`. Also expose the replication port (default `6543/tcp`) on the host firewall to the subscriber IP only; host-firewall configuration is out of scope for this guide.

### Subscriber Side (Remote Host)

The subscriber is a separate PostgreSQL instance — typically on another AEMS host or an analytics warehouse — that pulls telemetry from the publisher via PostgreSQL logical replication. The subscriber-side setup is a series of `psql` commands (create database, define schema, create subscription, verify lag) that goes beyond routine deployment operations.

**Prerequisites the sysadmin owns before subscriber setup begins:**

- PostgreSQL 16+ installed on the subscriber host.
- TCP reachability from subscriber → publisher on the port `HISTORIAN_REPLICATION_PORT` from the publisher's `.env` (default **6543**, not the PostgreSQL default 5432).
- The publisher's `HISTORIAN_REPLICATOR_PASSWORD` value from `.env.secrets` and the publisher's `HOSTNAME`, communicated to whoever will run the subscriber-side setup.
- Sufficient disk on the subscriber for the historian volume you expect (see *Historian Retention* above for growth estimates).

The full subscriber-side procedure — `CREATE DATABASE`, schema DDL, `CREATE SUBSCRIPTION`, monitoring queries, pause / resume, retirement, and the catalog-DELETE break-glass — is in *Deep-Ops Reference → Subscriber-Side SQL Setup* at the end of this guide.

**Live UI.** For an operator-friendly view of subscription status, disk usage, and lag over time on the publisher, browse to `https://<PUBLISHER_HOSTNAME>/historian` on the running deployment.

### Break-Glass: Resetting Wedged Replication

If replication becomes stuck after a schema change or after manually deleting historian rows (subscriber lag climbs and never recovers), see *Deep-Ops Reference → Resetting Wedged Replication* at the end of this guide. The recovery command interrupts every active subscriber, so coordinate before running it.

# Stack Topology Reference

## Services

| Service | Profile | Purpose |
|---------|---------|---------|
| `init` | core | One-shot. Runs Prisma migrations; all other services wait on it. |
| `certs` | core | One-shot. Generates self-signed TLS certificates on first boot. |
| `database` | core | Primary Postgres + PostGIS. |
| `client` | core | Next.js web UI. |
| `server` | core | NestJS GraphQL / REST API. |
| `services` | core | Background workers (cron, telemetry, backup-trigger). |
| `seeders` | core | One-shot. First-boot DB seed. |
| `backup` | core | Backup sidecar (age-encrypted archives). |
| `proxy` | `proxy` | Traefik v3 — TLS termination, routing. |
| `sso` | `sso` | Keycloak + keycloak-db. |
| `redis` | `redis` | Cache and session store. |
| `volttron` | `volttron` | VOLTTRON platform with edge agents. |
| `historian` | `historian` | Time-series Postgres for telemetry. |

## Profiles

Each profile in the *Services* table above is a Docker Compose profile — the service starts only when that profile is enabled in `COMPOSE_PROFILES`. The recommended `COMPOSE_PROFILES` value in `aems-app/.env` for a typical production deployment is:

```
proxy,sso,redis,volttron,historian
```

The `core` services in the table have no profile gate and always start.

> **NOTE.** A `grafana` profile is also defined in the compose project but is **deprecated** and is not enabled in the recommended profile set. Built-in monitoring dashboards in the AEMS web UI have superseded it.

# Routine Maintenance

## Cadence Checklist

| Cadence | Task | How |
|---------|------|-----|
| Daily | Confirm last night's backup ran. | UI → Backups → Runs. Look for a **Succeeded** row from the scheduled cron time. |
| Daily | Check `docker compose ps` for unhealthy services. | Run from `aems-app/`. Any long-running service not showing `Up ... (healthy)` needs attention. |
| Weekly | Review historian disk usage; prune if approaching the volume limit. | Use the commands in *Routine Maintenance → Disk-Space Monitoring* below. If disk is high, see *Historian and VOLTTRON Configuration → Historian Retention*. |
| Weekly | Review Keycloak login logs for brute-force patterns. | `docker compose logs keycloak \| grep -iE 'failed\|invalid_grant'`. |
| Monthly | Apply OS security updates. Restart the host during a planned window. | Standard OS package management on the host — no AEMS-specific step. |
| Monthly | Validate a backup restore on a non-production environment. | See *Initial Configuration → Configure Backups → Restoring from an archive*. An untested backup is not a backup. |
| Annually | Review the *Security Hardening Checklist* chapter. | Walk every checkbox and confirm the deployment still satisfies it. |

## Health Checks

```bash
curl -k https://<HOSTNAME>/api/health
docker compose ps --format "table {{.Name}}\t{{.Status}}"
```

## Logs

```bash
docker compose logs -f server                  # follow one service
docker compose logs --tail=100 keycloak        # last 100 lines
docker logs aems-volttron                      # by container name
```

## Apply Updates

```bash
cd aems-app
git stash
git pull
git stash pop
docker compose pull
./start-services.sh
```

> **WARNING.** **Verify a recent successful backup exists in `/backups` Runs** immediately before applying updates. Database migrations are forward-only — there is no automatic rollback.

## Restart vs. Reset

| Action | Command | When |
|--------|---------|------|
| Reload after config edit | `docker compose restart <service>` | Non-destructive. Picks up new mounted-file content. |
| Reset a single service's volume | `./reset-service.sh <service>` | **Destructive.** Wipes the service's volume(s). Use after a hostname change for `certs`, or to reset Keycloak realm state. |
| Full stack stop | `docker compose down` | Keeps volumes. |
| Full data wipe | `docker compose down -v` | **Destructive.** Destroys every volume, including `database-data` and `historian-data`. |

## Disk-Space Monitoring

The historian volume dominates growth:

```bash
docker system df                               # overall Docker storage
docker volume ls -q | xargs -I {} sh -c 'echo {}; docker volume inspect {} | grep Mountpoint'
```

Prune unused Docker images periodically:

```bash
docker image prune -a -f --filter "until=720h"   # remove images older than 30 days
```

# Security Hardening Checklist

Walk this checklist before declaring the deployment production-ready.

- [ ] `HOSTNAME` is a real DNS name. Never `localhost`.
- [ ] Every value in `.env.secrets` is unique and strong; `secrets.sh` re-run after every edit.
- [ ] `CERT_RESOLVER=letsencrypt` with a real `ADMIN_EMAIL`, **or** a third-party cert is in place.
- [ ] Host firewall exposes only 80/tcp and 443/tcp publicly; 22/tcp restricted to administrator source IPs; 6543/tcp restricted to known replication subscribers only; 47808/udp internal-only.
- [ ] BACnet network is on a separate VLAN or NIC from the public network.
- [ ] Any default seeded administrator password has been changed.
- [ ] Keycloak admin console URL is not exposed publicly (IP allowlist via Traefik middleware if it must be).
- [ ] At least one off-host backup destination is configured.
- [ ] Active age private key has at least one offline copy in named custody.
- [ ] Last backup completed successfully within the retention window.
- [ ] OS unattended security updates enabled.
- [ ] Docker Engine on a supported release; image pulls scheduled.
- [ ] `aems-app/docker/historian/pg_hba.conf` restricts replication subscriber by IP (if off-site replication is configured).
- [ ] Time synchronization is enabled via NTP. BACnet schedules and ILC events depend on accurate time.

# Troubleshooting (Deployment Phase)

This catalog covers issues that surface during the deployment phase — bringing the stack up, TLS, first login, VOLTTRON reaching the RTUs, backups. BACnet field debugging (device-discovery walkthroughs, thermostat provisioning) is the domain of the *AEMS Building Installer Configuration User Guide*, and runtime-UI issues are covered by the *AEMS Building Owner and Occupant User Guide*.

## Browser Shows "Not Secure" / Certificate Warning

**Symptoms.** Browser displays a certificate warning when visiting `https://<HOSTNAME>`.

**Causes and fixes.**

- Using self-signed mode and the CA has not been imported on the operator's browser. Extract the CA per *DNS and TLS → Self-Signed (Default)* and import it as a trusted root.
- Hostname mismatch — the certificate's CN/SAN does not match the URL you are visiting. Confirm `HOSTNAME` in `.env` matches the URL exactly. Reset certs with `./reset-service.sh certs` after a hostname change.

## Site Unreachable

**Symptoms.** Browser shows "This site can't be reached" or connection refused.

**Causes and fixes.**

- DNS not resolving — `dig +short <HOSTNAME>` returns nothing. Fix DNS or add a hosts-file entry.
- Host firewall blocking 443. Check `sudo ufw status`.
- Docker not running — `sudo systemctl status docker`.
- Profile misconfigured — `docker compose ps` shows the `proxy` service missing. Verify `COMPOSE_PROFILES` includes `proxy`.
- Port 443 already in use by another process — `sudo ss -tlnp | grep ':443 '`.

## Login Loop or Keycloak 500 Error

**Symptoms.** Repeated redirects between the AEMS UI and Keycloak, or an Internal Server Error from `/auth/sso/`.

**Most common cause.** `HOSTNAME` was changed after first boot, so the Keycloak realm's redirect URIs no longer match. Two things can be misaligned after a hostname change — the TLS certificate the browser sees, or the redirect URIs baked into the Keycloak realm — so diagnose which one before you reset, because both `reset-service.sh` calls are destructive.

**Diagnose.** Inspect the two logs — the Traefik proxy handles TLS termination and the Keycloak container handles the redirect flow. Look for cert-name-mismatch errors on the proxy side, and redirect-URI errors on the Keycloak side:

```bash
docker compose logs proxy    | tail -30
docker compose logs keycloak | grep -iE 'redirect|invalid'
```

- Proxy log complains about a certificate `x509: certificate is valid for <old-name>, not <new-name>` → certs are stale for the new hostname. Reset certs.
- Keycloak log shows `Invalid parameter: redirect_uri` referencing the old hostname → the realm's redirect URIs still point at the old name. Reset `keycloak-db` so the realm re-imports.
- Both → both are stale. Reset both.

**Fix (only after diagnosing).**

```bash
./reset-service.sh certs         # only if the proxy log shows a cert-name mismatch
./reset-service.sh keycloak-db   # only if the keycloak log shows a redirect-URI mismatch
```

Each `./reset-service.sh` call wipes the corresponding volume — do not run either preemptively. `keycloak-db` in particular destroys every locally-created Keycloak user and password, so users who had signed in against the old realm will need to register again.

## `start-services.sh` Fails with Compose v1 Errors

**Symptom.** Errors mentioning `unsupported keyword 'include'` or `version: '3'` warnings.

**Cause.** Docker Compose v1 is installed; the project requires v2 with `include:` support.

**Fix.** `docker compose version` must report v2.x. If it reports v1 or "command not found," Docker Compose v2 is missing from the host — see the *AEMS Deployment Preparation Guide* for the install path.

## VOLTTRON Cannot Reach RTUs

**Symptoms.** VOLTTRON logs show BACnet discovery timeouts; no points in the historian.

**Causes and fixes.**

- 47808/udp blocked by host firewall or network firewall. Verify reachability with `nc -u <RTU_IP> 47808` or a BACnet discovery tool.
- VOLTTRON container not on the host network. Verify in [`aems-app/docker/docker-compose.yml`](../../../aems-app/docker/docker-compose.yml) that the `volttron` service uses `network_mode: host`.
- `VOLTTRON_GATEWAY_ADDRESS` in `.env` does not match the host's BACnet-side NIC IP.


## Let's Encrypt "Too Many Failed Validations"

**Symptoms.** `proxy` (Traefik) logs show ACME challenge failures and a rate-limit error.

**Causes and fixes.**

- DNS has not propagated yet. Wait, then retry.
- Port 80/tcp is not reachable from the public internet. Verify with `curl -I http://<HOSTNAME>` from an external network.
- An upstream reverse proxy is terminating TLS before the AEMS host. Either move TLS termination to AEMS or pre-stage a third-party cert (see *DNS and TLS → Third-Party Certificate*).
- During debugging, switch to the staging resolver to avoid burning production rate limit. Edit [`aems-app/docker/proxy/`](../../../aems-app/docker/proxy/) Traefik static config to add a `letsencrypt-staging` resolver, set `CERT_RESOLVER=letsencrypt-staging`, retry. Once green, switch back.

## `update-user-role.sh` Reports "User Not Found"

**Cause.** The application database has no row for that email because the user has never signed into the UI. The role-grant script looks up users in the AEMS database, not in Keycloak directly.

**Fix.** Have the user complete the Guest → Login → Register flow described in *Initial Configuration → Create the First Administrator User* (steps 1–5) at least once, then re-run the role grant.

## Backup Admin UI Shows "No Active Key"

**Cause.** The backup sidecar did not initialize the age keypair on first boot.

**Fix.**

```bash
docker compose logs backup
ls -la docker/secrets/backup/
```

If the directory is empty, restart the sidecar — its `init-keys.sh` entrypoint generates a keypair on first run and writes to `docker/secrets/backup/`. If the entrypoint cannot write to the mounted volume, check host filesystem permissions on `aems-app/docker/secrets/`.

# Hand-Off

## To the Installer Guide

The AEMS stack is now running, an administrator account exists, and backups are configured. Continue with the **AEMS Building Installer Configuration User Guide** at its **VOLTTRON Configuration** section. That guide covers:

- BACnet/IP network design and Wi-Fi planning for thermostats.
- Schneider SE8650 thermostat provisioning (Wi-Fi setup, BACnet identifiers, RTU registry, application type).
- Whole-building power meter integration.
- VOLTTRON Weather Agent configuration against weather.gov.
- Platform Historian agent configuration.
- BACnet Driver and BACnet Proxy agent configuration.
- Target Agent configuration and startup.

> **NOTE — Installer Guide Errata.** The existing *AEMS Building Installer Configuration User Guide* describes installing VOLTTRON as a standalone Linux service via the `vcfg` interactive configurator. In the current deployment, **VOLTTRON runs as a Docker service under the AEMS Compose project** that this guide installed. The `vcfg` procedure is **not used** today. The conceptual content of the installer guide — BACnet topology, thermostat configuration, agent purpose, configuration-file structure — remains correct. The configuration files themselves now live under [`aems-app/docker/volttron/setup/configs/`](../../../aems-app/docker/volttron/setup/configs/) and reload via `docker compose restart volttron`. A revision of the installer guide to reflect the Docker reality is planned.

## To the Owner Guide

Once on-site BACnet and VOLTTRON configuration is complete, **AEMS Building Owner and Occupant User Guide** covers day-to-day operation of the running web UI:

- Setpoint Manager (occupied / unoccupied setpoints, deadband).
- Schedule Manager (weekday / weekend occupancy schedules).
- Temporary Schedule Manager (one-off occupancy overrides).
- Holiday Manager (predefined and custom holidays).
- Optimal Start Manager (pre-occupancy ramp-up).
- Miscellaneous parameter inputs.
- Grid Service Features — Intelligent Load Control configuration.

# Deep-Ops Reference

This chapter is a reference for procedures that go beyond routine deployment operations — historian pruning, subscriber-side logical replication setup, wedged-replication recovery, and direct Keycloak administration when the AEMS UI is unreachable. The main flow of the guide links here when a topic requires deeper database or systems knowledge. A sysadmin walking the guide end-to-end does **not** need to read this chapter; open it only when the main flow directs you here or when the procedure at hand is one of the four below.

## Historian Row Pruning

The historian has no automatic retention pruning. When disk usage on the `historian-data` volume approaches the volume limit, either scale up (see *Historian and VOLTTRON Configuration → Historian Retention*) or run a manual prune in a maintenance window.

Connect to the historian and delete rows older than your retention window, then reclaim disk with `VACUUM FULL`:

```bash
docker compose exec historian psql -U historian -d historian -c \
  "DELETE FROM data WHERE ts < NOW() - INTERVAL '90 days';"
docker compose exec historian psql -U historian -d historian -c "VACUUM FULL data;"
```

> **WARNING.** `VACUUM FULL` rewrites the table and reclaims disk to the operating system, but it takes an **exclusive lock** on the table for the duration of the rewrite — no reads or writes can proceed until it completes. Run it during a scheduled maintenance window, and monitor progress from a second `psql` session with `SELECT * FROM pg_stat_activity WHERE query LIKE '%VACUUM%';`.

Substitute the interval for your retention policy (`INTERVAL '30 days'`, `INTERVAL '180 days'`, etc.). The dashboard will not retroactively recompute cached views for pruned windows — old windows simply become empty.

## Subscriber-Side SQL Setup

The subscriber is a separate PostgreSQL instance — typically on another AEMS host, an analytics warehouse, or a developer workstation — that pulls telemetry from the publisher via logical replication. The publisher side is configured automatically on first boot of the `historian` profile; the subscriber side is manual.

**Prerequisites on the subscriber host:**

- PostgreSQL 16+ installed and running as the standard `postgres` superuser.
- TCP reachability from subscriber → publisher on the port `HISTORIAN_REPLICATION_PORT` from the publisher's `.env` (default **6543**, not the PostgreSQL default 5432).
- The publisher's `HISTORIAN_REPLICATOR_PASSWORD` value from `.env.secrets`.
- The publisher's `HOSTNAME`.
- Sufficient disk on the subscriber for the historian volume you expect (see *Historian and VOLTTRON Configuration → Historian Retention* for growth estimates).

**Step 1 — Create the subscriber database with the required schema.** Logical replication requires the target tables to exist and to carry the same primary keys as the publisher. Connect as `postgres`:

```bash
sudo -u postgres psql
```

Then, at the `psql` prompt:

```sql
CREATE DATABASE historian;
\c historian
CREATE SCHEMA IF NOT EXISTS public;

CREATE TABLE IF NOT EXISTS topics (
    topic_id   SERIAL PRIMARY KEY,
    topic_name VARCHAR(512) NOT NULL UNIQUE,
    metadata   TEXT
);

CREATE TABLE IF NOT EXISTS data (
    ts           TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    topic_id     INTEGER NOT NULL,
    value_string TEXT NOT NULL,
    PRIMARY KEY (topic_id, ts)
);

CREATE INDEX IF NOT EXISTS idx_data_ts ON data(ts);
```

The primary key on `(topic_id, ts)` is **mandatory** — without it, PostgreSQL rejects any `UPDATE` streamed by logical replication with a "cannot update table because it does not have a replica identity" error.

**Step 2 — Create the subscription.** In the same `psql` session:

```sql
CREATE SUBSCRIPTION historian_sub
CONNECTION 'host=<PUBLISHER_HOSTNAME> port=<HISTORIAN_REPLICATION_PORT> dbname=historian user=replicator password=<HISTORIAN_REPLICATOR_PASSWORD> sslmode=require'
PUBLICATION historian_pub
WITH (
    copy_data   = true,
    create_slot = true,
    enabled     = true,
    slot_name   = 'historian_sub_slot'
);
```

Placeholder substitution:

- `<PUBLISHER_HOSTNAME>` — the `HOSTNAME` from the publisher's `.env`.
- `<HISTORIAN_REPLICATION_PORT>` — from the publisher's `.env` (default 6543).
- `<HISTORIAN_REPLICATOR_PASSWORD>` — from the publisher's `.env.secrets`.
- `sslmode=require` for production traffic over any network you don't fully trust; `sslmode=prefer` only on isolated internal LANs where the publisher uses a self-signed cert.

**Step 3 — Verify initial sync and monitor lag.**

```sql
SELECT subname, subenabled, pid FROM pg_stat_subscription;

SELECT subname AS subscription, latest_end_lsn, latest_end_time,
       NOW() - latest_end_time AS replication_lag
FROM pg_stat_subscription;
```

`copy_data = true` performs an initial one-shot bulk copy of every existing row; steady-state streaming replication follows automatically. Table-sync state can be inspected with `SELECT srsubstate FROM pg_subscription_rel` — `i` initializing, `d` copying, `s` synchronized, `r` ready.

**Pause and resume.**

```sql
ALTER SUBSCRIPTION historian_sub DISABLE;
-- ... maintenance ...
ALTER SUBSCRIPTION historian_sub ENABLE;
```

**Retiring a subscriber.** On the subscriber:

```sql
DROP SUBSCRIPTION historian_sub;
```

Then on the **publisher**, drop the now-orphaned replication slot to prevent WAL bloat:

```bash
docker exec -it aems-historian psql -U historian -d historian \
  -c "SELECT pg_drop_replication_slot('historian_sub_slot');"
```

**Break-glass — publisher unreachable during retirement.** If `DROP SUBSCRIPTION` hangs because the publisher is unreachable, disable the subscription first, then remove it from the catalog:

```sql
ALTER SUBSCRIPTION historian_sub DISABLE;
DROP SUBSCRIPTION historian_sub;
-- If that still fails:
DELETE FROM pg_subscription_rel WHERE srsubid = (SELECT oid FROM pg_subscription WHERE subname='historian_sub');
DELETE FROM pg_subscription        WHERE subname='historian_sub';
```

Direct catalog deletion leaves the publisher's replication slot orphaned — clean it up on the publisher (per the retirement command above) once the publisher is reachable again.

## Resetting Wedged Replication

If replication becomes stuck after a schema change or after manually deleting historian rows (subscriber lag climbs and never recovers), the historian ships a recovery script that drops and recreates the publication:

```bash
docker compose exec historian psql -U historian -d historian \
  -f /docker-entrypoint-initdb.d/fix-replication.sql
```

> **WARNING.** Running `fix-replication.sql` **interrupts every active subscriber**. Every downstream historian will need to re-initialize its subscription (see *Subscriber-Side SQL Setup* above). Use it only after confirming the wedge cannot be cleared by disabling and re-enabling the affected subscription.

## Direct kcadm Recovery

Use these commands only when the Keycloak Admin Console UI is unreachable **and** the repository checkout with `update-user-role.sh` / `secrets.sh` is unavailable — for example when triaging from a bare operator workstation with only `docker` access to the host. In normal operation, use the UI walkthroughs in *Keycloak Administration* and the `secrets.sh` rotation path.

All commands run against the `aems-keycloak` container (container name `${COMPOSE_PROJECT_NAME}-keycloak`, which defaults to `aems-keycloak`). The AEMS realm is `default`; the master-realm admin user is `admin` (or whatever `KEYCLOAK_ADMIN` is set to in `aems-app/.env`).

**Prelude — authenticate `kcadm.sh`.** Every subsequent `kcadm.sh` call requires an authenticated session; the token is cached inside the container for the life of the session, so run this once per triage session and re-run whenever a call returns `401 Unauthorized`:

```bash
docker exec -it aems-keycloak /opt/keycloak/bin/kcadm.sh config credentials \
  --server http://localhost:8080/auth/sso \
  --realm master \
  --user admin \
  --password "$KEYCLOAK_ADMIN_PASSWORD"
```

`$KEYCLOAK_ADMIN_PASSWORD` must be set in your shell — read it from `aems-app/.env.secrets` if you have access, or paste it inline for one invocation.

**Reset a realm user's password.**

```bash
docker exec -it aems-keycloak /opt/keycloak/bin/kcadm.sh set-password \
  -r default \
  --username user@example.com \
  --new-password '<new-temporary-password>'
```

Communicate the temporary password to the user out-of-band. Keycloak's realm password policy applies — weak passwords are rejected with `403 Forbidden`.

**Grant a user the Keycloak admin client role.**

```bash
docker exec -it aems-keycloak /opt/keycloak/bin/kcadm.sh add-roles \
  -r default --uusername user@example.com \
  --cclientid realm-management --rolename realm-admin
```

> **WARNING.** This grants only the Keycloak-side role; the AEMS `User.role` column is **not** updated. The AEMS UI will still show the user as their previous role and the two sides drift. Once the UI or repository checkout is available again, use the AEMS UI walkthrough in *Keycloak Administration → Promoting a User to Keycloak Admin* to bring the two into sync.

**Rotate the master-realm admin password (raw kcadm).** Only use this when `./secrets.sh` cannot be run — for example when recovering a stack whose on-disk secrets layout has diverged from the live database:

```bash
# Authenticate with the OLD password
docker exec -it aems-keycloak /opt/keycloak/bin/kcadm.sh config credentials \
  --server http://localhost:8080/auth/sso --realm master \
  --user admin --password '<OLD_PASSWORD>'

# Set the NEW password on the master realm's admin user
docker exec -it aems-keycloak /opt/keycloak/bin/kcadm.sh set-password \
  -r master --username admin --new-password '<NEW_PASSWORD>'
```

Once you regain access to the repository checkout, update `aems-app/.env.secrets` to match and rewrite the mounted secret file:

```bash
./secrets.sh --force        # regenerates docker/secrets/*.txt from .env.secrets
docker compose restart keycloak server
```

`--force` is appropriate here because the live rotation is already done and only the on-disk secret file needs to be re-materialized.

# Appendix A — Helper Script Reference

All scripts live at the root of `aems-app/` and must be run from there.

| Script | Purpose |
|--------|---------|
| `./start-services.sh` | Build images and bring the stack up in detached mode. |
| `./reset-service.sh` | **Destructive.** Stop, delete the named service's volumes, restart. |
| `./secrets.sh` | Generate per-secret files from `.env.secrets`. |
| `./update-user-role.sh` | Grant or clear an application role on a user by email. |
| `./migrate-historian-data.sh` | One-shot migration of legacy telemetry into the historian. |
| `./backup-restore.sh` | Break-glass restore from an encrypted backup archive. |
| `./backup.sh` | Internal. Do not invoke directly. |
| `./build.sh` | Build the monorepo modules in dependency order. Source-tree builds only. |
| `./test.sh` | Lint, type-check, and Jest across all modules. Slow. |

# Appendix B — `.env` and `.env.secrets` Minimum Edits Cheat Sheet

## `aems-app/.env`

```ini
HOSTNAME=aems.example.com
ADMIN_EMAIL=admin@example.com
CERT_RESOLVER=letsencrypt
COMPOSE_PROFILES=proxy,sso,redis,volttron,historian
```

On memory-constrained hosts, keep `COMPOSE_PROFILES` at the recommended value above.

## `aems-app/.env.secrets`

```ini
SESSION_SECRET=<openssl rand -hex 32>
JWT_SECRET=<openssl rand -hex 32>
WORKER_TOKEN=<openssl rand -hex 32>
DATABASE_PASSWORD=<strong passphrase>
REDIS_PASSWORD=<strong passphrase>
KEYCLOAK_CLIENT_SECRET=<openssl rand -hex 32>
KEYCLOAK_ADMIN_PASSWORD=<strong passphrase>
KEYCLOAK_DATABASE_PASSWORD=<strong passphrase>
```

# Appendix C — Pandoc Build Instructions

This document's source is `docs/proposed/aems-deployment-guide/aems-deployment-guide.md`. To regenerate the Word `.docx`, run from the repository root:

```bash
pandoc \
  docs/proposed/aems-deployment-guide/aems-deployment-guide.md \
  --reference-doc=docs/proposed/aems-deployment-guide/pandoc/aems-pnnl-reference.docx \
  --toc --toc-depth=3 \
  --number-sections \
  --resource-path=docs/proposed/aems-deployment-guide/figures \
  -o "AEMS Software Deployment Guide ($(date +%Y-%m-%d)).docx"
```

A wrapper script that does the same thing lives at `docs/proposed/aems-deployment-guide/pandoc/build-deployment-guide.sh`.

The reference doc `aems-pnnl-reference.docx` defines the PNNL house style (cover page, heading styles, monospace code style, caption style). To regenerate it from a current PNNL guide:

```bash
pandoc --print-default-data-file reference.docx > /tmp/ref.docx
# Open /tmp/ref.docx in Word, apply PNNL styles to Heading 1/2/3, Cover, Caption,
# Source Code, then save as docs/proposed/aems-deployment-guide/pandoc/aems-pnnl-reference.docx
```

# Appendix D — Document Revision History

| Version | Date | Author | Notes |
|---------|------|--------|-------|
| 0.1 | 2026-06-25 | PNNL | Initial draft. |
