# This script restarts one or more Docker Compose services in place.
# It preserves persistent volumes and every other running service.
# Use reset-service.ps1 instead when the intent is to wipe volumes.

# Function to display help
function Show-Help {
    Write-Host "Usage: restart-service.ps1 [service-name...] [-n|--dry-run] [-h|--help]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Restart one or more Docker Compose services in place. Preserves volumes,"
    Write-Host "config, and every other service. This is the safe, non-destructive"
    Write-Host "counterpart to reset-service.ps1."
    Write-Host ""
    Write-Host "Arguments:"
    Write-Host "  service-name...        Name(s) of the service(s) to restart (optional - lists services if omitted)"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -n, --dry-run         Show what would be done without actually doing it"
    Write-Host "  -h, --help            Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\restart-service.ps1                        # List all services"
    Write-Host "  .\restart-service.ps1 volttron               # Restart volttron"
    Write-Host "  .\restart-service.ps1 historian server       # Restart two services"
    Write-Host "  .\restart-service.ps1 volttron -n            # Preview"
    Write-Host ""
    Write-Host "Note: Restart is non-destructive - no data is lost. To wipe persistent"
    Write-Host "volumes and reinitialize a service, use reset-service.ps1 instead."
    exit 0
}

# Check for help flag first
if ($args -contains "-h" -or $args -contains "--help") {
    Show-Help
}

# Store the starting path
$StartingPath = Get-Location

# Parse arguments
$ServiceNames = @()
$DryRun = $false

foreach ($arg in $args) {
    if ($arg -eq "-n" -or $arg -eq "--dry-run") {
        $DryRun = $true
    }
    elseif ($arg -eq "-h" -or $arg -eq "--help") {
        Show-Help
    }
    elseif ($arg -like "-*") {
        Write-Host "Error: Unknown option: $arg" -ForegroundColor Red
        Write-Host "Use -h or --help for usage information"
        exit 1
    }
    else {
        $ServiceNames += $arg
    }
}

# Function to list all services (restart is non-destructive; volume classification is not needed)
function List-Services {
    Write-Host "Available services (restart is non-destructive):" -ForegroundColor Blue
    Write-Host ""

    $allServices = docker compose config --services 2>$null

    foreach ($svc in $allServices) {
        if (-not [string]::IsNullOrEmpty($svc)) {
            Write-Host "  - $svc"
        }
    }

    Write-Host ""
    Write-Host "To restart a service, run:" -ForegroundColor Cyan
    Write-Host "  .\restart-service.ps1 <service-name> [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -n, --dry-run  Preview changes without applying them"
    Write-Host "  -h, --help     Show detailed help message"
    Write-Host ""
    Write-Host "Example:"
    Write-Host "  .\restart-service.ps1 volttron"

    exit 0
}

# Check if service names were provided - if not, list services
if ($ServiceNames.Count -eq 0) {
    List-Services
}

Write-Host "Docker Compose Restart for service(s): $($ServiceNames -join ', ')" -ForegroundColor Blue
if ($DryRun) {
    Write-Host "[DRY RUN MODE - No changes will be made]" -ForegroundColor Yellow
}

try {
    # Verify all services exist
    Write-Host "Verifying services exist..." -ForegroundColor Cyan
    $allServices = docker compose config --services 2>$null
    foreach ($svcName in $ServiceNames) {
        if ($allServices -notcontains $svcName) {
            Write-Host "Error: Service '$svcName' not found in docker-compose.yml" -ForegroundColor Red
            Set-Location -Path $StartingPath
            exit 1
        }
    }
    Write-Host "All services found" -ForegroundColor Green

    # Restart each service
    foreach ($ServiceName in $ServiceNames) {
        if ($DryRun) {
            Write-Host "[DRY RUN] Would restart: $ServiceName" -ForegroundColor Blue
        }
        else {
            Write-Host "Restarting service: $ServiceName" -ForegroundColor Blue
            docker compose restart $ServiceName
            Write-Host "Restarted: $ServiceName" -ForegroundColor Green
        }
    }

    # Show final status for restarted services
    if (-not $DryRun) {
        Write-Host ""
        Write-Host "Current status:" -ForegroundColor Cyan
        docker compose ps --format "table {{.Name}}`t{{.Status}}" @ServiceNames
    }

    if ($DryRun) {
        Write-Host "Dry run completed - no changes were made" -ForegroundColor Green
    }
    else {
        Write-Host "Restart completed successfully for service(s): $($ServiceNames -join ', ')" -ForegroundColor Green
    }
}
catch {
    Write-Host "Restart failed with error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
finally {
    # Always restore the starting path
    Set-Location -Path $StartingPath
    Write-Host "Restored starting directory: $StartingPath" -ForegroundColor Cyan
}
