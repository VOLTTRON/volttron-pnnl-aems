# Store the starting path
$StartingPath = Get-Location
Write-Host "Updating dependencies and building all modules in the monorepo..." -ForegroundColor Blue

try {
    # Build Prisma
    Write-Host "Prisma: Starting build process..." -ForegroundColor Blue
    Write-Host "Prisma: Cleaning output directories..." -ForegroundColor Cyan
    Set-Location -Path ./prisma
    if (Test-Path -Path ./node_modules -PathType Container) {
        Remove-Item -Recurse -Force ./node_modules
    }
    if (Test-Path -Path ./dist -PathType Container) {
        Remove-Item -Recurse -Force ./dist
    }
    Write-Host "Prisma: Installing dependencies..." -ForegroundColor Cyan
    yarn install
    Write-Host "Prisma: Building module..." -ForegroundColor Cyan
    yarn build
    Write-Host "Prisma: Build completed successfully!" -ForegroundColor Green

    # Build Common
    Write-Host "Common: Starting build process..." -ForegroundColor Blue
    Write-Host "Common: Cleaning output directories..." -ForegroundColor Cyan
    Set-Location -Path ../common
    if (Test-Path -Path ./node_modules -PathType Container) {
        Remove-Item -Recurse -Force ./node_modules
    }
    if (Test-Path -Path ./dist -PathType Container) {
        Remove-Item -Recurse -Force ./dist
    }
    Write-Host "Common: Installing dependencies..." -ForegroundColor Cyan
    yarn install
    Write-Host "Common: Building module..." -ForegroundColor Cyan
    yarn build
    Write-Host "Common: Build completed successfully!" -ForegroundColor Green

    # Build Server
    Write-Host "Server: Starting build process..." -ForegroundColor Blue
    Write-Host "Server: Cleaning output directories..." -ForegroundColor Cyan
    Set-Location -Path ../server
    if (Test-Path -Path ./node_modules -PathType Container) {
        Remove-Item -Recurse -Force ./node_modules
    }
    if (Test-Path -Path ./dist -PathType Container) {
        Remove-Item -Recurse -Force ./dist
    }
    Write-Host "Server: Installing dependencies..." -ForegroundColor Cyan
    yarn install
    Write-Host "Server: Building module..." -ForegroundColor Cyan
    yarn build
    Write-Host "Server: Build completed successfully!" -ForegroundColor Green

    # Build Client
    Write-Host "Client: Starting build process..." -ForegroundColor Blue
    Write-Host "Client: Cleaning output directories..." -ForegroundColor Cyan
    Set-Location -Path ../client
    if (Test-Path -Path ./node_modules -PathType Container) {
        Remove-Item -Recurse -Force ./node_modules
    }
    if (Test-Path -Path ./.next -PathType Container) {
        Remove-Item -Recurse -Force ./.next
    }
    Write-Host "Client: Installing dependencies..." -ForegroundColor Cyan
    yarn install
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
