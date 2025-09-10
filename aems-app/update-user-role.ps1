# This script connects to the database docker container and modifies a single user's role.
# It takes two arguments: email and role. The role is trimmed, lowercased, and may contain spaces.

# Display help if -h or --help is present in arguments
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

# Check if correct number of arguments provided
if ($args.Count -ne 2) {
    Write-Host "Error: Exactly 2 arguments required" -ForegroundColor Red
    Write-Host "Usage: update-user-role.ps1 <email> <role>" -ForegroundColor Yellow
    Write-Host "Use -h or --help for more information" -ForegroundColor Yellow
    exit 1
}

# Get arguments
$UserEmail = $args[0]
$UserRole = $args[1]

# Validate email format (basic check)
$EmailPattern = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
if ($UserEmail -notmatch $EmailPattern) {
    Write-Host "Error: Invalid email format: $UserEmail" -ForegroundColor Red
    exit 1
}

# Process role: trim whitespace and convert to lowercase
$UserRole = $UserRole.Trim().ToLower()

# Note: Empty role is allowed (removes user's role)

Write-Host "Updating user role in database..." -ForegroundColor Blue
Write-Host "Email: $UserEmail" -ForegroundColor Cyan
Write-Host "New Role: $UserRole" -ForegroundColor Cyan

try {
    # Load environment variables from .env file
    if (Test-Path ".env") {
        Get-Content ".env" | ForEach-Object {
            if ($_ -match "^([^#][^=]+)=(.*)$") {
                $name = $matches[1].Trim()
                $value = $matches[2].Trim()
                [Environment]::SetEnvironmentVariable($name, $value, "Process")
            }
        }
    }

    # Set default values if not provided
    $ComposeProjectName = if ($env:COMPOSE_PROJECT_NAME) { $env:COMPOSE_PROJECT_NAME } else { "skeleton" }
    $DatabaseName = if ($env:DATABASE_NAME) { $env:DATABASE_NAME } else { "skeleton" }
    $DatabaseUsername = if ($env:DATABASE_USERNAME) { $env:DATABASE_USERNAME } else { "postgres" }

    # Check if database container is running
    $ContainerName = "$ComposeProjectName-database"
    $RunningContainers = docker ps --format "table {{.Names}}" | Select-String -Pattern "^$ContainerName$"
    
    if (-not $RunningContainers) {
        Write-Host "Error: Database container '$ContainerName' is not running" -ForegroundColor Red
        Write-Host "Please start the database container first with: docker compose up -d database" -ForegroundColor Yellow
        exit 1
    }

    # Execute the SQL update
    Write-Host "Connecting to database container..." -ForegroundColor Cyan
    
    # Escape single quotes in the role for SQL safety
    $EscapedRole = $UserRole -replace "'", "''"
    $EscapedEmail = $UserEmail -replace "'", "''"
    
    $SqlCommand = "WITH updated AS (UPDATE \`"User\`" SET role = '$EscapedRole' WHERE email = '$EscapedEmail' RETURNING 1) SELECT COUNT(*) FROM updated;"
    
    # Capture both stdout and stderr to handle different scenarios
    $Result = docker exec -i $ContainerName psql -U $DatabaseUsername -d $DatabaseName -t -c $SqlCommand 2>&1
    
    # Check if the docker command itself failed (container not accessible, etc.)
    if ($LASTEXITCODE -ne 0) {
        # Check if this is a PostgreSQL error vs a Docker/connection error
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
    
    # Clean up the result (remove whitespace and any error text)
    $CleanResult = ($Result | Where-Object { $_ -match "^\s*\d+\s*$" } | Select-Object -First 1)
    if ($CleanResult) {
        $CleanResult = $CleanResult.Trim()
    }

    # Check if user was found and updated
    if ($CleanResult -eq "1") {
        Write-Host "Successfully updated role for user: $UserEmail" -ForegroundColor Green
        Write-Host "New role: $UserRole" -ForegroundColor Green
    }
    elseif ($CleanResult -eq "0") {
        Write-Host "No user found with email: $UserEmail" -ForegroundColor Yellow
        Write-Host "Please verify the email address is correct and the user exists in the database" -ForegroundColor Yellow
        Write-Host "No changes were made to the database" -ForegroundColor Yellow
        exit 0  # Exit successfully since this is not an error condition
    }
    else {
        Write-Host "Unexpected result from database update. Raw output:" -ForegroundColor Red
        Write-Host $Result -ForegroundColor Red
        Write-Host "Cleaned result: '$CleanResult'" -ForegroundColor Red
        exit 1
    }

    Write-Host "Role update operation completed!" -ForegroundColor Green
}
catch {
    Write-Host "Failed to update user role: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
