# Bring an existing deployment to the current release.
#
#   1. Carry every .env value differing from the tracked version into
#      .env.secrets, so the next sync restores it. This captures operator
#      edits made directly to .env that never reached .env.secrets.
#   2. Scrub .env (restore the tracked sentinel version, clear
#      skip-worktree) so git pull is never refused over .env.
#   3. git pull --ff-only. On failure for any reason, put .env back in
#      sync from .env.secrets, name the reason, and exit non-zero.
#   4. Run .\start-services.ps1, which calls secrets.ps1 and brings the
#      stack up.

param(
    [Parameter(ValueFromRemainingArguments)]
    [string[]]$Rest
)

$ErrorActionPreference = "Continue"

Set-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Path)

$ENV_FILE     = ".env"
$SECRETS_FILE = ".env.secrets"
$PLACEHOLDER  = "SeT_tHiS_iN_0x3A-.env.secrets-"

function Write-Info { param($msg) Write-Host "  ->  $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "  v   $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  !   $msg" -ForegroundColor Yellow }
function Write-Err  { param($msg) Write-Host "  x   $msg" -ForegroundColor Red }

function ConvertFrom-EnvValue {
    param([string]$Raw)
    $v = $Raw.Trim()
    if ($v.Length -ge 2 -and $v[0] -eq "'" -and $v[-1] -eq "'") { return $v.Substring(1, $v.Length - 2) }
    if ($v.Length -ge 2 -and $v[0] -eq '"' -and $v[-1] -eq '"') {
        return $v.Substring(1, $v.Length - 2).Replace('\"', '"').Replace('$$', '$')
    }
    return $v
}

function Get-ValueFromText {
    param([string]$Text, [string]$Key)
    foreach ($line in ($Text -split "`r?`n")) {
        $l = "$line".TrimEnd("`r")
        if ($l -match '^\s*#') { continue }
        if ($l -match "^${Key}=") {
            return (ConvertFrom-EnvValue ($l -split '=', 2)[1])
        }
    }
    return ''
}

function Get-EnvValue {
    param([string]$File, [string]$Key)
    if (-not (Test-Path $File)) { return '' }
    return (Get-ValueFromText ([IO.File]::ReadAllText((Join-Path (Get-Location) $File))) $Key)
}

function Get-EnvKeys {
    $keys = @()
    foreach ($line in (Get-Content $ENV_FILE)) {
        $l = "$line".TrimEnd("`r")
        if ($l -match '^\s*#') { continue }
        if ($l -match '^([A-Za-z_][A-Za-z0-9_]*)=') { $keys += $matches[1] }
    }
    return $keys
}

# Upsert KEY='VALUE' in FILE. UTF-8, no BOM, LF.
function Set-SecretsEntry {
    param([string]$File, [string]$Key, [string]$Value)
    if ($Value.Contains("'")) {
        Write-Warn "${Key}: value contains a literal single quote; skipped"
        return
    }
    $line = "$Key='$Value'"
    $existing = @()
    if (Test-Path $File) { $existing = @([IO.File]::ReadAllLines((Join-Path (Get-Location) $File))) }
    $new = @()
    $found = $false
    foreach ($l in $existing) {
        if ($l -match "^${Key}=") { $new += $line; $found = $true } else { $new += $l }
    }
    if (-not $found) { $new += $line }
    $path = Join-Path (Get-Location) $File
    [IO.File]::WriteAllText($path, (($new -join "`n") + "`n"), (New-Object System.Text.UTF8Encoding $false))
}

function Save-EnvOverrides {
    git ls-files --error-unmatch $ENV_FILE *> $null
    if ($LASTEXITCODE -ne 0) { return }
    $tracked = (git show "HEAD:./$ENV_FILE" 2>$null) -join "`n"
    if (-not $tracked) { return }
    $captured = 0
    foreach ($k in (Get-EnvKeys)) {
        $cur = Get-EnvValue $ENV_FILE $k
        if ([string]::IsNullOrEmpty($cur)) { continue }
        if ($cur -eq $PLACEHOLDER) { continue }
        $trackedVal = Get-ValueFromText $tracked $k
        if ($cur -cne $trackedVal) {
            Set-SecretsEntry $SECRETS_FILE $k $cur
            $captured++
        }
    }
    if ($captured -gt 0) {
        Write-Info "Captured $captured .env override(s) into $SECRETS_FILE"
    }
}

function Reset-EnvToTracked {
    git ls-files --error-unmatch $ENV_FILE *> $null
    if ($LASTEXITCODE -ne 0) { return }
    git update-index --no-skip-worktree $ENV_FILE 2>$null
    git checkout HEAD -- $ENV_FILE
}

function Restore-EnvFromSecrets {
    if (-not (Test-Path .\secrets.ps1)) { return }
    if (-not (Test-Path $SECRETS_FILE)) { return }
    & .\secrets.ps1
    if ($LASTEXITCODE -ne 0) { Write-Warn "secrets.ps1 reported issues (see above)" }
}

Write-Host "`nUpdate" -ForegroundColor White

Write-Info "Capturing .env overrides into $SECRETS_FILE"
Save-EnvOverrides

Write-Info "Scrubbing $ENV_FILE to the tracked baseline"
Reset-EnvToTracked

Write-Info "git pull --ff-only"
$pullOut = & git pull --ff-only 2>&1 | Out-String
$pullExit = $LASTEXITCODE
Write-Host $pullOut

if ($pullExit -ne 0) {
    Write-Err "pull refused"
    Write-Host $pullOut
    Write-Warn "Putting $ENV_FILE back in sync from $SECRETS_FILE; nothing started."
    Restore-EnvFromSecrets
    exit 1
}

Write-Ok "pull succeeded"
Write-Info "Running .\start-services.ps1"
if ($Rest) {
    & .\start-services.ps1 @Rest
} else {
    & .\start-services.ps1
}
exit $LASTEXITCODE
