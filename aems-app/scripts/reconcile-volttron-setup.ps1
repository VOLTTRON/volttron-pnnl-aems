#
# Fingerprint the inputs the volttron-setup container renders from, and invalidate its completion
# lock when any of them changes. See reconcile-volttron-setup.sh for the rationale; this is the
# Windows/PowerShell twin.
#
# Usage: reconcile-volttron-setup.ps1
#
# Exit codes:
#   0 - fingerprint unchanged, or lock successfully invalidated
#   1 - the volume exists but the lock could not be invalidated

$ErrorActionPreference = "Continue"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent $ScriptDir
$EnvFile   = Join-Path $RepoRoot ".env"
# aems-edge is a sibling of aems-app in the standard checkout. The script fixture places
# its own aems-edge tree inside the sandbox, so a path at ${RepoRoot}\aems-edge wins when
# it exists.
$LocalGen = Join-Path $RepoRoot "aems-edge\configurations\docker\generate_configs.py"
if (Test-Path -LiteralPath $LocalGen) {
    $GenPy = $LocalGen
} else {
    $GenPy = Join-Path (Split-Path -Parent $RepoRoot) "aems-edge\configurations\docker\generate_configs.py"
}
$StateDir  = Join-Path $RepoRoot "volttron\setup"
$StateFile = Join-Path $StateDir ".render_fingerprint"

function Write-Info { param($msg) Write-Host "  ->  $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "  v   $msg" -ForegroundColor Green }
function Write-Err  { param($msg) Write-Host "  x   $msg" -ForegroundColor Red }

# A value as compose reads it from .env: single quotes literal, double quotes with \" and $$.
function Resolve-EnvValue {
    param([string]$Raw)
    if ($Raw.Length -ge 2 -and $Raw[0] -eq "'" -and $Raw[-1] -eq "'") {
        return $Raw.Substring(1, $Raw.Length - 2)
    }
    if ($Raw.Length -ge 2 -and $Raw[0] -eq '"' -and $Raw[-1] -eq '"') {
        return $Raw.Substring(1, $Raw.Length - 2).Replace('\"', '"').Replace('$$', '$')
    }
    return $Raw
}

function Get-EnvValue {
    param([string]$Key)
    if (-not (Test-Path $EnvFile)) { return '' }
    $line = Get-Content $EnvFile | Where-Object { $_ -notmatch '^\s*#' -and $_ -match "^${Key}=" } | Select-Object -First 1
    if (-not $line) { return '' }
    $v = ($line -split '=', 2)[1].Trim()
    return (Resolve-EnvValue $v)
}

# Every VOLTTRON_* and HISTORIAN_DB_* line from .env, plus HISTORIAN_DATABASE_PASSWORD, as `KEY=VALUE`.
function Get-EnvPairs {
    if (-not (Test-Path $EnvFile)) { return @() }
    $out = @()
    foreach ($line in Get-Content $EnvFile) {
        if ($line -match '^\s*#') { continue }
        if ($line -match '^(VOLTTRON_|HISTORIAN_DB_|HISTORIAN_DATABASE_PASSWORD=)') {
            $parts = $line -split '=', 2
            $key   = $parts[0]
            $value = Resolve-EnvValue $parts[1].Trim()
            $out += "$key=$value"
        }
    }
    return $out | Sort-Object
}

function Get-FileSha {
    param([string]$Path)
    if (-not (Test-Path $Path)) { return '' }
    return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash.ToLower()
}

function Get-RenderFingerprint {
    $parts = @()
    $parts += Get-EnvPairs
    $gen = Get-FileSha $GenPy
    if ($gen) { $parts += "generate_configs=$gen" }
    $regPath = Get-EnvValue 'VOLTTRON_REGISTRY_FILE_PATH'
    if ($regPath) {
        $regSha = Get-FileSha $regPath
        if ($regSha) { $parts += "registry=$regSha" }
    }
    $text   = ($parts -join "`n") + "`n"
    $bytes  = [System.Text.Encoding]::UTF8.GetBytes($text)
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    try   { return (($sha256.ComputeHash($bytes) | ForEach-Object { $_.ToString("x2") }) -join '') }
    finally { $sha256.Dispose() }
}

$Project = $env:COMPOSE_PROJECT_NAME
if (-not $Project) { $Project = Get-EnvValue 'COMPOSE_PROJECT_NAME' }
if (-not $Project) { $Project = "skeleton" }
$Volume = "${Project}_volttron-setup"

$NewFp = Get-RenderFingerprint
$OldFp = ''
if (Test-Path $StateFile) { $OldFp = (Get-Content -LiteralPath $StateFile -Raw).Trim() }

if ($NewFp -eq $OldFp -and $OldFp) {
    Write-Info "volttron-setup inputs unchanged - no re-render needed."
    exit 0
}

docker volume inspect $Volume 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Info "volttron-setup inputs changed - invalidating $Volume completion lock."
    docker run --rm -v "${Volume}:/data" busybox sh -c 'rm -f /data/.setup_complete /data/.setup_complete.fingerprint' 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Err "could not invalidate $Volume completion lock."
        exit 1
    }
}

if (-not (Test-Path $StateDir)) { New-Item -ItemType Directory -Force -Path $StateDir | Out-Null }
Set-Content -LiteralPath $StateFile -Value $NewFp -NoNewline
Write-Ok "volttron-setup render fingerprint updated."
exit 0
