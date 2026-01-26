# This script builds and starts all Docker Compose services.
# It runs 'docker compose build' followed by 'docker compose up -d' to start services in detached mode.

# Display help if -h or --help is present in arguments
if ($args -contains "-h" -or $args -contains "--help") {
    Write-Host "Usage: start-services.ps1 [-h|--help]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Build and start all Docker Compose services in detached mode."
    Write-Host ""
    Write-Host "This script performs the following actions:"
    Write-Host "  1. Builds Docker images using 'docker compose build'"
    Write-Host "  2. Starts services in detached mode using 'docker compose up -d'"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -h, --help            Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\start-services.ps1              # Build and start all services"
    Write-Host ""
    Write-Host "Note: This script must be run from the aems-app directory."
    exit 0
}

# Store the starting path
$StartingPath = Get-Location

Write-Host "Building and starting Docker Compose services..." -ForegroundColor Blue

try {
    # Build Docker images
    Write-Host "Building Docker images..." -ForegroundColor Cyan
    docker compose build
    
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
    
    # Start services in detached mode
    Write-Host "Starting services in detached mode..." -ForegroundColor Cyan
    docker compose up -d
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to start services with exit code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host "Possible causes:" -ForegroundColor Yellow
        Write-Host "  - Ports already in use by other services" -ForegroundColor Yellow
        Write-Host "  - Missing or invalid environment variables" -ForegroundColor Yellow
        Write-Host "  - Insufficient system resources" -ForegroundColor Yellow
        Write-Host "  - Volume mount issues or permission errors" -ForegroundColor Yellow
        throw "Docker compose up failed"
    }
    
    Write-Host "Services started successfully!" -ForegroundColor Green
    Write-Host "" 
    Write-Host "All Docker Compose services are now running in detached mode." -ForegroundColor Green
    Write-Host "Use 'docker compose ps' to view running services." -ForegroundColor Cyan
    Write-Host "Use 'docker compose logs -f' to view logs." -ForegroundColor Cyan
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
