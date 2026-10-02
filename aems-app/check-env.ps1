#
# Report the state of .env and .env.secrets before deploying.
#
# Exit 0: OK, with or without warnings. A blank or placeholder entry in .env.secrets means the
#         .env sentinel, which is a valid runtime default; a sentinel .env beside a real
#         .env.secrets means secrets.ps1 has not run yet. Both are reported, neither blocks.
# Exit 1: the compose shim cannot be run from a fresh clone, or an env file has lost a newline.
#
# check-env.sh reports the same findings in the same words.
#
# Usage: .\check-env.ps1

$ErrorActionPreference = "Stop"

$ENV_FILE     = ".env"
$SECRETS_FILE = ".env.secrets"
$PLACEHOLDER  = "SeT_tHiS_iN_0x3A-.env.secrets-"

# -- color helpers --------------------------------------------------------------
function Write-Ok    { param($msg) Write-Host "  [OK]    $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "  [WARN]  $msg" -ForegroundColor Yellow }
function Write-Err   { param($msg) Write-Host "  [ERROR] $msg" -ForegroundColor Red }
function Write-Hdr   { param($msg) Write-Host "`n$msg" -ForegroundColor White }

$script:Errors = 0
function noteError { $script:Errors++ }

# -- helpers --------------------------------------------------------------------

# File content without a BOM or CRs, comments dropped. ReadAllLines strips both.
function Get-Entries {
  param([string]$File)
  if (-not (Test-Path $File)) { return @() }
  return @([IO.File]::ReadAllLines((Join-Path (Get-Location) $File)) | Where-Object { $_ -notmatch '^\s*#' })
}

function Get-EnvSecretKeys {
  $pattern = "^([A-Za-z_][A-Za-z0-9_]*)=['`"]?$([regex]::Escape($PLACEHOLDER))['`"]?$"
  foreach ($l in (Get-Entries $ENV_FILE)) { if ($l -cmatch $pattern) { $matches[1] } }
}

function Get-SecretsKeys {
  foreach ($l in (Get-Entries $SECRETS_FILE)) { if ($l -match '^([A-Za-z_][A-Za-z0-9_]*)=') { $matches[1] } }
}

# A value as compose reads it: '...' is literal, "..." takes \" and $$ escapes.
function Get-EnvValue {
  param([string]$File, [string]$Key)
  $line = Get-Entries $File | Where-Object { $_.StartsWith("$Key=") } | Select-Object -First 1
  if (-not $line) { return '' }
  $v = $line.Substring($Key.Length + 1)
  if ($v.Length -ge 2 -and $v[0] -eq "'" -and $v[-1] -eq "'") { return $v.Substring(1, $v.Length - 2) }
  if ($v.Length -ge 2 -and $v[0] -eq '"' -and $v[-1] -eq '"') { return $v.Substring(1, $v.Length - 2).Replace('\"', '"').Replace('$$', '$') }
  return $v
}

# -- pre-flight -----------------------------------------------------------------
if (-not (Test-Path $ENV_FILE)) {
  Write-Host "ERROR: $ENV_FILE not found. Run from the repo root." -ForegroundColor Red
  exit 1
}

Write-Host "`nEnvironment/Secrets Check" -ForegroundColor White
Write-Host "Running from: $(Get-Location)"

# -- compose-shim include: env_file: sanity -------------------------------------
# A gitignored file under the root shim's `include: env_file:` cannot exist in a fresh clone, and
# compose refuses to run at all without it.
$shim = "docker-compose.yml"
$gi = ".gitignore"
if ((Test-Path $shim) -and (Test-Path $gi)) {
  $ignored = @(Get-Entries $gi)
  $inBlock = $false
  foreach ($l in [IO.File]::ReadAllLines((Join-Path (Get-Location) $shim))) {
    if ($l -match '^\s*env_file:\s*$') { $inBlock = $true; continue }
    if ($inBlock -and $l -match '^\s*-\s*(.+?)\s*$') {
      $path = $matches[1] -replace '^\./', ''
      $base = Split-Path $path -Leaf
      if ($ignored -ccontains $path -or $ignored -ccontains "/$path" -or $ignored -ccontains $base) {
        Write-Err "$shim lists '$path' under 'include: env_file:', but that path is gitignored; a fresh clone cannot run compose"
        noteError
      }
      continue
    }
    $inBlock = $false
  }
}

# -- env-file line integrity ----------------------------------------------------
# KEY=VALUEKEY=VALUE: a dropped newline corrupts the first value and loses the second key.
foreach ($file in @($ENV_FILE, $SECRETS_FILE)) {
  $n = 0
  $bad = $false
  foreach ($l in (Get-Entries $file)) {
    $n++
    if ($l -cmatch '^[A-Z][A-Z0-9_]*=.*[a-zA-Z0-9][A-Z][A-Z0-9]{2,}(_[A-Z0-9]+)+=') {
      Write-Err "$file line $n holds two entries; insert the missing newline"
      $bad = $true
    }
  }
  if ($bad) { noteError }
}

# -- secrets --------------------------------------------------------------------
if (-not (Test-Path $SECRETS_FILE)) {
  Write-Hdr "No $SECRETS_FILE"
  if (@(Get-EnvSecretKeys).Count -gt 0) {
    Write-Warn "no ${SECRETS_FILE}: the $ENV_FILE sentinels are the running credentials"
  } else {
    Write-Warn "no ${SECRETS_FILE}: $ENV_FILE holds real values directly"
  }
} else {
  Write-Hdr "Checking $SECRETS_FILE"
  $keys = [string[]]@(@(Get-EnvSecretKeys) + @(Get-SecretsKeys) | Select-Object -Unique)
  [Array]::Sort($keys, [StringComparer]::Ordinal)
  foreach ($key in $keys) {
    $secretsVal = Get-EnvValue $SECRETS_FILE $key
    $envVal = Get-EnvValue $ENV_FILE $key
    if (-not $secretsVal -or $secretsVal -ceq $PLACEHOLDER) {
      Write-Warn "${key}: blank in $SECRETS_FILE, so the $ENV_FILE sentinel is used"
    } elseif ($envVal -ceq $PLACEHOLDER) {
      Write-Warn "${key}: $ENV_FILE holds the sentinel while $SECRETS_FILE has a value; run secrets before docker compose"
    } elseif ($envVal -cne $secretsVal) {
      Write-Warn "${key}: $ENV_FILE differs from $SECRETS_FILE; run secrets before docker compose"
    } else {
      Write-Ok $key
    }
  }
}

# -- summary --------------------------------------------------------------------
Write-Host ""
if ($script:Errors -gt 0) {
  Write-Host "$($script:Errors) error(s) found. Fix the issues above and re-run .\check-env.ps1`n" -ForegroundColor Red
  exit 1
}
Write-Host "Check complete.`n" -ForegroundColor Green
exit 0
