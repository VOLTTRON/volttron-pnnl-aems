# This script builds and starts all Docker Compose services.
# It runs 'docker compose build' followed by 'docker compose up -d' to start services in detached mode.

param(
    [switch]$NoBuild,
    [switch]$Help
)

if ($Help -or $args -contains "-h" -or $args -contains "--help") {
    Write-Host "Usage: start-services.ps1 [OPTIONS]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Build and start all Docker Compose services in detached mode."
    Write-Host ""
    Write-Host "This script performs the following actions:"
    Write-Host "  1. Builds Docker images using 'docker compose build'"
    Write-Host "  2. Starts services in detached mode using 'docker compose up -d'"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -NoBuild              Skip 'docker compose build' (use existing images)"
    Write-Host "  -Help                 Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\start-services.ps1              # Build and start all services"
    Write-Host "  .\start-services.ps1 -NoBuild     # Start without rebuilding images"
    Write-Host ""
    Write-Host "Note: This script must be run from the aems-app directory."
    exit 0
}

# Store the starting path
$StartingPath = Get-Location

# Anchor to this script's directory so relative paths (.\check-env.ps1,
# .\secrets.ps1, .\scripts\...) and `docker compose`'s cwd-based `.env`
# auto-load resolve regardless of the caller's location.
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path $ScriptDir

# Ensure .env is aligned with .env.secrets before check-env judges it and
# before compose reads it. secrets.ps1 syncs any changed values from
# .env.secrets into .env in place and rotates the live credentials if the
# stack is already up. Idempotent: no-op when .env already matches.
if ((Test-Path .\secrets.ps1) -and (Test-Path ".env.secrets")) {
    Write-Host "Syncing .env from .env.secrets..." -ForegroundColor Cyan
    & .\secrets.ps1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "secrets.ps1 reported issues (see above); continuing." -ForegroundColor Yellow
    }
}

Write-Host "Checking environment/secrets configuration..." -ForegroundColor Blue

# Run check-env.ps1 in a separate PowerShell process so parse errors surface
# as a non-zero exit code (dot-sourcing or `&` invocation in the same process
# reports parse errors to the console but leaves $LASTEXITCODE unchanged, so
# a broken check-env.ps1 would silently let start-services proceed).
& powershell.exe -NoProfile -File .\check-env.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Environment check failed - fix the issues above before starting services." -ForegroundColor Red
    exit 1
}

Write-Host "Building and starting Docker Compose services..." -ForegroundColor Blue

try {
    # Build Docker images
    if (-not $NoBuild) {
        Write-Host "Building Docker images..." -ForegroundColor Cyan
        & docker compose build

        if ($LASTEXITCODE -ne 0) {
            Write-Host "Docker build failed with exit code: $LASTEXITCODE" -ForegroundColor Red
            Write-Host "Possible causes:" -ForegroundColor Yellow
            Write-Host "  - Invalid docker-compose.yml syntax" -ForegroundColor Yellow
            Write-Host "  - Missing Dockerfile in service directory" -ForegroundColor Yellow
            Write-Host "  - Build context issues or missing files" -ForegroundColor Yellow
            Write-Host "  - Docker daemon not running" -ForegroundColor Yellow
            throw "Docker compose build failed"
        }

        Write-Host "Docker images built successfully!" -ForegroundColor Green
    } else {
        Write-Host "Skipping image build (-NoBuild)." -ForegroundColor Cyan
    }

    # Start services in detached mode. Do NOT throw on failure here - if
    # a stateful volume has drift (pg_shadow), the safety-net secrets.ps1
    # invocation below runs the pg_shadow probe and recovers. Only fail
    # out for the classic non-recoverable causes (ports, resources,
    # malformed config).
    Write-Host "Starting services in detached mode..." -ForegroundColor Cyan
    & docker compose up -d
    $composeExit = $LASTEXITCODE

    if ($composeExit -ne 0) {
        Write-Host "docker compose up -d exited $composeExit - will attempt self-heal via secrets.ps1..." -ForegroundColor Yellow
    } else {
        Write-Host "Services started successfully!" -ForegroundColor Green
    }

    # -- Safety net: reconcile pg_shadow / volttron install-time config ------
    # Runs regardless of the compose exit code. Covers stateful-volume
    # drift cases where env is correct but the persisted credential
    # (postgres pg_shadow, volttron agent install-time config) is stale.
    if (Test-Path .\secrets.ps1) {
        Write-Host "Reconciling stateful credentials..." -ForegroundColor Cyan
        & .\secrets.ps1
        $secretsExit = $LASTEXITCODE
        if ($secretsExit -ne 0) {
            Write-Host "secrets.ps1 reported issues (see above)." -ForegroundColor Yellow
        }
    }
    # The historian role keeps its password in the volume, so a login is checked, and repaired,
    # on every start. The SQLHistorian sync below logs in with it.
    if (Test-Path .\scripts\reconcile-historian-logins.ps1) {
        Write-Host "Checking historian logins..." -ForegroundColor Cyan
        & .\scripts\reconcile-historian-logins.ps1
    }
    # The SQLHistorian agent keeps its install-time config across every recreate, so it is
    # reconciled on every start, not only after a rotation.
    if (Test-Path .\scripts\sync-volttron-historian-config.ps1) {
        Write-Host "Reconciling SQLHistorian install-time config..." -ForegroundColor Cyan
        & .\scripts\sync-volttron-historian-config.ps1
    }
    # VOLTTRON keeps the configs it was installed with; every agent's are brought to what was
    # rendered, and the app then re-pushes its own values over them.
    if (Test-Path .\scripts\reconcile-volttron-configs.ps1) {
        Write-Host "Reconciling VOLTTRON configs..." -ForegroundColor Cyan
        & .\scripts\reconcile-volttron-configs.ps1
    }

    # If compose up failed, re-verify: did the safety-net actually recover?
    # secrets.ps1's recreate of init runs `docker compose up -d --no-deps init`,
    # which returns before init has finished running. Poll for it to exit 0
    # for up to 60s. `docker inspect` returns the exit code with a trailing
    # newline on PS 5.1 — trim it before comparing.
    if ($composeExit -ne 0) {
        Write-Host "Waiting up to 60 s for init to complete post self-heal..." -ForegroundColor Cyan
        $initContainer = (docker compose ps -a -q init 2>$null | Select-Object -First 1)
        $healed = $false
        for ($i = 0; $i -lt 60; $i++) {
            if ($initContainer) {
                $rawExit = docker inspect --format '{{.State.ExitCode}}' $initContainer 2>$null
                $rawState = docker inspect --format '{{.State.Status}}' $initContainer 2>$null
                $initExitTrim = if ($null -eq $rawExit) { '' } else { ($rawExit -join '').Trim() }
                $initState    = if ($null -eq $rawState) { '' } else { ($rawState -join '').Trim() }
                if ($initState -eq 'exited' -and $initExitTrim -eq '0') {
                    $healed = $true
                    break
                }
            }
            Start-Sleep -Seconds 1
        }
        if (-not $healed) {
            Write-Host "docker compose up exited $composeExit and self-heal did not recover the stack." -ForegroundColor Red
            Write-Host "Possible causes:" -ForegroundColor Yellow
            Write-Host "  - Ports already in use by other services" -ForegroundColor Yellow
            Write-Host "  - Missing or invalid environment variables in .env.secrets" -ForegroundColor Yellow
            Write-Host "  - Insufficient system resources" -ForegroundColor Yellow
            Write-Host "  - Volume mount issues or permission errors" -ForegroundColor Yellow
            throw "Docker compose up failed and self-heal did not recover"
        }
        Write-Host "Self-heal recovered the stack." -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "All Docker Compose services are now running in detached mode." -ForegroundColor Green
    Write-Host "Use 'docker compose ps' to view running services." -ForegroundColor Cyan
    Write-Host "Use 'docker compose logs -f' to view logs." -ForegroundColor Cyan

    # Last: what came up working. A report, so an unhealthy line does not fail the start.
    if (Test-Path .\scripts\deploy-report.ps1) {
        & .\scripts\deploy-report.ps1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "The deployment report names something unhealthy (above)." -ForegroundColor Yellow
        }
        # The report's verdict is its own: a caller in this session reads $LASTEXITCODE as the start's.
        $global:LASTEXITCODE = 0
    }
}
catch {
    Write-Host "Failed to start services: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    # Always restore the starting path
    Set-Location -Path $StartingPath
    Write-Host "Restored starting directory: $StartingPath" -ForegroundColor Cyan
}
