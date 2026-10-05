#
# Sync the current historian.config into the running VOLTTRON platform so
# the SQLHistorian agent's DB connection matches HISTORIAN_DATABASE_PASSWORD.
#
# See sync-volttron-historian-config.sh for the rationale. This is the
# Windows/PowerShell twin.
#
# Exit codes:
#   0 - success (either synced, already in sync, or volttron not running)
#   1 - could not read the on-disk historian.config
#   2 - volttron VIP did not come up within the timeout
#   3 - could not locate the historian agent's install-time config
#   4 - config write or agent restart failed

# This helper wraps many `docker exec … vctl` / Python calls whose
# non-zero exit and stderr writes are EXPECTED during the VIP-ready
# loop and while SQLHistorian's install-time config is being probed.
# PS 5.1 with $ErrorActionPreference=Stop turns those into ErrorRecords
# and throws past our explicit `if ($LASTEXITCODE -ne 0)` checks. Use
# Continue and rely on explicit exit-code handling.
$ErrorActionPreference = "Continue"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent $ScriptDir
$EnvFile   = Join-Path $RepoRoot ".env"
$HistorianConfigHost = Join-Path $RepoRoot "docker/volttron/setup/configs/historian.config"
# Up to 300s: after a fresh volttron start, setup-platform.py takes a few
# minutes to install all agents before SQLHistorian shows up.
$VctlTimeoutSeconds  = 300

function Write-Info { param($msg) Write-Host "  ->  $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "  v   $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  !   $msg" -ForegroundColor Yellow }
function Write-Err  { param($msg) Write-Host "  x   $msg" -ForegroundColor Red }

# ── resolve project name ───────────────────────────────────────────────────────
# The shell outranks .env, as it does for compose itself.
$Project = $env:COMPOSE_PROJECT_NAME
if (-not $Project -and (Test-Path $EnvFile)) {
    $line = Get-Content $EnvFile | Where-Object { $_ -notmatch '^\s*#' -and $_ -match '^COMPOSE_PROJECT_NAME=' } | Select-Object -First 1
    if ($line) { $Project = ($line -split '=', 2)[1].Trim().Trim("'", '"') }
}
if (-not $Project) { $Project = "skeleton" }
$VolttronContainer = "$Project-volttron"

# ── pre-flight ─────────────────────────────────────────────────────────────────
if (-not (Test-Path $HistorianConfigHost)) {
    Write-Err "historian.config not found at $HistorianConfigHost"
    Write-Err "Run volttron-setup (docker compose up -d volttron-setup) first."
    exit 1
}

$runningNames = docker ps --format '{{.Names}}' 2>$null
if (-not ($runningNames -contains $VolttronContainer)) {
    Write-Info "$VolttronContainer is not running - nothing to reconcile."
    exit 0
}

function Invoke-Vctl {
    param([string]$Args)
    docker exec -u volttron $VolttronContainer bash -lc "export PATH=/home/volttron/.local/bin:`$PATH; vctl $Args" *> $null
}

# `docker exec` returns $null (not "") when stdout is empty on PS 5.1,
# and $null.Trim() throws. Wrap all captures in this helper.
function SafeTrim([object]$val) {
    if ($null -eq $val) { return '' }
    return ($val -join "`n").Trim()
}

# Wrap the whole runtime in try/catch. This helper is a best-effort
# reconciler; if the volttron platform isn't ready or vctl misbehaves,
# it should warn and exit cleanly (never bubble up and abort the deploy).
try {
    # ── wait for VIP + SQLHistorian to be installed ────────────────────────
    # After a fresh volttron start, setup-platform.py sequentially installs
    # agents (a few minutes) before SQLHistorian appears.
    Write-Info "Waiting up to $VctlTimeoutSeconds s for volttron VIP + SQLHistorian install..."
    $elapsed = 0
    $HistorianPid = ''
    while ($elapsed -lt $VctlTimeoutSeconds) {
        Invoke-Vctl "status" | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $out = docker exec -u volttron $VolttronContainer bash -c 'pgrep -f "sqlhistorian\.historian" | head -1' 2> $null
            $HistorianPid = SafeTrim $out
            if ($HistorianPid) { break }
        }
        Start-Sleep -Seconds 3
        $elapsed += 3
    }
    if (-not $HistorianPid) {
        Write-Warn "volttron VIP or SQLHistorian did not become ready within $VctlTimeoutSeconds s - skipping sync."
        Write-Warn "Re-run this helper (or ./secrets.ps1) once the platform finishes booting."
        exit 0
    }

    $envOut = docker exec -u volttron $VolttronContainer sh -c "cat /proc/$HistorianPid/environ | tr '\0' '\n' | sed -n 's/^AGENT_CONFIG=//p' | head -1" 2> $null
    $AgentConfigPath = SafeTrim $envOut
    if (-not $AgentConfigPath) {
        Write-Warn "Could not resolve AGENT_CONFIG env var for pid $HistorianPid - skipping sync."
        exit 0
    }

    # ── compare installed vs on-disk ───────────────────────────────────────
    $installedOut  = docker exec -u volttron $VolttronContainer sh -c "cat '$AgentConfigPath'" 2> $null
    $InstalledJson = SafeTrim $installedOut
    $DesiredJson   = (Get-Content -Raw $HistorianConfigHost)

    $InstalledNorm = ($InstalledJson -replace '\s+', '')
    $DesiredNorm   = ($DesiredJson   -replace '\s+', '')

    $configInSync = ($InstalledNorm.Length -gt 0 -and $InstalledNorm -eq $DesiredNorm)

    $statusOut = Invoke-Vctl "status"
    $Health = ($statusOut | Select-String 'platform\.historian ' | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -First 1)

    if ($configInSync -and $Health -eq 'GOOD') {
        Write-Ok "SQLHistorian install-time config already in sync and health is GOOD - nothing to do."
        exit 0
    }

    # ── overwrite the install-time config ──────────────────────────────────
    if (-not $configInSync) {
        Write-Info "Overwriting SQLHistorian install-time config at $AgentConfigPath"
        $DesiredJson | docker exec -i -u volttron $VolttronContainer sh -c "cat > '$AgentConfigPath'" 2> $null
        if ($LASTEXITCODE -ne 0) {
            Write-Warn "Failed to write $AgentConfigPath - skipping sync."
            exit 0
        }
        Write-Ok "Install-time config updated."
    } else {
        Write-Info "Install-time config already in sync; agent health is $Health - restarting to recover."
    }

    # ── restart the agent so it re-reads config and re-runs historian_setup()
    Write-Info "Restarting platform.historian..."
    Invoke-Vctl "restart --tag historian" | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "vctl restart --tag historian failed - fall back to: docker compose up -d --force-recreate volttron"
        exit 0
    }

    Write-Ok "platform.historian restarted. Give it ~30s to re-run setup."
} catch {
    Write-Warn "sync-volttron-historian-config encountered an error: $($_.Exception.Message)"
    Write-Warn "Skipping SQLHistorian install-time config sync. Re-run manually if dashboards stay empty."
    exit 0
}
