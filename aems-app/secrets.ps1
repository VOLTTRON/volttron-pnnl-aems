#
# Manage .env.secrets and apply rotations to live containers.
#
# Secrets live as plain KEY=VALUE lines in the gitignored `.env.secrets`
# file. The root docker-compose.yml loads that file as an env_file, so
# every ${VAR} interpolation and every service's `env_file: .env.<svc>`
# forwarding picks the values up automatically. No /run/secrets, no _FILE
# indirection, no docker/secrets/*.txt.
#
# What this script does:
#
#   1. BOOTSTRAP (no .env.secrets): create a stub .env.secrets seeded with
#      every key marked in .env with the sentinel placeholder. Exits so
#      the user can fill in real values.
#
#   2. MISPLACED (real values found in .env): migrate them into
#      .env.secrets and warn.
#
#   3. ROTATION (a key's value in .env.secrets differs from what's live in
#      the deployed container): run the credential-change handler
#      against the running container, then `docker compose up -d --no-deps
#      <service>` so the container inherits the new value from
#      .env.secrets. Container must be running - abort otherwise; pass
#      -Force to skip live rotation.
#
#   4. NO-OP: silent skip when the running container's env matches.
#
# Note: `docker compose restart` reuses cached env vars in the existing
# container - it does NOT re-read env_file. We use `docker compose up -d
# --no-deps <svc>` instead, which recreates the container with fresh env.
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

$ErrorActionPreference = "Stop"

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

function Get-ContainerEnvKey {
    param([string]$Key)
    switch ($Key) {
        { $_ -in 'DATABASE_PASSWORD','KEYCLOAK_DATABASE_PASSWORD','NOMINATIM_DATABASE_PASSWORD','HISTORIAN_DATABASE_PASSWORD','GRAFANA_DATABASE_PASSWORD' } { 'POSTGRES_PASSWORD' }
        'BOOKSTACK_DATABASE_PASSWORD'      { 'MYSQL_PASSWORD' }
        'BOOKSTACK_ROOT_PASSWORD'          { 'MYSQL_ROOT_PASSWORD' }
        'GRAFANA_ADMIN_PASSWORD'           { 'GF_SECURITY_ADMIN_PASSWORD' }
        'KEYCLOAK_GRAFANA_CLIENT_SECRET'   { 'GF_AUTH_GENERIC_OAUTH_CLIENT_SECRET' }
        'BOOKSTACK_SESSION_SECRET'         { 'APP_KEY' }
        'BOOKSTACK_KEYCLOAK_CLIENT_SECRET' { 'OIDC_CLIENT_SECRET' }
        default                            { $Key }
    }
}

function Get-DeployedSecret {
    param([string]$Key)
    $container = Get-KeyDeployedContainer $PROJECT $Key
    if (-not $container) { return '' }
    if (-not (Test-ContainerRunning $container)) { return '' }
    $envKey = Get-ContainerEnvKey $Key
    $envList = docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' $container 2>$null
    foreach ($line in $envList) {
        if ($line -match "^${envKey}=(.*)$") {
            $val = $matches[1]
            # Filter noise: an unfilled sentinel means compose interpolation
            # produced a placeholder (old .env-only-with-placeholders deploys),
            # not a real deployed value.
            if ($val -eq $PLACEHOLDER) { return '' }
            return $val
        }
    }
    return ''
}

function Invoke-OrDry {
    param([string]$Cmd)
    if ($DryRun) { Write-Dry $Cmd } else { Invoke-Expression $Cmd }
}

# -- pre-flight -----------------------------------------------------------------
if (-not (Test-Path $ENV_FILE)) { Write-Err "$ENV_FILE not found. Run from the repo root."; exit 1 }

# Point docker compose at both .env and .env.secrets for interpolation so
# `docker compose up -d --no-deps <svc>` in the restart pass picks up real
# secret values.
if (Test-Path $SECRETS_FILE) {
    $env:COMPOSE_ENV_FILES = "$ENV_FILE,$SECRETS_FILE"
} else {
    $env:COMPOSE_ENV_FILES = "$ENV_FILE"
}

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
    $keysToCheck = @(Get-EnvSecretKeys)
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

if ($FRESH.Count -eq 0 -and $ROTATIONS.Count -eq 0) {
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
    $escNew = $NewPw -replace "'", "''"
    Write-Info "ALTER ROLE $DbUser in $Container"
    if ($OldPw) {
        $escOld = $OldPw -replace "'", "'\''"
        $cmd = "docker exec -e PGPASSWORD='$escOld' '$Container' psql -U '$DbUser' -c `"ALTER ROLE \`"$DbUser\`" WITH PASSWORD '$escNew';`""
    } else {
        $cmd = "docker exec '$Container' psql -U '$DbUser' -c `"ALTER ROLE \`"$DbUser\`" WITH PASSWORD '$escNew';`""
    }
    Invoke-OrDry $cmd
    return $true
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

# ==============================================================================
# RESTART PASS
# ==============================================================================
# Use `docker compose up -d --no-deps` (NOT `docker compose restart`) so
# containers re-read env_file and pick up the new .env.secrets values.

$RESTART = $RESTART | Where-Object { $_ } | Sort-Object -Unique

if ($RESTART.Count -gt 0) {
    Write-Hdr "Recreating affected services: $($RESTART -join ' ')"
    foreach ($svc in $RESTART) {
        $container = "$PROJECT-$svc"
        switch ($svc) {
            'volttron' {
                Write-Info "Recreating $svc (--force-recreate)"
                Invoke-OrDry "docker compose up -d --force-recreate $svc"
                Write-Ok "$svc recreated"
            }
            'volttron-setup' {
                Write-Info "Re-running $svc"
                Invoke-OrDry "docker compose up -d $svc"
                Write-Ok "$svc re-run"
            }
            default {
                if (Test-ContainerRunning $container) {
                    Write-Info "Recreating $svc"
                    Invoke-OrDry "docker compose up -d --no-deps $svc"
                    Write-Ok "$svc recreated"
                } else {
                    Write-Warn "$svc is not running - skipping"
                }
            }
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
