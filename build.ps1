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
        try {
            yarn migrate:deploy
            Write-Host "Prisma: Migrations applied successfully!" -ForegroundColor Green
        }
        catch {
            Write-Host "Prisma: Migration failed with error: $($_.Exception.Message)" -ForegroundColor Yellow
            # Continue with the build process even if migrations fail
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
        yarn install
    }
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
        yarn install
    }
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
        yarn install
    }
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
