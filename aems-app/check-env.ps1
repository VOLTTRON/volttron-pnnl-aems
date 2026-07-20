#
# Validate consistency of .env, .env.secrets, and docker/secrets/ before deploying.
#
# Exit 0: all warnings only (raw dev state, env-only, or secrets mode fully in sync)
# Exit 1: secrets chain is broken (docker compose will fail or services will use wrong credentials)
#
# Usage: .\check-env.ps1

$ErrorActionPreference = "Stop"

$ENV_FILE        = ".env"
$SECRETS_FILE    = ".env.secrets"
$SECRETS_DIR     = "docker/secrets"
$PLACEHOLDER     = "SeT_tHiS_iN_0x3A-.env.secrets-"

# ── color helpers ──────────────────────────────────────────────────────────────
function Write-Ok    { param($msg) Write-Host "  [OK]    $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "  [WARN]  $msg" -ForegroundColor Yellow }
function Write-Err   { param($msg) Write-Host "  [ERROR] $msg" -ForegroundColor Red }
function Write-Hdr   { param($msg) Write-Host "`n$msg" -ForegroundColor White }

$script:Errors = 0
function noteError { $script:Errors++ }

# ── helpers ────────────────────────────────────────────────────────────────────

# Derive the authoritative secret key list from .env by grepping for
# the placeholder marker. Any line in .env of the form KEY=<placeholder>
# is treated as a declared secret; this is the same signal `secrets.ps1`
# uses when bootstrapping .env.secrets.
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

# ── pre-flight ─────────────────────────────────────────────────────────────────
if (-not (Test-Path $ENV_FILE)) {
  Write-Host "ERROR: $ENV_FILE not found. Run from the repo root." -ForegroundColor Red
  exit 1
}

Write-Host "`nEnvironment/Secrets Check" -ForegroundColor White
Write-Host "Running from: $(Get-Location)"

# ── No .env.secrets: warn-only paths ──────────────────────────────────────────
#
# Without .env.secrets the user is in dev/env-only mode. Docker will start
# using whatever is in .env. We warn about the security posture but never
# block — a fresh clone with all placeholders is a legitimate starting point.

if (-not (Test-Path $SECRETS_FILE)) {
  if (Test-EnvHasPlaceholders) {
    Write-Hdr "Mode: raw dev (no secrets configured)"
    Write-Warn "Secret variables in .env still have placeholder values."
    Write-Warn "Services that depend on secrets (auth, database passwords, etc.) will not work"
    Write-Warn "until you either:"
    Write-Warn "  a) Edit .env directly with real values (simple dev setup), or"
    Write-Warn "  b) Run .\secrets.ps1 — it bootstraps $SECRETS_FILE from .env, then re-run it"
    Write-Warn "     after filling in real values to generate docker/secrets/*.txt"
  } else {
    Write-Hdr "Mode: env-only"
    Write-Warn "Running without docker secrets — secret values are set directly in .env."
    Write-Warn "This works for development. For production, consider using secrets.ps1."
  }
  Write-Host "`nCheck complete (warnings only).`n" -ForegroundColor Green
  exit 0
}

# ── .env.secrets exists: validate the full chain ──────────────────────────────
#
# Once .env.secrets is present the operator has committed to the secrets path.
# Broken links in the chain will cause docker compose to fail or services to
# authenticate with wrong credentials. These are hard errors.

# Mixed-state advisory
if (Test-EnvHasRealValues) {
  Write-Hdr "Advisory: mixed configuration detected"
  Write-Warn ".env has real secret values AND .env.secrets also exists."
  Write-Warn "Docker Compose loads .env first; docker/secrets/ takes effect only when"
  Write-Warn "compose is invoked with --env-file docker/.env.secrets.docker."
  Write-Warn "Reconcile to one approach to avoid confusion:"
  Write-Warn "  - env-only: remove .env.secrets and docker/secrets/*.txt"
  Write-Warn "  - secrets:  restore .env placeholder sentinels, keep .env.secrets"
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

Write-Hdr "Checking docker/secrets/ is populated and in sync"

if (-not (Test-Path $SECRETS_DIR)) {
  Write-Err "docker/secrets/ directory does not exist — run .\secrets.ps1 to generate secret files"
  noteError
} else {
  foreach ($key in (Get-EnvSecretKeys)) {
    $secretName = $key.ToLower()
    $secretFile = Join-Path $SECRETS_DIR "$secretName.txt"
    if (-not (Test-Path $secretFile)) {
      Write-Err "$secretFile missing — run .\secrets.ps1 to generate and apply secrets"
      noteError
    } else {
      $envVal  = Get-EnvValue -File $SECRETS_FILE -Key $key
      $fileVal = (Get-Content $secretFile -Raw).TrimEnd("`r`n")
      if ($envVal -ne $fileVal) {
        Write-Err "${key}: $secretFile is stale (out of sync with .env.secrets) — re-run .\secrets.ps1"
        noteError
      } else {
        Write-Ok "$key → $secretFile"
      }
    }
  }
}

# ── summary ────────────────────────────────────────────────────────────────────
Write-Host ""
if ($script:Errors -gt 0) {
  Write-Host "$($script:Errors) error(s) found. The secrets chain is broken — docker compose will fail or services will use wrong credentials." -ForegroundColor Red
  Write-Host "Fix the issues above and re-run .\check-env.ps1`n"
  exit 1
} else {
  Write-Host "All checks passed.`n" -ForegroundColor Green
  exit 0
}
