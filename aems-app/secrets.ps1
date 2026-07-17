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
#      from .env.secrets): run the credential-change SQL/kcadm command
#      against the running container BEFORE overwriting the file, then
#      restart the affected services. If the container isn't running,
#      REFUSE - writing the file without rotating would leave the next
#      boot unable to authenticate against the seeded data volume. Pass
#      -Force to override.
#
#   4. NO-OP (values already match): silent skip.
#
# Usage:
#   .\secrets.ps1                                # process every key
#   .\secrets.ps1 KEY1 KEY2 ...                  # limit to named keys
#   .\secrets.ps1 -DryRun                        # print plan without executing
#   .\secrets.ps1 -Force                         # skip rotation; just write files
#
# Must be run from the repo root.

param(
  [switch]$DryRun,
  [switch]$Force,
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

function Get-ProjectName {
    $val = Get-EnvValue -File $ENV_FILE -Key "COMPOSE_PROJECT_NAME"
    if ($val) { $val } else { "skeleton" }
}

function Test-ContainerRunning {
    param([string]$Name)
    $running = docker ps --format '{{.Names}}' 2>$null
    return $running -contains $Name
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

    $secretKeys = @(Get-EnvSecretKeys)

    if ($secretKeys.Count -eq 0) {
        Write-Err "No secret keys found in $ENV_FILE (expected values of '$PLACEHOLDER')."
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
#   3. Bring the stack up with docker secrets enabled:
#        docker compose --env-file docker/.env.secrets.docker up -d
#
# Add a new secret? Add it to .env with the placeholder value and
# re-run .\secrets.ps1 - this file will be regenerated with the new
# key preserved alongside any existing values.

"@

    # One `KEY=` line per secret, empty value so the user MUST fill it in.
    $body = ($secretKeys | ForEach-Object { "$_=" }) -join "`n"

    Set-Content -Path $SECRETS_FILE -Value ($header + $body) -NoNewline
    Set-OwnerOnlyAcl -Path $SECRETS_FILE

    Write-Host ""
    Write-Host "Wrote $($secretKeys.Count) stub entries to $SECRETS_FILE."
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Edit $SECRETS_FILE and fill in real values for each key."
    Write-Host "  2. Re-run .\secrets.ps1 to generate docker/secrets/*.txt and"
    Write-Host "     docker/.env.secrets.docker."
    Write-Host ""
    exit 0
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

# Early exit if nothing to do.
if ($FreshWrites.Count -eq 0 -and $Rotations.Count -eq 0) {
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

# Postgres ALTER ROLE - via socket auth inside the container, no current
# password needed. Returns $true on success, $false if the container is
# down (caller aborts).
function Invoke-PgRotate {
    param([string]$Container, [string]$DbUser, [string]$NewPw, [string]$CallerKey)
    if (-not (Test-ContainerRunning $Container)) {
        Write-Err "${CallerKey}: container $Container is not running"
        return $false
    }
    $escaped = $NewPw -replace "'", "''"
    Write-Info "ALTER ROLE $DbUser in $Container"
    Invoke-OrDry "docker exec '$Container' psql -U '$DbUser' -c `"ALTER ROLE \`"${DbUser}\`" WITH PASSWORD '${escaped}';`""
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

            default {
                Write-Warn "${key}: no rotation handler defined - file will be updated, but you may need to restart or reconcile services manually"
                noteWarn
            }
        }
    }

    if ($rotationErrors -gt 0 -and -not $DryRun) {
        Write-Hdr "Aborting"
        Write-Err "$rotationErrors rotation(s) could not be applied - nothing has been written."
        Write-Host ""
        Write-Host "Start the affected containers (docker compose up -d) and re-run,"
        Write-Host "OR pass -Force to write the files anyway (you will need to wipe"
        Write-Host "the affected data volumes or apply the credential change manually"
        Write-Host "before the services can authenticate)."
        Write-Host ""
        exit 1
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
    # Header + image-specific `_FILE` env vars. These aren't a mechanical
    # transform of the .env.secrets key list - they're image-defined
    # names (POSTGRES_PASSWORD_FILE, MYSQL_ROOT_PASSWORD_FILE, ...) with
    # a bespoke 1-to-many mapping onto secret files.
    $envHeader = @"
# Auto-generated file - DO NOT EDIT MANUALLY
# Generated by secrets.ps1 script
#
# These environment variables tell database containers to read passwords
# from Docker secret files instead of direct environment variables.
# This file is only used when Docker secrets are enabled.

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

# Compose top-level ``secrets:`` entries interpolate <KEY>_SOURCE to pick
# the host-side file. When unset, compose falls back to the tracked
# empty ``docker/secrets/.placeholder``. The lines below (one per key in
# .env.secrets) override that so real secret files get mounted.
"@

    # Blank the plain-env counterparts. The postgres official image's
    # `file_env` helper errors out if BOTH `POSTGRES_PASSWORD` and
    # `POSTGRES_PASSWORD_FILE` are set; blanking here lets the `_FILE`
    # variables win cleanly.
    $envFooter = @"

POSTGRES_PASSWORD=
KEYCLOAK_ADMIN_PASSWORD=
KC_DB_PASSWORD=
"@

    Set-Content -Path $SECRETS_ENV_FILE -Value ($envHeader + "`n" + $SourceLines + $envFooter)
    Set-OwnerOnlyAcl -Path $SECRETS_ENV_FILE
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
        if (Test-ContainerRunning $container) {
            Write-Info "Restarting $svc"
            Invoke-OrDry "docker compose restart $svc"
            Write-Ok "$svc restarted"
        } else {
            Write-Warn "$svc is not running - skipping restart"
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
