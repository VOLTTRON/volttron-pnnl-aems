#
# Apply changed secrets to running services.
#
# Detects which secrets differ between .env.secrets (or .env in env-only mode)
# and the currently-deployed docker/secrets/ files, then:
#   1. Runs ALTER ROLE / kcadm commands inside running containers to update credentials
#   2. Writes new values to docker/secrets/ via secrets.ps1
#   3. Restarts affected services
#
# Usage:
#   .\rotate-secrets.ps1                        # auto-detect all changed secrets
#   .\rotate-secrets.ps1 KEY1 KEY2 ...          # rotate specific secrets only
#   .\rotate-secrets.ps1 --dry-run              # print plan without executing
#
# Must be run from the repo root.

param(
  [switch]$DryRun,
  [Parameter(ValueFromRemainingArguments)]
  [string[]]$ExplicitKeys
)

$ErrorActionPreference = "Stop"

$ENV_FILE        = ".env"
$SECRETS_FILE    = ".env.secrets"
$SECRETS_EXAMPLE = ".env.secrets.example"
$SECRETS_DIR     = "docker/secrets"
$PLACEHOLDER     = "SeT_tHiS_iN_0x3A-.env.secrets-"

# ── color helpers ──────────────────────────────────────────────────────────────
function Write-Info  { param($msg) Write-Host "  ->  $msg" -ForegroundColor Cyan }
function Write-Ok    { param($msg) Write-Host "  v  $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "  !  $msg" -ForegroundColor Yellow }
function Write-Err   { param($msg) Write-Host "  x  $msg" -ForegroundColor Red }
function Write-Hdr   { param($msg) Write-Host "`n$msg" -ForegroundColor White }
function Write-Dry   { param($msg) Write-Host "  [dry-run] $msg" -ForegroundColor Yellow }

$script:Warnings = 0
function noteWarn { $script:Warnings++ }

# ── helpers ────────────────────────────────────────────────────────────────────

function Get-EnvValue {
  param([string]$File, [string]$Key)
  $line = Get-Content $File | Where-Object {
    $_ -notmatch '^\s*#' -and $_ -match "^${Key}="
  } | Select-Object -First 1
  if ($line) { ($line -split '=', 2)[1].Trim() } else { '' }
}

function Get-ExampleKeys {
  Get-Content $SECRETS_EXAMPLE | Where-Object {
    $_ -notmatch '^\s*#' -and $_ -match '='
  } | ForEach-Object { ($_ -split '=', 2)[0].Trim() }
}

function Get-ProjectName {
  $val = Get-EnvValue -File $ENV_FILE -Key "COMPOSE_PROJECT_NAME"
  if ($val) { $val } else { "skeleton" }
}

function Test-ContainerRunning {
  param([string]$Name)
  $running = docker ps --format '{{.Names}}' 2>$null
  return $running -contains $Name
}

function Get-OldSecret {
  param([string]$Key)
  $secretName = $Key.ToLower()
  $secretFile = Join-Path $SECRETS_DIR "$secretName.txt"
  if (Test-Path $secretFile) {
    return (Get-Content $secretFile -Raw).TrimEnd("`r`n")
  }
  return ''
}

function Invoke-OrDry {
  param([string]$Cmd)
  if ($DryRun) {
    Write-Dry $Cmd
  } else {
    Invoke-Expression $Cmd
  }
}

# ── pre-flight ─────────────────────────────────────────────────────────────────
if (-not (Test-Path $ENV_FILE)) {
  Write-Host "ERROR: $ENV_FILE not found. Run from the repo root." -ForegroundColor Red
  exit 1
}
if (-not (Test-Path $SECRETS_EXAMPLE)) {
  Write-Host "ERROR: $SECRETS_EXAMPLE not found. Run from the repo root." -ForegroundColor Red
  exit 1
}

$dryLabel = if ($DryRun) { " (dry-run)" } else { "" }
Write-Host "`nSecret Rotation$dryLabel" -ForegroundColor White
Write-Host "Running from: $(Get-Location)"

$PROJECT = Get-ProjectName

# ── mode detection ─────────────────────────────────────────────────────────────
$EnvOnly = -not (Test-Path $SECRETS_FILE)

# ══════════════════════════════════════════════════════════════════════════════
# ENV-ONLY MODE
# ══════════════════════════════════════════════════════════════════════════════
if ($EnvOnly) {
  Write-Hdr "Mode: env-only"
  Write-Warn "No .env.secrets found — operating in env-only mode."
  Write-Warn "No SQL credential changes will be performed."
  Write-Warn "If you changed a DB password in .env, you must also run ALTER ROLE"
  Write-Warn "inside the running container manually, or wipe and recreate its volume."
  Write-Host ""

  $restartServices = if ($ExplicitKeys.Count -gt 0) {
    # Restart only services associated with the named keys; simplified for env-only
    @("server", "client")
  } else {
    @("server", "client")
  }

  Write-Hdr "Restarting services"
  foreach ($svc in ($restartServices | Sort-Object -Unique)) {
    $container = "${PROJECT}-${svc}"
    if (Test-ContainerRunning $container) {
      Write-Info "Restarting $svc"
      Invoke-OrDry "docker compose restart $svc"
      Write-Ok "$svc restarted"
    } else {
      Write-Warn "$svc is not running — skipping"
    }
  }

  Write-Host "`nDone. Env-only rotation complete.`n" -ForegroundColor Green
  exit 0
}

# ══════════════════════════════════════════════════════════════════════════════
# SECRETS MODE
# ══════════════════════════════════════════════════════════════════════════════

$keysToCheck = if ($ExplicitKeys.Count -gt 0) { $ExplicitKeys } else { Get-ExampleKeys }

Write-Hdr "Detecting changes"
$changedKeys = @()
foreach ($key in $keysToCheck) {
  $newVal = Get-EnvValue -File $SECRETS_FILE -Key $key
  if ([string]::IsNullOrEmpty($newVal)) {
    Write-Warn "${key}: not found in $SECRETS_FILE — skipping"
    continue
  }
  $secretName = $key.ToLower()
  $secretFile = Join-Path $SECRETS_DIR "$secretName.txt"
  if (-not (Test-Path $secretFile)) {
    Write-Info "${key}: no deployed secret file — will create"
    $changedKeys += $key
  } else {
    $deployedVal = (Get-Content $secretFile -Raw).TrimEnd("`r`n")
    if ($newVal -ne $deployedVal) {
      Write-Info "${key}: changed"
      $changedKeys += $key
    } else {
      Write-Ok "${key}: unchanged"
    }
  }
}

if ($changedKeys.Count -eq 0) {
  Write-Host "`nAll secrets are current. No rotation needed.`n" -ForegroundColor Green
  exit 0
}

# ── process each changed key ───────────────────────────────────────────────────
Write-Hdr "Applying credential changes"

$restartServices = [System.Collections.Generic.List[string]]::new()
$KC_CONTAINER = "${PROJECT}-keycloak"
$KC_ADMIN = Get-EnvValue -File $ENV_FILE -Key "KEYCLOAK_ADMIN"
$KC_AUTHED = $false

foreach ($key in $changedKeys) {
  $newVal = Get-EnvValue -File $SECRETS_FILE -Key $key
  $oldVal = Get-OldSecret -Key $key

  switch ($key) {

    "DATABASE_PASSWORD" {
      $dbUser      = Get-EnvValue -File $ENV_FILE -Key "DATABASE_USERNAME"
      $dbContainer = "${PROJECT}-database"
      Write-Info "Rotating DATABASE_PASSWORD (Postgres user: $dbUser)"
      if (Test-ContainerRunning $dbContainer) {
        $escaped = $newVal -replace "'", "''"
        Invoke-OrDry "docker exec '$dbContainer' psql -U '$dbUser' -c `"ALTER ROLE \`"${dbUser}\`" WITH PASSWORD '${escaped}';\`""
        Write-Ok "ALTER ROLE executed"
      } else {
        Write-Warn "$dbContainer not running — file updated, DB credential NOT changed"
        noteWarn
      }
      $restartServices.Add("server")
      $restartServices.Add("client")
    }

    "KEYCLOAK_DATABASE_PASSWORD" {
      $kcDbUser      = Get-EnvValue -File $ENV_FILE -Key "KEYCLOAK_DATABASE_USERNAME"
      $kcDbContainer = "${PROJECT}-keycloak-db"
      Write-Info "Rotating KEYCLOAK_DATABASE_PASSWORD (Postgres user: $kcDbUser)"
      if (Test-ContainerRunning $kcDbContainer) {
        $escaped = $newVal -replace "'", "''"
        Invoke-OrDry "docker exec '$kcDbContainer' psql -U '$kcDbUser' -c `"ALTER ROLE \`"${kcDbUser}\`" WITH PASSWORD '${escaped}';\`""
        Write-Ok "ALTER ROLE executed"
      } else {
        Write-Warn "$kcDbContainer not running — file updated, DB credential NOT changed"
        noteWarn
      }
      $restartServices.Add("keycloak")
    }

    "NOMINATIM_DATABASE_PASSWORD" {
      $nomContainer = "${PROJECT}-nominatim"
      Write-Info "Rotating NOMINATIM_DATABASE_PASSWORD"
      if (Test-ContainerRunning $nomContainer) {
        $escaped = $newVal -replace "'", "''"
        Invoke-OrDry "docker exec '$nomContainer' psql -U nominatim -c `"ALTER ROLE nominatim WITH PASSWORD '${escaped}';\`""
        Write-Ok "ALTER ROLE executed"
      } else {
        Write-Warn "$nomContainer not running — file updated, DB credential NOT changed"
        noteWarn
      }
      $restartServices.Add("nominatim")
    }

    "BOOKSTACK_DATABASE_PASSWORD" {
      $wikiDbContainer = "${PROJECT}-wiki-db"
      $wikiDbUser      = Get-EnvValue -File $ENV_FILE -Key "BOOKSTACK_DATABASE_USERNAME"
      $rootPw          = Get-OldSecret -Key "BOOKSTACK_ROOT_PASSWORD"
      if ([string]::IsNullOrEmpty($rootPw)) {
        $rootPw = Get-EnvValue -File $SECRETS_FILE -Key "BOOKSTACK_ROOT_PASSWORD"
      }
      Write-Info "Rotating BOOKSTACK_DATABASE_PASSWORD (MariaDB user: $wikiDbUser)"
      if (Test-ContainerRunning $wikiDbContainer) {
        $escapedNew  = $newVal  -replace "'", "\'"
        $escapedRoot = $rootPw  -replace "'", "\'"
        Invoke-OrDry "docker exec '$wikiDbContainer' mysql -u root -p'$escapedRoot' -e `"ALTER USER '${wikiDbUser}'@'%' IDENTIFIED BY '$escapedNew'; FLUSH PRIVILEGES;\`""
        Write-Ok "ALTER USER executed"
      } else {
        Write-Warn "$wikiDbContainer not running — file updated, DB credential NOT changed"
        noteWarn
      }
      $restartServices.Add("wiki")
    }

    "BOOKSTACK_ROOT_PASSWORD" {
      $wikiDbContainer = "${PROJECT}-wiki-db"
      Write-Info "Rotating BOOKSTACK_ROOT_PASSWORD (MariaDB root)"
      if (Test-ContainerRunning $wikiDbContainer) {
        $escapedNew = $newVal -replace "'", "\'"
        $escapedOld = $oldVal -replace "'", "\'"
        Invoke-OrDry "docker exec '$wikiDbContainer' mysql -u root -p'$escapedOld' -e `"ALTER USER 'root'@'%' IDENTIFIED BY '$escapedNew'; FLUSH PRIVILEGES;\`""
        Write-Ok "ALTER USER root executed"
      } else {
        Write-Warn "$wikiDbContainer not running — file updated, DB credential NOT changed"
        noteWarn
      }
      $restartServices.Add("wiki-db")
      $restartServices.Add("wiki")
    }

    "REDIS_PASSWORD" {
      Write-Info "Rotating REDIS_PASSWORD (restart required to re-read startup command)"
      $restartServices.Add("redis")
      $restartServices.Add("server")
    }

    "KEYCLOAK_ADMIN_PASSWORD" {
      Write-Info "Rotating KEYCLOAK_ADMIN_PASSWORD"
      if (Test-ContainerRunning $KC_CONTAINER) {
        if (-not $KC_AUTHED) {
          Invoke-OrDry "docker exec '$KC_CONTAINER' /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080/auth/sso --realm master --user '$KC_ADMIN' --password '$oldVal'"
          $KC_AUTHED = $true
        }
        $escaped = $newVal -replace "'", "\'"
        Invoke-OrDry "docker exec '$KC_CONTAINER' /opt/keycloak/bin/kcadm.sh set-password -r master --username '$KC_ADMIN' --new-password '$escaped'"
        Write-Ok "Keycloak admin password updated"
        $KC_AUTHED = $false  # token now stale
      } else {
        Write-Warn "$KC_CONTAINER not running — file updated, Keycloak admin password NOT changed"
        noteWarn
      }
      $restartServices.Add("keycloak")
    }

    "KEYCLOAK_CLIENT_SECRET" {
      Write-Info "Rotating KEYCLOAK_CLIENT_SECRET"
      if (Test-ContainerRunning $KC_CONTAINER) {
        if (-not $KC_AUTHED) {
          $kcAdminPw = Get-OldSecret -Key "KEYCLOAK_ADMIN_PASSWORD"
          if ([string]::IsNullOrEmpty($kcAdminPw)) { $kcAdminPw = Get-EnvValue -File $SECRETS_FILE -Key "KEYCLOAK_ADMIN_PASSWORD" }
          Invoke-OrDry "docker exec '$KC_CONTAINER' /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080/auth/sso --realm master --user '$KC_ADMIN' --password '$kcAdminPw'"
          $KC_AUTHED = $true
        }
        $escaped = $newVal -replace "'", "\'"
        Invoke-OrDry "docker exec '$KC_CONTAINER' sh -c `"/opt/keycloak/bin/kcadm.sh get clients -r default --fields id,clientId | grep -B1 '\`"clientId\`" : \`"app\`"' | grep id | sed 's/.*: \`"//;s/\`".*//' | xargs -I{} /opt/keycloak/bin/kcadm.sh update clients/{} -r default -s secret='$escaped'\`""
        Write-Ok "Keycloak app client secret updated"
      } else {
        Write-Warn "$KC_CONTAINER not running — file updated, Keycloak client secret NOT changed"
        noteWarn
      }
      $restartServices.Add("server")
    }

    "BOOKSTACK_KEYCLOAK_CLIENT_SECRET" {
      Write-Info "Rotating BOOKSTACK_KEYCLOAK_CLIENT_SECRET"
      if (Test-ContainerRunning $KC_CONTAINER) {
        if (-not $KC_AUTHED) {
          $kcAdminPw = Get-OldSecret -Key "KEYCLOAK_ADMIN_PASSWORD"
          if ([string]::IsNullOrEmpty($kcAdminPw)) { $kcAdminPw = Get-EnvValue -File $SECRETS_FILE -Key "KEYCLOAK_ADMIN_PASSWORD" }
          Invoke-OrDry "docker exec '$KC_CONTAINER' /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080/auth/sso --realm master --user '$KC_ADMIN' --password '$kcAdminPw'"
          $KC_AUTHED = $true
        }
        $wikiClientId = Get-EnvValue -File $ENV_FILE -Key "BOOKSTACK_KEYCLOAK_CLIENT_ID"
        $escaped = $newVal -replace "'", "\'"
        Invoke-OrDry "docker exec '$KC_CONTAINER' sh -c `"/opt/keycloak/bin/kcadm.sh get clients -r default --fields id,clientId | grep -B1 '\`"clientId\`" : \`"$wikiClientId\`"' | grep id | sed 's/.*: \`"//;s/\`".*//' | xargs -I{} /opt/keycloak/bin/kcadm.sh update clients/{} -r default -s secret='$escaped'\`""
        Write-Ok "Keycloak wiki client secret updated"
      } else {
        Write-Warn "$KC_CONTAINER not running — file updated, Keycloak wiki client secret NOT changed"
        noteWarn
      }
      $restartServices.Add("wiki")
    }

    { $_ -in @("SESSION_SECRET", "JWT_SECRET", "WORKER_TOKEN", "BOOKSTACK_SESSION_SECRET") } {
      Write-Info "Rotating $key (app-only — no DB action needed)"
      $restartServices.Add("server")
      if ($key -eq "WORKER_TOKEN")             { $restartServices.Add("backup") }
      if ($key -eq "BOOKSTACK_SESSION_SECRET") { $restartServices.Add("wiki")   }
    }

    default {
      Write-Warn "${key}: no rotation handler defined — file will be updated but no live action taken"
    }
  }
}

# ── update secret files ────────────────────────────────────────────────────────
Write-Hdr "Updating docker/secrets/"
if ($DryRun) {
  Write-Dry "Would run: .\secrets.ps1"
} else {
  & .\secrets.ps1
  Write-Ok "Secret files updated"
}

# ── restart affected services ──────────────────────────────────────────────────
$toRestart = ($restartServices | Sort-Object -Unique | Where-Object { $_ -ne '' })

if ($toRestart.Count -gt 0) {
  Write-Hdr "Restarting affected services: $($toRestart -join ', ')"
  foreach ($svc in $toRestart) {
    $container = "${PROJECT}-${svc}"
    if (Test-ContainerRunning $container) {
      Write-Info "Restarting $svc"
      Invoke-OrDry "docker compose restart $svc"
      Write-Ok "$svc restarted"
    } else {
      Write-Warn "$svc is not running — skipping restart"
    }
  }
}

# ── summary ────────────────────────────────────────────────────────────────────
Write-Host ""
if ($script:Warnings -gt 0) {
  Write-Host "Rotation complete with $($script:Warnings) warning(s)." -ForegroundColor Yellow
  Write-Host "Review warnings above — some credential changes may require manual follow-up.`n"
} else {
  Write-Host "Rotation complete.`n" -ForegroundColor Green
}
