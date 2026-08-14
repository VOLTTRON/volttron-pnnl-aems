# This script resets a Docker Compose service by stopping it, deleting its persistent volumes, and restarting it.
# It dynamically discovers volumes associated with the specified service and handles dependencies automatically.

# Function to display help
function Show-Help {
    Write-Host "Usage: reset-service.ps1 [service-name...] [-f|--force] [-n|--dry-run] [-s|--include-shared] [-h|--help]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Reset one or more Docker Compose services by deleting their persistent volumes."
    Write-Host ""
    Write-Host "Arguments:"
    Write-Host "  service-name...        Name(s) of the service(s) to reset (optional - lists services if omitted)"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -f, --force             Skip confirmation prompt"
    Write-Host "  -n, --dry-run           Show what would be done without actually doing it"
    Write-Host "  -s, --include-shared    Also delete volumes shared with services outside the reset target"
    Write-Host "                          (default: shared volumes are skipped to avoid breaking other services)"
    Write-Host "  -h, --help              Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\reset-service.ps1                             # List all services with volumes"
    Write-Host "  .\reset-service.ps1 database                    # Reset the database service"
    Write-Host "  .\reset-service.ps1 database grafana-db         # Reset multiple services"
    Write-Host "  .\reset-service.ps1 grafana -f                  # Reset grafana without confirmation"
    Write-Host "  .\reset-service.ps1 keycloak-db -n              # Preview what would be reset"
    Write-Host "  .\reset-service.ps1 certs --include-shared      # Reset certs including its shared volume"
    Write-Host ""
    Write-Host "Warning: This will permanently delete all data in the service's volumes!" -ForegroundColor Red
    Write-Host "THIS CHANGE IS UNRECOVERABLE!" -ForegroundColor Red
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
$Force = $false
$DryRun = $false
$IncludeShared = $false

foreach ($arg in $args) {
    if ($arg -eq "-f" -or $arg -eq "--force") {
        $Force = $true
    }
    elseif ($arg -eq "-n" -or $arg -eq "--dry-run") {
        $DryRun = $true
    }
    elseif ($arg -eq "-s" -or $arg -eq "--include-shared" -or $arg -eq "-IncludeShared") {
        $IncludeShared = $true
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

# Helper: Build a map of { volumeSource -> @(serviceNames) } across all services
function Get-VolumeOwnershipMap {
    param($ConfigJson)
    $map = @{}
    foreach ($svcName in $ConfigJson.services.PSObject.Properties.Name) {
        $svc = $ConfigJson.services.$svcName
        if (-not $svc.volumes) { continue }
        foreach ($vol in $svc.volumes) {
            $source = ""
            if ($vol -is [System.Management.Automation.PSCustomObject]) {
                $source = $vol.source
            }
            else {
                $parts = $vol -split ':'
                if ($parts.Length -gt 0) { $source = $parts[0] }
            }
            if ($source -and -not $source.StartsWith('.') -and -not $source.StartsWith('/') -and -not $source.Contains('\')) {
                if (-not $map.ContainsKey($source)) { $map[$source] = @() }
                $map[$source] += $svcName
            }
        }
    }
    return $map
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
    $volumeOwnership = Get-VolumeOwnershipMap -ConfigJson $configJson

    # Check each service for volumes
    foreach ($svc in $allServices) {
        if ([string]::IsNullOrEmpty($svc)) { continue }

        $service = $configJson.services.$svc
        $volumeEntries = @()
        $seen = @{}

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
                    if ($seen.ContainsKey($source)) { continue }
                    $seen[$source] = $true
                    $owners = @($volumeOwnership[$source])
                    $others = @($owners | Where-Object { $_ -ne $svc } | Sort-Object -Unique)
                    $volumeEntries += @{
                        Name = $source
                        OwnerCount = $owners.Count
                        Others = $others
                    }
                }
            }
        }

        if ($volumeEntries.Count -gt 0) {
            $servicesWithVolumes += @{
                Name = $svc
                Volumes = $volumeEntries
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
            if ($vol.OwnerCount -gt 1) {
                Write-Host "    - $($vol.Name) (shared with: $($vol.Others -join ', '))"
            }
            else {
                Write-Host "    - $($vol.Name)"
            }
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
    Write-Host "  -f, --force             Skip confirmation prompt"
    Write-Host "  -n, --dry-run           Preview changes without applying them"
    Write-Host "  -s, --include-shared    Also delete volumes shared with other services"
    Write-Host "  -h, --help              Show detailed help message"
    Write-Host ""
    Write-Host "Example:"
    Write-Host "  .\reset-service.ps1 database -n"
    
    exit 0
}

# Check if service names were provided - if not, list services
if ($ServiceNames.Count -eq 0) {
    List-Services
}

Write-Host "Docker Compose Volume Reset for service(s): $($ServiceNames -join ', ')" -ForegroundColor Blue
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

    # Get the list of volumes used by all specified services
    Write-Host "Discovering volumes for specified services..." -ForegroundColor Cyan
    $configJson = docker compose config --format json 2>$null | ConvertFrom-Json
    $volumeOwnership = Get-VolumeOwnershipMap -ConfigJson $configJson
    $targetSet = @{}
    foreach ($t in $ServiceNames) { $targetSet[$t] = $true }

    $keptVolumes = @()
    $skippedShared = 0
    $seenVolumes = @{}

    foreach ($ServiceName in $ServiceNames) {
        $service = $configJson.services.$ServiceName
        if (-not $service.volumes) { continue }

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
            # Only consider named volumes (not bind mounts with paths)
            if (-not $source -or $source.StartsWith('.') -or $source.StartsWith('/') -or $source.Contains('\')) {
                continue
            }
            if ($seenVolumes.ContainsKey($source)) { continue }
            $seenVolumes[$source] = $true

            $owners = @($volumeOwnership[$source])
            $external = @($owners | Where-Object { -not $targetSet.ContainsKey($_) } | Sort-Object -Unique)

            if ($external.Count -gt 0 -and -not $IncludeShared) {
                Write-Host "Skipping shared volume: $source (also mounted by: $($external -join ', '))" -ForegroundColor Yellow
                $skippedShared++
                continue
            }
            $keptVolumes += $source
        }
    }

    $volumeNames = $keptVolumes | Select-Object -Unique

    # Check if any volumes remain after filtering
    if ($volumeNames.Count -eq 0) {
        if ($skippedShared -gt 0) {
            Write-Host "All discovered volumes are shared with other services and were skipped." -ForegroundColor Yellow
            Write-Host "Pass -s / --include-shared to include them (this will affect the services listed above)." -ForegroundColor Yellow
        }
        else {
            Write-Host "No persistent volumes found for the specified service(s)" -ForegroundColor Yellow
            Write-Host "These services may only use bind mounts or no volumes at all" -ForegroundColor Yellow
        }
        Set-Location -Path $StartingPath
        exit 0
    }

    # Display volumes that will be deleted
    Write-Host "The following volumes will be deleted:" -ForegroundColor Blue
    foreach ($vol in $volumeNames) {
        Write-Host "  - $vol"
    }

    if ($skippedShared -gt 0) {
        Write-Host ""
        Write-Host "Note: $skippedShared shared volume(s) were skipped. Pass -s / --include-shared to include them." -ForegroundColor Yellow
    }

    # Get dependent services for all specified services
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
            # Check if any of our services are in the dependencies
            foreach ($targetService in $ServiceNames) {
                if ($dependencies -contains $targetService -and $dependentServices -notcontains $svcName) {
                    $dependentServices += $svcName
                }
            }
        }
    }

    if ($dependentServices.Count -gt 0) {
        Write-Host "Warning: The following services depend on the specified service(s) and will be stopped:" -ForegroundColor Yellow
        foreach ($svc in $dependentServices) {
            Write-Host "  - $svc"
        }
    }

    # Confirmation prompt (unless --force or --dry-run)
    if (-not $Force -and -not $DryRun) {
        Write-Host ""
        Write-Host "WARNING: This will permanently delete all data in these volumes!" -ForegroundColor Yellow
        Write-Host "THIS CHANGE IS UNRECOVERABLE!" -ForegroundColor Red
        $confirmation = Read-Host "Are you sure you want to continue? (yes/no)"
        if ($confirmation -ne "yes") {
            Write-Host "Reset cancelled by user" -ForegroundColor Yellow
            Set-Location -Path $StartingPath
            exit 0
        }
    }

    # Stop the services and their dependents
    if ($DryRun) {
        foreach ($ServiceName in $ServiceNames) {
            Write-Host "[DRY RUN] Would stop service: $ServiceName" -ForegroundColor Blue
            Write-Host "[DRY RUN] Would remove container: $ServiceName" -ForegroundColor Blue
        }
        foreach ($svc in $dependentServices) {
            Write-Host "[DRY RUN] Would stop dependent service: $svc" -ForegroundColor Blue
            Write-Host "[DRY RUN] Would remove container: $svc" -ForegroundColor Blue
        }
    }
    else {
        foreach ($ServiceName in $ServiceNames) {
            Write-Host "Stopping service: $ServiceName" -ForegroundColor Blue
            docker compose stop $ServiceName
            Write-Host "Removing container: $ServiceName" -ForegroundColor Blue
            docker compose rm -f $ServiceName
        }

        foreach ($svc in $dependentServices) {
            Write-Host "Stopping dependent service: $svc" -ForegroundColor Blue
            try {
                docker compose stop $svc 2>$null
                Write-Host "Removing container: $svc" -ForegroundColor Blue
                docker compose rm -f $svc 2>$null
            }
            catch {
                # Continue even if stopping a dependent service fails
            }
        }
    }

    # Get the Docker Compose project name
    $projectName = "docker"
    try {
        $projectConfig = docker compose config --format json 2>$null | ConvertFrom-Json
        if ($projectConfig.name) {
            $projectName = $projectConfig.name
        }
    }
    catch {
        $projectName = "docker"
    }
    Write-Host "Using Docker Compose project name: $projectName" -ForegroundColor Cyan

    # Remove the volumes
    foreach ($vol in $volumeNames) {
        $fullVolumeName = "${projectName}_$vol"
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
                Write-Host "Volume not found: $fullVolumeName" -ForegroundColor Yellow
                Write-Host "Attempting to find volume with different naming..." -ForegroundColor Yellow
                # Try to find the actual volume name
                $allVolumes = docker volume ls --format "{{.Name}}"
                $actualVolume = $allVolumes | Where-Object { $_ -match ".*[_-]$vol`$" } | Select-Object -First 1
                if ($actualVolume) {
                    Write-Host "Found volume: $actualVolume" -ForegroundColor Cyan
                    docker volume rm $actualVolume
                    Write-Host "Volume removed: $actualVolume" -ForegroundColor Green
                }
                else {
                    Write-Host "Could not find volume matching: $vol" -ForegroundColor Yellow
                }
            }
        }
    }

    # Restart the services
    if ($DryRun) {
        foreach ($ServiceName in $ServiceNames) {
            Write-Host "[DRY RUN] Would restart service: $ServiceName" -ForegroundColor Blue
        }
        foreach ($svc in $dependentServices) {
            Write-Host "[DRY RUN] Would restart dependent service: $svc" -ForegroundColor Blue
        }
    }
    else {
        foreach ($ServiceName in $ServiceNames) {
            Write-Host "Restarting service: $ServiceName" -ForegroundColor Blue
            docker compose up -d $ServiceName
        }
        Write-Host "Services restarted successfully" -ForegroundColor Green
        
        # Restart dependent services that were stopped
        if ($dependentServices.Count -gt 0) {
            foreach ($svc in $dependentServices) {
                Write-Host "Restarting dependent service: $svc" -ForegroundColor Blue
                try {
                    docker compose up -d $svc 2>$null
                }
                catch {
                    Write-Host "Failed to restart $svc" -ForegroundColor Yellow
                }
            }
            Write-Host "Dependent services restarted" -ForegroundColor Green
        }
    }

    if ($DryRun) {
        Write-Host "Dry run completed - no changes were made" -ForegroundColor Green
    }
    else {
        Write-Host "Volume reset completed successfully for service(s): $($ServiceNames -join ', ')" -ForegroundColor Green
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
