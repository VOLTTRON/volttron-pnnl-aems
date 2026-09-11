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

# Load .env if present
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line -split "=", 2
            if ($parts.Length -eq 2) {
                $name = $parts[0].Trim()
                $value = $parts[1].Trim()
                if ($name -match '^[A-Za-z_][A-Za-z0-9_]*$') {
                    [Environment]::SetEnvironmentVariable($name, $value)
                }
            }
        }
    }
}

$ProjectName = $env:COMPOSE_PROJECT_NAME
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

if ($DryRun) {
    docker exec -i $TargetContainer /usr/local/bin/repair-replication.sh --dry-run
} else {
    docker exec -i $TargetContainer /usr/local/bin/repair-replication.sh
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Repair script exited with error code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Done." -ForegroundColor Green
