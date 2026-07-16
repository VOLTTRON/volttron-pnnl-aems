# This script connects to the database docker container and modifies a single user's role.
# It takes two arguments: email and role. The role is trimmed, lowercased, and may contain spaces.
# When KEYCLOAK_ADMIN and KEYCLOAK_ADMIN_PASSWORD are set it also syncs the realm-management
# 'realm-admin' client role via kcadm.sh inside the Keycloak container.

if ($args -contains "-h" -or $args -contains "--help") {
    Write-Host "Usage: update-user-role.ps1 <email> <role>" -ForegroundColor Yellow
    Write-Host "Arguments:"
    Write-Host "  email              The email address of the user to update"
    Write-Host "  role               The new role for the user (will be trimmed and lowercased)"
    Write-Host "                     Use empty string `"`" to remove user's role"
    Write-Host "Options:"
    Write-Host "  -h, --help         Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\update-user-role.ps1 user@example.com admin"
    Write-Host "  .\update-user-role.ps1 user@example.com `"project manager`""
    Write-Host "  .\update-user-role.ps1 user@example.com `"`"  # Remove role"
    exit 0
}

if ($args.Count -ne 2) {
    Write-Host "Error: Exactly 2 arguments required" -ForegroundColor Red
    Write-Host "Usage: update-user-role.ps1 <email> <role>" -ForegroundColor Yellow
    Write-Host "Use -h or --help for more information" -ForegroundColor Yellow
    exit 1
}

$UserEmail = $args[0]
$UserRole = $args[1]

$EmailPattern = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
if ($UserEmail -notmatch $EmailPattern) {
    Write-Host "Error: Invalid email format: $UserEmail" -ForegroundColor Red
    exit 1
}

$UserRole = $UserRole.Trim().ToLower()

Write-Host "Updating user role in database..." -ForegroundColor Blue
Write-Host "Email: $UserEmail" -ForegroundColor Cyan
Write-Host "New Role: $UserRole" -ForegroundColor Cyan

try {
    # Load environment variables — root .env first, then server/.env (server values win)
    $ComposeProjectName = "skeleton"
    $DatabaseName = "skeleton"
    $DatabaseUsername = "postgres"
    $KeycloakAdmin = "admin"
    $KeycloakAdminRole = "realm-admin"
    $KeycloakRealm = "default"

    function Read-EnvFile($path) {
        if (Test-Path $path) {
            Get-Content $path | ForEach-Object {
                if ($_ -match "^([^#][^=]+)=(.*)$") {
                    [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
                }
            }
        }
    }

    Read-EnvFile ".env"
    Read-EnvFile "server/.env"

    if ($env:COMPOSE_PROJECT_NAME) { $ComposeProjectName = $env:COMPOSE_PROJECT_NAME }
    if ($env:DATABASE_NAME)        { $DatabaseName        = $env:DATABASE_NAME }
    if ($env:DATABASE_USERNAME)    { $DatabaseUsername    = $env:DATABASE_USERNAME }
    if ($env:KEYCLOAK_ADMIN)       { $KeycloakAdmin        = $env:KEYCLOAK_ADMIN }
    if ($env:KEYCLOAK_ADMIN_ROLE)  { $KeycloakAdminRole   = $env:KEYCLOAK_ADMIN_ROLE }

    # Derive realm name from KEYCLOAK_ISSUER_URL if available
    if ($env:KEYCLOAK_ISSUER_URL -match "/realms/([^/]+)") {
        $KeycloakRealm = $Matches[1]
    }

    # Admin password: secrets files take priority over .env placeholders
    foreach ($secretsFile in @(".env.secrets", "server/.env.secrets")) {
        if (Test-Path $secretsFile) {
            Get-Content $secretsFile | ForEach-Object {
                if ($_ -match "^KEYCLOAK_ADMIN_PASSWORD=(.+)$") {
                    $KeycloakAdminPassword = $matches[1].Trim()
                }
            }
        }
    }
    if ((-not $KeycloakAdminPassword) -and $env:KEYCLOAK_ADMIN_PASSWORD -and
        ($env:KEYCLOAK_ADMIN_PASSWORD -notmatch "SeT_tHiS_iN")) {
        $KeycloakAdminPassword = $env:KEYCLOAK_ADMIN_PASSWORD
    }

    # Check database container
    $ContainerName = "$ComposeProjectName-database"
    $RunningContainers = docker ps --format "table {{.Names}}" | Select-String -Pattern "^$ContainerName$"
    if (-not $RunningContainers) {
        Write-Host "Error: Database container '$ContainerName' is not running" -ForegroundColor Red
        Write-Host "Please start the database container first with: docker compose up -d database" -ForegroundColor Yellow
        exit 1
    }

    $EscapedRole  = $UserRole  -replace "'", "''"
    $EscapedEmail = $UserEmail -replace "'", "''"

    $SqlCommand = "WITH updated AS (UPDATE ""User"" SET role = '$EscapedRole' WHERE email = '$EscapedEmail' RETURNING id) SELECT u.id FROM updated u LIMIT 1;"

    Write-Host "Connecting to database container..." -ForegroundColor Cyan
    $Result = ($SqlCommand | docker exec -i $ContainerName psql -U $DatabaseUsername -d $DatabaseName -t -A) 2>&1

    if ($LASTEXITCODE -ne 0) {
        if ($Result -match "psql:|ERROR:|FATAL:") {
            Write-Host "Database error occurred:" -ForegroundColor Red
            Write-Host $Result -ForegroundColor Red
            throw "Database command failed with PostgreSQL error"
        }
        else {
            Write-Host "Docker/connection error occurred:" -ForegroundColor Red
            Write-Host $Result -ForegroundColor Red
            throw "Failed to connect to database container"
        }
    }

    $DataRow = ($Result | Where-Object { $_ -match "^\S" -and $_ -notmatch "^-" } | Select-Object -First 1)

    if (-not $DataRow) {
        Write-Host "No user found with email: $UserEmail" -ForegroundColor Yellow
        Write-Host "Please verify the email address is correct and the user exists in the database" -ForegroundColor Yellow
        Write-Host "No changes were made to the database" -ForegroundColor Yellow
        exit 0
    }

    Write-Host "Successfully updated role for user: $UserEmail" -ForegroundColor Green
    Write-Host "New role: $UserRole" -ForegroundColor Green

    # Keycloak sync via kcadm.sh inside the Keycloak container
    $RoleHasKeycloak = ($UserRole -split "[\s,|]+") -contains "keycloak"
    $KcContainerName = "$ComposeProjectName-keycloak"
    $KcRunning = docker ps --format "table {{.Names}}" | Select-String -Pattern "^$KcContainerName$"
    $KcConfigured = $KcRunning -and $KeycloakAdminPassword

    if ($KcConfigured) {
        Write-Host "Syncing Keycloak admin role..." -ForegroundColor Cyan

        $KcadmCmd = "/opt/keycloak/bin/kcadm.sh"
        $KcServerUrl = "http://localhost:8080/auth/sso"

        # Authenticate
        $AuthOut = docker exec $KcContainerName sh -c "$KcadmCmd config credentials --server $KcServerUrl --realm master --user $KeycloakAdmin --password $KeycloakAdminPassword 2>&1"
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Warning: Could not authenticate with Keycloak kcadm -- role sync skipped" -ForegroundColor Yellow
            Write-Host $AuthOut -ForegroundColor Yellow
        }
        else {
            if ($RoleHasKeycloak) {
                $Out = docker exec $KcContainerName sh -c "$KcadmCmd add-roles -r $KeycloakRealm --uusername $UserEmail --cclientid realm-management --rolename $KeycloakAdminRole 2>&1"
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "Granted Keycloak '$KeycloakAdminRole' role to user" -ForegroundColor Green
                }
                else {
                    Write-Host "Warning: Failed to grant Keycloak role: $Out" -ForegroundColor Yellow
                }
            }
            else {
                $Out = docker exec $KcContainerName sh -c "$KcadmCmd remove-roles -r $KeycloakRealm --uusername $UserEmail --cclientid realm-management --rolename $KeycloakAdminRole 2>&1"
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "Revoked Keycloak '$KeycloakAdminRole' role from user" -ForegroundColor Green
                }
                else {
                    Write-Host "Warning: Failed to revoke Keycloak role (may not have been assigned): $Out" -ForegroundColor Yellow
                }
            }
        }
    }
    elseif (-not $KcRunning) {
        Write-Host "Note: Keycloak container '$KcContainerName' not running -- role sync skipped" -ForegroundColor Yellow
    }

    Write-Host "Role update operation completed!" -ForegroundColor Green
}
catch {
    Write-Host "Failed to update user role: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
