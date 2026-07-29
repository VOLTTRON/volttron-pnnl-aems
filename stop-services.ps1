# This script stops all Docker Compose services.
# By default it preserves persistent volumes. Use -Volumes to also delete every
# named volume in the compose project (fully destructive - every service's data
# is wiped in one call). This is the counterpart to start-services.ps1.

# Function to display help
function Show-Help {
    Write-Host "Usage: stop-services.ps1 [-v|--volumes] [-f|--force] [-n|--dry-run] [-h|--help]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Stop all Docker Compose services. Preserves persistent volumes by default."
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -v, --volumes         Also delete every named volume in the compose project."
    Write-Host "                        THIS IS DESTRUCTIVE and wipes every service's data."
    Write-Host "  -f, --force           Skip confirmation prompt (only meaningful with --volumes)"
    Write-Host "  -n, --dry-run         Show what would be done without actually doing it"
    Write-Host "  -h, --help            Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\stop-services.ps1                       # Stop all services, keep volumes"
    Write-Host "  .\stop-services.ps1 --volumes             # Stop and wipe every volume (prompts)"
    Write-Host "  .\stop-services.ps1 --volumes --force     # Wipe without confirmation"
    Write-Host "  .\stop-services.ps1 --dry-run             # Preview"
    Write-Host ""
    Write-Host "Note: To wipe a single service's volume(s) rather than the whole stack,"
    Write-Host "use .\reset-service.ps1 <service> instead. To restart in place without"
    Write-Host "stopping, use .\restart-service.ps1 <service>."
    Write-Host "With --volumes, THIS CHANGE IS UNRECOVERABLE!" -ForegroundColor Red
    exit 0
}

# Check for help flag first
if ($args -contains "-h" -or $args -contains "--help") {
    Show-Help
}

# Store the starting path
$StartingPath = Get-Location

# Parse arguments
$WipeVolumes = $false
$Force = $false
$DryRun = $false

foreach ($arg in $args) {
    if ($arg -eq "-v" -or $arg -eq "--volumes") {
        $WipeVolumes = $true
    }
    elseif ($arg -eq "-f" -or $arg -eq "--force") {
        $Force = $true
    }
    elseif ($arg -eq "-n" -or $arg -eq "--dry-run") {
        $DryRun = $true
    }
    elseif ($arg -eq "-h" -or $arg -eq "--help") {
        Show-Help
    }
    else {
        Write-Host "Error: Unknown option: $arg" -ForegroundColor Red
        Write-Host "Use -h or --help for usage information"
        exit 1
    }
}

if ($WipeVolumes) {
    Write-Host "Docker Compose Stop with volume wipe (docker compose down -v)" -ForegroundColor Blue
}
else {
    Write-Host "Docker Compose Stop (docker compose down)" -ForegroundColor Blue
}

if ($DryRun) {
    Write-Host "[DRY RUN MODE - No changes will be made]" -ForegroundColor Yellow
}

# Confirmation prompt when wiping volumes (unless --force or --dry-run)
if ($WipeVolumes -and -not $Force -and -not $DryRun) {
    Write-Host ""
    Write-Host "WARNING: --volumes will delete EVERY named volume in the compose project." -ForegroundColor Yellow
    Write-Host "Every service's persistent data (databases, historian, keycloak realm, backups, etc.)" -ForegroundColor Yellow
    Write-Host "will be permanently lost." -ForegroundColor Yellow
    Write-Host "THIS CHANGE IS UNRECOVERABLE!" -ForegroundColor Red
    $confirmation = Read-Host "Are you sure you want to continue? (yes/no)"
    if ($confirmation -ne "yes") {
        Write-Host "Stop cancelled by user" -ForegroundColor Yellow
        exit 0
    }
}

try {
    if ($WipeVolumes) {
        if ($DryRun) {
            Write-Host "[DRY RUN] Would run: docker compose down -v" -ForegroundColor Blue
        }
        else {
            Write-Host "Stopping services and deleting volumes..." -ForegroundColor Cyan
            docker compose down -v
            if ($LASTEXITCODE -ne 0) {
                throw "docker compose down -v failed with exit code $LASTEXITCODE"
            }
            Write-Host "All services stopped and every named volume deleted" -ForegroundColor Green
        }
    }
    else {
        if ($DryRun) {
            Write-Host "[DRY RUN] Would run: docker compose down" -ForegroundColor Blue
        }
        else {
            Write-Host "Stopping services (volumes preserved)..." -ForegroundColor Cyan
            docker compose down
            if ($LASTEXITCODE -ne 0) {
                throw "docker compose down failed with exit code $LASTEXITCODE"
            }
            Write-Host "All services stopped. Volumes preserved." -ForegroundColor Green
            Write-Host "Use .\start-services.ps1 to bring the stack back up." -ForegroundColor Cyan
        }
    }

    if ($DryRun) {
        Write-Host "Dry run completed - no changes were made" -ForegroundColor Green
    }
}
catch {
    Write-Host "Stop failed with error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    # Always restore the starting path
    Set-Location -Path $StartingPath
}
