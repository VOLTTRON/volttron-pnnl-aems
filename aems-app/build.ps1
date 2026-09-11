# This script builds all modules in the monorepo, including Prisma, Common, Server, and Client.
# It handles cleaning up previous builds if requested, installs dependencies, and builds each module in sequence
# Display help if -h or --help is present in arguments
if ($args -contains "-h" -or $args -contains "--help") {
    Write-Host "Usage: build.ps1 [-c|--clean-build] [-d|--skip-dependencies] [-m|--skip-migrations] [-h|--help]" -ForegroundColor Yellow
    Write-Host "Environment Variables:"
    Write-Host "  CLEAN_BUILD=true      Remove node_modules for each module before building."
    Write-Host "  SKIP_DEPENDENCIES=true Skip installing dependencies for each module."
    Write-Host "  SKIP_MIGRATIONS=true  Skip applying Prisma migrations."
    Write-Host "Options:"
    Write-Host "  -c, --clean-build      Remove node_modules for each module before building."
    Write-Host "  -d, --skip-dependencies Skip installing dependencies for each module."
    Write-Host "  -m, --skip-migrations  Skip applying Prisma migrations."
    Write-Host "  -h, --help         Show this help message."
    exit 0
}
# Store the starting path
$StartingPath = Get-Location
# Determine if clean build is requested
$CleanBuild = $false
if ($args -contains "-c" -or $args -contains "--clean-build" -or $env:CLEAN_BUILD -eq "true") {
    $CleanBuild = $true
}
# Determine if dependencies should be skipped
$SkipDependencies = $false
if ($args -contains "-d" -or $args -contains "--skip-dependencies" -or $env:SKIP_DEPENDENCIES -eq "true") {
    $SkipDependencies = $true
}
# Skip prisma migrations if requested
$SkipMigrations = $false
if ($args -contains "-m" -or $args -contains "--skip-migrations" -or $env:SKIP_MIGRATIONS -eq "true") {
    $SkipMigrations = $true
}
# Remove portal: symlinks before `yarn install` in the current working directory.
# Yarn 4 fails with EEXIST when re-linking a portal dep whose symlink already
# exists (e.g. after a CI cache restore). Deleting them lets yarn recreate them
# cleanly. Safe to run when node_modules doesn't exist yet.
function Clear-PortalLinks {
    if (Test-Path -Path ./node_modules/@local) {
        Remove-Item -Recurse -Force ./node_modules/@local
    }
    if (Test-Path -Path ./node_modules/@prisma/client) {
        Remove-Item -Recurse -Force ./node_modules/@prisma/client
    }
}

# Refresh ./node_modules/.prisma/client from the prisma workspace's freshly
# generated copy. Node runs each downstream workspace with
# --preserve-symlinks (set via NODE_OPTIONS in that workspace's .env), which
# means `require('.prisma/client/default')` from the portalled @prisma/client
# entry resolves against THIS workspace's node_modules rather than following
# the portal back to prisma/. Without this refresh, a stale local copy shadows
# the freshly generated one and downstream code crashes on symbols added since
# it was last generated — e.g. `Object.values(BackupDestinationType)` throws
# "Cannot convert undefined or null to object" during schema compile.
function Sync-PrismaClient {
    $Target = "./node_modules/.prisma"
    $Source = Join-Path $StartingPath "prisma/node_modules/.prisma/client"
    if (Test-Path -Path $Source -PathType Container) {
        if (Test-Path -Path "$Target/client") {
            Remove-Item -Recurse -Force "$Target/client"
        }
        if (-not (Test-Path -Path $Target)) {
            New-Item -ItemType Directory -Path $Target | Out-Null
        }
        Copy-Item -Recurse -Force $Source "$Target/client"
    }
}

Write-Host "Updating dependencies and building all modules in the monorepo..." -ForegroundColor Blue

try {
    # Build Prisma
    Write-Host "Prisma: Starting build process..." -ForegroundColor Blue
    Write-Host "Prisma: Cleaning output directories..." -ForegroundColor Cyan
    Set-Location -Path ./prisma
    if ($CleanBuild -and (Test-Path -Path ./node_modules -PathType Container)) {
        Remove-Item -Recurse -Force ./node_modules
    }
    if (Test-Path -Path ./dist -PathType Container) {
        Remove-Item -Recurse -Force ./dist
    }
    if (!$SkipDependencies) {
        Write-Host "Prisma: Installing dependencies..." -ForegroundColor Cyan
        yarn install
    }
    Write-Host "Prisma: Building module..." -ForegroundColor Cyan
    yarn build
    Write-Host "Prisma: Build completed successfully!" -ForegroundColor Green

    # Applying Prisma Migrations
    if ($SkipMigrations) {
        Write-Host "Prisma: Skipping migrations as requested." -ForegroundColor Yellow
    }
    else {
        Write-Host "Prisma: Applying migrations..." -ForegroundColor Blue
        # Prisma reads DATABASE_URL from process.env first and only falls back
        # to prisma/.env if that variable is unset. If the caller's shell has
        # DATABASE_URL set to anything else (a leftover from docker compose,
        # a previous script, or a system-wide env), prisma fails validation
        # with P1012 "URL must start with the protocol postgresql://" before
        # ever reading .env. Unset the ambient values so migrate:deploy
        # always reads the workspace .env authoritatively.
        $PrevDatabaseUrl = $env:DATABASE_URL
        $PrevDirectUrl = $env:DIRECT_URL
        Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
        Remove-Item Env:DIRECT_URL -ErrorAction SilentlyContinue
        try {
            yarn migrate:deploy
            Write-Host "Prisma: Migrations applied successfully!" -ForegroundColor Green
        }
        catch {
            Write-Host "Prisma: Migration failed with error: $($_.Exception.Message)" -ForegroundColor Yellow
            # Continue with the build process even if migrations fail
        }
        finally {
            if ($null -ne $PrevDatabaseUrl) { $env:DATABASE_URL = $PrevDatabaseUrl }
            if ($null -ne $PrevDirectUrl) { $env:DIRECT_URL = $PrevDirectUrl }
        }
    }

    # Build Common
    Write-Host "Common: Starting build process..." -ForegroundColor Blue
    Write-Host "Common: Cleaning output directories..." -ForegroundColor Cyan
    Set-Location -Path ../common
    if ($CleanBuild -and (Test-Path -Path ./node_modules -PathType Container)) {
        Remove-Item -Recurse -Force ./node_modules
    }
    if (Test-Path -Path ./dist -PathType Container) {
        Remove-Item -Recurse -Force ./dist
    }
    if (!$SkipDependencies) {
        Write-Host "Common: Installing dependencies..." -ForegroundColor Cyan
        Clear-PortalLinks
        yarn install
    }
    Sync-PrismaClient
    Write-Host "Common: Building module..." -ForegroundColor Cyan
    yarn build
    Write-Host "Common: Build completed successfully!" -ForegroundColor Green

    # Build Server
    Write-Host "Server: Starting build process..." -ForegroundColor Blue
    Write-Host "Server: Cleaning output directories..." -ForegroundColor Cyan
    Set-Location -Path ../server
    if ($CleanBuild -and (Test-Path -Path ./node_modules -PathType Container)) {
        Remove-Item -Recurse -Force ./node_modules
    }
    if (Test-Path -Path ./dist -PathType Container) {
        Remove-Item -Recurse -Force ./dist
    }
    if (!$SkipDependencies) {
        Write-Host "Server: Installing dependencies..." -ForegroundColor Cyan
        Clear-PortalLinks
        yarn install
    }
    Sync-PrismaClient
    Write-Host "Server: Building module..." -ForegroundColor Cyan
    yarn build
    Write-Host "Server: Build completed successfully!" -ForegroundColor Green

    # Build Client
    Write-Host "Client: Starting build process..." -ForegroundColor Blue
    Write-Host "Client: Cleaning output directories..." -ForegroundColor Cyan
    Set-Location -Path ../client
    if ($CleanBuild -and (Test-Path -Path ./node_modules -PathType Container)) {
        Remove-Item -Recurse -Force ./node_modules
    }
    if (Test-Path -Path ./.next -PathType Container) {
        Remove-Item -Recurse -Force ./.next
    }
    if (!$SkipDependencies) {
        Write-Host "Client: Installing dependencies..." -ForegroundColor Cyan
        Clear-PortalLinks
        yarn install
    }
    Sync-PrismaClient
    Write-Host "Client: Building module..." -ForegroundColor Cyan
    yarn build
    Write-Host "Client: Build completed successfully!" -ForegroundColor Green

    Write-Host "All builds completed successfully!" -ForegroundColor Green
}
catch {
    Write-Host "Build failed with error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
finally {
    # Always restore the starting path
    Set-Location -Path $StartingPath
    Write-Host "Restored starting directory: $StartingPath" -ForegroundColor Cyan
}
