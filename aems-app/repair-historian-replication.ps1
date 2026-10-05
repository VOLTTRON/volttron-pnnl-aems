# repair-historian-replication.ps1
# Repair historian PostgreSQL logical-replication configuration in-place.
# Run from aems-app directory: .\repair-historian-replication.ps1
#
# Fixes deployments where either:
#   * historian_pub was created FOR ALL TABLES and has picked up stray schemas
#     (e.g. migration_stage from migrate-historian-data.sh), which breaks
#     subscriber initial-sync with "schema does not exist" errors;
#   * historian_pub exists but covers zero tables (or is missing entirely).
#
# Idempotent — safe to run against a deployment that is already correctly
# configured.

function Show-Help {
    Write-Host "Usage: repair-historian-replication.ps1 [-n|--dry-run] [-y|--yes] [-h|--help]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Repair historian logical-replication configuration on the publisher."
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -n, --dry-run    Report current state and planned actions without writing"
    Write-Host "  -y, --yes        Skip the interactive confirmation prompt"
    Write-Host "  -h, --help       Show this help message"
    Write-Host ""
    Write-Host "This script must be run against a running historian container."
    Write-Host "Downstream subscribers will need to drop and recreate their subscriptions"
    Write-Host "after a repair that rebuilds the publication."
    exit 0
}

if ($args -contains "-h" -or $args -contains "--help") {
    Show-Help
}

$DryRun = $false
$Force = $false

foreach ($arg in $args) {
    if ($arg -eq "-n" -or $arg -eq "--dry-run") { $DryRun = $true }
    elseif ($arg -eq "-y" -or $arg -eq "--yes") { $Force = $true }
    elseif ($arg -eq "-h" -or $arg -eq "--help") { Show-Help }
    else {
        Write-Host "Error: Unknown option: $arg" -ForegroundColor Red
        Write-Host "Use -h or --help for usage information"
        exit 1
    }
}

# .env read into a table, never the environment: run from a prompt, this script shares the
# session's process, and anything set there would outrank .env for every later compose.
# secrets.ps1/secrets.sh write values as '...'.
$DotEnv = @{}
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
            $v = $matches[2].Trim()
            if ($v.Length -ge 2 -and (($v[0] -eq "'" -and $v[-1] -eq "'") -or ($v[0] -eq '"' -and $v[-1] -eq '"'))) {
                $v = $v.Substring(1, $v.Length - 2)
            }
            $DotEnv[$matches[1]] = $v
        }
    }
}
function Get-Setting([string]$name) {
    if ($DotEnv[$name]) { return $DotEnv[$name] }
    return [Environment]::GetEnvironmentVariable($name)
}

$ProjectName = Get-Setting "COMPOSE_PROJECT_NAME"
if (-not $ProjectName) { $ProjectName = "aems-app" }
$TargetContainer = $env:TARGET_CONTAINER
if (-not $TargetContainer) { $TargetContainer = "$ProjectName-historian" }

Write-Host "Historian replication repair" -ForegroundColor Blue
Write-Host "Target container: $TargetContainer" -ForegroundColor Cyan
if ($DryRun) {
    Write-Host "[DRY RUN - no writes]" -ForegroundColor Yellow
}

# Verify container is running
$running = docker ps --format '{{.Names}}' 2>$null
if (-not ($running -contains $TargetContainer)) {
    Write-Host "Error: container '$TargetContainer' is not running." -ForegroundColor Red
    Write-Host "Bring the stack up first, e.g. from the repo root: docker compose --profile historian up -d" -ForegroundColor Yellow
    exit 1
}

if (-not $DryRun -and -not $Force) {
    Write-Host ""
    Write-Host "This may DROP and recreate the historian_pub publication." -ForegroundColor Yellow
    Write-Host "Any downstream subscribers will need to drop and recreate their subscriptions after this runs." -ForegroundColor Yellow
    $confirmation = Read-Host "Continue? (yes/no)"
    if ($confirmation -ne "yes") {
        Write-Host "Cancelled by user" -ForegroundColor Yellow
        exit 0
    }
}

# Verify the baked-in script exists
$check = docker exec $TargetContainer test -x /usr/local/bin/repair-replication.sh 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: /usr/local/bin/repair-replication.sh is not present in the historian container." -ForegroundColor Red
    Write-Host "Rebuild the historian image so it picks up the baked-in repair script:" -ForegroundColor Yellow
    Write-Host "    docker compose build historian && docker compose up -d historian"
    exit 1
}

# Forward host-side passwords so the in-container script can authenticate even
# when the compose secrets: mount ended up as ./secrets/.placeholder (empty
# file) — same pattern as migrate-historian-data.ps1 / .sh.
$DbPassword = Get-Setting "HISTORIAN_DATABASE_PASSWORD"
if (-not $DbPassword) { $DbPassword = "" }
$ReplPassword = Get-Setting "HISTORIAN_REPLICATOR_PASSWORD"
if (-not $ReplPassword) { $ReplPassword = "" }

if ($DryRun) {
    docker exec -i `
        -e "HISTORIAN_DATABASE_PASSWORD=$DbPassword" `
        -e "HISTORIAN_REPLICATOR_PASSWORD=$ReplPassword" `
        $TargetContainer /usr/local/bin/repair-replication.sh --dry-run
} else {
    docker exec -i `
        -e "HISTORIAN_DATABASE_PASSWORD=$DbPassword" `
        -e "HISTORIAN_REPLICATOR_PASSWORD=$ReplPassword" `
        $TargetContainer /usr/local/bin/repair-replication.sh
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Repair script exited with error code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Done." -ForegroundColor Green
