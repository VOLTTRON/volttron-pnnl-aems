#
# Manage the secret pipeline: .env -> .env.secrets -> docker/secrets/*.txt.
#
# One entry point for every secret operation:
#
#   1. FIRST RUN (no .env.secrets): bootstrap it from .env's placeholder-
#      marked keys. Exits after writing the stub so you can fill in real
#      values. Nothing under docker/secrets/ is touched.
#
#   2. FRESH DEPLOY (no docker/secrets/<key>.txt yet): write each secret
#      file. No rotation is needed - nothing is running with the old
#      credential yet.
#
#   3. ROTATION (docker/secrets/<key>.txt exists with a value that differs
#      from .env.secrets AND a live deployment exists): run the
#      credential-change SQL/kcadm command against the running container
#      BEFORE overwriting the file, then restart the affected services.
#      If the container isn't running, REFUSE - writing the file without
#      rotating would leave the next boot unable to authenticate against
#      the seeded data volume. Pass -Force to override.
#
#   4. NO-OP (values already match): silent skip.
#
#   5. RESIDUE (docker/secrets/<key>.txt differs from .env.secrets BUT
#      no ${PROJECT}-* containers or ${PROJECT}_* volumes exist): treat
#      the mismatched files as residue from a prior run, prompt to
#      overwrite, and skip the rotation lane. -Yes or -Force
#      auto-confirms the prompt.
#
# Usage:
#   .\secrets.ps1                                # process every key
#   .\secrets.ps1 KEY1 KEY2 ...                  # limit to named keys
#   .\secrets.ps1 -DryRun                        # print plan without executing
#   .\secrets.ps1 -Force                         # skip rotation; just write files
#   .\secrets.ps1 -Yes                           # auto-confirm residue overwrite
#
# Must be run from the repo root.

param(
  [switch]$DryRun,
  [switch]$Force,
  [switch]$Yes,
  [Parameter(ValueFromRemainingArguments)]
  [string[]]$ExplicitKeys
)

$ErrorActionPreference = "Stop"

$ENV_FILE         = ".env"
$SECRETS_FILE     = ".env.secrets"
$SECRETS_DIR      = "docker/secrets"
$SECRETS_ENV_FILE = "docker/.env.secrets.docker"
# Marker value in .env that flags a key as "needs a real secret before
# deployment." Kept in one place - helpers grep on this exact string.
$PLACEHOLDER      = "SeT_tHiS_iN_0x3A-.env.secrets-"

# ── color helpers ──────────────────────────────────────────────────────────────
function Write-Info { param($msg) Write-Host "  ->  $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "  v   $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  !   $msg" -ForegroundColor Yellow }
function Write-Err  { param($msg) Write-Host "  x   $msg" -ForegroundColor Red }
function Write-Hdr  { param($msg) Write-Host "`n$msg" -ForegroundColor White }
function Write-Dry  { param($msg) Write-Host "  [dry-run] $msg" -ForegroundColor Yellow }

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

# Derive the authoritative secret key list from .env by grepping for the
# placeholder marker. Any line in .env of the form KEY=<placeholder> is
# treated as a declared secret.
function Get-EnvSecretKeys {
    Get-Content $ENV_FILE | ForEach-Object {
        if ($_.TrimEnd() -match "^([A-Za-z_][A-Za-z0-9_]*)=$([regex]::Escape($PLACEHOLDER))$") {
            $matches[1]
        }
    }
}

# Returns objects with Key and Value for every variable in .env whose name
# ends in _PASSWORD, _SECRET, _TOKEN, or _KEY and whose value is non-empty
# and not the placeholder. These are misplaced secrets that belong in .env.secrets.
function Get-MisplacedKeys {
    Get-Content $ENV_FILE | ForEach-Object {
        if ($_ -notmatch '^\s*#' -and
            $_ -match '^([A-Za-z_][A-Za-z0-9_]*_(PASSWORD|SECRET|TOKEN|KEY))=(.+)$') {
            $key = $matches[1]; $val = $matches[3]
            if ($val -and $val -ne $PLACEHOLDER) {
                [PSCustomObject]@{ Key = $key; Value = $val }
            }
        }
    }
}

# Write Key=Value into File, replacing an existing entry or appending a new
# one. Line-by-line rewrite so special characters in Value are safe.
function Update-SecretsEntry {
    param([string]$File, [string]$Key, [string]$Value)
    $lines   = Get-Content $File -Encoding UTF8
    $updated = $false
    $result  = @()
    foreach ($line in $lines) {
        if ($line -match "^${Key}=") { $result += "${Key}=${Value}"; $updated = $true }
        else                         { $result += $line }
    }
    if (-not $updated) { $result += "${Key}=${Value}" }
    Set-Content -Path $File -Value $result -Encoding UTF8
    Set-OwnerOnlyAcl -Path $File
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

# True iff any docker container (running or stopped) exists whose name
# starts with "${Project}-". Compose sets container names of the form
# <project>-<service> when container_name uses ${COMPOSE_PROJECT_NAME}.
function Test-ProjectHasContainers {
    param([string]$Project)
    $names = docker ps -a --format '{{.Names}}' 2>$null
    if (-not $names) { return $false }
    return @($names | Where-Object { $_ -like "$Project-*" }).Count -gt 0
}

# Per-secret data volume: names the compose-declared volume that holds
# seeded credentials for each rotation-capable secret. When the volume
# is absent, overwriting the corresponding docker/secrets/*.txt file is
# safe - no seeded state can be out of sync with the file.
#
# Keys without a volume entry are either app-only (rotation via restart)
# or read the credential from the compose command line (REDIS_PASSWORD).
$SECRET_DATA_VOLUME = @{
    "DATABASE_PASSWORD"                = "database-data"
    "KEYCLOAK_ADMIN_PASSWORD"          = "keycloak-data"
    "KEYCLOAK_DATABASE_PASSWORD"       = "keycloak-data"
    "KEYCLOAK_CLIENT_SECRET"           = "keycloak-data"
    "KEYCLOAK_GRAFANA_CLIENT_SECRET"   = "keycloak-data"
    "BOOKSTACK_KEYCLOAK_CLIENT_SECRET" = "keycloak-data"
    "NOMINATIM_DATABASE_PASSWORD"      = "nominatim-data"
    "BOOKSTACK_ROOT_PASSWORD"          = "wiki-data"
    "BOOKSTACK_DATABASE_PASSWORD"      = "wiki-data"
    "HISTORIAN_DATABASE_PASSWORD"      = "historian-data"
    "HISTORIAN_REPLICATOR_PASSWORD"    = "historian-data"
    "GRAFANA_ADMIN_PASSWORD"           = "grafana-data"
    "GRAFANA_DATABASE_PASSWORD"        = "grafana-data"
}

# True iff a docker named volume exists on this host that would hold
# seeded credentials for $Key under this project prefix. Returns false
# for keys with no volume dependency (they're safe to overwrite by
# definition).
function Test-KeyDataVolumeExists {
    param([string]$Project, [string]$Key)
    $vol = $SECRET_DATA_VOLUME[$Key]
    if (-not $vol) { return $false }
    $vols = docker volume ls --format '{{.Name}}' 2>$null
    if (-not $vols) { return $false }
    return $vols -contains "${Project}_${vol}"
}

# Read the currently-deployed value from disk. Returns '' if the file
# doesn't exist.
function Get-DeployedSecret {
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

# Try to tighten ACLs on the given path to owner-only. Silently skips
# when the shell isn't elevated (non-admins can't disable inheritance).
function Set-OwnerOnlyAcl {
    param([string]$Path)
    try {
        $acl = Get-Acl $Path
        $acl.SetAccessRuleProtection($true, $false)
        $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
            [System.Security.Principal.WindowsIdentity]::GetCurrent().Name,
            "FullControl",
            "Allow"
        )
        $acl.SetAccessRule($rule)
        Set-Acl $Path $acl
    } catch [System.Security.AccessControl.PrivilegeNotHeldException] {
        if (-not $script:AclWarnShown) {
            Write-Host "  (note: skipping ACL tightening - run from an elevated PowerShell to disable inheritance)"
            $script:AclWarnShown = $true
        }
    }
}

# Write docker/.env.secrets.docker with the given _SOURCE lines block.
# Called on every successful secrets.ps1 run so the root docker-compose.yml
# include: env_file always reflects the current state and plain
# `docker compose up -d` works without extra --env-file flags.
function Write-SecretsEnv {
    param([string]$SourceLines)
    $envHeader = @"
# Auto-generated by secrets.ps1 - do not edit manually.
# Populated when secrets.ps1 has been run with real values in .env.secrets.
# Referenced by the root docker-compose.yml include: env_file so that
# plain ``docker compose up -d`` activates real Docker secrets without any
# --env-file flags.

# Image-defined _FILE vars tell database containers to read passwords from
# /run/secrets/ instead of plain env vars. These are only active when
# compose mounts a real (non-empty) secret file at the declared path.

# Main application database
POSTGRES_PASSWORD_FILE=/run/secrets/database_password

# Keycloak SSO service
KEYCLOAK_ADMIN_PASSWORD_FILE=/run/secrets/keycloak_admin_password
KC_DB_PASSWORD_FILE=/run/secrets/keycloak_database_password

# Keycloak database
KC_DB_POSTGRES_PASSWORD_FILE=/run/secrets/keycloak_database_password

# Nominatim geocoding service
NOMINATIM_POSTGRES_PASSWORD_FILE=/run/secrets/nominatim_database_password

# BookStack wiki database
MYSQL_ROOT_PASSWORD_FILE=/run/secrets/bookstack_root_password
MYSQL_PASSWORD_FILE=/run/secrets/bookstack_database_password

# Historian database. Interpolated by the historian service's
# ``POSTGRES_PASSWORD_FILE: `${HISTORIAN_DATABASE_PASSWORD_FILE:-}`` so
# the main-db name above doesn't leak into the historian container.
HISTORIAN_DATABASE_PASSWORD_FILE=/run/secrets/historian_database_password

# Compose top-level ``secrets:`` entries interpolate <KEY>_SOURCE to pick
# the host-side file. When unset, compose falls back to the tracked
# empty ``docker/secrets/.placeholder``. The lines below (one per key in
# .env.secrets) override that so real secret files get mounted.
"@
    $envFooter = @"

POSTGRES_PASSWORD=
KEYCLOAK_ADMIN_PASSWORD=
KC_DB_PASSWORD=
"@
    Set-Content -Path $SECRETS_ENV_FILE -Value ($envHeader + "`n" + $SourceLines + $envFooter)
    Set-OwnerOnlyAcl -Path $SECRETS_ENV_FILE
}

# ── pre-flight ─────────────────────────────────────────────────────────────────
if (-not (Test-Path $ENV_FILE)) {
    Write-Err "$ENV_FILE not found. Run from the repo root."
    exit 1
}

# ══════════════════════════════════════════════════════════════════════════════
# BOOTSTRAP PATH - .env.secrets doesn't exist
# ══════════════════════════════════════════════════════════════════════════════
if (-not (Test-Path $SECRETS_FILE)) {
    Write-Host "No $SECRETS_FILE found - bootstrapping from $ENV_FILE."

    $secretKeys    = [System.Collections.Generic.List[string]]@(Get-EnvSecretKeys)
    $misplacedKeys = @(Get-MisplacedKeys)

    # Warn about and merge in any misplaced secrets found in .env
    if ($misplacedKeys.Count -gt 0) {
        Write-Hdr "WARNING: Secret values found in $ENV_FILE"
        foreach ($mp in $misplacedKeys) {
            Write-Warn "  $($mp.Key) has a real value in $ENV_FILE - it belongs in $SECRETS_FILE"
        }
        Write-Warn "Migrating those values into $SECRETS_FILE."
        Write-Warn "Reset them to the placeholder in $ENV_FILE when possible."
        noteWarn
        foreach ($mp in $misplacedKeys) {
            if (-not $secretKeys.Contains($mp.Key)) { $secretKeys.Add($mp.Key) }
        }
    }

    if ($secretKeys.Count -eq 0) {
        Write-Err "No secret keys found in $ENV_FILE (expected values of '$PLACEHOLDER' or credential-named keys with real values)."
        exit 1
    }

    $header = @"
# $SECRETS_FILE
#
# Real values for every secret marked in .env with the placeholder
# '$PLACEHOLDER'.
# This file is gitignored - never commit real values.
#
# Workflow:
#   1. Edit the values below.
#   2. Re-run .\secrets.ps1 to write docker/secrets/*.txt and
#      docker/.env.secrets.docker.
#   3. Bring the stack up:
#        docker compose up -d
#
# Add a new secret? Add it to .env with the placeholder value and
# re-run .\secrets.ps1 - this file will be regenerated with the new
# key preserved alongside any existing values.

"@

    # Pre-fill misplaced secrets; leave placeholder-declared ones blank.
    $body = ($secretKeys | ForEach-Object {
        $envVal = Get-EnvValue -File $ENV_FILE -Key $_
        if ($envVal -and $envVal -ne $PLACEHOLDER) { "${_}=${envVal}" }
        else { "${_}=" }
    }) -join "`n"

    Set-Content -Path $SECRETS_FILE -Value ($header + $body) -NoNewline
    Set-OwnerOnlyAcl -Path $SECRETS_FILE

    # Reset docker/.env.secrets.docker to empty so that `docker compose up -d`
    # falls back to the .env placeholder defaults until real secrets are deployed.
    # Without this, stale _SOURCE paths from a prior run cause compose to
    # auto-create missing files as directories, corrupting future secret mounts.
    Set-Content -Path $SECRETS_ENV_FILE -Value '' -NoNewline

    $blankCount = (Get-Content $SECRETS_FILE | Where-Object { $_ -match '^[A-Za-z_][A-Za-z0-9_]*=$' }).Count

    if ($blankCount -gt 0) {
        Write-Host ""
        Write-Host "Wrote $($secretKeys.Count) stub entries to $SECRETS_FILE."
        if ($misplacedKeys.Count -gt 0) { Write-Host "Some entries were pre-populated from $ENV_FILE values." }
        Write-Host ""
        Write-Host "Next steps:"
        Write-Host "  1. Edit $SECRETS_FILE and fill in the $blankCount remaining blank entries."
        Write-Host "  2. Re-run .\secrets.ps1 to generate docker/secrets/*.txt and"
        Write-Host "     docker/.env.secrets.docker."
        Write-Host ""
        exit 0
    }

    Write-Info "All secrets pre-populated from $ENV_FILE - proceeding with deployment."
}

# ══════════════════════════════════════════════════════════════════════════════
# DEPLOY / ROTATE PATH - .env.secrets exists
# ══════════════════════════════════════════════════════════════════════════════

$dryLabel   = if ($DryRun) { " (dry-run)"                    } else { "" }
$forceLabel = if ($Force)  { " (--force: skipping rotation)" } else { "" }
Write-Host "`nSecret Deploy${dryLabel}${forceLabel}" -ForegroundColor White
Write-Host "Running from: $(Get-Location)"

$PROJECT = Get-ProjectName

if (-not (Test-Path $SECRETS_DIR)) {
    New-Item -ItemType Directory -Path $SECRETS_DIR | Out-Null
}

# Build the list of keys to process.
$keysToCheck = if ($ExplicitKeys.Count -gt 0) { $ExplicitKeys } else { @(Get-EnvSecretKeys) }

# ── misplaced-secret migration ─────────────────────────────────────────────────
# Scan .env for credential-named keys with real values that are absent or
# blank in .env.secrets. Warn and migrate them so the deploy pass can write
# their docker/secrets/*.txt files. Only runs on full (non-explicit-key) runs.
if ($ExplicitKeys.Count -eq 0) {
    $misplacedKeys = @(Get-MisplacedKeys)
    $migratedCount = 0
    foreach ($mp in $misplacedKeys) {
        $secretsVal = Get-EnvValue -File $SECRETS_FILE -Key $mp.Key
        if ([string]::IsNullOrEmpty($secretsVal) -or $secretsVal -eq $PLACEHOLDER) {
            Write-Warn "$($mp.Key): real value found in $ENV_FILE but missing from $SECRETS_FILE - migrating"
            Write-Warn "  Reset $($mp.Key) in $ENV_FILE to the placeholder when convenient."
            noteWarn
            if (-not $DryRun) {
                Update-SecretsEntry -File $SECRETS_FILE -Key $mp.Key -Value $mp.Value
            } else {
                Write-Dry "Would migrate $($mp.Key) from $ENV_FILE into $SECRETS_FILE"
            }
            $migratedCount++
        }
        # Always add to keysToCheck so .txt files get written even when
        # .env.secrets was already populated (e.g. by the bootstrap fall-through).
        if ($keysToCheck -notcontains $mp.Key) { $keysToCheck += $mp.Key }
    }
    if ($migratedCount -gt 0 -and -not $DryRun) {
        Write-Info "Migrated $migratedCount key(s) into $SECRETS_FILE"
    }
}

# ── residue check ─────────────────────────────────────────────────────────────
# Per-key check: for each key whose docker/secrets/*.txt differs from
# .env.secrets, is there ANY live state (running/stopped container or a
# seeded data volume) that would make live rotation necessary? If not,
# the file is residue from a prior run and can be safely overwritten.
# Prompt once with the full list so the user can approve all at once.
$residueKeys = [System.Collections.Generic.List[string]]::new()
foreach ($key in $keysToCheck) {
    $newVal = Get-EnvValue -File $SECRETS_FILE -Key $key
    $newIsEmpty = [string]::IsNullOrEmpty($newVal) -or $newVal -eq $PLACEHOLDER
    if ($newIsEmpty) { continue }

    $secretName = $key.ToLower()
    $secretFile = Join-Path $SECRETS_DIR "$secretName.txt"
    if (-not (Test-Path $secretFile)) { continue }

    $oldVal = Get-DeployedSecret -Key $key
    if ($newVal -eq $oldVal) { continue }

    # Would be classified as a rotation. Check whether any live state
    # would actually block it. Both container AND volume absent => the
    # file is residue.
    if (Test-ProjectHasContainers -Project $PROJECT) { continue }
    if (Test-KeyDataVolumeExists  -Project $PROJECT -Key $key) { continue }

    $residueKeys.Add($key)
}

if ($residueKeys.Count -gt 0) {
    Write-Hdr "No live deployment detected for changed keys"
    Write-Warn "The following docker/secrets/ files do not match ${SECRETS_FILE},"
    Write-Warn "and neither their container nor their data volume exists:"
    foreach ($key in $residueKeys) {
        Write-Warn "  $($key.ToLower()).txt"
    }
    Write-Host ""
    Write-Host "These files are residue from a prior run. No live rotation is"
    Write-Host "needed - the new values will be honored on the next ``docker"
    Write-Host "compose up``."
    Write-Host ""

    $confirmed = $false
    if ($DryRun) {
        Write-Dry "Would prompt to overwrite residue files"
        $confirmed = $true
    } elseif ($Yes -or $Force) {
        Write-Info "Auto-confirmed (-Yes / -Force)"
        $confirmed = $true
    } else {
        $answer = Read-Host "Overwrite these files from ${SECRETS_FILE}? [y/N]"
        if ($answer -match '^(y|yes)$') { $confirmed = $true }
    }

    if (-not $confirmed) {
        Write-Host ""
        Write-Err "Aborted by user."
        Write-Host "Re-run with -Yes to auto-confirm, or delete the residue files"
        Write-Host "manually and re-run."
        Write-Host ""
        exit 1
    }

    # Overwrite residue files in place so classification sees them as
    # matching .env.secrets. Rotation lane will not fire for these keys.
    if (-not $DryRun) {
        foreach ($key in $residueKeys) {
            $newVal     = Get-EnvValue -File $SECRETS_FILE -Key $key
            $secretName = $key.ToLower()
            $secretFile = Join-Path $SECRETS_DIR "$secretName.txt"
            Set-Content -Path $secretFile -Value $newVal -NoNewline
            Set-OwnerOnlyAcl -Path $secretFile
        }
        Write-Ok "Overwrote $($residueKeys.Count) residue file(s)"
    }
}

# ── classify ──────────────────────────────────────────────────────────────────
# For each key, decide the lane:
#   FreshWrites - no deployed file yet, .env.secrets has a real value.
#   Rotations   - deployed file exists with a different value; need to
#                 run the credential-change handler before overwriting.
#   Noops       - deployed file matches .env.secrets. Silent skip.
#   Conflicts   - deployed file exists but .env.secrets is empty or
#                 still holds the placeholder marker. Refuse.
#   Missing     - no deployed file AND no real value. Warn and skip.

Write-Hdr "Classifying secrets"

$FreshWrites = [System.Collections.Generic.List[string]]::new()
$Rotations   = [System.Collections.Generic.List[string]]::new()
$Noops       = [System.Collections.Generic.List[string]]::new()
$Conflicts   = [System.Collections.Generic.List[string]]::new()

foreach ($key in $keysToCheck) {
    $newVal = Get-EnvValue -File $SECRETS_FILE -Key $key
    $oldVal = Get-DeployedSecret -Key $key

    $secretName = $key.ToLower()
    $secretFile = Join-Path $SECRETS_DIR "$secretName.txt"

    $newIsEmpty = [string]::IsNullOrEmpty($newVal) -or $newVal -eq $PLACEHOLDER

    if (Test-Path $secretFile) {
        if ($newIsEmpty) {
            $Conflicts.Add($key)
        } elseif ($newVal -eq $oldVal) {
            $Noops.Add($key)
            Write-Ok "${key}: unchanged"
        } else {
            $Rotations.Add($key)
            Write-Info "${key}: changed - will rotate"
        }
    } else {
        if ($newIsEmpty) {
            Write-Warn "${key}: no value in $SECRETS_FILE - skipping"
        } else {
            $FreshWrites.Add($key)
            Write-Info "${key}: fresh write"
        }
    }
}

# ── bail on conflicts ─────────────────────────────────────────────────────────
if ($Conflicts.Count -gt 0) {
    Write-Hdr "Refusing to overwrite deployed secrets with empty values"
    foreach ($key in $Conflicts) {
        Write-Err "${key}: $SECRETS_FILE has no value, but docker/secrets/ has one deployed"
    }
    Write-Host ""
    Write-Host "Edit $SECRETS_FILE and fill in real values, then re-run."
    Write-Host "If you want to intentionally clear these secrets, delete the"
    Write-Host "corresponding docker/secrets/*.txt files first."
    Write-Host ""
    exit 1
}

# Early exit if nothing to do — but still regenerate docker/.env.secrets.docker
# so that the root docker-compose.yml include: env_file picks up the _SOURCE
# vars and plain `docker compose up -d` works without any extra flags.
if ($FreshWrites.Count -eq 0 -and $Rotations.Count -eq 0) {
    if (-not $DryRun) {
        $noopSourceLines = ""
        foreach ($key in Get-EnvSecretKeys) {
            $secretName = $key.ToLower()
            $noopSourceLines += "${key}_SOURCE=./secrets/${secretName}.txt`n"
        }
        Write-SecretsEnv -SourceLines $noopSourceLines
    }
    Write-Host "`nAll secrets are up to date.`n" -ForegroundColor Green
    exit 0
}

# ══════════════════════════════════════════════════════════════════════════════
# ROTATION PASS
# ══════════════════════════════════════════════════════════════════════════════
# Skipped entirely under -Force. Otherwise: for each key in Rotations,
# check the target container is running and dispatch to the handler. If
# any target container is down, abort BEFORE writing any files.

$RestartServices = [System.Collections.Generic.List[string]]::new()

# Postgres ALTER ROLE. When OldPw is omitted, assumes socket auth works
# without a password (POSIX peer or the default `trust` pg_hba shipped by
# the postgres image). When provided, authenticates via PGPASSWORD - needed
# for containers with a hardened pg_hba (e.g. the historian, whose local
# socket requires scram-sha-256 for non-postgres users). Returns $true on
# success, $false if the container is down.
function Invoke-PgRotate {
    param(
        [string]$Container,
        [string]$DbUser,
        [string]$NewPw,
        [string]$CallerKey,
        [string]$OldPw = ""
    )
    if (-not (Test-ContainerRunning $Container)) {
        Write-Err "${CallerKey}: container $Container is not running"
        return $false
    }
    $escapedNew = $NewPw -replace "'", "''"
    Write-Info "ALTER ROLE $DbUser in $Container"
    if (-not [string]::IsNullOrEmpty($OldPw)) {
        $escapedOld = $OldPw -replace "'", "'\''"
        Invoke-OrDry "docker exec -e PGPASSWORD='$escapedOld' '$Container' psql -U '$DbUser' -c `"ALTER ROLE \`"${DbUser}\`" WITH PASSWORD '${escapedNew}';`""
    } else {
        Invoke-OrDry "docker exec '$Container' psql -U '$DbUser' -c `"ALTER ROLE \`"${DbUser}\`" WITH PASSWORD '${escapedNew}';`""
    }
    return $true
}

function Invoke-MysqlUserRotate {
    param([string]$Container, [string]$DbUser, [string]$OldRootPw, [string]$NewPw, [string]$CallerKey)
    if (-not (Test-ContainerRunning $Container)) {
        Write-Err "${CallerKey}: container $Container is not running"
        return $false
    }
    $escapedNew  = $NewPw     -replace "'", "\'"
    $escapedRoot = $OldRootPw -replace "'", "\'"
    Write-Info "ALTER USER '$DbUser' in $Container"
    Invoke-OrDry "docker exec '$Container' mysql -u root -p'$escapedRoot' -e `"ALTER USER '${DbUser}'@'%' IDENTIFIED BY '$escapedNew'; FLUSH PRIVILEGES;`""
    return $true
}

function Invoke-MysqlRootRotate {
    param([string]$Container, [string]$OldRootPw, [string]$NewPw, [string]$CallerKey)
    if (-not (Test-ContainerRunning $Container)) {
        Write-Err "${CallerKey}: container $Container is not running"
        return $false
    }
    $escapedNew = $NewPw     -replace "'", "\'"
    $escapedOld = $OldRootPw -replace "'", "\'"
    Write-Info "ALTER USER root in $Container"
    Invoke-OrDry "docker exec '$Container' mysql -u root -p'$escapedOld' -e `"ALTER USER 'root'@'%' IDENTIFIED BY '$escapedNew'; FLUSH PRIVILEGES;`""
    return $true
}

if ($Force -and $Rotations.Count -gt 0) {
    Write-Hdr "Skipping rotation (--force)"
    Write-Warn "The following keys changed but their credentials will NOT be"
    Write-Warn "rotated against the running containers:"
    foreach ($key in $Rotations) { Write-Warn "  $key" }
    Write-Warn "You must wipe the affected data volumes or apply the credential"
    Write-Warn "change manually, otherwise services will fail authentication."
    noteWarn
}
elseif ($Rotations.Count -gt 0) {
    Write-Hdr "Applying credential changes"

    $KC_CONTAINER = "${PROJECT}-keycloak"
    $KC_ADMIN     = Get-EnvValue -File $ENV_FILE -Key "KEYCLOAK_ADMIN"
    $KC_AUTHED    = $false
    $rotationErrors = 0

    foreach ($key in $Rotations) {
        $newVal = Get-EnvValue -File $SECRETS_FILE -Key $key
        $oldVal = Get-DeployedSecret -Key $key

        switch ($key) {

            "DATABASE_PASSWORD" {
                $dbUser      = Get-EnvValue -File $ENV_FILE -Key "DATABASE_USERNAME"
                $dbContainer = "${PROJECT}-database"
                if (-not (Invoke-PgRotate -Container $dbContainer -DbUser $dbUser -NewPw $newVal -CallerKey $key)) {
                    $rotationErrors++
                }
                $RestartServices.Add("server")
                $RestartServices.Add("client")
            }

            "KEYCLOAK_DATABASE_PASSWORD" {
                $kcDbUser      = Get-EnvValue -File $ENV_FILE -Key "KEYCLOAK_DATABASE_USERNAME"
                $kcDbContainer = "${PROJECT}-keycloak-db"
                if (-not (Invoke-PgRotate -Container $kcDbContainer -DbUser $kcDbUser -NewPw $newVal -CallerKey $key)) {
                    $rotationErrors++
                }
                $RestartServices.Add("keycloak")
            }

            "NOMINATIM_DATABASE_PASSWORD" {
                $nomContainer = "${PROJECT}-nominatim"
                if (-not (Invoke-PgRotate -Container $nomContainer -DbUser "nominatim" -NewPw $newVal -CallerKey $key)) {
                    $rotationErrors++
                }
                $RestartServices.Add("nominatim")
            }

            "BOOKSTACK_DATABASE_PASSWORD" {
                $wikiDbContainer = "${PROJECT}-wiki-db"
                $wikiDbUser      = Get-EnvValue -File $ENV_FILE -Key "BOOKSTACK_DATABASE_USERNAME"
                $rootPw          = Get-DeployedSecret -Key "BOOKSTACK_ROOT_PASSWORD"
                if ([string]::IsNullOrEmpty($rootPw)) {
                    $rootPw = Get-EnvValue -File $SECRETS_FILE -Key "BOOKSTACK_ROOT_PASSWORD"
                }
                if (-not (Invoke-MysqlUserRotate -Container $wikiDbContainer -DbUser $wikiDbUser -OldRootPw $rootPw -NewPw $newVal -CallerKey $key)) {
                    $rotationErrors++
                }
                $RestartServices.Add("wiki")
            }

            "BOOKSTACK_ROOT_PASSWORD" {
                $wikiDbContainer = "${PROJECT}-wiki-db"
                if (-not (Invoke-MysqlRootRotate -Container $wikiDbContainer -OldRootPw $oldVal -NewPw $newVal -CallerKey $key)) {
                    $rotationErrors++
                }
                $RestartServices.Add("wiki-db")
                $RestartServices.Add("wiki")
            }

            "REDIS_PASSWORD" {
                # Redis reads its password from the compose command line, so
                # a restart is enough.
                Write-Info "${key}: rotation via restart (no live command needed)"
                $RestartServices.Add("redis")
                $RestartServices.Add("server")
            }

            "KEYCLOAK_ADMIN_PASSWORD" {
                if (-not (Test-ContainerRunning $KC_CONTAINER)) {
                    Write-Err "${key}: container $KC_CONTAINER is not running"
                    $rotationErrors++
                } else {
                    if (-not $KC_AUTHED) {
                        Invoke-OrDry "docker exec '$KC_CONTAINER' /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080/auth/sso --realm master --user '$KC_ADMIN' --password '$oldVal'"
                        $KC_AUTHED = $true
                    }
                    $escaped = $newVal -replace "'", "\'"
                    Write-Info "Updating Keycloak admin password"
                    Invoke-OrDry "docker exec '$KC_CONTAINER' /opt/keycloak/bin/kcadm.sh set-password -r master --username '$KC_ADMIN' --new-password '$escaped'"
                    $KC_AUTHED = $false  # token stale
                }
                $RestartServices.Add("keycloak")
            }

            "KEYCLOAK_CLIENT_SECRET" {
                if (-not (Test-ContainerRunning $KC_CONTAINER)) {
                    Write-Err "${key}: container $KC_CONTAINER is not running"
                    $rotationErrors++
                } else {
                    if (-not $KC_AUTHED) {
                        $kcAdminPw = Get-DeployedSecret -Key "KEYCLOAK_ADMIN_PASSWORD"
                        if ([string]::IsNullOrEmpty($kcAdminPw)) {
                            $kcAdminPw = Get-EnvValue -File $SECRETS_FILE -Key "KEYCLOAK_ADMIN_PASSWORD"
                        }
                        Invoke-OrDry "docker exec '$KC_CONTAINER' /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080/auth/sso --realm master --user '$KC_ADMIN' --password '$kcAdminPw'"
                        $KC_AUTHED = $true
                    }
                    $escaped = $newVal -replace "'", "\'"
                    Write-Info "Updating Keycloak app client secret"
                    Invoke-OrDry "docker exec '$KC_CONTAINER' sh -c `"/opt/keycloak/bin/kcadm.sh get clients -r default --fields id,clientId | grep -B1 '\`"clientId\`" : \`"app\`"' | grep id | sed 's/.*: \`"//;s/\`".*//' | xargs -I{} /opt/keycloak/bin/kcadm.sh update clients/{} -r default -s secret='$escaped'`""
                }
                $RestartServices.Add("server")
            }

            "BOOKSTACK_KEYCLOAK_CLIENT_SECRET" {
                if (-not (Test-ContainerRunning $KC_CONTAINER)) {
                    Write-Err "${key}: container $KC_CONTAINER is not running"
                    $rotationErrors++
                } else {
                    if (-not $KC_AUTHED) {
                        $kcAdminPw = Get-DeployedSecret -Key "KEYCLOAK_ADMIN_PASSWORD"
                        if ([string]::IsNullOrEmpty($kcAdminPw)) {
                            $kcAdminPw = Get-EnvValue -File $SECRETS_FILE -Key "KEYCLOAK_ADMIN_PASSWORD"
                        }
                        Invoke-OrDry "docker exec '$KC_CONTAINER' /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080/auth/sso --realm master --user '$KC_ADMIN' --password '$kcAdminPw'"
                        $KC_AUTHED = $true
                    }
                    $wikiClientId = Get-EnvValue -File $ENV_FILE -Key "BOOKSTACK_KEYCLOAK_CLIENT_ID"
                    $escaped = $newVal -replace "'", "\'"
                    Write-Info "Updating Keycloak wiki client secret"
                    Invoke-OrDry "docker exec '$KC_CONTAINER' sh -c `"/opt/keycloak/bin/kcadm.sh get clients -r default --fields id,clientId | grep -B1 '\`"clientId\`" : \`"$wikiClientId\`"' | grep id | sed 's/.*: \`"//;s/\`".*//' | xargs -I{} /opt/keycloak/bin/kcadm.sh update clients/{} -r default -s secret='$escaped'`""
                }
                $RestartServices.Add("wiki")
            }

            { $_ -in @("SESSION_SECRET", "JWT_SECRET", "WORKER_TOKEN", "BOOKSTACK_SESSION_SECRET") } {
                Write-Info "${key}: app-only - rotation via restart"
                $RestartServices.Add("server")
                if ($key -eq "WORKER_TOKEN")             { $RestartServices.Add("backup") }
                if ($key -eq "BOOKSTACK_SESSION_SECRET") { $RestartServices.Add("wiki")   }
            }

            "HISTORIAN_DATABASE_PASSWORD" {
                $histContainer = "${PROJECT}-historian"
                # historian's pg_hba requires scram-sha-256 for local socket
                # auth as the `historian` user, so authenticate with the
                # current password before ALTER.
                if (-not (Invoke-PgRotate -Container $histContainer -DbUser "historian" -NewPw $newVal -CallerKey $key -OldPw $oldVal)) {
                    $rotationErrors++
                }
                $RestartServices.Add("historian")
                # volttron-setup's fingerprint check will re-run and regenerate
                # historian.config from the new mounted secret; volttron picks
                # it up on --force-recreate (see the restart pass below).
                $RestartServices.Add("volttron-setup")
                $RestartServices.Add("volttron")
                $RestartServices.Add("server")
                $RestartServices.Add("services")
                $RestartServices.Add("synth-worker")
            }

            "HISTORIAN_REPLICATOR_PASSWORD" {
                $histContainer = "${PROJECT}-historian"
                if (-not (Invoke-PgRotate -Container $histContainer -DbUser "replicator" -NewPw $newVal -CallerKey $key -OldPw $oldVal)) {
                    $rotationErrors++
                }
                $RestartServices.Add("historian")
                # No in-stack consumers: subscribers are external and manage
                # their own CONNECTION strings for the historian_sub
                # subscription.
            }

            "GRAFANA_DATABASE_PASSWORD" {
                $gdContainer = "${PROJECT}-grafana-db"
                if (-not (Invoke-PgRotate -Container $gdContainer -DbUser "grafana" -NewPw $newVal -CallerKey $key)) {
                    $rotationErrors++
                }
                $RestartServices.Add("grafana-db")
                $RestartServices.Add("grafana")
            }

            "GRAFANA_ADMIN_PASSWORD" {
                $grafanaContainer = "${PROJECT}-grafana"
                # grafana-cli supports resetting the admin password without
                # the current one, so no OldPw needed.
                if (-not (Test-ContainerRunning $grafanaContainer)) {
                    Write-Err "${key}: container $grafanaContainer is not running"
                    $rotationErrors++
                } else {
                    $escaped = $newVal -replace "'", "'\''"
                    Write-Info "Resetting Grafana admin password"
                    Invoke-OrDry "docker exec '$grafanaContainer' grafana-cli admin reset-admin-password '$escaped'"
                }
                $RestartServices.Add("grafana")
            }

            "KEYCLOAK_GRAFANA_CLIENT_SECRET" {
                if (-not (Test-ContainerRunning $KC_CONTAINER)) {
                    Write-Err "${key}: container $KC_CONTAINER is not running"
                    $rotationErrors++
                } else {
                    if (-not $KC_AUTHED) {
                        $kcAdminPw = Get-DeployedSecret -Key "KEYCLOAK_ADMIN_PASSWORD"
                        if ([string]::IsNullOrEmpty($kcAdminPw)) {
                            $kcAdminPw = Get-EnvValue -File $SECRETS_FILE -Key "KEYCLOAK_ADMIN_PASSWORD"
                        }
                        Invoke-OrDry "docker exec '$KC_CONTAINER' /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080/auth/sso --realm master --user '$KC_ADMIN' --password '$kcAdminPw'"
                        $KC_AUTHED = $true
                    }
                    $escaped = $newVal -replace "'", "\'"
                    Write-Info "Updating Keycloak grafana-oauth client secret"
                    Invoke-OrDry "docker exec '$KC_CONTAINER' sh -c `"/opt/keycloak/bin/kcadm.sh get clients -r default --fields id,clientId | grep -B1 '\`"clientId\`" : \`"grafana-oauth\`"' | grep id | sed 's/.*: \`"//;s/\`".*//' | xargs -I{} /opt/keycloak/bin/kcadm.sh update clients/{} -r default -s secret='$escaped'`""
                }
                $RestartServices.Add("grafana")
            }

            default {
                Write-Warn "${key}: no rotation handler defined - file will be updated, but you may need to restart or reconcile services manually"
                noteWarn
            }
        }
    }

    if ($rotationErrors -gt 0 -and -not $DryRun) {
        Write-Hdr "Cannot rotate $rotationErrors credential(s) live"
        Write-Host ""
        Write-Host "Overwriting the files without rotating means any data volume"
        Write-Host "seeded with the old credential will no longer authenticate on"
        Write-Host "next boot - you will need to wipe the affected data volume(s)"
        Write-Host "or apply the credential change manually."
        Write-Host ""

        $overwrite = $false
        if ($Yes -or $Force) {
            Write-Info "Auto-confirmed (-Yes / -Force)"
            $overwrite = $true
        } else {
            $answer = Read-Host "Overwrite anyway (skip rotation)? [y/N]"
            if ($answer -match '^(y|yes)$') { $overwrite = $true }
        }

        if (-not $overwrite) {
            Write-Hdr "Aborting"
            Write-Err "$rotationErrors rotation(s) could not be applied - nothing has been written."
            Write-Host ""
            Write-Host "Start the affected containers (docker compose up -d) and re-run."
            Write-Host ""
            exit 1
        }

        Write-Warn "Skipping rotation for the failed key(s). Data volumes must be"
        Write-Warn "wiped or credentials reconciled manually before services can auth."
        noteWarn
    }
}

# ══════════════════════════════════════════════════════════════════════════════
# WRITE PASS
# ══════════════════════════════════════════════════════════════════════════════

Write-Hdr "Writing docker/secrets/"

# FreshWrites + Rotations get the actual write. Noops are already on disk
# with the current value - skip them. Conflicts already caused an exit.
$SourceLines = ""

foreach ($key in @($FreshWrites) + @($Rotations)) {
    $value      = Get-EnvValue -File $SECRETS_FILE -Key $key
    $secretName = $key.ToLower()
    $secretFile = Join-Path $SECRETS_DIR "$secretName.txt"

    # Empty-dir self-heal (see .sh for the full explanation).
    if (Test-Path $secretFile -PathType Container) {
        if ((Get-ChildItem -LiteralPath $secretFile -Force | Measure-Object).Count -eq 0) {
            Remove-Item -LiteralPath $secretFile -Force
        } else {
            Write-Err "$secretFile exists as a non-empty directory."
            Write-Err "Refusing to overwrite. Move or delete it manually, then re-run."
            exit 1
        }
    }

    if ($DryRun) {
        Write-Dry "Would write $secretFile"
    } else {
        Set-Content -Path $secretFile -Value $value -NoNewline
        Set-OwnerOnlyAcl -Path $secretFile
    }

    # Accumulate the _SOURCE line. Paths are relative to docker/, so
    # strip the docker/ prefix and normalize slashes.
    $relPath = ($secretFile -replace '\\', '/') -replace '^docker/', ''
    $SourceLines += "${key}_SOURCE=./$relPath`n"
}

# Emit _SOURCE lines for keys the write pass didn't touch (Noops, plus
# any key excluded by positional args). .env.secrets.docker must always
# list every declared secret so compose interpolation resolves them.
$emitted = @{}
foreach ($key in @($FreshWrites) + @($Rotations)) { $emitted[$key] = $true }
foreach ($key in Get-EnvSecretKeys) {
    if (-not $emitted.ContainsKey($key)) {
        $secretName = $key.ToLower()
        $SourceLines += "${key}_SOURCE=./secrets/${secretName}.txt`n"
    }
}

if ($DryRun) {
    Write-Dry "Would regenerate $SECRETS_ENV_FILE"
} else {
    Write-SecretsEnv -SourceLines $SourceLines
    Write-Ok "Updated docker/secrets/*.txt and $SECRETS_ENV_FILE"
}

# ══════════════════════════════════════════════════════════════════════════════
# RESTART PASS
# ══════════════════════════════════════════════════════════════════════════════

$toRestart = @($RestartServices | Sort-Object -Unique | Where-Object { $_ -ne '' })

if ($toRestart.Count -gt 0) {
    Write-Hdr "Restarting affected services: $($toRestart -join ', ')"
    foreach ($svc in $toRestart) {
        $container = "${PROJECT}-${svc}"
        switch ($svc) {
            "volttron" {
                # `docker compose restart` reuses the same container, so
                # anything in the writable layer (e.g. ~/.volttron/agents/)
                # survives with its stale cached configs. Force-recreate so
                # bootstart.sh re-runs setup-platform.py and reinstalls agents
                # from the freshly generated historian.config on the bind
                # mount.
                Write-Info "Recreating $svc (--force-recreate)"
                Invoke-OrDry "docker compose up -d --force-recreate $svc"
                Write-Ok "$svc recreated"
            }
            "volttron-setup" {
                # volttron-setup is `restart: no`; re-invoke via up -d so it
                # runs once and detects the fingerprint change.
                Write-Info "Re-running $svc"
                Invoke-OrDry "docker compose up -d $svc"
                Write-Ok "$svc re-run"
            }
            default {
                if (Test-ContainerRunning $container) {
                    Write-Info "Restarting $svc"
                    Invoke-OrDry "docker compose restart $svc"
                    Write-Ok "$svc restarted"
                } else {
                    Write-Warn "$svc is not running - skipping restart"
                }
            }
        }
    }
}

# ── summary ────────────────────────────────────────────────────────────────────
Write-Host ""
if ($script:Warnings -gt 0) {
    Write-Host "Done with $($script:Warnings) warning(s)." -ForegroundColor Yellow
    Write-Host "Review warnings above.`n"
} else {
    Write-Host "Done.`n" -ForegroundColor Green
}
