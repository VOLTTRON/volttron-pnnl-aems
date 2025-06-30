# This script performs code analysis and testing for all modules in the monorepo, including Prisma, Common, Server, and Client.
# It runs linting, type checking, and tests with coverage for each module in sequence

# Display help if -h or --help is present in arguments
if ($args -contains "-h" -or $args -contains "--help") {
    Write-Host "Usage: test.ps1 [--skip-coverage] [-h|--help]" -ForegroundColor Yellow
    Write-Host "Environment Variables:"
    Write-Host "  SKIP_COVERAGE=true    Skip running tests with coverage (run tests without coverage)."
    Write-Host "Options:"
    Write-Host "  --skip-coverage    Skip running tests with coverage (run tests without coverage)."
    Write-Host "  -h, --help         Show this help message."
    exit 0
}

# Store the starting path
$StartingPath = Get-Location

# Set Node.js memory options for large projects
$env:NODE_OPTIONS = "$env:NODE_OPTIONS --max-old-space-size=8192"

# Determine if coverage should be skipped
$SkipCoverage = $false
if ($args -contains "--skip-coverage" -or $env:SKIP_COVERAGE -eq "true") {
    $SkipCoverage = $true
}

Write-Host "Performing code analysis and testing for all modules in the monorepo..." -ForegroundColor Blue

try {
    # Analyze and test Prisma
    Write-Host "Prisma: Starting analysis and testing..." -ForegroundColor Blue
    Set-Location -Path ./prisma
    Write-Host "Prisma: Running linter..." -ForegroundColor Cyan
    yarn lint
    Write-Host "Prisma: Running type checks..." -ForegroundColor Cyan
    yarn check
    if ($SkipCoverage) {
        Write-Host "Prisma: Running tests (without coverage)..." -ForegroundColor Cyan
        yarn test
    }
    else {
        Write-Host "Prisma: Running tests with coverage..." -ForegroundColor Cyan
        yarn test:cov
    }
    Write-Host "Prisma: Analysis and testing completed successfully!" -ForegroundColor Green

    # Analyze and test Common
    Write-Host "Common: Starting analysis and testing..." -ForegroundColor Blue
    Set-Location -Path ../common
    Write-Host "Common: Running linter..." -ForegroundColor Cyan
    yarn lint
    Write-Host "Common: Running type checks..." -ForegroundColor Cyan
    yarn check
    if ($SkipCoverage) {
        Write-Host "Common: Running tests (without coverage)..." -ForegroundColor Cyan
        yarn test
    }
    else {
        Write-Host "Common: Running tests with coverage..." -ForegroundColor Cyan
        yarn test:cov
    }
    Write-Host "Common: Analysis and testing completed successfully!" -ForegroundColor Green

    # Analyze and test Server
    Write-Host "Server: Starting analysis and testing..." -ForegroundColor Blue
    Set-Location -Path ../server
    Write-Host "Server: Running linter..." -ForegroundColor Cyan
    yarn lint
    Write-Host "Server: Running type checks..." -ForegroundColor Cyan
    yarn check
    if ($SkipCoverage) {
        Write-Host "Server: Running tests (without coverage)..." -ForegroundColor Cyan
        yarn test
    }
    else {
        Write-Host "Server: Running tests with coverage..." -ForegroundColor Cyan
        yarn test:cov
    }
    Write-Host "Server: Analysis and testing completed successfully!" -ForegroundColor Green

    # Analyze and test Client
    Write-Host "Client: Starting analysis and testing..." -ForegroundColor Blue
    Set-Location -Path ../client
    Write-Host "Client: Running linter..." -ForegroundColor Cyan
    yarn lint
    Write-Host "Client: Running type checks..." -ForegroundColor Cyan
    yarn check
    if ($SkipCoverage) {
        Write-Host "Client: Running tests (without coverage)..." -ForegroundColor Cyan
        yarn test
    }
    else {
        Write-Host "Client: Running tests with coverage..." -ForegroundColor Cyan
        yarn test:cov
    }
    Write-Host "Client: Analysis and testing completed successfully!" -ForegroundColor Green

    Write-Host "All analysis and testing completed successfully!" -ForegroundColor Green
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
    Write-Host "Restored starting directory: $StartingPath" -ForegroundColor Cyan
}
