# This script refreshes the ILC configuration templates that aems-server
# reads for the Admin -> Templates preview and that aems-services pushes
# to the ILC agent on its 10s cron.
#
# Source of truth is aems-edge/configurations/templates/*.json. Those files
# are baked into the volttron-setup image at build time and copied into the
# shared .\docker\volttron\setup\templates\ directory when that container
# runs. After editing a template on the host, this script rebuilds the
# image and re-runs the setup container so both the image and the on-disk
# copy match what's in aems-edge/configurations/templates/.

# Function to display help
function Show-Help {
    Write-Host "Usage: refresh-templates.ps1 [-n|--dry-run] [-h|--help]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Refresh the ILC configuration templates the server and services read."
    Write-Host ""
    Write-Host "This script performs the following actions:"
    Write-Host "  1. Rebuilds the 'volttron-setup' image so its baked-in templates"
    Write-Host "     match the current contents of aems-edge/configurations/templates/."
    Write-Host "  2. Recreates and re-runs the 'volttron-setup' container. That"
    Write-Host "     container's setup-volttron.sh drops the fresh templates into"
    Write-Host "     .\docker\volttron\setup\templates\, which the 'server' and"
    Write-Host "     'services' containers read via a bind mount."
    Write-Host ""
    Write-Host "No other services are stopped. 'server' picks up the new files on"
    Write-Host "the next 'previewControlTemplates' call; 'services' picks them up"
    Write-Host "on the next 10s cron tick. The running 'volttron' platform does"
    Write-Host "not read templates, so it is not restarted."
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -n, --dry-run         Show what would be done without making changes"
    Write-Host "  -h, --help            Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\refresh-templates.ps1              # Rebuild and refresh"
    Write-Host "  .\refresh-templates.ps1 -n           # Preview commands only"
    Write-Host ""
    Write-Host "Note: This script must be run from the aems-app directory."
    exit 0
}

# Check for help flag first
if ($args -contains "-h" -or $args -contains "--help") {
    Show-Help
}

# Store the starting path
$StartingPath = Get-Location

# Parse arguments
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
        Write-Host "Error: Unexpected argument: $arg" -ForegroundColor Red
        Write-Host "Use -h or --help for usage information"
        exit 1
    }
}

$ServiceName = "volttron-setup"

Write-Host "Refreshing ILC configuration templates via '$ServiceName'..." -ForegroundColor Blue
if ($DryRun) {
    Write-Host "[DRY RUN MODE - No changes will be made]" -ForegroundColor Yellow
}

try {
    # Verify volttron-setup exists in the compose config
    Write-Host "Verifying '$ServiceName' service is defined..." -ForegroundColor Cyan
    $allServices = docker compose config --services 2>$null
    if ($allServices -notcontains $ServiceName) {
        Write-Host "Error: Service '$ServiceName' not found in docker-compose.yml" -ForegroundColor Red
        Write-Host "Are you running this from the aems-app directory?" -ForegroundColor Yellow
        Set-Location -Path $StartingPath
        exit 1
    }
    Write-Host "Service found" -ForegroundColor Green

    # Rebuild the image so baked-in templates match the host
    if ($DryRun) {
        Write-Host "[DRY RUN] Would run: docker compose build $ServiceName" -ForegroundColor Blue
    }
    else {
        Write-Host "Rebuilding '$ServiceName' image..." -ForegroundColor Blue
        docker compose build $ServiceName
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to build '$ServiceName' image" -ForegroundColor Red
            Set-Location -Path $StartingPath
            exit 1
        }
        Write-Host "Image rebuilt" -ForegroundColor Green
    }

    # Recreate and re-run the setup container so setup-volttron.sh refreshes
    # .\volttron\setup\templates\ from the newly rebuilt image.
    if ($DryRun) {
        Write-Host "[DRY RUN] Would run: docker compose up -d --no-deps --force-recreate $ServiceName" -ForegroundColor Blue
    }
    else {
        Write-Host "Re-running '$ServiceName' to refresh templates..." -ForegroundColor Blue
        docker compose up -d --no-deps --force-recreate $ServiceName
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to start '$ServiceName'" -ForegroundColor Red
            Set-Location -Path $StartingPath
            exit 1
        }
    }

    # Wait for the one-shot container to finish
    if (-not $DryRun) {
        Write-Host "Waiting for '$ServiceName' to complete..." -ForegroundColor Cyan
        $projectJson = docker compose config --format json 2>$null
        $projectName = "docker"
        try {
            $projectName = ($projectJson | ConvertFrom-Json).name
        }
        catch {
            $projectName = "docker"
        }
        $containerName = "$projectName-$ServiceName"

        $maxAttempts = 150
        $attempts = 0
        $state = "running"
        while ($attempts -lt $maxAttempts) {
            $state = (docker inspect --format '{{.State.Status}}' $containerName 2>$null)
            if ($LASTEXITCODE -ne 0) { $state = "missing" }
            if ($state -eq "exited") { break }
            if ($state -eq "missing") {
                Write-Host "Container '$containerName' disappeared before completing" -ForegroundColor Red
                Set-Location -Path $StartingPath
                exit 1
            }
            Start-Sleep -Seconds 2
            $attempts++
        }

        $exitCode = docker inspect --format '{{.State.ExitCode}}' $containerName 2>$null
        if ($exitCode -ne "0") {
            Write-Host "'$ServiceName' exited with code $exitCode" -ForegroundColor Red
            Write-Host "Check logs with: docker compose logs $ServiceName" -ForegroundColor Yellow
            Set-Location -Path $StartingPath
            exit 1
        }
        Write-Host "'$ServiceName' completed successfully" -ForegroundColor Green
    }

    # List the refreshed templates so the admin can confirm
    $templatesDir = ".\docker\volttron\setup\templates"
    if ($DryRun) {
        Write-Host "[DRY RUN] Would list: $templatesDir" -ForegroundColor Blue
    }
    else {
        if (Test-Path $templatesDir) {
            Write-Host "Refreshed templates in ${templatesDir}:" -ForegroundColor Cyan
            $jsonFiles = Get-ChildItem -Path $templatesDir -Filter *.json
            if ($jsonFiles.Count -eq 0) {
                Write-Host "  (no .json files found)" -ForegroundColor Yellow
            }
            else {
                $jsonFiles | Format-Table Name, Length, LastWriteTime -AutoSize
            }
        }
        else {
            Write-Host "Warning: $templatesDir not found on host" -ForegroundColor Yellow
        }
    }

    Write-Host ""
    if ($DryRun) {
        Write-Host "Dry run completed - no changes were made" -ForegroundColor Green
    }
    else {
        Write-Host "Templates refreshed. The Admin -> Templates preview and the" -ForegroundColor Green
        Write-Host "ILC config cron will pick up the new files on their next read." -ForegroundColor Green
    }
}
catch {
    Write-Host "Refresh failed with error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    Set-Location -Path $StartingPath
    exit 1
}
finally {
    # Always restore the starting path
    Set-Location -Path $StartingPath
    Write-Host "Restored starting directory: $StartingPath" -ForegroundColor Cyan
}
