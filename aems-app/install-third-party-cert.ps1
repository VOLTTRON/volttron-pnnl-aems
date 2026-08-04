#
# Install a third-party TLS certificate into the AEMS Traefik proxy (Windows).
#
# Copies cert / key / (optional) CA bundle into the `certs-data` Docker volume
# where Traefik reads them from /etc/certs/, rewrites
# docker\proxy\certs-traefik.yml to reference the new filenames (with a
# timestamped backup), and restarts the proxy service.
#
# The AEMS deployment guide's "Third-Party Certificate" section instructs
# operators to drop cert files into docker\proxy\ and edit the YAML by hand,
# but docker\proxy\ is not bind-mounted as a directory into the Traefik
# container -- only individual YAML files inside it are. Certs live in the
# certs-data named volume. This script bridges that gap.
#
# Usage:
#   .\install-third-party-cert.ps1 -Cert server.crt -Key server.key
#   .\install-third-party-cert.ps1 -Cert server.crt -Key server.key `
#       -CaBundle chain.crt -Name my-domain
#   .\install-third-party-cert.ps1 -Cert ... -Key ... -DryRun
#
# Must be run from the aems-app\ repo root. Requires docker on PATH.

param(
  [Parameter(Mandatory)][string]$Cert,
  [Parameter(Mandatory)][string]$Key,
  [string]$CaBundle,
  [string]$Name = "custom",
  [switch]$SkipRestart,
  [switch]$Force,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$ENV_FILE  = ".env"
$YAML_FILE = "docker/proxy/certs-traefik.yml"

# -- color helpers ------------------------------------------------------------
function Write-Info { param($msg) Write-Host "  ->  $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "  v   $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  !   $msg" -ForegroundColor Yellow }
function Write-Err  { param($msg) Write-Host "  x   $msg" -ForegroundColor Red }
function Write-Dry  { param($msg) Write-Host "  [dry-run] $msg" -ForegroundColor Yellow }

function Invoke-OrDry {
  param([scriptblock]$Action, [string]$Description)
  if ($DryRun) { Write-Dry $Description } else { & $Action }
}

# -- helpers ------------------------------------------------------------------
function Get-EnvValue {
  param([string]$File, [string]$Key)
  $line = Get-Content $File -ErrorAction SilentlyContinue |
    Where-Object { $_ -notmatch '^\s*#' -and $_ -match "^${Key}=" } |
    Select-Object -First 1
  if ($line) { ($line -split '=', 2)[1].Trim() } else { '' }
}

function Write-Utf8NoBom {
  param([string]$Path, [string]$Content)
  $utf8 = [System.Text.UTF8Encoding]::new($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

# -- CLI validation -----------------------------------------------------------
if ($Name -match '^mkcert-' -or $Name -in @('ca','hostname')) {
  Write-Err "Slug `"$Name`" is reserved (used by the certs init container)."
  Write-Err "Pick a different -Name, e.g. -Name my-domain."
  exit 1
}
if ($Name -notmatch '^[A-Za-z0-9._-]+$') {
  Write-Err "Slug must match [A-Za-z0-9._-]+; got `"$Name`"."
  exit 1
}

# -- pre-flight ---------------------------------------------------------------
if (-not (Test-Path $ENV_FILE)) {
  Write-Err "$ENV_FILE not found -- run from the aems-app\ repo root."
  exit 2
}
if (-not (Test-Path $YAML_FILE)) {
  Write-Err "Expected file $YAML_FILE not found -- is this the AEMS repo?"
  exit 2
}

# COMPOSE_PROJECT_NAME resolution matches docker compose itself: shell env wins.
$project = if ($env:COMPOSE_PROJECT_NAME) { $env:COMPOSE_PROJECT_NAME } else { Get-EnvValue -File $ENV_FILE -Key 'COMPOSE_PROJECT_NAME' }
if (-not $project) { $project = 'aems' }
$volumeName     = "${project}_certs-data"
$proxyContainer = "$project-proxy"
$certsContainer = "$project-certs"

$dryLabel = if ($DryRun) { " (dry-run)" } else { "" }
Write-Host ""
Write-Host "Install third-party TLS certificate${dryLabel}" -ForegroundColor White
Write-Host ""

Write-Info "Project:        $project"
Write-Info "Volume:         $volumeName"
Write-Info "Slug:           $Name"
Write-Info "Cert:           $Cert"
Write-Info "Key:            $Key"
if ($CaBundle) { Write-Info "CA bundle:      $CaBundle" }
Write-Host ""

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Err "docker CLI not found on PATH."
  exit 4
}
try { docker info *>&1 | Out-Null } catch {
  Write-Err "Docker daemon not reachable. Start Docker Desktop."
  exit 4
}
if ($LASTEXITCODE -ne 0) {
  Write-Err "Docker daemon not reachable. Start Docker Desktop."
  exit 4
}

foreach ($f in @($Cert, $Key)) {
  if (-not (Test-Path $f)) { Write-Err "File not found: $f"; exit 3 }
  if ((Get-Item $f).Length -eq 0) { Write-Err "File is empty: $f"; exit 3 }
}
if ($CaBundle) {
  if (-not (Test-Path $CaBundle) -or (Get-Item $CaBundle).Length -eq 0) {
    Write-Err "CA bundle file not found or empty: $CaBundle"
    exit 3
  }
}

# Resolve absolute paths for docker -v
$CertAbs = (Resolve-Path $Cert).Path
$KeyAbs  = (Resolve-Path $Key).Path
$CaAbs   = if ($CaBundle) { (Resolve-Path $CaBundle).Path } else { $null }

# -- input validation (openssl) -----------------------------------------------
$openssl = Get-Command openssl -ErrorAction SilentlyContinue
if ($openssl) {
  Write-Info "Verifying cert / key pair with openssl..."
  $certHash = (& openssl x509 -noout -pubkey -in $CertAbs 2>$null | & openssl sha256 2>$null) -replace '.*= *',''
  $keyHash  = (& openssl pkey -pubout -in $KeyAbs 2>$null | & openssl sha256 2>$null) -replace '.*= *',''

  if (-not $certHash) {
    Write-Err "Could not parse $CertAbs as PEM."
    Write-Err "Expected file to contain -----BEGIN CERTIFICATE-----."
    exit 3
  }
  if (-not $keyHash) {
    Write-Err "Could not parse $KeyAbs as PEM."
    Write-Err "Expected file to contain -----BEGIN PRIVATE KEY----- or similar."
    exit 3
  }
  if ($certHash -ne $keyHash) {
    Write-Err "Certificate and private key do not match."
    Write-Err "  cert pubkey sha256: $certHash"
    Write-Err "  key  pubkey sha256: $keyHash"
    exit 3
  }
  Write-Ok "Cert / key pair verified"

  Write-Info "Certificate details:"
  & openssl x509 -in $CertAbs -noout -subject -issuer -dates 2>$null | ForEach-Object { "       $_" }
  $san = & openssl x509 -in $CertAbs -noout -ext subjectAltName 2>$null | Where-Object { $_ -notmatch 'X509v3' }
  if ($san) { $san | ForEach-Object { "       SAN: $($_.Trim())" } }

  # Expiry warning
  & openssl x509 -in $CertAbs -checkend 2592000 *>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    & openssl x509 -in $CertAbs -checkend 0 *>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
      Write-Warn "Certificate is ALREADY EXPIRED. Traefik will still serve it but browsers will reject."
    } else {
      Write-Warn "Certificate expires within the next 30 days."
    }
  }

  if ($CaBundle) {
    & openssl verify -CAfile $CaAbs $CertAbs *>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
      Write-Ok "Certificate verified against CA bundle"
    } else {
      Write-Warn "openssl verify against $CaBundle failed (private CAs sometimes trip this; not fatal)."
    }
  }
} else {
  Write-Warn "openssl not on PATH -- skipping cert/key match verification."
}

# -- volume existence ---------------------------------------------------------
docker volume inspect $volumeName *>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
  Write-Ok "Volume $volumeName exists"
} else {
  Write-Warn "Volume $volumeName does not exist yet (normal on first-time deploy)."
  Write-Info "Pre-creating so files can be seeded before 'docker compose up -d'."
  Invoke-OrDry -Description "docker volume create $volumeName" -Action {
    docker volume create $volumeName *>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { Write-Err "Failed to create volume $volumeName."; exit 5 }
  }
}

# -- certs init container race check ------------------------------------------
$running = docker ps --format '{{.Names}}' 2>$null
if ($running -contains $certsContainer) {
  Write-Info "Certs init container is running -- waiting up to 30s for it to exit."
  for ($i = 0; $i -lt 30; $i++) {
    $running = docker ps --format '{{.Names}}' 2>$null
    if ($running -notcontains $certsContainer) { break }
    Start-Sleep -Seconds 1
  }
  $running = docker ps --format '{{.Names}}' 2>$null
  if ($running -contains $certsContainer) {
    Write-Err "Certs init container did not exit in 30s. Aborting to avoid a race."
    Write-Err "Check its logs: docker compose logs certs"
    exit 5
  }
  Write-Ok "Certs init container has exited."
}

# -- YAML state detection -----------------------------------------------------
$yamlContent = Get-Content $YAML_FILE -Raw
$pristCrt = ([regex]::Matches($yamlContent, [regex]::Escape('mkcert-local.crt'))).Count
$pristKey = ([regex]::Matches($yamlContent, [regex]::Escape('mkcert-local.key'))).Count
$slugCrt  = ([regex]::Matches($yamlContent, [regex]::Escape("$Name.crt"))).Count
$slugKey  = ([regex]::Matches($yamlContent, [regex]::Escape("$Name.key"))).Count

$yamlState = 'other'
if ($pristCrt -ge 2 -and $pristKey -ge 2 -and $slugCrt -eq 0 -and $slugKey -eq 0) {
  $yamlState = 'pristine'
} elseif ($slugCrt -ge 2 -and $slugKey -ge 2 -and $pristCrt -eq 0 -and $pristKey -eq 0) {
  $yamlState = 'same-slug'
}

switch ($yamlState) {
  'pristine'  { Write-Ok "$YAML_FILE is in the shipped form -- will rewrite for slug `"$Name`"." }
  'same-slug' { Write-Ok "$YAML_FILE already references slug `"$Name`" -- rotation mode, YAML rewrite will be skipped." }
  'other' {
    if ($Force) {
      Write-Warn "$YAML_FILE has been hand-edited; -Force given, will rewrite anyway."
    } else {
      Write-Err "$YAML_FILE has been modified from its shipped form."
      Write-Err "The script would replace mkcert-local.crt/.key with $Name.crt/.key,"
      Write-Err "but the file contains neither pattern in the expected count."
      Write-Err "Re-run with -Force to rewrite anyway (a timestamped backup is still written),"
      Write-Err "or restore certs-traefik.yml from the last .bak.<timestamp> and try again."
      Write-Err "The volume copy has NOT been performed yet."
      exit 6
    }
  }
}

# -- copy files into the volume ----------------------------------------------
function Copy-IntoVolume {
  param([string]$Src, [string]$DestName, [string]$Mode)

  $srcAbs  = (Resolve-Path $Src).Path
  $srcDir  = [System.IO.Path]::GetDirectoryName($srcAbs)
  $srcFile = [System.IO.Path]::GetFileName($srcAbs)

  Write-Info "Copying $srcFile into ${volumeName}:/certs/$DestName (mode $Mode)"

  $description = "docker run --rm -v ${volumeName}:/certs -v ${srcDir}:/src:ro alpine:3 sh -c `"cp /src/$srcFile /certs/$DestName && chmod $Mode /certs/$DestName && chown root:root /certs/$DestName`""

  Invoke-OrDry -Description $description -Action {
    $cmd = "cp /src/$srcFile /certs/$DestName && chmod $Mode /certs/$DestName && chown root:root /certs/$DestName"
    docker run --rm `
      -v "${volumeName}:/certs" `
      -v "${srcDir}:/src:ro" `
      alpine:3 `
      sh -c $cmd *>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
      Write-Err "Failed to copy $srcFile into volume."
      exit 5
    }
  }
}

Copy-IntoVolume -Src $CertAbs -DestName "$Name.crt" -Mode 644
Copy-IntoVolume -Src $KeyAbs  -DestName "$Name.key" -Mode 600
if ($CaBundle) {
  Copy-IntoVolume -Src $CaAbs -DestName "$Name-ca.crt" -Mode 644
}

$filesList = "$Name.crt (644), $Name.key (600)"
if ($CaBundle) { $filesList += ", $Name-ca.crt (644)" }
Write-Ok "Files installed in ${volumeName}: ${filesList}"

# -- YAML rewrite -------------------------------------------------------------
$bakPath = $null
if ($yamlState -eq 'pristine' -or ($yamlState -eq 'other' -and $Force)) {
  $bakStamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
  $bakPath  = "$YAML_FILE.bak.$bakStamp"

  Write-Info "Backing up $YAML_FILE to $bakPath"
  Invoke-OrDry -Description "Copy-Item $YAML_FILE $bakPath" -Action {
    Copy-Item $YAML_FILE $bakPath -Force
  }

  Write-Info "Rewriting $YAML_FILE (mkcert-local.* -> $Name.*)"
  Invoke-OrDry -Description "Rewrite $YAML_FILE with slug $Name" -Action {
    $new = $yamlContent `
      -replace [regex]::Escape('mkcert-local.crt'), "$Name.crt" `
      -replace [regex]::Escape('mkcert-local.key'), "$Name.key"
    Write-Utf8NoBom -Path $YAML_FILE -Content $new
  }
  Write-Ok "Rewrote $YAML_FILE"
}

# -- restart proxy ------------------------------------------------------------
$restarted = $false
$existing  = docker ps -a --format '{{.Names}}' 2>$null
$running   = docker ps --format '{{.Names}}' 2>$null

if ($SkipRestart) {
  Write-Info "-SkipRestart given; leaving proxy alone."
  Write-Info "  Run 'docker compose restart proxy' from the repo root when ready."
} elseif ($existing -notcontains $proxyContainer) {
  Write-Info "Proxy container $proxyContainer does not exist yet."
  Write-Info "  The certificate is already in the volume; run 'docker compose up -d' when ready."
} elseif ($running -notcontains $proxyContainer) {
  Write-Info "Proxy container is stopped; starting: docker compose up -d proxy"
  Invoke-OrDry -Description "docker compose up -d proxy" -Action {
    docker compose up -d proxy
  }
  $restarted = $true
} else {
  Write-Info "Restarting proxy: docker compose restart proxy"
  Invoke-OrDry -Description "docker compose restart proxy" -Action {
    docker compose restart proxy
  }
  $restarted = $true
}

# -- verification -------------------------------------------------------------
if ($restarted -and -not $DryRun) {
  Write-Info "Waiting 3s for proxy to settle..."
  Start-Sleep -Seconds 3

  $logs = (docker compose logs --tail 50 proxy 2>&1) -join "`n"

  if ($logs -match 'level=error|level=fatal') {
    Write-Err "Proxy logs contain errors after restart:"
    $logs -split "`n" | Where-Object { $_ -match 'level=error|level=fatal' } | Select-Object -First 10 | ForEach-Object { "       $_" }
    Write-Err "Full logs: docker compose logs proxy"
    Write-Err "Cert files are already in the volume. To revert the YAML:"
    if ($bakPath) { Write-Err "  Copy-Item $bakPath $YAML_FILE -Force; docker compose restart proxy" }
    exit 7
  }
  if ($logs -match 'Configuration loaded|Starting provider') {
    Write-Ok "Proxy reloaded configuration."
  } else {
    Write-Warn "Could not confirm reload from logs. Check: docker compose logs proxy"
  }

  $appHost = Get-EnvValue -File $ENV_FILE -Key 'APP_HOSTNAME'
  if ($appHost -and $openssl) {
    Write-Info "Fetching live cert from https://${appHost}:443 ..."
    $live = "" | & openssl s_client -connect "${appHost}:443" -servername $appHost 2>$null | & openssl x509 -noout -subject -issuer -dates 2>$null
    if ($live) {
      $live | ForEach-Object { "       $_" }
    } else {
      Write-Warn "Could not fetch live cert (hostname may not resolve locally, or firewall blocks 443)."
    }
  }
}

# -- summary ------------------------------------------------------------------
Write-Host ""
Write-Ok "Third-party certificate installed"
Write-Host "     Slug:         $Name"
Write-Host "     Volume:       $volumeName (at /etc/certs/ inside Traefik)"
Write-Host "     Files:        $filesList"
if ($bakPath) { Write-Host "     YAML backup:  $bakPath" }
if ($restarted) { Write-Host "     Proxy:        restarted ($proxyContainer)" }
$appHost = Get-EnvValue -File $ENV_FILE -Key 'APP_HOSTNAME'
if ($appHost) { Write-Host "     Test:         https://$appHost" }
if ($bakPath) {
  Write-Host ""
  Write-Host "     Revert with:"
  Write-Host "       Copy-Item $bakPath $YAML_FILE -Force; docker compose restart proxy"
}
Write-Host ""
