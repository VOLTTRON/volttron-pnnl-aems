#
# Validate consistency of .env and .env.secrets before deploying.
#
# Exit 0: OK (with or without warnings)
# Exit 1: a required secret is missing or still holds the placeholder
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

function Get-EnvSecretKeys {
  Get-Content $ENV_FILE | ForEach-Object {
    if ($_.TrimEnd() -match "^([A-Za-z_][A-Za-z0-9_]*)=$([regex]::Escape($PLACEHOLDER))$") {
      $matches[1]
    }
  }
}

function Get-EnvValue {
  param([string]$File, [string]$Key)
  $line = Get-Content $File | Where-Object {
    $_ -notmatch '^\s*#' -and $_ -match "^${Key}="
  } | Select-Object -First 1
  if ($line) { ($line -split '=', 2)[1].Trim() } else { '' }
}

function Test-EnvHasPlaceholders {
  foreach ($key in (Get-EnvSecretKeys)) {
    $val = Get-EnvValue -File $ENV_FILE -Key $key
    if ($val -eq $PLACEHOLDER) { return $true }
  }
  return $false
}

function Test-EnvHasRealValues {
  foreach ($key in (Get-EnvSecretKeys)) {
    $val = Get-EnvValue -File $ENV_FILE -Key $key
    if ([string]::IsNullOrEmpty($val) -or $val -eq $PLACEHOLDER) { return $false }
  }
  return $true
}

# -- pre-flight -----------------------------------------------------------------
if (-not (Test-Path $ENV_FILE)) {
  Write-Host "ERROR: $ENV_FILE not found. Run from the repo root." -ForegroundColor Red
  exit 1
}

Write-Host "`nEnvironment/Secrets Check" -ForegroundColor White
Write-Host "Running from: $(Get-Location)"

# -- No .env.secrets: env-only path ------------------------------------------

if (-not (Test-Path $SECRETS_FILE)) {
  if (Test-EnvHasPlaceholders) {
    Write-Hdr "Mode: raw dev (no secrets configured)"
    Write-Warn "Secret variables in .env still have placeholder values."
    Write-Warn "Services that depend on secrets will not work until you either:"
    Write-Warn "  a) Edit .env directly with real values (simple dev setup), or"
    Write-Warn "  b) Run .\secrets.ps1 - it bootstraps $SECRETS_FILE from .env; edit real"
    Write-Warn "     values there and run docker compose up -d."
  } else {
    Write-Hdr "Mode: env-only (real values in .env)"
    Write-Warn "Running with real secret values in .env directly."
    Write-Warn "This works but is less secure - .env is typically committed. Consider"
    Write-Warn "moving secrets to $SECRETS_FILE (gitignored) via .\secrets.ps1."
  }
  Write-Host "`nCheck complete (warnings only).`n" -ForegroundColor Green
  exit 0
}

# -- .env.secrets exists: validate completeness --------------------------------

if (Test-EnvHasRealValues) {
  Write-Hdr "Advisory: mixed configuration detected"
  Write-Warn ".env has real secret values AND .env.secrets also exists."
  Write-Warn "Both are loaded by compose; .env.secrets wins on collisions."
  Write-Warn "Reset .env placeholders back to the sentinel to avoid confusion."
}

Write-Hdr "Checking .env.secrets completeness"

foreach ($key in (Get-EnvSecretKeys)) {
  $val = Get-EnvValue -File $SECRETS_FILE -Key $key
  if ([string]::IsNullOrEmpty($val)) {
    Write-Err "$key is missing from $SECRETS_FILE"
    noteError
  } elseif ($val -eq $PLACEHOLDER) {
    Write-Err "$key still has a placeholder value in $SECRETS_FILE"
    noteError
  } else {
    Write-Ok $key
  }
}

# -- summary --------------------------------------------------------------------
Write-Host ""
if ($script:Errors -gt 0) {
  Write-Host "$($script:Errors) error(s) found." -ForegroundColor Red
  Write-Host "Fix the issues above and re-run .\check-env.ps1`n"
  exit 1
} else {
  Write-Host "All checks passed.`n" -ForegroundColor Green
  exit 0
}
