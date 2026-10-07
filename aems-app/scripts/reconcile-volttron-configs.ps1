#
# Make VOLTTRON's config store and every agent's install-time config match what volttron-setup
# rendered, then mark every unit and control for a push so the app's own values win.
#
# See reconcile-volttron-configs.sh for the rationale. This is the Windows/PowerShell twin.
#
# Usage: reconcile-volttron-configs.ps1 [-Timeout SECONDS]   (waits that long for VOLTTRON; default 300)
#
# Exit codes:
#   0 - reconciled, or VOLTTRON is not running
#   1 - an agent's config could not be reconciled (the re-push is still asked for)
#   2 - VOLTTRON did not answer within the timeout
param([int]$Timeout = 300)

# vctl's refusals while VOLTTRON boots are expected non-zero exits, not errors to throw on.
$ErrorActionPreference = "Continue"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent $ScriptDir
$EnvFile   = Join-Path $RepoRoot ".env"

function Write-Info { param($msg) Write-Host "  ->  $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "  v   $msg" -ForegroundColor Green }
function Write-Err  { param($msg) Write-Host "  x   $msg" -ForegroundColor Red }

# The shell outranks .env, as it does for compose itself.
$Project = $env:COMPOSE_PROJECT_NAME
if (-not $Project -and (Test-Path $EnvFile)) {
    $line = Get-Content $EnvFile | Where-Object { $_ -notmatch '^\s*#' -and $_ -match '^COMPOSE_PROJECT_NAME=' } | Select-Object -First 1
    if ($line) { $Project = ($line -split '=', 2)[1].Trim().Trim("'", '"') }
}
if (-not $Project) { $Project = "skeleton" }
$Volttron = "$Project-volttron"
$Database = "$Project-database"
$running  = @(docker ps --format '{{.Names}}' 2>$null)

if (-not ($running -contains $Volttron)) {
    Write-Info "$Volttron is not running - no VOLTTRON configs to reconcile."
    exit 0
}

Write-Info "Waiting up to ${Timeout}s for VOLTTRON to answer..."
$elapsed = 0
while ($true) {
    docker exec -u volttron $Volttron bash -lc 'export PATH=/home/volttron/.local/bin:$PATH; vctl status' 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { break }
    if ($elapsed -ge $Timeout) {
        Write-Err "VOLTTRON did not answer within ${Timeout}s - its configs were not reconciled."
        exit 2
    }
    Start-Sleep -Seconds 3
    $elapsed += 3
}

$status = 0
# Piped as text: PowerShell 5.1 has no byte stdin redirection, and the script is ASCII.
Get-Content -Raw (Join-Path $ScriptDir "reconcile-volttron-configs.py") |
    docker exec -i -u volttron $Volttron bash -lc 'export PATH=/home/volttron/.local/bin:$PATH; python3 -'
if ($LASTEXITCODE -eq 0) {
    Write-Ok "VOLTTRON holds the rendered configs for every agent."
} else {
    Write-Err "Some VOLTTRON configs could not be reconciled (above)."
    $status = 1
}

# The app's own values -- setpoints, schedules, holidays, ILC -- go out again over whatever was reset.
if ($running -contains $Database) {
    $dbEnv = @(docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' $Database 2>$null) | ForEach-Object { "$_".Trim() }
    $dbUser = ($dbEnv | Where-Object { $_ -like 'POSTGRES_USER=*' } | Select-Object -First 1)
    $dbUser = if ($dbUser) { $dbUser.Substring('POSTGRES_USER='.Length) } else { 'postgres' }
    $dbName = ($dbEnv | Where-Object { $_ -like 'POSTGRES_DB=*' } | Select-Object -First 1)
    $dbName = if ($dbName) { $dbName.Substring('POSTGRES_DB='.Length) } else { $dbUser }
    $mark = "SET stage = 'Update', message = 'Repushing after VOLTTRON configs were reconciled', `"updatedAt`" = now()"
    # On stdin: PowerShell 5.1 strips the double quotes "Unit" needs from a native argument.
    "UPDATE `"Unit`" $mark; UPDATE `"Control`" $mark;" | docker exec -i $Database psql -U $dbUser -d $dbName -v ON_ERROR_STOP=1 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Every unit and control is marked for a push."
    } else {
        Write-Err "Could not mark units and controls for a push."
        $status = 1
    }
} else {
    Write-Info "$Database is not running - no units or controls to re-push."
}

exit $status
