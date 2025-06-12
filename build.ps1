# Store the starting path
$StartingPath = Get-Location
Write-Host "Updating dependencies and building all projects in the monorepo..." -ForegroundColor Blue

try {
    # Build Prisma
    Write-Host "Building Prisma..." -ForegroundColor Cyan
    Set-Location -Path ./prisma
    if (Test-Path -Path ./node_modules -PathType Container) {
        Remove-Item -Recurse -Force ./node_modules
    }
    yarn install
    yarn build

    # Build Common
    Write-Host "Building Common..." -ForegroundColor Cyan
    Set-Location -Path ../common
    if (Test-Path -Path ./node_modules -PathType Container) {
        Remove-Item -Recurse -Force ./node_modules
    }
    yarn install
    yarn build

    # Build Server
    Write-Host "Building Server..." -ForegroundColor Cyan
    Set-Location -Path ../server
    if (Test-Path -Path ./node_modules -PathType Container) {
        Remove-Item -Recurse -Force ./node_modules
    }
    yarn install
    yarn build

    # Build Client
    Write-Host "Building Client..." -ForegroundColor Cyan
    Set-Location -Path ../client
    if (Test-Path -Path ./node_modules -PathType Container) {
        Remove-Item -Recurse -Force ./node_modules
    }
    yarn install
    yarn build

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
    Write-Host "Restored to starting directory: $StartingPath" -ForegroundColor Cyan
}
