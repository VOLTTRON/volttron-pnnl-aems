# Build, start, and test the Docker Compose stack using the standard project scripts,
# then stop the stack. Exercises start-services.ps1 and stop-services.ps1 end-to-end.
#
# Usage: .\test-integration.ps1 [OPTIONS]

param(
    [string]$Project = "aems-test",
    [switch]$Warm,
    [switch]$SkipInstall,
    [switch]$NoBuild,
    [switch]$NoStart,
    [switch]$NoStop,
    [switch]$Help
)

if ($Help) {
    Write-Host "Usage: .\test-integration.ps1 [OPTIONS]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Start the Docker Compose stack, run Playwright integration tests,"
    Write-Host "write an HTML report, then stop the stack."
    Write-Host ""
    Write-Host "The stack runs as its own compose project on its own volumes, started cold:"
    Write-Host "its volumes are removed first. Containers of any other project holding the"
    Write-Host "stack's host ports are stopped for the run and started again afterwards."
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Project NAME   Compose project to test as (default: aems-test). Never the"
    Write-Host "                  COMPOSE_PROJECT_NAME in .env: that one holds real data."
    Write-Host "  -Warm           Keep the test project's volumes instead of starting cold"
    Write-Host "  -SkipInstall    Skip npm install + playwright install (faster on repeat runs)"
    Write-Host "  -NoBuild        Skip 'docker compose build' (use existing images)"
    Write-Host "  -NoStart        Don't start the stack (assume it's already running)"
    Write-Host "  -NoStop         Don't stop the stack after tests (useful for debugging)"
    Write-Host "  -Help           Show this help message"
    Write-Host ""
    Write-Host "Reads from:"
    Write-Host "  .env            APP_HOSTNAME, KEYCLOAK_ADMIN, KEYCLOAK_ADMIN_PASSWORD"
    Write-Host ""
    Write-Host "Output:"
    Write-Host "  scripts\playwright-report\index.html"
    exit 0
}

$StartingPath = Get-Location
$StackStarted = $false
$TestExit = 0
$Parked = @()

function Write-Blue($msg)   { Write-Host $msg -ForegroundColor Blue }
function Write-Cyan($msg)   { Write-Host $msg -ForegroundColor Cyan }
function Write-Green($msg)  { Write-Host $msg -ForegroundColor Green }
function Write-Yellow($msg) { Write-Host $msg -ForegroundColor Yellow }
function Write-Red($msg)    { Write-Host $msg -ForegroundColor Red }

function Read-EnvVar($file, $key) {
    if (-not (Test-Path $file)) { return $null }
    $line = Get-Content $file | Where-Object { $_ -match "^${key}=" } | Select-Object -First 1
    if (-not $line) { return $null }
    return ($line -replace "^${key}=", "").Trim().Trim('"').Trim("'")
}

function Wait-ForUrl($url, $label, $timeoutSeconds = 600) {
    Write-Blue "Waiting for $label to be ready..."
    Write-Cyan "  URL: $url"
    $elapsed = 0
    while ($elapsed -lt $timeoutSeconds) {
        $code = 0
        try {
            $result = & curl.exe --silent --insecure --max-time 5 -o NUL -w "%{http_code}" $url 2>$null
            if ($result -match '^\d{3}$') { $code = [int]$result }
        } catch { }
        if ($code -gt 0 -and $code -lt 500) {
            Write-Green "$label is ready (HTTP $code)."
            return
        }
        Start-Sleep -Seconds 5
        $elapsed += 5
        if ($code -gt 0) {
            Write-Cyan "  ...waiting (${elapsed}s, HTTP $code)"
        } else {
            Write-Cyan "  ...waiting (${elapsed}s, no response)"
        }
    }
    Write-Red "To debug: curl.exe -v --insecure '$url'"
    throw "Timed out waiting for $label after ${timeoutSeconds}s"
}

try {
    # ── Load environment ───────────────────────────────────────────────────────

    $AppHostname = Read-EnvVar ".env" "APP_HOSTNAME"
    $KeycloakAdmin = Read-EnvVar ".env" "KEYCLOAK_ADMIN"
    if (-not $KeycloakAdmin) { $KeycloakAdmin = "admin" }

    if (-not $AppHostname) {
        Write-Red "Error: APP_HOSTNAME is not set in .env"; exit 1
    }

    # The project .env names holds the operator's data; this harness removes its own
    # project's volumes, so it never runs as that one.
    $EnvProject = Read-EnvVar ".env" "COMPOSE_PROJECT_NAME"
    if ($Project -eq $EnvProject) {
        Write-Red "Error: -Project '$Project' is the project .env names; refusing to test against it."; exit 1
    }
    # Shell environment outranks .env for compose interpolation, and the scripts read it first too.
    $env:COMPOSE_PROJECT_NAME = $Project

    Write-Blue "Integration test configuration:"
    Write-Cyan "  APP_HOSTNAME:  $AppHostname"
    Write-Cyan "  Project:       $Project$(if ($Warm) { ' (warm)' } else { ' (cold)' })"
    Write-Cyan "  Report:        scripts\playwright-report\index.html"

    # ── Install test dependencies ──────────────────────────────────────────────

    Set-Location scripts
    if (-not $SkipInstall) {
        Write-Blue "Installing test dependencies..."
        npm install
        if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
        npx playwright install chromium --with-deps
        if ($LASTEXITCODE -ne 0) { throw "playwright install failed" }
    }
    Set-Location $StartingPath

    # ── Start the stack ────────────────────────────────────────────────────────

    if (-not $NoStart) {
        # Another project's running containers hold the host ports this stack publishes.
        # PowerShell 5.1 strips quotes inside native arguments, so the label is parsed here rather
        # than selected with {{.Label "..."}}.
        $Parked = @(docker ps --format '{{.ID}}|{{.Labels}}' |
            Where-Object { $_ -match '^(\w+)\|.*\bcom\.docker\.compose\.project=([^,]+)' -and $Matches[2] -ne $Project } |
            ForEach-Object { ($_ -split '\|')[0] })
        if ($LASTEXITCODE -ne 0) { throw "docker ps failed" }
        if ($Parked.Count -gt 0) {
            Write-Blue "Stopping $($Parked.Count) container(s) of other compose projects for the run..."
            docker stop $Parked | Out-Null
        }

        if (-not $Warm) {
            Write-Blue "Removing project '$Project' and its volumes for a cold start..."
            docker compose down -v --remove-orphans
            if ($LASTEXITCODE -ne 0) { throw "docker compose down -v failed" }
        }

        Write-Blue "Starting Docker Compose stack..."
        if ($NoBuild) {
            & .\start-services.ps1 -NoBuild
        } else {
            & .\start-services.ps1
        }
        if ($LASTEXITCODE -ne 0) { throw "start-services failed" }
        $StackStarted = $true
    }

    # ── Wait for readiness ─────────────────────────────────────────────────────

    Wait-ForUrl "https://${AppHostname}/auth/sso/realms/default/.well-known/openid-configuration" "Keycloak" 600
    Wait-ForUrl "https://${AppHostname}/" "App" 300

    # ── Copy mkcert CA cert for Node TLS verification ──────────────────────────

    # Whatever answers on APP_HOSTNAME must be this project's proxy, not another stack's.
    $ProxyContainer = "${Project}-proxy"
    $proxyRunning = (docker inspect --format '{{.State.Running}}' $ProxyContainer 2>$null | Out-String).Trim()
    if ($proxyRunning -ne "true") { throw "$ProxyContainer is not running; the stack under test did not come up" }
    $CaCertPath = "scripts\.auth\mkcert-ca.crt"

    New-Item -ItemType Directory -Path "scripts\.auth" -Force | Out-Null
    Write-Blue "Copying mkcert CA cert from ${ProxyContainer}..."
    docker cp "${ProxyContainer}:/etc/certs/mkcert-ca.crt" $CaCertPath 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Green "CA cert copied to ${CaCertPath}."
    } else {
        Write-Yellow "Warning: could not copy CA cert from ${ProxyContainer} - Node fetch() may fail TLS verification."
    }

    # ── Run tests ──────────────────────────────────────────────────────────────

    # Read after start: start-services has synced .env, and a sentinel there is the live value.
    $KeycloakAdminPassword = Read-EnvVar ".env" "KEYCLOAK_ADMIN_PASSWORD"
    if (-not $KeycloakAdminPassword) {
        Write-Red "Error: KEYCLOAK_ADMIN_PASSWORD is not set in .env"; exit 1
    }

    Write-Blue "Running integration tests..."
    Set-Location scripts

    $env:APP_HOSTNAME = $AppHostname
    $env:KEYCLOAK_ADMIN = $KeycloakAdmin
    $env:KEYCLOAK_ADMIN_PASSWORD = $KeycloakAdminPassword
    $env:NODE_EXTRA_CA_CERTS = "..\${CaCertPath}"

    npx playwright test
    $TestExit = $LASTEXITCODE

    Set-Location $StartingPath

    # ── Report ─────────────────────────────────────────────────────────────────

    if ($TestExit -eq 0) {
        Write-Green "All integration tests passed."
    } else {
        Write-Red "Some integration tests failed (exit $TestExit)."
    }
    Write-Cyan "Report: scripts\playwright-report\index.html"
    Write-Cyan "To open: cd scripts; npx playwright show-report"

} catch {
    Write-Red "Error: $_"
    $TestExit = 1
} finally {
    Set-Location $StartingPath
    Remove-Item Env:\APP_HOSTNAME -ErrorAction SilentlyContinue
    Remove-Item Env:\KEYCLOAK_ADMIN -ErrorAction SilentlyContinue
    Remove-Item Env:\KEYCLOAK_ADMIN_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:\NODE_EXTRA_CA_CERTS -ErrorAction SilentlyContinue

    if ($StackStarted -and -not $NoStop) {
        Write-Blue "Stopping Docker Compose stack..."
        & .\stop-services.ps1
    }
    # -NoStop keeps the stack under test up, which still holds the ports; if it never came up,
    # nothing holds them and the parked containers go back regardless.
    if ($Parked.Count -gt 0 -and (-not $NoStop -or -not $StackStarted)) {
        Write-Blue "Starting the $($Parked.Count) container(s) stopped for the run..."
        docker start $Parked | Out-Null
    }
    Remove-Item Env:\COMPOSE_PROJECT_NAME -ErrorAction SilentlyContinue
}

exit $TestExit
