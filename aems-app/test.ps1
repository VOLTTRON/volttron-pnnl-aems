# Store the starting path
$StartingPath = Get-Location
Write-Host "Performing code analysis and testing for all projects in the monorepo..." -ForegroundColor Blue

try {
    # Analyze and test Prisma
    Write-Host "Analyzing and testing Prisma..." -ForegroundColor Cyan
    Set-Location -Path ./prisma
    yarn lint
    yarn check
    yarn test:cov

    # Analyze and test Common
    Write-Host "Analyzing and testing Common..." -ForegroundColor Cyan
    Set-Location -Path ../common
    yarn lint
    yarn check
    yarn test:cov

    # Analyze and test Server
    Write-Host "Analyzing and testing Server..." -ForegroundColor Cyan
    Set-Location -Path ../server
    yarn lint
    yarn check
    yarn test:cov

    # Analyze and test Client
    Write-Host "Analyzing and testing Client..." -ForegroundColor Cyan
    Set-Location -Path ../client
    yarn lint
    yarn check
    yarn test:cov

    Write-Host "All analysis and testing completed." -ForegroundColor Green
}
catch {
    Write-Host "Did you forget to run 'build.ps1'?" -ForegroundColor Yellow
    Write-Host "Code analysis and testing failed with error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
finally {
    # Always restore the starting path
    Set-Location -Path $StartingPath
    Write-Host "Restored to starting directory: $StartingPath" -ForegroundColor Cyan
}
