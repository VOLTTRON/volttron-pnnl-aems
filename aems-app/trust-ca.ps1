#
# Install the mkcert CA from the running proxy container into the Windows
# certificate trust store so that https://<APP_HOSTNAME> works without
# warnings in Edge, Chrome, and other system-trust browsers.
#
# Run once after the first `docker compose up -d`, and again any time the
# certs-data volume is recreated (e.g. after `docker compose down -v`).
#
# Usage:
#   .\trust-ca.ps1            # auto-detect proxy container from .env
#   .\trust-ca.ps1 -DryRun    # print what would be done without executing
#
# Must be run from the repo root. Requires an elevated (Administrator)
# PowerShell session to write to the LocalMachine certificate store.

param(
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$ENV_FILE      = ".env"
$CA_CERT_PATH  = "/etc/certs/mkcert-ca.crt"
$TMP_CA        = Join-Path $env:TEMP "mkcert-skeleton-ca.crt"

# ── color helpers ──────────────────────────────────────────────────────────────
function Write-Info { param($msg) Write-Host "  ->  $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "  v   $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  !   $msg" -ForegroundColor Yellow }
function Write-Err  { param($msg) Write-Host "  x   $msg" -ForegroundColor Red }
function Write-Dry  { param($msg) Write-Host "  [dry-run] $msg" -ForegroundColor Yellow }

function Invoke-OrDry {
    param([scriptblock]$Action, [string]$Description)
    if ($DryRun) { Write-Dry $Description }
    else         { & $Action }
}

# ── helpers ────────────────────────────────────────────────────────────────────
function Get-EnvValue {
    param([string]$File, [string]$Key)
    $line = Get-Content $File -ErrorAction SilentlyContinue |
        Where-Object { $_ -notmatch '^\s*#' -and $_ -match "^${Key}=" } |
        Select-Object -First 1
    if ($line) { ($line -split '=', 2)[1].Trim() } else { '' }
}

# ── pre-flight ─────────────────────────────────────────────────────────────────
if (-not (Test-Path $ENV_FILE)) {
    Write-Err "$ENV_FILE not found - run from the repo root."
    exit 1
}

$project        = Get-EnvValue -File $ENV_FILE -Key "COMPOSE_PROJECT_NAME"
if (-not $project) { $project = "skeleton" }
$proxyContainer = "$project-proxy"
$appHostname    = Get-EnvValue -File $ENV_FILE -Key "APP_HOSTNAME"

$dryLabel = if ($DryRun) { " (dry-run)" } else { "" }
Write-Host "`nInstall mkcert CA${dryLabel}`n" -ForegroundColor White

# ── elevation check ────────────────────────────────────────────────────────────
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
    ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin -and -not $DryRun) {
    Write-Err "This script must be run from an elevated (Administrator) PowerShell."
    Write-Host ""
    Write-Host "  Right-click PowerShell and choose 'Run as administrator', then re-run:"
    Write-Host "    .\trust-ca.ps1"
    Write-Host ""
    exit 1
}

# ── check proxy container is running ──────────────────────────────────────────
Write-Info "Looking for container: $proxyContainer"
$running = docker ps --format '{{.Names}}' 2>$null
if ($running -notcontains $proxyContainer) {
    Write-Err "Container $proxyContainer is not running."
    Write-Host ""
    Write-Host "  Start the stack first:"
    Write-Host "    docker compose up -d"
    Write-Host ""
    exit 1
}
Write-Ok "Container running"

# ── copy CA cert from container ───────────────────────────────────────────────
Write-Info "Copying CA from ${proxyContainer}:${CA_CERT_PATH}"
Invoke-OrDry -Description "docker cp ${proxyContainer}:${CA_CERT_PATH} $TMP_CA" -Action {
    docker cp "${proxyContainer}:${CA_CERT_PATH}" $TMP_CA
}
Write-Ok "CA cert extracted to $TMP_CA"

# ── install into Windows trust store ──────────────────────────────────────────
Write-Info "Installing into Windows Trusted Root Certification Authorities"
Invoke-OrDry -Description "Import-Certificate -FilePath $TMP_CA -CertStoreLocation Cert:\LocalMachine\Root" -Action {
    $cert = Import-Certificate -FilePath $TMP_CA -CertStoreLocation Cert:\LocalMachine\Root
    Write-Ok "Installed: $($cert.Subject) [thumbprint: $($cert.Thumbprint.Substring(0,16))...]"
}

Write-Host ""
Write-Host "  Restart Edge and Chrome to pick up the new CA." -ForegroundColor Cyan
Write-Host "  Firefox: import manually via Settings -> Privacy -> Certificates -> View Certificates -> Authorities." -ForegroundColor Cyan
Write-Host ""

if ($appHostname) {
    Write-Ok "Done - https://$appHostname should now be trusted."
} else {
    Write-Ok "Done."
}
Write-Host ""
