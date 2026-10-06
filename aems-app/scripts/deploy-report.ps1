#
# The last thing start-services prints: whether the historian role accepts the password .env holds,
# and the health VOLTTRON reports for each of its agents. A service its profile did not start is
# named as not running, which is not a failure.
#
# See deploy-report.sh; this is the Windows/PowerShell twin.
#
# Exit codes:
#   0 - everything running is healthy
#   1 - a login is refused, VOLTTRON did not answer, or an agent is not GOOD

# A refused login or an unanswered vctl is an expected non-zero exit here, not an error to throw on.
$ErrorActionPreference = "Continue"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent $ScriptDir
$EnvFile   = Join-Path $RepoRoot ".env"

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
$Historian = "$Project-historian"
$Volttron  = "$Project-volttron"
$running   = @(docker ps --format '{{.Names}}' 2>$null)

$script:Unhealthy = $false
function Write-Good { param($verdict, $what) Write-Host ("  {0,-12} {1}" -f $verdict, $what) -ForegroundColor Green }
function Write-Bad  { param($verdict, $what) Write-Host ("  {0,-12} {1}" -f $verdict, $what) -ForegroundColor Red; $script:Unhealthy = $true }
function Write-Note { param($verdict, $what) Write-Host ("  {0,-12} {1}" -f $verdict, $what) -ForegroundColor Cyan }

Write-Host ""
Write-Host "Deployment report"

if ($running -contains $Historian) {
    $password = Get-EnvValue 'HISTORIAN_DATABASE_PASSWORD'
    $containerEnv = @(docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' $Historian 2>$null) | ForEach-Object { "$_".Trim() }
    $role = ($containerEnv | Where-Object { $_ -like 'POSTGRES_USER=*' } | Select-Object -First 1)
    $role = if ($role) { $role.Substring('POSTGRES_USER='.Length) } else { 'historian' }
    $database = ($containerEnv | Where-Object { $_ -like 'POSTGRES_DB=*' } | Select-Object -First 1)
    $database = if ($database) { $database.Substring('POSTGRES_DB='.Length) } else { $role }
    docker exec -e "PGPASSWORD=$password" $Historian psql -U $role -h localhost -d $database -tAc 'SELECT 1;' 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Good "OK" "historian login: role $role"
    } else {
        Write-Bad "FAILED" "historian login: role $role refuses the password .env holds"
    }
} else {
    Write-Note "-" "historian: not running"
}

if ($running -contains $Volttron) {
    $status = @(docker exec -u volttron $Volttron bash -lc 'export PATH=/home/volttron/.local/bin:$PATH; vctl status' 2>$null)
    if ($LASTEXITCODE -ne 0) {
        Write-Bad "NO ANSWER" "VOLTTRON: did not answer vctl status"
    } else {
        $agents = @($status | ForEach-Object { "$_".TrimEnd() } | Where-Object { $_.Trim() -and $_ -notmatch 'AGENT.*HEALTH' })
        if ($agents.Count -eq 0) { Write-Bad "NO AGENTS" "VOLTTRON: vctl status lists no agent" }
        foreach ($line in $agents) {
            $agent = ($line.Trim() -replace '\s+', ' ')
            if (($line.Trim() -split '\s+')[-1] -eq 'GOOD') {
                Write-Good "GOOD" "agent: $agent"
            } else {
                Write-Bad "NOT HEALTHY" "agent: $agent"
            }
        }
    }
} else {
    Write-Note "-" "VOLTTRON: not running"
}

if ($script:Unhealthy) { exit 1 } else { exit 0 }
