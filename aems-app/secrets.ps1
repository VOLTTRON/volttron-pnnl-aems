#
# Manage .env.secrets and apply rotations to live containers.
#
# ARCHITECTURE
# ------------
# .env is the single input docker compose reads. It contains real
# values in a running deployment. .env.secrets (optional, gitignored)
# is an operator's editable secret store. This script overlays the
# values from .env.secrets onto .env before compose runs, so compose's
# natural `.env` auto-load resolves every ${VAR} to the real value -
# no --env-file flag, no COMPOSE_ENV_FILES, no service-level env_file
# mount of .env.secrets.
#
# What this script does:
#
#   1. BOOTSTRAP (no .env.secrets): create a stub .env.secrets seeded
#      from every key marked in .env with the sentinel placeholder.
#      Exits so the operator can fill in real values.
#
#   2. SYNC + ROTATION (every subsequent run): compare each secret
#      key's value between .env.secrets (desired) and .env (currently
#      deployed). If they differ:
#        - Run the live credential-change handler against the running
#          container using the old value from .env.
#        - Overlay the new value into .env in place.
#        - Queue affected services for `docker compose up -d --no-deps`.
#
#   3. NO-OP: silent skip when .env and .env.secrets already match.
#
# Note: `docker compose restart` reuses cached env vars in the existing
# container - use `docker compose up -d --no-deps <svc>` after editing
# secrets so the container re-reads .env at parse time.
#
# WARNING: after this script runs, .env contains real secret values.
# .env is tracked in git with the sentinel baseline. DO NOT commit
# the modified .env.
#
# Usage:
#   .\secrets.ps1                            # process every key
#   .\secrets.ps1 KEY1 KEY2 ...              # limit to named keys
#   .\secrets.ps1 -DryRun                    # print plan without executing
#   .\secrets.ps1 -Force                     # skip live rotation
#
# Must be run from the repo root.

param(
  [switch]$DryRun,
  [switch]$Force,
  [switch]$Yes,
  [Parameter(ValueFromRemainingArguments)]
  [string[]]$ExplicitKeys
)

# This script wraps many `docker` / `psql` calls whose non-zero exit is
# EXPECTED (e.g. a probe that authenticates with the sentinel and
# fails). With ErrorActionPreference=Stop, PS 5.1 turns those native-
# command stderr writes into ErrorRecords and can throw right past our
# explicit `if ($LASTEXITCODE -ne 0)` checks. Use Continue and rely on
# explicit exit-code handling throughout.
$ErrorActionPreference = "Continue"

# Anchor to this script's directory so relative paths and docker compose's
# cwd-based `.env` auto-load resolve regardless of the caller's location.
Set-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Path)

$ENV_FILE     = ".env"
$SECRETS_FILE = ".env.secrets"
$PLACEHOLDER  = "SeT_tHiS_iN_0x3A-.env.secrets-"

# -- color helpers --------------------------------------------------------------
function Write-Info { param($msg) Write-Host "  ->  $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "  v   $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  !   $msg" -ForegroundColor Yellow }
function Write-Err  { param($msg) Write-Host "  x   $msg" -ForegroundColor Red }
function Write-Hdr  { param($msg) Write-Host "`n$msg" -ForegroundColor White }
function Write-Dry  { param($msg) Write-Host "  [dry-run] $msg" -ForegroundColor Yellow }

$script:Warnings = 0
function noteWarn { $script:Warnings++ }

# -- helpers --------------------------------------------------------------------

function Get-EnvValue {
    param([string]$File, [string]$Key)
    $line = Get-Content $File | Where-Object {
        $_ -notmatch '^\s*#' -and $_ -match "^${Key}="
    } | Select-Object -First 1
    if ($line) { ($line -split '=', 2)[1].Trim() } else { '' }
}

function Get-EnvSecretKeys {
    Get-Content $ENV_FILE | ForEach-Object {
        if ($_.TrimEnd() -match "^([A-Za-z_][A-Za-z0-9_]*)=$([regex]::Escape($PLACEHOLDER))$") {
            $matches[1]
        }
    }
}

function Get-MisplacedKeys {
    # A key is "misplaced" if it holds a real credential in .env that
    # ISN'T already in .env.secrets. Values in .env that match
    # .env.secrets are synced entries, not misplaced ones.
    Get-Content $ENV_FILE | ForEach-Object {
        if ($_ -notmatch '^\s*#' -and
            $_ -match '^([A-Za-z_][A-Za-z0-9_]*_(PASSWORD|SECRET|TOKEN|KEY))=(.+)$') {
            $key = $matches[1]; $val = $matches[3]
            if ($val -and $val -ne $PLACEHOLDER) {
                $isSynced = $false
                if (Test-Path $SECRETS_FILE) {
                    $secretsVal = Get-EnvValue $SECRETS_FILE $key
                    if ($secretsVal -eq $val) { $isSynced = $true }
                }
                if (-not $isSynced) {
                    [PSCustomObject]@{ Key = $key; Value = $val }
                }
            }
        }
    }
}

function Update-SecretsEntry {
    param([string]$File, [string]$Key, [string]$Value)
    $content = Get-Content $File
    $found = $false
    $new = $content | ForEach-Object {
        if ($_ -match "^${Key}=") { $found = $true; "$Key=$Value" } else { $_ }
    }
    if (-not $found) { $new = @($content) + @("$Key=$Value") }
    Set-Content -Path $File -Value $new -Encoding UTF8
}

function Get-ProjectName {
    $val = Get-EnvValue $ENV_FILE "COMPOSE_PROJECT_NAME"
    if ($val) { return $val } else { return "skeleton" }
}

function Test-ContainerRunning {
    param([string]$Name)
    $names = docker ps --format '{{.Names}}' 2>$null
    return ($names -contains $Name)
}

function Get-KeyDeployedContainer {
    param([string]$Proj, [string]$Key)
    switch ($Key) {
        'DATABASE_PASSWORD'                { "${Proj}-database" }
        'KEYCLOAK_ADMIN_PASSWORD'          { "${Proj}-keycloak" }
        'KEYCLOAK_DATABASE_PASSWORD'       { "${Proj}-keycloak-db" }
        'KEYCLOAK_CLIENT_SECRET'           { "${Proj}-server" }
        'KEYCLOAK_GRAFANA_CLIENT_SECRET'   { "${Proj}-grafana" }
        'BOOKSTACK_KEYCLOAK_CLIENT_SECRET' { "${Proj}-wiki" }
        'NOMINATIM_DATABASE_PASSWORD'      { "${Proj}-nominatim" }
        'BOOKSTACK_ROOT_PASSWORD'          { "${Proj}-wiki-db" }
        'BOOKSTACK_DATABASE_PASSWORD'      { "${Proj}-wiki-db" }
        'HISTORIAN_DATABASE_PASSWORD'      { "${Proj}-historian" }
        'HISTORIAN_REPLICATOR_PASSWORD'    { "${Proj}-historian" }
        'GRAFANA_ADMIN_PASSWORD'           { "${Proj}-grafana" }
        'GRAFANA_DATABASE_PASSWORD'        { "${Proj}-grafana-db" }
        'SESSION_SECRET'                   { "${Proj}-server" }
        'JWT_SECRET'                       { "${Proj}-server" }
        'WORKER_TOKEN'                     { "${Proj}-server" }
        'REDIS_PASSWORD'                   { "${Proj}-redis" }
        'BOOKSTACK_SESSION_SECRET'         { "${Proj}-wiki" }
        default                            { "" }
    }
}

# The "currently deployed" value for a secret key is the value in .env -
# that's what docker compose reads. A sentinel in .env means the key
# hasn't been synced from .env.secrets yet; return empty so classification
# falls to FRESH.
function Get-DeployedSecret {
    param([string]$Key)
    $val = Get-EnvValue $ENV_FILE $Key
    if ($val -eq $PLACEHOLDER) { return '' }
    return $val
}

# List every KEY=VALUE line in .env.secrets (skipping comments/blanks).
function Get-SecretsFileKeys {
    if (-not (Test-Path $SECRETS_FILE)) { return @() }
    $lines = Get-Content $SECRETS_FILE
    $keys = @()
    foreach ($line in $lines) {
        if ($line -match '^\s*#') { continue }
        if ($line -match '^([A-Za-z_][A-Za-z0-9_]*)=') { $keys += $matches[1] }
    }
    return $keys
}

# Overlay every non-blank non-placeholder value from .env.secrets onto
# .env. Returns the count of keys whose value changed.
function Sync-EnvFromSecrets {
    if (-not (Test-Path $SECRETS_FILE)) { return 0 }
    $changed = 0
    foreach ($k in (Get-SecretsFileKeys)) {
        $new_val = Get-EnvValue $SECRETS_FILE $k
        if ([string]::IsNullOrEmpty($new_val)) { continue }
        if ($new_val -eq $PLACEHOLDER) { continue }
        $old_val = Get-EnvValue $ENV_FILE $k
        if ($new_val -ne $old_val) {
            if (-not $DryRun) {
                Update-SecretsEntry $ENV_FILE $k $new_val
            }
            $changed++
        }
    }
    return $changed
}

function Invoke-OrDry {
    param([string]$Cmd)
    if ($DryRun) { Write-Dry $Cmd } else { Invoke-Expression $Cmd }
}

# -- pre-flight -----------------------------------------------------------------
if (-not (Test-Path $ENV_FILE)) { Write-Err "$ENV_FILE not found. Run from the repo root."; exit 1 }

# Compose auto-loads .env from cwd. No --env-file discipline needed -
# this script's job is to make .env correct, and compose reads it
# unconditionally.
$ComposeArgs = @()

# ==============================================================================
# BOOTSTRAP PATH
# ==============================================================================
if (-not (Test-Path $SECRETS_FILE)) {
    Write-Host "No $SECRETS_FILE found - bootstrapping from $ENV_FILE."

    $secretKeys = @(Get-EnvSecretKeys)
    $misplacedObjs = @(Get-MisplacedKeys)

    if ($misplacedObjs.Count -gt 0) {
        Write-Hdr "WARNING: Secret values found in $ENV_FILE"
        foreach ($m in $misplacedObjs) {
            Write-Warn "  $($m.Key) has a real value in $ENV_FILE - it belongs in $SECRETS_FILE"
        }
        Write-Warn "Migrating those values into $SECRETS_FILE."
        Write-Warn "Reset them to the placeholder in $ENV_FILE when possible."
        noteWarn
        foreach ($m in $misplacedObjs) {
            if ($secretKeys -notcontains $m.Key) { $secretKeys += $m.Key }
        }
    }

    if ($secretKeys.Count -eq 0) {
        Write-Err "No secret keys found in $ENV_FILE"
        exit 1
    }

    $lines = @(
        "# $SECRETS_FILE",
        "#",
        "# Real values for every secret marked in .env with the placeholder",
        "# '$PLACEHOLDER'.",
        "# This file is gitignored - never commit real values.",
        "#",
        "# Workflow:",
        "#   1. Edit the values below.",
        "#   2. Bring the stack up: docker compose up -d",
        "#",
        "# To rotate a credential after deploy:",
        "#   1. Edit the value here.",
        "#   2. Re-run .\secrets.ps1 - it will apply the change against the",
        "#      running container, then recreate affected services.",
        ""
    )
    foreach ($key in $secretKeys) {
        $envVal = Get-EnvValue $ENV_FILE $key
        if ($envVal -and $envVal -ne $PLACEHOLDER) {
            $lines += "$key=$envVal"
        } else {
            $lines += "$key="
        }
    }
    Set-Content -Path $SECRETS_FILE -Value $lines -Encoding UTF8

    $blank = (Get-Content $SECRETS_FILE | Where-Object { $_ -match '^[A-Za-z_][A-Za-z0-9_]*=$' }).Count
    $total = (Get-Content $SECRETS_FILE | Where-Object { $_ -match '^[A-Za-z_][A-Za-z0-9_]*=' }).Count

    Write-Host ""
    Write-Host "Wrote $total stub entries to $SECRETS_FILE."
    if ($misplacedObjs.Count -gt 0) { Write-Host "Some entries were pre-populated from $ENV_FILE values." }
    if ($blank -gt 0) {
        Write-Host ""
        Write-Host "Next steps:"
        Write-Host "  1. Edit $SECRETS_FILE and fill in the $blank remaining blank entries."
        Write-Host "  2. docker compose up -d"
        Write-Host ""
    }
    exit 0
}

# ==============================================================================
# ROTATE PATH
# ==============================================================================

$dryMark = ''; if ($DryRun) { $dryMark = ' (dry-run)' }
$forceMark = ''; if ($Force) { $forceMark = ' (--force: skipping live rotation)' }
Write-Host "`nSecret Rotate$dryMark$forceMark"
Write-Host "Running from: $(Get-Location)"

$PROJECT = Get-ProjectName

if ($ExplicitKeys) {
    $keysToCheck = @($ExplicitKeys)
} else {
    # Prefer .env.secrets as the authoritative list - after the first
    # sync, .env no longer has sentinel-marked entries.
    $keysToCheck = @(Get-SecretsFileKeys)
    if ($keysToCheck.Count -eq 0) { $keysToCheck = @(Get-EnvSecretKeys) }
}

# -- misplaced-secret migration ------------------------------------------------
if (-not $ExplicitKeys) {
    $misplacedObjs = @(Get-MisplacedKeys)
    if ($misplacedObjs.Count -gt 0) {
        $migrated = 0
        foreach ($m in $misplacedObjs) {
            $secretsVal = Get-EnvValue $SECRETS_FILE $m.Key
            if (-not $secretsVal -or $secretsVal -eq $PLACEHOLDER) {
                Write-Warn "$($m.Key): real value found in $ENV_FILE but missing from $SECRETS_FILE - migrating"
                Write-Warn "  Reset $($m.Key) in $ENV_FILE to the placeholder when convenient."
                noteWarn
                if ($DryRun) {
                    Write-Dry "Would migrate $($m.Key) from $ENV_FILE into $SECRETS_FILE"
                } else {
                    Update-SecretsEntry $SECRETS_FILE $m.Key $m.Value
                }
                $migrated++
            }
            if ($keysToCheck -notcontains $m.Key) { $keysToCheck += $m.Key }
        }
        if ($migrated -gt 0 -and -not $DryRun) {
            Write-Info "Migrated $migrated key(s) into $SECRETS_FILE"
        }
    }
}

# -- classify ------------------------------------------------------------------
Write-Hdr "Classifying secrets"

$FRESH = @()
$ROTATIONS = @()

foreach ($key in $keysToCheck) {
    $newVal = Get-EnvValue $SECRETS_FILE $key
    if (-not $newVal -or $newVal -eq $PLACEHOLDER) {
        Write-Warn "$key`: no value in $SECRETS_FILE - skipping"
        continue
    }
    $oldVal = Get-DeployedSecret $key
    if (-not $oldVal) {
        $FRESH += $key
        Write-Info "$key`: fresh (no running container to rotate against)"
    } elseif ($newVal -eq $oldVal) {
        Write-Ok "$key`: unchanged"
    } else {
        $ROTATIONS += $key
        Write-Info "$key`: changed - will rotate live"
    }
}

# ==============================================================================
# SENTINEL SCAN - detect and repair containers whose env holds the
# `.env` placeholder sentinel (from a `docker compose up -d` invocation
# with COMPOSE_ENV_FILES unset). See secrets.sh for the full rationale.
# ==============================================================================
$POISONED = @()
if (-not $ExplicitKeys) {
    Write-Hdr "Scanning for sentinel-poisoned containers"
    $containers = docker ps -a --format '{{.Names}}' 2>$null | Where-Object { $_ -match "^${PROJECT}-" }
    foreach ($c in $containers) {
        $envDump = docker inspect $c --format '{{range .Config.Env}}{{println .}}{{end}}' 2>$null
        if ($envDump -match "=$([regex]::Escape($PLACEHOLDER))(\r?\n|$)") {
            $svc = $c -replace "^${PROJECT}-", ""
            $POISONED += $svc
            Write-Warn "$c`: env holds the sentinel placeholder"
        }
    }
    if ($POISONED.Count -gt 0) {
        Write-Warn "This means docker compose ran without COMPOSE_ENV_FILES set."
        Write-Warn "Recreating with real values from $SECRETS_FILE..."
        noteWarn
    } else {
        Write-Ok "No sentinel-poisoned containers detected."
    }
}

if ($FRESH.Count -eq 0 -and $ROTATIONS.Count -eq 0 -and $POISONED.Count -eq 0) {
    Write-Host "`nAll secrets are up to date." -ForegroundColor Green
    if (-not $DryRun -and (Test-Path .\check-env.ps1)) {
        & .\check-env.ps1
    }
    exit 0
}

# ==============================================================================
# ROTATION PASS
# ==============================================================================

$RESTART = @()
function Queue-Restart { param([string]$Svc) $script:RESTART += $Svc }

function Invoke-RotatePg {
    param([string]$Container, [string]$DbUser, [string]$NewPw, [string]$CallerKey, [string]$OldPw = '')
    if (-not (Test-ContainerRunning $Container)) {
        Write-Err "$CallerKey`: container $Container is not running"
        return $false
    }
    # SQL escape for single quotes inside the password literal.
    $escNew = $NewPw -replace "'", "''"
    $sql    = "ALTER ROLE `"$DbUser`" WITH PASSWORD '$escNew';"
    Write-Info "ALTER ROLE $DbUser in $Container"
    if ($DryRun) {
        Write-Dry "docker exec [-e PGPASSWORD=***] $Container psql -U $DbUser -c `"$sql`""
        return $true
    }
    # Invoke docker directly with argv so PowerShell doesn't mangle the
    # nested quotes. Previous version routed through Invoke-Expression
    # which parsed `\"aems\"` as PS syntax and dropped the actual ALTER.
    try {
        $prev = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
        if ($OldPw) {
            & docker exec -e "PGPASSWORD=$OldPw" $Container psql -U $DbUser -c $sql *> $null
        } else {
            & docker exec $Container psql -U $DbUser -c $sql *> $null
        }
        return ($LASTEXITCODE -eq 0)
    } catch {
        return $false
    } finally {
        $ErrorActionPreference = $prev
    }
}

function Invoke-RotateMySqlUser {
    param([string]$Container, [string]$DbUser, [string]$OldRootPw, [string]$NewPw, [string]$CallerKey)
    if (-not (Test-ContainerRunning $Container)) {
        Write-Err "$CallerKey`: container $Container is not running"
        return $false
    }
    $escNew = $NewPw -replace "'", "\'"
    $escRoot = $OldRootPw -replace "'", "\'"
    Write-Info "ALTER USER '$DbUser' in $Container"
    Invoke-OrDry "docker exec '$Container' mysql -u root -p'$escRoot' -e `"ALTER USER '$DbUser'@'%' IDENTIFIED BY '$escNew'; FLUSH PRIVILEGES;`""
    return $true
}

function Invoke-RotateMySqlRoot {
    param([string]$Container, [string]$OldRootPw, [string]$NewPw, [string]$CallerKey)
    if (-not (Test-ContainerRunning $Container)) {
        Write-Err "$CallerKey`: container $Container is not running"
        return $false
    }
    $escNew = $NewPw -replace "'", "\'"
    $escOld = $OldRootPw -replace "'", "\'"
    Write-Info "ALTER USER root in $Container"
    Invoke-OrDry "docker exec '$Container' mysql -u root -p'$escOld' -e `"ALTER USER 'root'@'%' IDENTIFIED BY '$escNew'; FLUSH PRIVILEGES;`""
    return $true
}

if ($Force -and $ROTATIONS.Count -gt 0) {
    Write-Hdr "Skipping live rotation (-Force)"
    foreach ($k in $ROTATIONS) { Write-Warn "  $k" }
    noteWarn
} elseif ($ROTATIONS.Count -gt 0) {
    Write-Hdr "Applying credential changes"
    $KC_CONTAINER = "$PROJECT-keycloak"
    $KC_ADMIN = Get-EnvValue $ENV_FILE "KEYCLOAK_ADMIN"
    $KC_AUTHED = $false
    $ROT_ERR = 0

    foreach ($key in $ROTATIONS) {
        $newVal = Get-EnvValue $SECRETS_FILE $key
        $oldVal = Get-DeployedSecret $key

        switch ($key) {
            'DATABASE_PASSWORD' {
                $u = Get-EnvValue $ENV_FILE "DATABASE_USERNAME"
                if (-not (Invoke-RotatePg "$PROJECT-database" $u $newVal $key)) { $ROT_ERR++ }
                Queue-Restart "database"; Queue-Restart "server"; Queue-Restart "client"
            }
            'KEYCLOAK_DATABASE_PASSWORD' {
                $u = Get-EnvValue $ENV_FILE "KEYCLOAK_DATABASE_USERNAME"
                if (-not (Invoke-RotatePg "$PROJECT-keycloak-db" $u $newVal $key)) { $ROT_ERR++ }
                Queue-Restart "keycloak-db"; Queue-Restart "keycloak"
            }
            'NOMINATIM_DATABASE_PASSWORD' {
                if (-not (Invoke-RotatePg "$PROJECT-nominatim" "nominatim" $newVal $key)) { $ROT_ERR++ }
                Queue-Restart "nominatim"
            }
            'BOOKSTACK_DATABASE_PASSWORD' {
                $root = Get-DeployedSecret "BOOKSTACK_ROOT_PASSWORD"
                if (-not $root) { $root = Get-EnvValue $SECRETS_FILE "BOOKSTACK_ROOT_PASSWORD" }
                $u = Get-EnvValue $ENV_FILE "BOOKSTACK_DATABASE_USERNAME"
                if (-not (Invoke-RotateMySqlUser "$PROJECT-wiki-db" $u $root $newVal $key)) { $ROT_ERR++ }
                Queue-Restart "wiki"
            }
            'BOOKSTACK_ROOT_PASSWORD' {
                if (-not (Invoke-RotateMySqlRoot "$PROJECT-wiki-db" $oldVal $newVal $key)) { $ROT_ERR++ }
                Queue-Restart "wiki-db"; Queue-Restart "wiki"
            }
            'REDIS_PASSWORD' {
                Write-Info "$key`: rotation via restart"
                Queue-Restart "redis"; Queue-Restart "server"
            }
            'KEYCLOAK_ADMIN_PASSWORD' {
                if (-not (Test-ContainerRunning $KC_CONTAINER)) {
                    Write-Err "$key`: container $KC_CONTAINER is not running"; $ROT_ERR++
                } else {
                    if (-not $KC_AUTHED) {
                        Invoke-OrDry "docker exec '$KC_CONTAINER' /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080/auth/sso --realm master --user '$KC_ADMIN' --password '$oldVal'"
                        $KC_AUTHED = $true
                    }
                    $esc = $newVal -replace "'", "\'"
                    Write-Info "Updating Keycloak admin password"
                    Invoke-OrDry "docker exec '$KC_CONTAINER' /opt/keycloak/bin/kcadm.sh set-password -r master --username '$KC_ADMIN' --new-password '$esc'"
                    $KC_AUTHED = $false
                }
                Queue-Restart "keycloak"
            }
            'KEYCLOAK_CLIENT_SECRET' {
                if (-not (Test-ContainerRunning $KC_CONTAINER)) {
                    Write-Err "$key`: container $KC_CONTAINER is not running"; $ROT_ERR++
                } else {
                    if (-not $KC_AUTHED) {
                        $adminPw = Get-DeployedSecret "KEYCLOAK_ADMIN_PASSWORD"
                        if (-not $adminPw) { $adminPw = Get-EnvValue $SECRETS_FILE "KEYCLOAK_ADMIN_PASSWORD" }
                        Invoke-OrDry "docker exec '$KC_CONTAINER' /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080/auth/sso --realm master --user '$KC_ADMIN' --password '$adminPw'"
                        $KC_AUTHED = $true
                    }
                    $esc = $newVal -replace "'", "\'"
                    Write-Info "Updating Keycloak app client secret"
                    Invoke-OrDry "docker exec '$KC_CONTAINER' sh -c `"/opt/keycloak/bin/kcadm.sh get clients -r default --fields id,clientId | grep -B1 '\`"clientId\`" : \`"app\`"' | grep id | sed 's/.*: \`"//;s/\`".*//' | xargs -I{} /opt/keycloak/bin/kcadm.sh update clients/{} -r default -s secret='$esc'`""
                }
                Queue-Restart "server"
            }
            'BOOKSTACK_KEYCLOAK_CLIENT_SECRET' {
                if (-not (Test-ContainerRunning $KC_CONTAINER)) {
                    Write-Err "$key`: container $KC_CONTAINER is not running"; $ROT_ERR++
                } else {
                    if (-not $KC_AUTHED) {
                        $adminPw = Get-DeployedSecret "KEYCLOAK_ADMIN_PASSWORD"
                        if (-not $adminPw) { $adminPw = Get-EnvValue $SECRETS_FILE "KEYCLOAK_ADMIN_PASSWORD" }
                        Invoke-OrDry "docker exec '$KC_CONTAINER' /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080/auth/sso --realm master --user '$KC_ADMIN' --password '$adminPw'"
                        $KC_AUTHED = $true
                    }
                    $wikiId = Get-EnvValue $ENV_FILE "BOOKSTACK_KEYCLOAK_CLIENT_ID"
                    $esc = $newVal -replace "'", "\'"
                    Write-Info "Updating Keycloak wiki client secret"
                    Invoke-OrDry "docker exec '$KC_CONTAINER' sh -c `"/opt/keycloak/bin/kcadm.sh get clients -r default --fields id,clientId | grep -B1 '\`"clientId\`" : \`"$wikiId\`"' | grep id | sed 's/.*: \`"//;s/\`".*//' | xargs -I{} /opt/keycloak/bin/kcadm.sh update clients/{} -r default -s secret='$esc'`""
                }
                Queue-Restart "wiki"
            }
            { $_ -in 'SESSION_SECRET','JWT_SECRET','WORKER_TOKEN','BOOKSTACK_SESSION_SECRET' } {
                Write-Info "$key`: app-only - rotation via restart"
                Queue-Restart "server"
                if ($key -eq 'WORKER_TOKEN') { Queue-Restart "backup" }
                if ($key -eq 'BOOKSTACK_SESSION_SECRET') { Queue-Restart "wiki" }
            }
            'HISTORIAN_DATABASE_PASSWORD' {
                if (-not (Invoke-RotatePg "$PROJECT-historian" "historian" $newVal $key $oldVal)) { $ROT_ERR++ }
                Queue-Restart "historian"; Queue-Restart "volttron-setup"; Queue-Restart "volttron"
                Queue-Restart "server"; Queue-Restart "services"; Queue-Restart "synth-worker"
            }
            'HISTORIAN_REPLICATOR_PASSWORD' {
                if (-not (Invoke-RotatePg "$PROJECT-historian" "replicator" $newVal $key $oldVal)) { $ROT_ERR++ }
                Queue-Restart "historian"
            }
            'GRAFANA_DATABASE_PASSWORD' {
                if (-not (Invoke-RotatePg "$PROJECT-grafana-db" "grafana" $newVal $key)) { $ROT_ERR++ }
                Queue-Restart "grafana-db"; Queue-Restart "grafana"
            }
            'GRAFANA_ADMIN_PASSWORD' {
                $gc = "$PROJECT-grafana"
                if (-not (Test-ContainerRunning $gc)) {
                    Write-Err "$key`: container $gc is not running"; $ROT_ERR++
                } else {
                    $esc = $newVal -replace "'", "'\''"
                    Write-Info "Resetting Grafana admin password"
                    Invoke-OrDry "docker exec '$gc' grafana-cli admin reset-admin-password '$esc'"
                }
                Queue-Restart "grafana"
            }
            'KEYCLOAK_GRAFANA_CLIENT_SECRET' {
                if (-not (Test-ContainerRunning $KC_CONTAINER)) {
                    Write-Err "$key`: container $KC_CONTAINER is not running"; $ROT_ERR++
                } else {
                    if (-not $KC_AUTHED) {
                        $adminPw = Get-DeployedSecret "KEYCLOAK_ADMIN_PASSWORD"
                        if (-not $adminPw) { $adminPw = Get-EnvValue $SECRETS_FILE "KEYCLOAK_ADMIN_PASSWORD" }
                        Invoke-OrDry "docker exec '$KC_CONTAINER' /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080/auth/sso --realm master --user '$KC_ADMIN' --password '$adminPw'"
                        $KC_AUTHED = $true
                    }
                    $esc = $newVal -replace "'", "\'"
                    Write-Info "Updating Keycloak grafana-oauth client secret"
                    Invoke-OrDry "docker exec '$KC_CONTAINER' sh -c `"/opt/keycloak/bin/kcadm.sh get clients -r default --fields id,clientId | grep -B1 '\`"clientId\`" : \`"grafana-oauth\`"' | grep id | sed 's/.*: \`"//;s/\`".*//' | xargs -I{} /opt/keycloak/bin/kcadm.sh update clients/{} -r default -s secret='$esc'`""
                }
                Queue-Restart "grafana"
            }
            default {
                Write-Warn "$key`: no rotation handler defined - new value will be picked up on next 'docker compose up -d', but you may need to reconcile services manually"
                noteWarn
            }
        }
    }

    if ($ROT_ERR -gt 0 -and -not $DryRun) {
        Write-Hdr "Cannot rotate $ROT_ERR credential(s) live"
        Write-Host ""
        Write-Host "The containers for those keys are not running. Bringing the stack"
        Write-Host "up now with the new .env.secrets would leave the seeded data"
        Write-Host "volumes unable to authenticate."
        Write-Host ""
        Write-Err "Start the affected containers (docker compose up -d) and re-run."
        Write-Host "Or pass -Force to skip live rotation (data volumes must then be"
        Write-Host "wiped or credentials reconciled manually)."
        Write-Host ""
        exit 1
    }
}

# -- pg_shadow-drift probe ------------------------------------------------------
# Runs UNCONDITIONALLY on full-runs (not just when a container's env is
# poisoned). For each postgres role, verify pg_shadow accepts the
# .env.secrets value. If it doesn't but ACCEPTS the sentinel, the volume
# was seeded with the sentinel (fresh-clone-with-bad-boot) — rotate to
# realign. Covers the case where compose up -d fixed container envs but
# pg_shadow was already poisoned in the volume from a prior bad boot.
function Test-PgAuth {
    param([string]$Container, [string]$User, [string]$DbHost, [string]$Db, [string]$Password)
    try {
        $prev = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
        & docker exec -e "PGPASSWORD=$Password" $Container psql -U $User -h $DbHost -d $Db -tAc 'SELECT 1;' *> $null
        return ($LASTEXITCODE -eq 0)
    } catch {
        return $false
    } finally {
        $ErrorActionPreference = $prev
    }
}

if (-not $ExplicitKeys -and -not $DryRun) {
    $pgSpecs = @(
        @{ Key = 'DATABASE_PASSWORD';            Svc = 'database';    User = 'aems' },
        @{ Key = 'KEYCLOAK_DATABASE_PASSWORD';   Svc = 'keycloak-db'; User = 'keycloak' },
        @{ Key = 'NOMINATIM_DATABASE_PASSWORD';  Svc = 'nominatim';   User = 'nominatim' },
        @{ Key = 'HISTORIAN_DATABASE_PASSWORD';  Svc = 'historian';   User = 'historian' },
        @{ Key = 'HISTORIAN_REPLICATOR_PASSWORD';Svc = 'historian';   User = 'replicator' },
        @{ Key = 'GRAFANA_DATABASE_PASSWORD';    Svc = 'grafana-db';  User = 'grafana' }
    )
    $probedAny = $false
    foreach ($spec in $pgSpecs) {
        $container = "$PROJECT-$($spec.Svc)"
        if (-not (Test-ContainerRunning $container)) { continue }
        $newVal = Get-EnvValue $SECRETS_FILE $spec.Key
        if (-not $newVal -or $newVal -eq $PLACEHOLDER) { continue }
        $probedAny = $true
        # If pg_shadow already accepts the correct value, nothing to do.
        if (Test-PgAuth $container $spec.User $spec.Svc $spec.User $newVal) { continue }
        # It doesn't. Try the sentinel — if that works, pg_shadow is
        # stuck on the sentinel and needs rotation to align with .env.secrets.
        if (Test-PgAuth $container $spec.User $spec.Svc $spec.User $PLACEHOLDER) {
            Write-Warn "$container`: pg_shadow accepts the sentinel - aligning role $($spec.User) to $SECRETS_FILE value"
            try {
                $null = Invoke-RotatePg $container $spec.User $newVal "$($spec.Key) (pg_shadow repair)" $PLACEHOLDER
                # Force the recreate of dependent containers so their env
                # matches the newly-rotated pg_shadow.
                switch ($spec.Svc) {
                    'database'    { Queue-Restart 'init'; Queue-Restart 'server'; Queue-Restart 'services'; Queue-Restart 'seeders'; Queue-Restart 'synth-worker'; Queue-Restart 'client'; Queue-Restart 'backup' }
                    'keycloak-db' { Queue-Restart 'keycloak' }
                    'historian'   { Queue-Restart 'volttron'; Queue-Restart 'volttron-setup'; Queue-Restart 'server'; Queue-Restart 'services'; Queue-Restart 'synth-worker' }
                    'grafana-db'  { Queue-Restart 'grafana' }
                    'nominatim'   { Queue-Restart 'nominatim' }
                }
            } catch {
                Write-Warn "  rotate_pg failed - pg_shadow may still be drift; check manually"
            }
        } else {
            Write-Warn "$container`: pg_shadow does not accept either the sentinel or the .env.secrets value for $($spec.User) - manual reconciliation required"
        }
    }
}

# Merge POISONED into RESTART so the existing pass recreates them with
# real env from .env (which the sync step below aligns with .env.secrets).
foreach ($svc in $POISONED) { Queue-Restart $svc }

# ==============================================================================
# SYNC .env FROM .env.secrets
# ==============================================================================
#
# Live rotations above ran against the OLD .env values. Now overlay the
# new .env.secrets values onto .env so the RESTART pass below recreates
# each service with the new value in its runtime env, and any future
# `docker compose up -d` from any shell resolves ${VAR} to the real
# value from .env.
if (Test-Path $SECRETS_FILE) {
    $synced = Sync-EnvFromSecrets
    if ($synced -gt 0 -and -not $DryRun) {
        Write-Hdr "Synced $synced secret(s) from $SECRETS_FILE into $ENV_FILE"
        Write-Warn "$ENV_FILE now contains real secret values - DO NOT commit."
        noteWarn
    }
}

# ==============================================================================
# RESTART PASS
# ==============================================================================
# Use `docker compose up -d --no-deps` (NOT `docker compose restart`) so
# containers re-read env_file and pick up the new .env.secrets values.

$RESTART = $RESTART | Where-Object { $_ } | Sort-Object -Unique

if ($RESTART.Count -gt 0) {
    Write-Hdr "Recreating affected services: $($RESTART -join ' ')"
    foreach ($svc in $RESTART) {
        switch ($svc) {
            'volttron' {
                Write-Info "Recreating $svc (--force-recreate)"
                if ($DryRun) { Write-Dry "docker compose $($ComposeArgs -join ' ') up -d --force-recreate $svc" }
                else { & docker compose @ComposeArgs up -d --force-recreate $svc }
                Write-Ok "$svc recreated"
            }
            'volttron-setup' {
                Write-Info "Re-running $svc"
                if ($DryRun) { Write-Dry "docker compose $($ComposeArgs -join ' ') up -d $svc" }
                else { & docker compose @ComposeArgs up -d $svc }
                Write-Ok "$svc re-run"
            }
            default {
                # Always try to recreate — compose will skip services
                # whose profile isn't active. Services in Exited/Created
                # state (e.g., a failed init) still need to come up with
                # fresh env, so we can't gate on running-status.
                Write-Info "Recreating $svc"
                if ($DryRun) { Write-Dry "docker compose $($ComposeArgs -join ' ') up -d --no-deps $svc" }
                else { & docker compose @ComposeArgs up -d --no-deps $svc }
                Write-Ok "$svc recreated"
            }
        }
    }
}

# ── Volttron historian config sync ────────────────────────────────────────────
# SQLHistorian reads its DB connection from its install-time config file,
# NOT the dynamic config store, so we invoke the sync helper whenever a
# historian secret rotated.
$needVolttronSync = $false
if ($ROTATIONS -contains 'HISTORIAN_DATABASE_PASSWORD' -or $ROTATIONS -contains 'HISTORIAN_REPLICATOR_PASSWORD') { $needVolttronSync = $true }
if ($POISONED -contains 'volttron' -or $POISONED -contains 'volttron-setup') { $needVolttronSync = $true }
if ($needVolttronSync -and -not $DryRun) {
    if (Test-Path .\scripts\sync-volttron-historian-config.ps1) {
        Write-Hdr "Syncing SQLHistorian install-time config"
        & .\scripts\sync-volttron-historian-config.ps1
        if ($LASTEXITCODE -ne 0) {
            Write-Warn "sync-volttron-historian-config.ps1 reported issues (see above). Dashboards may not show new data until the sync succeeds."
        }
    }
}

# -- post-check -----------------------------------------------------------------
if (-not $DryRun -and (Test-Path .\check-env.ps1)) {
    & .\check-env.ps1
}

# -- summary --------------------------------------------------------------------
Write-Host ""
if ($script:Warnings -gt 0) {
    Write-Host "Done with $($script:Warnings) warning(s)." -ForegroundColor Yellow
    Write-Host "Review warnings above."
} else {
    Write-Host "Done." -ForegroundColor Green
}
Write-Host ""
