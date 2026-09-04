# subscribe-historian.ps1 — standalone historian subscriber provisioning.
# PowerShell equivalent of subscribe-historian.sh. Same semantics; requires
# psql + pg_dump on PATH. Run against any PostgreSQL 16+ subscriber.

param(
    [string]$PublisherHost         = $env:PUB_HOST,
    [int]   $PublisherPort         = $(if ($env:PUB_PORT)     { [int]$env:PUB_PORT } else { {{PORT}} }),
    [string]$PublisherDb           = $(if ($env:PUB_DB)       { $env:PUB_DB }       else { "historian" }),
    [string]$PublisherUser         = $(if ($env:PUB_USER)     { $env:PUB_USER }     else { "replicator" }),
    [string]$PublisherPassword     = $env:PUB_PASSWORD,
    [string]$PublisherPasswordFile = "",
    [string]$PublisherSslmode      = $(if ($env:PUB_SSLMODE)  { $env:PUB_SSLMODE }  else { "{{SSLMODE}}" }),
    [string]$SubscriberHost         = $env:SUB_HOST,
    [int]   $SubscriberPort         = $(if ($env:SUB_PORT)     { [int]$env:SUB_PORT } else { 5432 }),
    [string]$SubscriberDb           = $(if ($env:SUB_DB)       { $env:SUB_DB }       else { "historian" }),
    [string]$SubscriberUser         = $env:SUB_USER,
    [string]$SubscriberPassword     = $env:SUB_PASSWORD,
    [string]$SubscriberPasswordFile = "",
    [string]$SubscriberSslmode      = $(if ($env:SUB_SSLMODE)  { $env:SUB_SSLMODE }  else { "prefer" }),
    [string]$SubscriptionName = "historian_sub",
    [string]$SlotName         = "historian_sub_slot",
    [string]$ChunkInterval    = "1 week",
    [string]$StartTs          = "",
    [switch]$SkipSchema,
    [switch]$SkipSubscription,
    [switch]$VerifyOnly,
    [switch]$DryRun,
    [switch]$Yes,
    [switch]$Help
)

function Show-Help {
    Write-Host "Usage: subscribe-historian.ps1 [OPTIONS]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Publisher connection (required unless -VerifyOnly):"
    Write-Host "  -PublisherHost HOST         (env PUB_HOST)"
    Write-Host "  -PublisherPort PORT         Default: {{PORT}}"
    Write-Host "  -PublisherDb NAME           Default: historian"
    Write-Host "  -PublisherUser USER         Default: replicator"
    Write-Host "  -PublisherPassword PW       (env PUB_PASSWORD or -PublisherPasswordFile)"
    Write-Host "  -PublisherPasswordFile F"
    Write-Host "  -PublisherSslmode MODE      Default: {{SSLMODE}}"
    Write-Host ""
    Write-Host "Subscriber connection (required):"
    Write-Host "  -SubscriberHost HOST        (env SUB_HOST)"
    Write-Host "  -SubscriberPort PORT        Default: 5432"
    Write-Host "  -SubscriberDb NAME          Default: historian"
    Write-Host "  -SubscriberUser USER        (env SUB_USER)"
    Write-Host "  -SubscriberPassword PW      (env SUB_PASSWORD or -SubscriberPasswordFile)"
    Write-Host "  -SubscriberSslmode MODE     Default: prefer"
    Write-Host ""
    Write-Host "Behavior:"
    Write-Host "  -SubscriptionName NAME      Default: historian_sub"
    Write-Host "  -SlotName NAME              Default: historian_sub_slot"
    Write-Host "  -ChunkInterval INTERVAL     Backfill chunk width. Default: '1 week'"
    Write-Host "  -StartTs TIMESTAMP          Backfill window start"
    Write-Host "  -SkipSchema, -SkipSubscription, -VerifyOnly, -DryRun, -Yes, -Help"
    exit 0
}

if ($Help) { Show-Help }

function Write-Info { param($m) Write-Host "[INFO] $m" -ForegroundColor Blue }
function Write-Ok   { param($m) Write-Host "[OK] $m" -ForegroundColor Green }
function Write-Warn { param($m) Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Write-Err  { param($m) Write-Host "[ERROR] $m" -ForegroundColor Red }
function Write-Dry  { param($m) Write-Host "[DRY-RUN] $m" -ForegroundColor Yellow }

if ($PublisherPasswordFile -and (Test-Path $PublisherPasswordFile)) {
    $PublisherPassword = (Get-Content $PublisherPasswordFile -Raw).Trim()
}
if ($SubscriberPasswordFile -and (Test-Path $SubscriberPasswordFile)) {
    $SubscriberPassword = (Get-Content $SubscriberPasswordFile -Raw).Trim()
}

if (-not $PublisherHost)   { Write-Err "-PublisherHost (or env PUB_HOST) required";   exit 2 }
if (-not $SubscriberHost)  { Write-Err "-SubscriberHost (or env SUB_HOST) required";  exit 2 }
if (-not $SubscriberUser)  { Write-Err "-SubscriberUser (or env SUB_USER) required";  exit 2 }
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Err "psql not found on PATH. Install PostgreSQL client tools."
    exit 1
}

function Invoke-PubPsql {
    param([string[]]$Args, [string]$Stdin = $null)
    $env:PGPASSWORD = $PublisherPassword
    try {
        if ($Stdin) { $Stdin | & psql -h $PublisherHost -p $PublisherPort -U $PublisherUser -d $PublisherDb -v ON_ERROR_STOP=1 --set=sslmode=$PublisherSslmode @Args }
        else { & psql -h $PublisherHost -p $PublisherPort -U $PublisherUser -d $PublisherDb -v ON_ERROR_STOP=1 --set=sslmode=$PublisherSslmode @Args }
    } finally { Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue }
}
function Invoke-SubPsql {
    param([string[]]$Args, [string]$Stdin = $null)
    $env:PGPASSWORD = $SubscriberPassword
    try {
        if ($Stdin) { $Stdin | & psql -h $SubscriberHost -p $SubscriberPort -U $SubscriberUser -d $SubscriberDb -v ON_ERROR_STOP=1 --set=sslmode=$SubscriberSslmode @Args }
        else { & psql -h $SubscriberHost -p $SubscriberPort -U $SubscriberUser -d $SubscriberDb -v ON_ERROR_STOP=1 --set=sslmode=$SubscriberSslmode @Args }
    } finally { Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue }
}
function Get-PubValue { param([string]$Sql) (Invoke-PubPsql -Args @("-tA", "-c", $Sql)).Trim() }
function Get-SubValue { param([string]$Sql) (Invoke-SubPsql -Args @("-tA", "-c", $Sql)).Trim() }

Write-Host "================================================"
Write-Host "Historian Subscriber Provisioning"
if ($DryRun) { Write-Host "MODE: DRY RUN (no writes)" -ForegroundColor Yellow }
Write-Host "================================================"
Write-Info "Publisher:  $PublisherUser@${PublisherHost}:$PublisherPort/$PublisherDb (sslmode=$PublisherSslmode)"
Write-Info "Subscriber: $SubscriberUser@${SubscriberHost}:$SubscriberPort/$SubscriberDb (sslmode=$SubscriberSslmode)"

Write-Info "Verifying connectivity..."
try { Invoke-PubPsql -Args @("-tA", "-c", "SELECT 1") | Out-Null; Write-Ok "Publisher reachable" } catch { Write-Err "Publisher unreachable"; exit 1 }
try { Invoke-SubPsql -Args @("-tA", "-c", "SELECT 1") | Out-Null; Write-Ok "Subscriber reachable" } catch { Write-Err "Subscriber unreachable"; exit 1 }

if ((Get-PubValue "SELECT count(*) FROM pg_publication WHERE pubname='historian_pub'") -ne "1") {
    Write-Err "Publication 'historian_pub' does not exist on publisher."
    exit 1
}
Write-Ok "Publication historian_pub present"

if ($VerifyOnly) {
    Write-Info "Verify-only mode:"
    $pt = Get-PubValue "SELECT count(*) FROM public.topics"
    $pd = Get-PubValue "SELECT count(*) FROM public.data"
    $st = Get-SubValue "SELECT count(*) FROM public.topics"
    $sd = Get-SubValue "SELECT count(*) FROM public.data"
    Write-Info "  topics: publisher=$pt subscriber=$st"
    Write-Info "  data:   publisher=$pd subscriber=$sd"
    if ([int]$sd -ge [int]$pd -and [int]$st -ge [int]$pt) { Write-Ok "Converged."; exit 0 }
    else { Write-Warn "Behind."; exit 2 }
}

if (-not $DryRun -and -not $Yes) {
    Write-Warn "This will create (or reuse) the '$SubscriptionName' subscription and start backfill."
    $confirm = Read-Host "Continue? (yes/no)"
    if ($confirm -ne "yes") { Write-Warn "Cancelled."; exit 0 }
}

# STEP 1: schema
if (-not $SkipSchema) {
    Write-Info "Step 1: schema clone from publisher..."
    $subHas = Get-SubValue "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('data','topics')"
    if ($subHas -eq "2") {
        Write-Info "Both tables exist; skipping DDL."
    } elseif ($DryRun) {
        Write-Dry "pg_dump --schema-only | subscriber psql"
    } else {
        if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
            Write-Err "pg_dump not found on PATH."
            exit 1
        }
        $env:PGPASSWORD = $PublisherPassword
        $ddl = & pg_dump -h $PublisherHost -p $PublisherPort -U $PublisherUser -d $PublisherDb `
            --schema-only --no-owner --no-privileges `
            -t public.data -t public.topics -t public.topics_topic_id_seq
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
        Invoke-SubPsql -Args @() -Stdin ($ddl -join "`n")
        Write-Ok "Schema cloned"
    }
} else { Write-Info "Step 1: -SkipSchema" }

# STEP 2: topics copy
Write-Info "Step 2: copying public.topics..."
if ($DryRun) {
    Write-Dry "COPY public.topics FROM publisher (one-shot)"
} else {
    Invoke-SubPsql -Args @() -Stdin @'
CREATE TABLE IF NOT EXISTS public.topics_stage (LIKE public.topics INCLUDING DEFAULTS);
TRUNCATE public.topics_stage;
'@
    $env:PGPASSWORD = $PublisherPassword
    $rows = & psql -h $PublisherHost -p $PublisherPort -U $PublisherUser -d $PublisherDb `
        -v ON_ERROR_STOP=1 --set=sslmode=$PublisherSslmode `
        -c "\copy (SELECT topic_id, topic_name, metadata FROM public.topics ORDER BY topic_id) TO STDOUT"
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    $env:PGPASSWORD = $SubscriberPassword
    $rows | & psql -h $SubscriberHost -p $SubscriberPort -U $SubscriberUser -d $SubscriberDb `
        -v ON_ERROR_STOP=1 --set=sslmode=$SubscriberSslmode `
        -c "\copy public.topics_stage (topic_id, topic_name, metadata) FROM STDIN"
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    Invoke-SubPsql -Args @() -Stdin @'
INSERT INTO public.topics (topic_id, topic_name, metadata)
SELECT topic_id, topic_name, metadata FROM public.topics_stage
ON CONFLICT (topic_id) DO UPDATE
  SET topic_name = EXCLUDED.topic_name, metadata = EXCLUDED.metadata;
SELECT setval('public.topics_topic_id_seq', COALESCE((SELECT max(topic_id) FROM public.topics), 1));
DROP TABLE public.topics_stage;
'@
    Write-Ok "topics copied"
}

# STEP 3: subscription
if ($SkipSubscription) {
    Write-Info "Step 3: -SkipSubscription"
} else {
    Write-Info "Step 3: subscription '$SubscriptionName' with copy_data=false..."
    $subExists = Get-SubValue "SELECT count(*) FROM pg_subscription WHERE subname='$SubscriptionName'"
    if ($subExists -eq "1") {
        $slotStatus = (Get-PubValue "SELECT wal_status FROM pg_replication_slots WHERE slot_name='$SlotName'").Trim()
        if ($slotStatus -in @("reserved","extended")) {
            Write-Info "Subscription healthy — leaving in place."
        } else {
            Write-Warn "Slot state '$slotStatus' — dropping and recreating."
            if (-not $DryRun) {
                Invoke-SubPsql -Args @() -Stdin @"
ALTER SUBSCRIPTION $SubscriptionName DISABLE;
ALTER SUBSCRIPTION $SubscriptionName SET (slot_name = NONE);
DROP SUBSCRIPTION $SubscriptionName;
"@
                try { Invoke-PubPsql -Args @("-c", "SELECT pg_drop_replication_slot('$SlotName');") | Out-Null } catch {}
                $subExists = "0"
            }
        }
    }
    if ($subExists -ne "1") {
        $conn = "host=$PublisherHost port=$PublisherPort dbname=$PublisherDb user=$PublisherUser password=$PublisherPassword sslmode=$PublisherSslmode"
        if ($DryRun) {
            Write-Dry "CREATE SUBSCRIPTION $SubscriptionName ... copy_data=false"
        } else {
            Invoke-SubPsql -Args @() -Stdin @"
CREATE SUBSCRIPTION $SubscriptionName
CONNECTION '$conn'
PUBLICATION historian_pub
WITH (copy_data=false, create_slot=true, enabled=true, slot_name='$SlotName', streaming='on');
"@
            Write-Ok "Subscription created (streaming from now)"
        }
    }
}

# STEP 4: progress table
Write-Info "Step 4: progress table..."
if (-not $DryRun) {
    Invoke-SubPsql -Args @() -Stdin @'
CREATE TABLE IF NOT EXISTS public.backfill_progress (
    chunk_start  timestamp PRIMARY KEY,
    chunk_end    timestamp NOT NULL,
    inserted     bigint,
    completed_at timestamptz NOT NULL DEFAULT now()
);
'@
}

# STEP 5: chunked backfill
Write-Info "Step 5: chunked backfill of public.data..."
if (-not $StartTs) {
    $StartTs = (Get-PubValue "SELECT COALESCE(MIN(ts), NOW())::text FROM public.data").Trim()
}
$EndTs = (Get-PubValue "SELECT NOW()::text").Trim()
Write-Info "Backfill window: [$StartTs, $EndTs) in chunks of $ChunkInterval"

$chunkQuery = @"
SELECT to_char(gs, 'YYYY-MM-DD HH24:MI:SS')
FROM generate_series('$StartTs'::timestamp, '$EndTs'::timestamp, '$ChunkInterval'::interval) AS gs
UNION ALL
SELECT to_char('$EndTs'::timestamp, 'YYYY-MM-DD HH24:MI:SS')
ORDER BY 1;
"@
$rawBounds = (Invoke-PubPsql -Args @("-tA") -Stdin $chunkQuery) -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
$bounds = @(); $last = ""
foreach ($b in $rawBounds) { if ($b -ne $last) { $bounds += $b; $last = $b } }
$chunkCount = $bounds.Count - 1
if ($chunkCount -lt 0) { $chunkCount = 0 }
Write-Info "Will process up to $chunkCount chunks"

for ($i = 0; $i -lt $chunkCount; $i++) {
    $cs = $bounds[$i]
    $ce = $bounds[$i + 1]
    $idx = $i + 1
    if ($DryRun) {
        Write-Info "[$idx/$chunkCount] $cs -> $ce"
        Write-Dry "  COPY data rows in window and INSERT ... ON CONFLICT DO NOTHING"
        continue
    }
    $done = Get-SubValue "SELECT count(*) FROM public.backfill_progress WHERE chunk_start = '$cs'::timestamp"
    if ($done -eq "1") {
        Write-Info "[$idx/$chunkCount] $cs -> $ce  (skip: already completed)"
        continue
    }
    Write-Info "[$idx/$chunkCount] $cs -> $ce"

    Invoke-SubPsql -Args @("-c", "DROP TABLE IF EXISTS public.backfill_stage; CREATE UNLOGGED TABLE public.backfill_stage (LIKE public.data);") | Out-Null

    $env:PGPASSWORD = $PublisherPassword
    $pipe = & psql -h $PublisherHost -p $PublisherPort -U $PublisherUser -d $PublisherDb `
        -v ON_ERROR_STOP=1 --set=sslmode=$PublisherSslmode `
        -c "\copy (SELECT topic_id, ts, value_string FROM public.data WHERE ts >= '$cs'::timestamp AND ts < '$ce'::timestamp) TO STDOUT"
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

    if ($LASTEXITCODE -ne 0) {
        Write-Warn "  chunk export failed — re-run to retry"
        exit 3
    }

    $env:PGPASSWORD = $SubscriberPassword
    $pipe | & psql -h $SubscriberHost -p $SubscriberPort -U $SubscriberUser -d $SubscriberDb `
        -v ON_ERROR_STOP=1 --set=sslmode=$SubscriberSslmode `
        -c "\copy public.backfill_stage (topic_id, ts, value_string) FROM STDIN"
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

    if ($LASTEXITCODE -ne 0) {
        Write-Warn "  chunk import failed — re-run to retry"
        exit 3
    }

    $insertedRaw = Invoke-SubPsql -Args @("-tA") -Stdin @"
WITH stage_count AS (SELECT count(*)::bigint AS n FROM public.backfill_stage),
ins AS (
    INSERT INTO public.data (topic_id, ts, value_string)
    SELECT topic_id, ts, value_string FROM public.backfill_stage
    ON CONFLICT (topic_id, ts) DO NOTHING RETURNING 1
),
prog AS (
    INSERT INTO public.backfill_progress (chunk_start, chunk_end, inserted)
    VALUES ('$cs'::timestamp, '$ce'::timestamp, (SELECT count(*) FROM ins))
    RETURNING chunk_start
)
SELECT n FROM stage_count, prog;
"@
    Invoke-SubPsql -Args @("-c", "DROP TABLE IF EXISTS public.backfill_stage;") | Out-Null
    $inserted = ($insertedRaw -split "`n" | Select-Object -Last 1).Trim()
    Write-Ok "  chunk merged ($inserted rows scanned)"
}

Write-Info "Step 6: verification..."
$pt = Get-PubValue "SELECT count(*) FROM public.topics"
$pd = Get-PubValue "SELECT count(*) FROM public.data"
$st = Get-SubValue "SELECT count(*) FROM public.topics"
$sd = Get-SubValue "SELECT count(*) FROM public.data"
Write-Info "  topics: publisher=$pt subscriber=$st"
Write-Info "  data:   publisher=$pd subscriber=$sd"
$delta = [int]$pd - [int]$sd
if ($delta -le 0) { Write-Ok "Convergence (delta=$delta)." }
else { Write-Warn "Subscriber is $delta rows behind. Streaming will close the gap." }

Write-Host ""
Write-Host "================================================"
Write-Ok "Done."
Write-Host "================================================"
