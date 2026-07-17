---
title: "Autonomous Energy Management Software System for Small Commercial Buildings: Software Deployment Guide"
subtitle: "Host OS, Docker, and AEMS Stack Installation for Linux and Raspberry Pi 5"
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

This guide is for the **administrator who installs and configures the AEMS software stack** on a host computer. This guide bridges the gap between an off-the-shelf operating system and the moment when a running web UI is reachable at `https://<HOSTNAME>` and a building installer can begin to configure VOLTTRON, BACnet drivers, and thermostats.

**In scope:**

- Hardware bill of materials for standard PCs and for a Raspberry Pi 5 (with M.2 HAT and NVMe SSD) deployment.
- Host operating system install on Ubuntu Server 24.04 LTS (x86_64 and arm64 — including Raspberry Pi 5).
- Docker Engine and Docker Compose v2 installation.
- DNS, TLS, and reverse-proxy configuration.
- Cloning the AEMS repository, populating secrets, and bringing the Docker Compose stack up.
- Creating the first administrator account through the in-app registration flow.
- Configuring backups and validating the deployment.
- Routine maintenance, updates, and a deployment-phase troubleshooting catalog.
- Clean hand-off to the companion guides.

**Out of scope** — covered by the two companion documents in the repository root:

- **VOLTTRON platform configuration, BACnet network design, Schneider SE8650 thermostat provisioning, power meter wiring, weather agent, historian agent, and target agent setup** — see *AEMS Building Installer Configuration User Guide*.
- **Day-to-day operation of the AEMS web UI** — Setpoint Manager, Schedule Manager, Holiday Manager, Optimal Start Manager, Intelligent Load Control configuration — see *AEMS Building Owner and Occupant User Guide*.

## How to Read This Guide

The sections are ordered to be followed sequentially on a clean machine. §4 (Host Operating System Install) covers the standard Ubuntu Server install on an x86_64 host and the Pi 5 arm64 variant; pick the one that matches your hardware and skip the other. Everything from §5 onward is identical for both paths. All commands shown are bash on Ubuntu — the AEMS stack runs on Linux and the helper scripts in `aems-app/` are bash (`.sh`).

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
| AEMS | Autonomous Energy Management System |
| ACME | Automatic Certificate Management Environment |
| BACnet | Building Automation and Control Network |
| BTO | Building Technologies Office |
| CA | Certificate Authority |
| DHCP | Dynamic Host Configuration Protocol |
| DNS | Domain Name System |
| DR | Disaster Recovery |
| FQDN | Fully Qualified Domain Name |
| HVAC | Heating, Ventilation, and Air Conditioning |
| ILC | Intelligent Load Control |
| IP | Internet Protocol |
| NIC | Network Interface Card |
| NTP | Network Time Protocol |
| NVMe | Non-Volatile Memory Express |
| OS | Operating System |
| PNNL | Pacific Northwest National Laboratory |
| RTU | Rooftop Unit |
| SBC | Single-Board Computer |
| SSD | Solid-State Drive |
| SSO | Single Sign-On |
| TLS | Transport Layer Security |
| UPS | Uninterruptible Power Supply |
| URL | Uniform Resource Locator |
| VOLTTRON | The Eclipse VOLTTRON™ distributed control platform |
| VPN | Virtual Private Network |

# Introduction

## What This Guide Does

A working AEMS deployment has three distinct phases:

1. **Software installation** — install an OS, install Docker, clone the repository, configure secrets and DNS, and launch the AEMS Docker Compose stack. **This guide covers phase 1.**
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

A full, authoritative diagram with profile gating, internal ports, and volume names appears in [`aems-app/README.md`](../../../aems-app/README.md) and in [`aems-app/docker/README.md`](../../../aems-app/docker/README.md).

# Hardware Bill of Materials

## Sizing Baseline

| Resource | Baseline | Notes |
|----------|----------|-------|
| CPU | 4 cores | 8 cores recommended for sites with many RTUs. |
| RAM | 8 GB | 16 GB strongly recommended once the historian and VOLTTRON profiles are running. |
| Storage | 512 GB | Telemetry growth in the historian volume dominates; size against your retention policy. |
| Network | Gigabit Ethernet | Wireless acceptable for bench / demo only. |
| Power | UPS recommended | The host should ride through transient outages so the BACnet platform does not restart during a brownout. |
| Network reachability | UDP 47808 host ↔ RTU/HP LAN | Or HTTP to a Normal Framework gateway. |

> **WARNING.** The host's hostname must be a real, resolvable DNS name. `localhost` will not work — session cookies and OAuth redirects depend on a stable name that the browser and the server agree on.

## Option A: Standard PC or Server

A modern x86_64 machine that boots Ubuntu Server 24.04 LTS is the recommended production target. Vendor-neutral specifications:

- 4-core x86_64 CPU (Intel Core / Xeon, AMD Ryzen / EPYC).
- 16 GB RAM.
- 512 GB or larger NVMe SSD.
- One gigabit NIC for the public-facing network; a second NIC is useful when the BACnet network must be isolated by VLAN.

> **WARNING.** **Bare-metal hosts only — virtual machines are not supported.** VOLTTRON's BACnet/IP driver must bind directly to a host network interface to send and receive UDP broadcasts on port 47808. Hypervisor NIC virtualization (VMware vSwitch, Hyper-V vSwitch, Proxmox bridge, etc.) drops or rewrites the broadcasts that BACnet device discovery depends on, so thermostats and RTUs become unreachable from a VM-hosted VOLTTRON. Install the AEMS host on bare metal — either a dedicated PC/server or a Raspberry Pi 5 (Option B).

## Option B: Raspberry Pi 5 with M.2 HAT and NVMe SSD

The Raspberry Pi 5 is a supported deployment target for **single-building, compact installations**. A recommended bill of materials:

| Item | Recommendation | Notes |
|------|---------------|-------|
| Raspberry Pi 5 | 8 GB model | 16 GB strongly preferred when the historian profile is enabled. |
| Power supply | Official Raspberry Pi 27 W USB-C | Under-rated supplies cause throttling under sustained Docker load. |
| Cooling | Official Active Cooler (or equivalent) | Mandatory. Without active cooling the SoC thermal-throttles under sustained Docker load. |
| M.2 HAT | Pimoroni NVMe Base, Pineboards HatDrive!, Geekworm X1001/X1003, or equivalent PCIe Gen 2/3 HAT+ | Verify M.2 HAT+ compatibility with Pi 5. |
| Storage | 512 GB+ NVMe SSD from the Raspberry Pi Foundation compatibility list | Avoid drives outside the compatibility list — Pi 5 PCIe is selective. |
| Enclosure | Sealed enclosure rated for the install location | Mechanical rooms require dust- and vibration-tolerant housings. |
| Optional | PoE+ HAT | Single-cable power and data; reduces cabling in mechanical rooms. |

**Boot from NVMe.** Configure the Pi to boot directly from the NVMe SSD per the official documentation at <https://www.raspberrypi.com/documentation/computers/raspberry-pi-5.html>. This includes updating the bootloader EEPROM (`sudo rpi-eeprom-update`) and setting `BOOT_ORDER` to prefer NVMe over the SD card slot. Do not run AEMS from an SD card in production — write amplification and historian I/O will exhaust the card.

**Pi-specific caveats:**

- All AEMS images are multi-arch, but **verify** `aarch64` availability for any custom or pinned image tag before relying on it.
- Sustained Docker load on a Pi 5 will thermal-throttle without active cooling.
- USB-attached spinning disks are not supported as a primary storage tier.
- A single Pi 5 is sized for one small-to-medium commercial building; campuses or multi-building deployments require a standard PC.
- For Pi 5 deployments with less than 16 GB RAM, keep `COMPOSE_PROFILES` at the recommended `proxy,sso,redis,volttron,historian` and add a 4 GB swap file (§14.8 has the recipe).

Once the Pi is booting from NVMe and Ubuntu Server 24.04 LTS for arm64 is installed, **the install path is identical to the standard Ubuntu path** — continue with §4.2 from that point on.

## Network Prerequisites

| Port / Protocol | Purpose | Direction |
|-----------------|---------|-----------|
| 80/tcp | HTTP (redirects to HTTPS, ACME challenge) | Inbound from operator network and, if using Let's Encrypt, the internet. |
| 443/tcp | HTTPS — AEMS UI, GraphQL, Keycloak | Inbound from operator network. |
| 47808/udp | BACnet/IP to RTUs and HPs | Internal-only. The BACnet LAN should be a separate VLAN or NIC. |
| 6543/tcp | Historian replication (optional) | Inbound from a known subscriber IP only, when off-site replication is configured. |
| 22/tcp | SSH for administrative access | Inbound from administrator network only. |

A real DNS A record (or, in lab environments, a per-workstation hosts-file entry) must resolve `<HOSTNAME>` to the host's IP address before the first launch.

# Pre-Deployment Planning Checklist

Decide these before touching the host. Each is awkward to change after first boot. The full reference is in [`README.md` § Pre-Deployment Planning](../../../README.md).

| Decision | Your value | Notes |
|----------|------------|-------|
| Hostname (FQDN) | | Real DNS name. **Never `localhost`.** |
| TLS strategy | | Let's Encrypt, third-party CA, or self-signed. |
| `ADMIN_EMAIL` | | Used for Let's Encrypt registration and operator-facing notifications. |
| Campus and building names | | Drives VOLTTRON agent configuration. |
| Thermostat type | | `schneider` or `openstat`. |
| Backup destinations | | Local plus at least one off-host destination for production. |
| Backup-key custodian | | A named individual who holds the offline copy of the age private key. |
| Off-site replication subscriber | | If running an off-site historian replica, the subscriber's IP for `pg_hba.conf` allowlisting. |
| `COMPOSE_PROFILES` overrides | | Default `proxy,sso,redis,volttron,historian` works for most deployments. |

# Host Operating System Install

## OS Decision Tree

<!-- diagram: os_decision -->

**Figure 4.1.** Operating system decision tree.

## Ubuntu Server 24.04 LTS (x86_64) — Recommended for Production

### Download and Write the ISO

1. Download `ubuntu-24.04.x-live-server-amd64.iso` from <https://ubuntu.com/download/server>.
2. Write the ISO to a USB stick:
   - **Linux / macOS:** `sudo dd if=ubuntu-24.04.x-live-server-amd64.iso of=/dev/sdX bs=4M status=progress` — confirm `/dev/sdX` is the USB stick, not your local disk.
   - **From a Windows workstation:** use [balenaEtcher](https://etcher.balena.io/) or [Rufus](https://rufus.ie) to flash the USB. (Windows is supported only as the workstation that writes the ISO and runs the operator browser; the AEMS host itself runs Ubuntu.)

### Install

Boot the target machine from the USB stick and accept the defaults except for:

- **Profile setup:** create a non-root administrator (you will add this user to the `docker` group in §5).
- **SSH setup:** check **Install OpenSSH server**.
- **Featured server snaps:** do not select any. **Do not** install Docker via snap on the installer screen — snap Docker has subtle bind-mount and DNS differences that break the AEMS stack. You will install Docker Engine via the official apt repository in §5.

### Post-Install Housekeeping

After first boot, log in as the administrator and run:

```bash
sudo apt update && sudo apt -y upgrade
sudo hostnamectl set-hostname <your-fqdn>          # e.g. aems.example.com
sudo timedatectl set-timezone <Region/City>         # e.g. America/Los_Angeles
```

Set a static IP or, preferably, configure a DHCP reservation on your network's DHCP server so the host's IP is stable.

Enable unattended security updates **for the OS only** (Docker should be updated deliberately, not automatically):

```bash
sudo apt -y install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Host Firewall

Enable `ufw` and allow only the required ports:

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

If off-site historian replication will be enabled later, also allow 6543/tcp from the subscriber's IP only. Replace `<SUBSCRIBER_IP>` below with the actual address of your replication subscriber host:

```bash
sudo ufw allow from <SUBSCRIBER_IP>/32 to any port 6543 proto tcp
```

## Ubuntu Server 24.04 LTS arm64 (Raspberry Pi 5)

Use Ubuntu Server, not Raspberry Pi OS. Ubuntu Server provides the same apt repositories, the same Docker Engine install path, the same `ufw` firewall workflow, and the same `unattended-upgrades` defaults that §4.2 describes for x86_64 hosts. Keeping the Pi 5 on the same distribution as the production Linux target means one OS to maintain, one set of packages to test against, and a single host-OS chapter in this guide.

### Flash the Image

Use the official Raspberry Pi Imager (<https://www.raspberrypi.com/software/>):

1. Choose device → **Raspberry Pi 5**.
2. Choose OS → **Other general-purpose OS → Ubuntu → Ubuntu Server 24.04 LTS (64-bit)**.
3. Choose storage → your NVMe SSD attached via USB enclosure, or an SD card for the bootloader update step.
4. **Customise OS settings** (the gear icon): enable SSH (key-only recommended), set the administrator username and password, set hostname and timezone, configure Wi-Fi or wired networking.
5. Write and verify.

> **NOTE.** Ubuntu Server 24.04 ships an arm64 image specifically built for the Raspberry Pi 5. Do not select the Raspberry Pi OS entries in the Imager — those bring a different package set, a different kernel, and a `dphys-swapfile` swap mechanism that diverges from the standard Ubuntu workflow used in §4.2.

### Configure Boot-from-NVMe

Follow the procedure at <https://www.raspberrypi.com/documentation/computers/raspberry-pi-5.html>. The bootloader EEPROM update is independent of the Linux distribution installed; the same `rpi-eeprom-update` flow Raspberry Pi publishes for Pi OS applies when running it from an Ubuntu live SD card or from any Pi-supported Linux:

```bash
sudo apt update && sudo apt -y install rpi-eeprom
sudo rpi-eeprom-update -a
sudo reboot
sudo rpi-eeprom-config --edit
# Set BOOT_ORDER=0xf416 (try NVMe before SD)
sudo reboot
```

Verify that `lsblk` shows the NVMe device as `/dev/nvme0n1` and that `findmnt /` shows `/dev/nvme0n1p2` (or similar).

### First-Boot Housekeeping

The post-install steps from §4.2.3 (`apt update`, `hostnamectl`, `timedatectl`, unattended-upgrades) apply unchanged on the Pi.

If your Pi 5 has less than 16 GB of RAM, add a 4 GB swap file using Ubuntu's standard mechanism:

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

From this point on, follow §4.2.4 (host firewall) and then §5 onward — the path is identical to the x86_64 Ubuntu install.

## A Note on Windows Hosts

> **NOTE.** Windows is **not supported** as an AEMS host platform. The VOLTTRON edge agent and the BACnet/IP driver depend on Linux networking primitives (raw UDP socket binding to a host interface for 47808 broadcasts, `network_mode: host` containers, BBMD compatibility) that are not reliably available through Docker Desktop's WSL2 networking. The AEMS host must run Ubuntu Server on x86_64 or on Raspberry Pi 5 (arm64). A Windows machine can serve as the operator workstation that writes the install media and accesses the running UI from a browser.

# Install Docker Engine and Compose

## Ubuntu (x86_64 and arm64)

Install Docker Engine from Docker's official apt repository (not from distribution packages, not via snap). The same procedure works on x86_64 servers and on the Pi 5 running Ubuntu arm64:

```bash
sudo apt update
sudo apt -y install ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list
sudo apt update
sudo apt -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Verify:

```bash
sudo docker run --rm hello-world
docker compose version              # must be v2.x
```

Add the administrator user to the `docker` group so `docker` and `docker compose` can run without `sudo`:

```bash
sudo usermod -aG docker $USER
exit                                  # log out and back in to refresh group membership
docker ps                             # should succeed without sudo
```

## Optional Tools

If you anticipate needing to perform a break-glass backup restore from the command line, install `age` and `gpg` now. They are not required for the running stack:

```bash
sudo apt -y install age gnupg
```

# DNS and TLS

## Decision Tree

<!-- diagram: tls_decision -->

**Figure 6.1.** TLS strategy decision tree.

## DNS Setup

### Public Deployment

Register a DNS A record that points your chosen FQDN at the host's public IP. Verify:

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

## Let's Encrypt

The easiest path for public deployments. In [`aems-app/.env`](../../../aems-app/.env), set:

```ini
HOSTNAME=aems.example.com
ADMIN_EMAIL=admin@example.com
CERT_RESOLVER=letsencrypt
```

Ensure ports 80/tcp and 443/tcp are reachable from the public internet — Let's Encrypt validates via an HTTP challenge on port 80 and an in-band TLS challenge on port 443. Do not place an upstream reverse proxy in front of the AEMS host that terminates TLS itself; the Traefik proxy in the stack handles termination directly.

If you hit Let's Encrypt's production rate limit while debugging, temporarily set `CERT_RESOLVER=letsencrypt-staging` (see Traefik docs) and re-run `./start-services.sh`.

## Third-Party Certificate

If your organization issues TLS certificates from an internal CA, drop the cert and key into [`aems-app/docker/proxy/`](../../../aems-app/docker/proxy) and edit [`aems-app/docker/proxy/certs-traefik.yml`](../../../aems-app/docker/proxy/certs-traefik.yml) to point the `tls.certificates` list at the new filenames. Leave `CERT_RESOLVER=` empty in `.env` so Traefik uses the static config and does not attempt ACME.

## Self-Signed (Default)

If `CERT_RESOLVER` is empty and no third-party cert is configured, the `certs` initialization container generates a self-signed CA and a host certificate on first boot, writing them to the `certs-data` Docker volume. Operator browsers will see a "Not secure" warning until you import the CA certificate into the browser's trust store.

To extract the CA certificate from the volume:

```bash
docker compose cp certs:/data/mkcert-ca.crt ./aems-ca.crt
```

Distribute `aems-ca.crt` to each operator workstation and import it as a trusted root authority.

## Hostname Change After First Boot

If you change `HOSTNAME` in `.env` after the stack has booted at least once, the generated certificates and the Keycloak realm both still reference the old name. Reset the affected services from `aems-app/`:

```bash
./reset-service.sh certs                # regenerate certs for the new hostname
```

If Keycloak login fails after a hostname change, also reset `keycloak-db` (this wipes Keycloak state and re-imports `default-realm.json`).

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
| `HOSTNAME` | Your FQDN (matches §6 DNS). |
| `ADMIN_EMAIL` | Your administrator email (also used for Let's Encrypt registration). |
| `CERT_RESOLVER` | `letsencrypt`, or leave empty for self-signed / third-party. |
| `COMPOSE_PROFILES` | Leave at the default `proxy,sso,redis,volttron,historian` unless you have a reason to deviate. |

If your network requires a forward proxy to reach the internet, also set:

```ini
HTTP_PROXY=http://proxy.example.com:3128
HTTPS_PROXY=http://proxy.example.com:3128
NO_PROXY=*.example.com,127.0.0.1
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

Wait for `init` to reach `Exited (0)`, for `certs` to reach `Exited (0)`, and for `keycloak` and `server` to enter the `running` state with healthy log output.

## Health Check

```bash
curl -k -o /dev/null -s --max-time 10 -w "%{http_code}" https://<HOSTNAME>
```

`200` is the healthy result. `503` typically means a downstream service is still booting; wait a minute and try again.

## Open the UI

Open `https://<HOSTNAME>` in a browser. You should see the AEMS landing page with a **Guest** menu in the top-right corner.

**Figure 8.1.** Expected first-launch landing page, with the Guest dropdown in the top-right.

## Common First-Launch Problems

If the UI does not load, cross-reference §14 (Troubleshooting):

- Hostname does not resolve → §14.2.
- "Port already in use" on 80 or 443 → §14.2.
- Let's Encrypt rate-limit error in `proxy` logs → §14.6.
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

**Figures 9.1–9.5.** Guest menu → Keycloak Register link → registration form → post-login UI before role grant → post-login UI after role grant.

## Configure Backups

Backups are mandatory for any production deployment. The full backup pipeline is documented in [`aems-app/docker/backup/README.md`](../../../aems-app/docker/backup/README.md).

Every archive is **encrypted before it leaves the host** — no plaintext archive is ever uploaded to a destination. The backup sidecar uses asymmetric encryption via `age` (preferred), falling back to symmetric `gpg` when an `age` key is unavailable. On first boot the sidecar generates an `age` keypair: the **public key** encrypts each archive automatically at backup time, and the matching **private key** is what [`backup-restore.sh`](../../../aems-app/backup-restore.sh) needs to decrypt one. Operators never paste keys into config files — the sidecar holds the live keypair and the **Keys** tab in the admin UI surfaces a one-click download of the active private key. Step 4 below is the only place that copy gets created; without it, a total host loss leaves every archive permanently unreadable, regardless of how many off-host copies you kept.

1. Open `https://<HOSTNAME>/backups` (administrator UI).
2. In the **Policy** tab, set the cron schedule (e.g. `0 2 * * *` for 02:00 nightly) and retention in days. Review the default policy that ships in [`aems-app/docker/seed/20260427080000-backup-policy.json`](../../../aems-app/docker/seed/).
3. In the **Destinations** tab, add at least one off-host destination. For production, an S3 bucket in a separate AWS account is strongly recommended.
4. In the **Keys** tab, click **Download active private key** and store the file offline. Possibilities include: a sealed envelope in a fireproof safe, a corporate KMS, or a password manager with a hardware-key second factor.

   > **WARNING.** **You cannot decrypt backup archives without the active age private key.** If you rotate keys, keep an offline copy of every key that was active at the time of any archive you might need to restore. The single largest cause of unrestorable backups is a lost key.

5. In the **Runs** tab, click **Trigger manual run**. Wait for the run to reach **Succeeded** and verify the archive lands in the destination.

**Figures 9.7–9.9.** Backups admin UI — Policy tab, Keys tab with the download button highlighted, Runs tab with a successful manual run.

## Site Customization Defaults

A light touch only — full configuration is in the Installer Guide.

- Campus and building names live in seed data and can be overridden in [`aems-app/server/config/site.json`](../../../aems-app/server/config/).
- VOLTTRON-topic to historian-column mapping lives in [`aems-app/docker/historian/historian-topic-map.json`](../../../aems-app/docker/historian/). Edit this file to match your site's BACnet topic naming, then reload:

  ```bash
  docker compose restart historian server
  ```

# Historian and VOLTTRON Configuration

This chapter covers the host-side configuration files an administrator edits before the on-site BACnet wiring described in the Installer Guide. The reload command for each file appears alongside the description; live-mounted files pick up edits on a service restart, while files baked into the historian image require a rebuild.

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

### Full reference

The complete schema — every supported `aggregation`, `transform`, and `format` value, with the SQL each one emits and guidance on which to pick for which kind of signal — is in [historian-topic-map.json.txt](../../../aems-app/docker/historian/historian-topic-map.json.txt), kept alongside the JSON file. A longer markdown walkthrough with additional worked examples lives at [aems-app/README.md § Historian Topic Mapping](../../../aems-app/README.md).

## BACnet Driver — Host Interface

The Docker-side [bacnet.config](../../../aems-app/docker/volttron/setup/configs/bacnet.config) sets `local_interface` to the IP/CIDR of the host NIC that lives on the BACnet LAN. The default `172.31.32.1/24` is PNNL's lab network and must be changed to your site's address.

The canonical edit point is `VOLTTRON_GATEWAY_ADDRESS` (and the related `VOLTTRON_BACNET_ADDRESS`) in [`aems-app/.env`](../../../aems-app/.env), which template-fills `bacnet.config` and `bacnet_proxy.config` at container startup. Edit `.env`; do not edit the rendered files directly or they will be overwritten on the next rebuild.

For BACnet network design and device-ID conventions on the BACnet LAN itself, see the *AEMS Building Installer Configuration User Guide*.

> **WARNING.** An incorrect `local_interface` is the most common cause of "no points in the historian" at first boot. Verify with `ip -4 addr show` on the host that the chosen interface actually exists on the BACnet-side VLAN before starting the stack. See §14.5 for full troubleshooting.

## Weather Agent — Station Code

The weather station is set by `VOLTTRON_WEATHER_STATION` in [`aems-app/.env`](../../../aems-app/.env), which template-fills [weather.config](../../../aems-app/docker/volttron/setup/configs/weather.config) at container startup. Edit `.env` rather than the rendered file. For the station-selection procedure and weather-agent setup, see the *AEMS Building Installer Configuration User Guide* section on weather-agent configuration.

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

1. **Manual periodic prune.** In a maintenance window, connect to the historian and delete old rows:

   ```bash
   docker compose exec historian psql -U historian -d historian -c \
     "DELETE FROM data WHERE ts < NOW() - INTERVAL '90 days';"
   docker compose exec historian psql -U historian -d historian -c "VACUUM FULL data;"
   ```

   `VACUUM FULL` rewrites the table and reclaims disk; it requires an exclusive lock, so run it during low-traffic hours.

2. **Vertical scale.** Provision a larger NVMe SSD on the AEMS host and migrate the `historian-data` volume to it. See §12.6 (Disk-Space Monitoring) for the inspection commands.

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

`pg_hba.conf` is baked into the historian image, so apply the edit and rebuild with `./start-services.sh`. Also expose the replication port (default `6543/tcp`) on the host firewall to the subscriber IP only, per §4.2.4.

### Subscriber Side (Remote Host)

The subscriber host runs [setup-subscriber.sh](../../../aems-app/docker/historian/setup-subscriber.sh) against its own historian instance. The script reads `TEST_HISTORIAN_HOST`, `TEST_HISTORIAN_PORT`, `TEST_HISTORIAN_USER`, and `TEST_HISTORIAN_PASSWORD` from its environment and creates a uniquely-named subscription tied to its operating-system username, so multiple developers can subscribe to the same publisher without slot collisions.

The end-to-end procedure — including how to provision the subscriber host, what credentials to set, how to monitor replication lag, and how to remove a subscriber when retiring it — is documented at `https://<HOSTNAME>/historian` on the running deployment and in the [aems-app/README.md § Historian Database Replication](../../../aems-app/README.md) reference. This guide does not restate it.

### Break-Glass: Resetting Wedged Replication

If replication gets stuck after a schema change or after manually deleting historian rows, [fix-replication.sql](../../../aems-app/docker/historian/fix-replication.sql) drops and recreates the publication. Use it only on operator direction; running it interrupts every active subscriber.

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

The recommended `COMPOSE_PROFILES` value in [`aems-app/.env`](../../../aems-app/.env) for a typical production deployment is:

```
proxy,sso,redis,volttron,historian
```

> **NOTE.** A `grafana` profile is also defined in the compose project but is **deprecated** and is not enabled in the recommended profile set. Built-in monitoring dashboards in the AEMS web UI have superseded it.

For the authoritative, in-repo table of every profile with its service composition, see [`aems-app/docker/README.md`](../../../aems-app/docker/README.md).

## Where Configuration Lives

[`aems-app/README.md`](../../../aems-app/README.md) contains the authoritative table of every configuration file in the deployment with a one-line description of what it controls. Refer to it rather than duplicating the table here.

# Routine Maintenance

## Cadence Checklist

| Cadence | Task |
|---------|------|
| Daily | Confirm last night's backup ran (UI → Backups → Runs). |
| Daily | Check `docker compose ps` for unhealthy services. |
| Weekly | Review historian disk usage; prune if approaching the volume limit. |
| Weekly | Review Keycloak login logs for brute-force patterns. |
| Monthly | Apply OS security updates. Restart the host during a planned window. |
| Monthly | Validate a backup restore on a non-production environment. |
| Annually | Review the hardening checklist in §13. |

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

This checklist mirrors the in-repo hardening list in [`README.md`](../../../README.md) with deployment-specific additions. Walk it before declaring the deployment production-ready.

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
- [ ] [`aems-app/docker/historian/pg_hba.conf`](../../../aems-app/docker/historian/pg_hba.conf) restricts replication subscriber by IP (if off-site replication is configured).
- [ ] Time synchronization is enabled via NTP. BACnet schedules and ILC events depend on accurate time.

# Troubleshooting (Deployment Phase)

For BACnet, VOLTTRON, and runtime-UI troubleshooting, see the Installer Guide and the Owner Guide respectively.

## 13.1 Browser Shows "Not Secure" / Certificate Warning

**Symptoms.** Browser displays a certificate warning when visiting `https://<HOSTNAME>`.

**Causes and fixes.**

- Using self-signed mode and the CA has not been imported on the operator's browser. Extract the CA per §6.5 and import it as a trusted root.
- Hostname mismatch — the certificate's CN/SAN does not match the URL you are visiting. Confirm `HOSTNAME` in `.env` matches the URL exactly. Reset certs with `./reset-service.sh certs` after a hostname change.

## 13.2 Site Unreachable

**Symptoms.** Browser shows "This site can't be reached" or connection refused.

**Causes and fixes.**

- DNS not resolving — `dig +short <HOSTNAME>` returns nothing. Fix DNS or add a hosts-file entry.
- Host firewall blocking 443. Check `sudo ufw status`.
- Docker not running — `sudo systemctl status docker`.
- Profile misconfigured — `docker compose ps` shows the `proxy` service missing. Verify `COMPOSE_PROFILES` includes `proxy`.
- Port 443 already in use by another process — `sudo ss -tlnp | grep ':443 '`.

## 13.3 Login Loop or Keycloak 500 Error

**Symptoms.** Repeated redirects between the AEMS UI and Keycloak, or an Internal Server Error from `/auth/sso/`.

**Cause.** `HOSTNAME` was changed after first boot, so the Keycloak realm's redirect URIs no longer match.

**Fix.**

```bash
./reset-service.sh certs
./reset-service.sh keycloak-db
```

This regenerates certs and re-imports the realm with the new hostname.

## 13.4 `start-services.sh` Fails with Compose v1 Errors

**Symptom.** Errors mentioning `unsupported keyword 'include'` or `version: '3'` warnings.

**Cause.** Docker Compose v1 is installed; the project requires v2 with `include:` support.

**Fix.** `docker compose version` should report v2.x. If it reports v1 or "command not found," install the official Docker Engine + Compose v2 per §5.

## 13.5 VOLTTRON Cannot Reach RTUs

**Symptoms.** VOLTTRON logs show BACnet discovery timeouts; no points in the historian.

**Causes and fixes.**

- 47808/udp blocked by host firewall or network firewall. Verify reachability with `nc -u <RTU_IP> 47808` or a BACnet discovery tool.
- VOLTTRON container not on the host network. Verify in [`aems-app/docker/docker-compose.yml`](../../../aems-app/docker/docker-compose.yml) that the `volttron` service uses `network_mode: host`.
- `VOLTTRON_GATEWAY_ADDRESS` in `.env` does not match the host's BACnet-side NIC IP.

Detailed BACnet troubleshooting — including device-discovery procedures and Schneider SE8650 configuration — is in the Installer Guide.

## 13.6 Let's Encrypt "Too Many Failed Validations"

**Symptoms.** `proxy` (Traefik) logs show ACME challenge failures and a rate-limit error.

**Causes and fixes.**

- DNS has not propagated yet. Wait, then retry.
- Port 80/tcp is not reachable from the public internet. Verify with `curl -I http://<HOSTNAME>` from an external network.
- An upstream reverse proxy is terminating TLS before the AEMS host. Either move TLS termination to AEMS or pre-stage a third-party cert (§6.4).
- During debugging, switch to the staging resolver to avoid burning production rate limit. Edit [`aems-app/docker/proxy/`](../../../aems-app/docker/proxy/) Traefik static config to add a `letsencrypt-staging` resolver, set `CERT_RESOLVER=letsencrypt-staging`, retry. Once green, switch back.

## 13.7 `update-user-role.sh` Reports "User Not Found"

**Cause.** The application database has no row for that email because the user has never signed into the UI. The role-grant script looks up users in the AEMS database, not in Keycloak directly.

**Fix.** Have the user complete the Guest → Login → Register flow at least once (§9.1, step 1–5), then re-run the role grant.

## 13.8 Raspberry Pi 5 Thermal Throttling or Out-of-Memory

**Symptoms.** `vcgencmd measure_temp` shows >80 °C under load; containers killed with OOM messages in `dmesg`.

**Fixes.**

- Confirm the active cooler is installed and operating.
- Confirm the 27 W official PSU is in use; under-rated supplies cause CPU throttling that looks like thermal throttling.
- For 8 GB Pi 5: keep `COMPOSE_PROFILES` at the recommended `proxy,sso,redis,volttron,historian`.
- Add a 4 GB swap file per the Ubuntu housekeeping in §4.3.3.

## 13.9 Backup Admin UI Shows "No Active Key"

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

# Appendix A — Helper Script Reference

All scripts live at the root of `aems-app/` and must be run from there. Full purpose-and-flags reference is in [`README.md` § Managing the Stack](../../../README.md).

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

For Pi 5 with < 16 GB RAM, keep `COMPOSE_PROFILES` at the recommended value above.

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
