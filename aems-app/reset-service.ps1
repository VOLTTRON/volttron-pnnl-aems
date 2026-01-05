# This script resets a Docker Compose service by stopping it, deleting its persistent volumes, and restarting it.
# It dynamically discovers volumes associated with the specified service and handles dependencies automatically.

# Function to display help
function Show-Help {
    Write-Host "Usage: reset-service.ps1 [service-name] [-f|--force] [-n|--dry-run] [-h|--help]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Reset a Docker Compose service by deleting its persistent volumes."
    Write-Host ""
    Write-Host "Arguments:"
    Write-Host "  service-name           Name of the service to reset (optional - lists services if omitted)"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -f, --force           Skip confirmation prompt"
    Write-Host "  -n, --dry-run         Show what would be done without actually doing it"
    Write-Host "  -h, --help            Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\reset-service.ps1                       # List all services with volumes"
    Write-Host "  .\reset-service.ps1 database              # Reset the database service"
    Write-Host "  .\reset-service.ps1 grafana -f            # Reset grafana without confirmation"
    Write-Host "  .\reset-service.ps1 keycloak-db -n        # Preview what would be reset"
    Write-Host ""
    Write-Host "Warning: This will permanently delete all data in the service's volumes!" -ForegroundColor Red
    exit 0
}

# Check for help flag first
if ($args -contains "-h" -or $args -contains "--help") {
    Show-Help
}

# Store the starting path
$StartingPath = Get-Location

# Parse arguments
$ServiceName = ""
$Force = $false
$DryRun = $false

foreach ($arg in $args) {
    if ($arg -eq "-f" -or $arg -eq "--force") {
        $Force = $true
    }
    elseif ($arg -eq "-n" -or $arg -eq "--dry-run") {
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
        if ([string]::IsNullOrEmpty($ServiceName)) {
            $ServiceName = $arg
        }
        else {
            Write-Host "Error: Multiple service names specified" -ForegroundColor Red
            Write-Host "Use -h or --help for usage information"
            exit 1
        }
    }
}

# Function to list all services with volumes
function List-Services {
    Write-Host "Available services in docker-compose.yml:" -ForegroundColor Blue
    Write-Host ""
    
    $servicesWithVolumes = @()
    $servicesWithoutVolumes = @()
    
    # Get all services
    $allServices = docker compose config --services 2>$null
    
    # Get config JSON once
    $configJson = docker compose config --format json 2>$null | ConvertFrom-Json
    
    # Check each service for volumes
    foreach ($svc in $allServices) {
        if ([string]::IsNullOrEmpty($svc)) { continue }
        
        $service = $configJson.services.$svc
        $volumeNames = @()
        
        if ($service.volumes) {
            foreach ($vol in $service.volumes) {
                $source = ""
                if ($vol -is [System.Management.Automation.PSCustomObject]) {
                    $source = $vol.source
                }
                else {
                    $parts = $vol -split ':'
                    if ($parts.Length -gt 0) {
                        $source = $parts[0]
                    }
                }
                if ($source -and -not $source.StartsWith('.') -and -not $source.StartsWith('/') -and -not $source.Contains('\')) {
                    $volumeNames += $source
                }
            }
        }
        
        if ($volumeNames.Count -gt 0) {
            $servicesWithVolumes += @{
                Name = $svc
                Volumes = $volumeNames
            }
        }
        else {
            $servicesWithoutVolumes += $svc
        }
    }
    
    # Display services with volumes
    Write-Host "Services with persistent volumes:" -ForegroundColor Green
    Write-Host ""
    foreach ($entry in $servicesWithVolumes) {
        Write-Host "  $($entry.Name)"
        foreach ($vol in $entry.Volumes) {
            Write-Host "    - $vol"
        }
        Write-Host ""
    }
    
    # Display services without volumes
    if ($servicesWithoutVolumes.Count -gt 0) {
        Write-Host "Services without persistent volumes:" -ForegroundColor Yellow
        foreach ($svc in $servicesWithoutVolumes) {
            Write-Host "  - $svc"
        }
    }
    
    # Display usage instructions
    Write-Host ""
    Write-Host "To reset a service, run:" -ForegroundColor Cyan
    Write-Host "  .\reset-service.ps1 <service-name> [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -f, --force    Skip confirmation prompt"
    Write-Host "  -n, --dry-run  Preview changes without applying them"
    Write-Host "  -h, --help     Show detailed help message"
    Write-Host ""
    Write-Host "Example:"
    Write-Host "  .\reset-service.ps1 database -n"
    
    exit 0
}

# Check if service name was provided - if not, list services
if ([string]::IsNullOrEmpty($ServiceName)) {
    List-Services
}

Write-Host "Docker Compose Volume Reset for service: $ServiceName" -ForegroundColor Blue
if ($DryRun) {
    Write-Host "[DRY RUN MODE - No changes will be made]" -ForegroundColor Yellow
}

try {
    # Verify the service exists
    Write-Host "Verifying service exists..." -ForegroundColor Cyan
    $services = docker compose config --services 2>$null
    if ($services -notcontains $ServiceName) {
        Write-Host "Error: Service '$ServiceName' not found in docker-compose.yml" -ForegroundColor Red
        Set-Location -Path $StartingPath
        exit 1
    }
    Write-Host "Service '$ServiceName' found" -ForegroundColor Green

    # Get the list of volumes used by this service
    Write-Host "Discovering volumes for service '$ServiceName'..." -ForegroundColor Cyan
    $configJson = docker compose config --format json 2>$null | ConvertFrom-Json
    $service = $configJson.services.$ServiceName
    $volumeNames = @()

    if ($service.volumes) {
        foreach ($vol in $service.volumes) {
            $source = ""
            if ($vol -is [System.Management.Automation.PSCustomObject]) {
                $source = $vol.source
            }
            else {
                # Handle short syntax: 'source:target' or 'source:target:mode'
                $parts = $vol -split ':'
                if ($parts.Length -gt 0) {
                    $source = $parts[0]
                }
            }
            # Only include named volumes (not bind mounts with paths)
            if ($source -and -not $source.StartsWith('.') -and -not $source.StartsWith('/') -and -not $source.Contains('\')) {
                $volumeNames += $source
            }
        }
    }

    # Check if any volumes were found
    if ($volumeNames.Count -eq 0) {
        Write-Host "No persistent volumes found for service '$ServiceName'" -ForegroundColor Yellow
        Write-Host "This service may only use bind mounts or no volumes at all" -ForegroundColor Yellow
        Set-Location -Path $StartingPath
        exit 0
    }

    # Display volumes that will be deleted
    Write-Host "The following volumes will be deleted:" -ForegroundColor Blue
    foreach ($vol in $volumeNames) {
        Write-Host "  - $vol"
    }

    # Get dependent services
    Write-Host "Checking for dependent services..." -ForegroundColor Cyan
    $dependentServices = @()
    foreach ($svcName in $configJson.services.PSObject.Properties.Name) {
        $svcConfig = $configJson.services.$svcName
        if ($svcConfig.depends_on) {
            $dependencies = @()
            if ($svcConfig.depends_on -is [System.Management.Automation.PSCustomObject]) {
                $dependencies = $svcConfig.depends_on.PSObject.Properties.Name
            }
            elseif ($svcConfig.depends_on -is [Array]) {
                $dependencies = $svcConfig.depends_on
            }
            if ($dependencies -contains $ServiceName) {
                $dependentServices += $svcName
            }
        }
    }

    if ($dependentServices.Count -gt 0) {
        Write-Host "Warning: The following services depend on '$ServiceName' and will be stopped:" -ForegroundColor Yellow
        foreach ($svc in $dependentServices) {
            Write-Host "  - $svc"
        }
    }

    # Confirmation prompt (unless --force or --dry-run)
    if (-not $Force -and -not $DryRun) {
        Write-Host ""
        Write-Host "WARNING: This will permanently delete all data in these volumes!" -ForegroundColor Yellow
        $confirmation = Read-Host "Are you sure you want to continue? (yes/no)"
        if ($confirmation -ne "yes") {
            Write-Host "Reset cancelled by user" -ForegroundColor Yellow
            Set-Location -Path $StartingPath
            exit 0
        }
    }

    # Stop the service and its dependents
    if ($DryRun) {
        Write-Host "[DRY RUN] Would stop service: $ServiceName" -ForegroundColor Blue
        foreach ($svc in $dependentServices) {
            Write-Host "[DRY RUN] Would stop dependent service: $svc" -ForegroundColor Blue
        }
    }
    else {
        Write-Host "Stopping service: $ServiceName" -ForegroundColor Blue
        docker compose stop $ServiceName

        foreach ($svc in $dependentServices) {
            Write-Host "Stopping dependent service: $svc" -ForegroundColor Blue
            try {
                docker compose stop $svc 2>$null
            }
            catch {
                # Continue even if stopping a dependent service fails
            }
        }
    }

    # Remove the volumes
    foreach ($vol in $volumeNames) {
        $fullVolumeName = "docker_$vol"
        if ($DryRun) {
            Write-Host "[DRY RUN] Would remove volume: $fullVolumeName" -ForegroundColor Blue
        }
        else {
            Write-Host "Removing volume: $fullVolumeName" -ForegroundColor Blue
            $volumeExists = docker volume inspect $fullVolumeName 2>$null
            if ($LASTEXITCODE -eq 0) {
                docker volume rm $fullVolumeName
                Write-Host "Volume removed: $fullVolumeName" -ForegroundColor Green
            }
            else {
                Write-Host "Volume not found (may not exist yet): $fullVolumeName" -ForegroundColor Yellow
            }
        }
    }

    # Restart the service
    if ($DryRun) {
        Write-Host "[DRY RUN] Would restart service: $ServiceName" -ForegroundColor Blue
        Write-Host "[DRY RUN] Docker Compose would automatically start dependencies" -ForegroundColor Cyan
    }
    else {
        Write-Host "Restarting service: $ServiceName" -ForegroundColor Blue
        docker compose up -d $ServiceName
        Write-Host "Service restarted successfully" -ForegroundColor Green
        Write-Host "Docker Compose will automatically start dependencies as needed" -ForegroundColor Cyan
    }

    if ($DryRun) {
        Write-Host "Dry run completed - no changes were made" -ForegroundColor Green
    }
    else {
        Write-Host "Volume reset completed successfully for service: $ServiceName" -ForegroundColor Green
    }
}
catch {
    Write-Host "Reset failed with error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
finally {
    # Always restore the starting path
    Set-Location -Path $StartingPath
    Write-Host "Restored starting directory: $StartingPath" -ForegroundColor Cyan
}
