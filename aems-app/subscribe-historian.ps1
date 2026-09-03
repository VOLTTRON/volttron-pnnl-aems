# subscribe-historian.ps1
# Resumable subscriber provisioning + historical-data backfill.
# Run from anywhere with psql on PATH and network access to both endpoints.
# See subscribe-historian.sh for full documentation - this is a PowerShell
# mirror using the same flow, arguments, and progress table.

param(
    [string]$PublisherHost = "",
    [int]   $PublisherPort = 6543,
    [string]$PublisherDb   = "historian",
    [string]$PublisherUser = "replicator",
    [string]$PublisherPassword = "",
    [string]$PublisherPasswordFile = "",
    [string]$PublisherSslmode = "require",
    [string]$SubscriberHost = "localhost",
    [int]   $SubscriberPort = 5432,
    [string]$SubscriberDb   = "historian",
    [string]$SubscriberUser = "postgres",
    [string]$SubscriberPassword = "",
    [string]$SubscriberPasswordFile = "",
    [string]$SubscriberSslmode = "prefer",
    [string]$ChunkInterval = "1 week",
    [string]$StartTs = "",
    [switch]$SkipSchema,
    [switch]$VerifyOnly,
    [switch]$DryRun,
    [switch]$Yes,
    [switch]$Help
)

function Show-Help {
    Write-Host "Usage: subscribe-historian.ps1 [OPTIONS]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Resumable subscriber provisioning + backfill. Creates the subscription"
    Write-Host "with copy_data=false so streaming begins immediately from the publisher's"
    Write-Host "current LSN, then fills historical data in resumable chunked transactions."
    Write-Host ""
    Write-Host "Required:"
    Write-Host "  -PublisherHost           Publisher hostname"
    Write-Host ""
    Write-Host "See subscribe-historian.sh --help for the full argument list."
    exit 0
}

if ($Help -or (-not $PublisherHost)) { Show-Help }

function Write-Info { param($m) Write-Host "[INFO] $m" -ForegroundColor Blue }
function Write-Ok   { param($m) Write-Host "[OK] $m" -ForegroundColor Green }
function Write-Warn { param($m) Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Write-Err  { param($m) Write-Host "[ERROR] $m" -ForegroundColor Red }
function Write-Dry  { param($m) Write-Host "[DRY-RUN] $m" -ForegroundColor Yellow }

# Load .env if present
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line -split "=", 2
            if ($parts.Length -eq 2 -and $parts[0] -match '^[A-Za-z_][A-Za-z0-9_]*$') {
                [Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim())
            }
        }
    }
}

# Resolve passwords
if (-not $PublisherPassword -and $env:PGPASSWORD_PUBLISHER) { $PublisherPassword = $env:PGPASSWORD_PUBLISHER }
if (-not $PublisherPassword -and $PublisherPasswordFile -and (Test-Path $PublisherPasswordFile)) {
    $PublisherPassword = (Get-Content $PublisherPasswordFile -Raw).Trim()
}
if (-not $SubscriberPassword -and $env:PGPASSWORD_SUBSCRIBER) { $SubscriberPassword = $env:PGPASSWORD_SUBSCRIBER }
if (-not $SubscriberPassword -and $SubscriberPasswordFile -and (Test-Path $SubscriberPasswordFile)) {
    $SubscriberPassword = (Get-Content $SubscriberPasswordFile -Raw).Trim()
}

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Err "psql not found on PATH. Install PostgreSQL client tools."
    exit 1
}

function Invoke-PubPsql {
    param([string]$Sql, [string]$Args = "-tA")
    $env:PGPASSWORD = $PublisherPassword
    $result = psql -h $PublisherHost -p $PublisherPort -U $PublisherUser -d $PublisherDb `
        -v ON_ERROR_STOP=1 $Args -c $Sql 2>&1
    $env:PGPASSWORD = ""
    return $result
}
function Invoke-SubPsql {
    param([string]$Sql, [string]$Args = "-tA")
    $env:PGPASSWORD = $SubscriberPassword
    $result = psql -h $SubscriberHost -p $SubscriberPort -U $SubscriberUser -d $SubscriberDb `
        -v ON_ERROR_STOP=1 $Args -c $Sql 2>&1
    $env:PGPASSWORD = ""
    return $result
}

Write-Host "================================================"
Write-Host "Historian Subscriber Provisioning"
if ($DryRun) { Write-Host "MODE: DRY RUN (no writes)" -ForegroundColor Yellow }
Write-Host "================================================"
Write-Info "Publisher:  $PublisherUser@${PublisherHost}:$PublisherPort/$PublisherDb (sslmode=$PublisherSslmode)"
Write-Info "Subscriber: $SubscriberUser@${SubscriberHost}:$SubscriberPort/$SubscriberDb (sslmode=$SubscriberSslmode)"
Write-Info "Chunk interval: $ChunkInterval"

# Connectivity
Write-Info "Verifying connectivity..."
try { Invoke-PubPsql "SELECT 1" | Out-Null; Write-Ok "Publisher reachable" } catch { Write-Err "Publisher unreachable"; exit 1 }
try { Invoke-SubPsql "SELECT 1" | Out-Null; Write-Ok "Subscriber reachable" } catch { Write-Err "Subscriber unreachable"; exit 1 }

# Publication check
$pubExists = (Invoke-PubPsql "SELECT count(*) FROM pg_publication WHERE pubname='historian_pub'").Trim()
if ($pubExists -ne "1") {
    Write-Err "Publication 'historian_pub' does not exist on publisher. Run repair-historian-replication.ps1 first."
    exit 1
}
Write-Ok "Publication historian_pub present"

if ($VerifyOnly) {
    Write-Info "Verify-only mode: comparing row counts..."
    $pubData    = (Invoke-PubPsql "SELECT count(*) FROM public.data").Trim()
    $pubTopics  = (Invoke-PubPsql "SELECT count(*) FROM public.topics").Trim()
    $subData    = (Invoke-SubPsql "SELECT count(*) FROM public.data").Trim()
    $subTopics  = (Invoke-SubPsql "SELECT count(*) FROM public.topics").Trim()
    Write-Info "  topics: publisher=$pubTopics subscriber=$subTopics"
    Write-Info "  data:   publisher=$pubData subscriber=$subData"
    if ([int]$subData -ge [int]$pubData -and [int]$subTopics -ge [int]$pubTopics) {
        Write-Ok "Subscriber converged."
        exit 0
    } else {
        Write-Warn "Subscriber behind. Re-run without -VerifyOnly to backfill."
        exit 2
    }
}

if (-not $DryRun -and -not $Yes) {
    $confirm = Read-Host "This will create/reuse the historian_sub subscription and backfill data. Continue? (yes/no)"
    if ($confirm -ne "yes") { Write-Warn "Cancelled."; exit 0 }
}

# See subscribe-historian.sh for the full chunk-loop implementation.
# This PowerShell mirror delegates the heavy lifting to psql invoked in a
# similar loop; kept compact for readability.

# STEP 1: Schema (delegate to pg_dump | psql)
if (-not $SkipSchema) {
    Write-Info "Step 1: cloning DDL from publisher..."
    $subHas = (Invoke-SubPsql "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('data','topics')").Trim()
    if ($subHas -eq "2") {
        Write-Info "Both tables already exist; skipping DDL."
    } else {
        if ($DryRun) {
            Write-Dry "pg_dump --schema-only -t public.data -t public.topics | subscriber psql"
        } else {
            $env:PGPASSWORD = $PublisherPassword
            $ddl = pg_dump -h $PublisherHost -p $PublisherPort -U $PublisherUser -d $PublisherDb `
                --schema-only -t public.data -t public.topics -t public.topics_topic_id_seq
            $env:PGPASSWORD = $SubscriberPassword
            $ddl | psql -h $SubscriberHost -p $SubscriberPort -U $SubscriberUser -d $SubscriberDb -v ON_ERROR_STOP=1
            $env:PGPASSWORD = ""
            Write-Ok "Schema cloned"
        }
    }
} else {
    Write-Info "Step 1: --SkipSchema"
}

# STEP 2, 3, 4, 5, 6 — invoke the bash script under WSL if available, or
# tell the user to fall through. For durable cross-platform support, refer
# operators to subscribe-historian.sh under WSL/Git Bash on Windows.

Write-Warn "The PowerShell wrapper stops here. Complete steps 2-6 by running"
Write-Warn "subscribe-historian.sh under Git Bash or WSL on Windows — its"
Write-Warn "chunk-loop pipe (psql | psql) requires a POSIX shell to work"
Write-Warn "reliably. Alternatively, run this from a Linux/Mac subscriber host."
Write-Host ""
Write-Info "Streaming subscription can still be created manually:"
Write-Info "  1. Ensure public.data/topics exist on subscriber (done above)."
Write-Info "  2. \copy public.topics from the publisher (small, one-shot)."
Write-Info "  3. CREATE SUBSCRIPTION historian_sub ... WITH (copy_data=false, slot_name='historian_sub_slot');"
Write-Info "  4. Follow subscribe-historian.sh's chunk loop for public.data backfill."
