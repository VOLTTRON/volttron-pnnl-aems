#
# Make the historian role the services log in as accept the password .env holds, whatever it held
# before, then report the login.
#
# See reconcile-historian-logins.sh for the rationale. This is the Windows/PowerShell twin.
#
# Usage: reconcile-historian-logins.ps1 [-Timeout SECONDS]
#
# Exit codes:
#   0 - the login is accepted, or the historian is not running
#   1 - the role still refuses the .env password after a restart
param([int]$Timeout = 60)

# psql's refusal is an expected non-zero exit here, not an error to throw on.
$ErrorActionPreference = "Continue"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent $ScriptDir
$EnvFile   = Join-Path $RepoRoot ".env"

function Write-Info { param($msg) Write-Host "  ->  $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "  v   $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  !   $msg" -ForegroundColor Yellow }
function Write-Err  { param($msg) Write-Host "  x   $msg" -ForegroundColor Red }

# A value as compose reads it from .env: single quotes literal, double quotes with \" and $$.
function Get-EnvValue {
    param([string]$Key)
    if (-not (Test-Path $EnvFile)) { return '' }
    $line = Get-Content $EnvFile | Where-Object { $_ -notmatch '^\s*#' -and $_ -match "^${Key}=" } | Select-Object -First 1
    if (-not $line) { return '' }
    $v = ($line -split '=', 2)[1].Trim()
    if ($v.Length -ge 2 -and $v[0] -eq "'" -and $v[-1] -eq "'") { return $v.Substring(1, $v.Length - 2) }
    if ($v.Length -ge 2 -and $v[0] -eq '"' -and $v[-1] -eq '"') { return $v.Substring(1, $v.Length - 2).Replace('\"', '"').Replace('$$', '$') }
    return $v
}

# The shell outranks .env, as it does for compose itself.
$Project = $env:COMPOSE_PROJECT_NAME
if (-not $Project) { $Project = Get-EnvValue 'COMPOSE_PROJECT_NAME' }
if (-not $Project) { $Project = "skeleton" }
$Container = "$Project-historian"

$runningNames = docker ps --format '{{.Names}}' 2>$null
if (-not ($runningNames -contains $Container)) {
    Write-Info "$Container is not running - no historian login to check."
    exit 0
}

$Password = Get-EnvValue 'HISTORIAN_DATABASE_PASSWORD'
$containerEnv = @(docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' $Container 2>$null) | ForEach-Object { "$_".Trim() }
$Role = ($containerEnv | Where-Object { $_ -like 'POSTGRES_USER=*' } | Select-Object -First 1)
$Role = if ($Role) { $Role.Substring('POSTGRES_USER='.Length) } else { 'historian' }
$Database = ($containerEnv | Where-Object { $_ -like 'POSTGRES_DB=*' } | Select-Object -First 1)
$Database = if ($Database) { $Database.Substring('POSTGRES_DB='.Length) } else { $Role }

function Test-Login {
    docker exec -e "PGPASSWORD=$Password" $Container psql -U $Role -h localhost -d $Database -tAc 'SELECT 1;' 2>$null | Out-Null
    return $LASTEXITCODE -eq 0
}

if (Test-Login) {
    Write-Ok "historian login: role $Role accepts the password .env holds"
    exit 0
}

Write-Warn "historian login: role $Role refuses the password .env holds - restarting $Container to reset it"
docker restart $Container 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Err "could not restart $Container"
    exit 1
}
for ($elapsed = 0; $elapsed -lt $Timeout; $elapsed += 2) {
    if (Test-Login) {
        Write-Ok "historian login: role $Role reset, and accepts the password .env holds"
        exit 0
    }
    Start-Sleep -Seconds 2
}
Write-Err "historian login: role $Role still refuses the password .env holds after a restart"
exit 1
