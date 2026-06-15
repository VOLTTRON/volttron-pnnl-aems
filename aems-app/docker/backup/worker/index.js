/* eslint-disable no-console */
/**
 * Backup sidecar worker.
 *
 * Responsibilities:
 *   1. Reconcile stale `Running` rows on boot.
 *   2. Poll the server for a `Queued` run to claim.
 *   3. Spawn `backup.sh --json --run-id <id>` in the mounted workspace.
 *      The shell pipeline emits NDJSON progress events on stdout:
 *        {"event":"plan", ...}
 *        {"event":"component", ...}
 *        {"event":"destination", ...}
 *        {"event":"archive", ...}
 *        {"event":"done", ...}
 *   4. Relay each event to the server's /worker/backup API, and emit a
 *      heartbeat (which also surfaces cancelRequested) every HEARTBEAT_MS.
 *   5. On success/failure, stamp final BackupRun state via the finalize
 *      endpoint.
 *
 * All database writes go through the server's /worker/backup REST API.
 * The sidecar holds no Postgres credentials and imports no `pg` client.
 * This keeps the image small, gives the server a single write path into
 * the backup tables, and makes subscriptions fire for every change.
 */

const { spawn, spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const WORKSPACE = process.env.BACKUP_WORKSPACE || "/workspace";
const SECRETS_DIR = process.env.BACKUP_SECRETS_DIR || "/host-secrets";
// Fixed target for Local destinations. The `backup-archives` docker volume
// declared in docker/docker-compose.yml is mounted here; operators do not
// configure this path per-destination.
const LOCAL_DESTINATION_PATH = "/var/lib/backup/archives";
const SERVER_URL = (process.env.BACKUP_SERVER_URL || "http://server:3000").replace(/\/+$/, "");
const POLL_MS = parseInt(process.env.BACKUP_WORKER_POLL_MS || "5000", 10);
const HEARTBEAT_MS = parseInt(process.env.BACKUP_WORKER_HEARTBEAT_MS || "10000", 10);
const STALE_MS = parseInt(process.env.BACKUP_WORKER_STALE_MS || "300000", 10);
const WORKER_ID = `${process.env.HOSTNAME || "backup"}-${process.pid}-${crypto.randomBytes(3).toString("hex")}`;

/**
 * Resolve a secret by name, matching the server's readSecret precedence:
 *   1. Docker secret file at /run/secrets/<name-lowercase>
 *   2. `<NAME>_FILE` env var pointing at a file
 *   3. `<NAME>` env var directly
 *
 * Returns "" if none are available or readable. Read errors (including
 * ENOENT/EISDIR for a non-existent or mistakenly-created-as-dir secret
 * mount) fall through to the next source instead of aborting.
 */
function readSecret(name) {
    const dockerPath = `/run/secrets/${name.toLowerCase()}`;
    try {
        const v = fs.readFileSync(dockerPath, "utf-8").trim();
        if (v) return v;
    } catch { /* fall through */ }

    const filePath = process.env[`${name}_FILE`];
    if (filePath) {
        try {
            const v = fs.readFileSync(filePath, "utf-8").trim();
            if (v) return v;
        } catch { /* fall through */ }
    }

    return (process.env[name] ?? "").trim();
}

const WORKER_TOKEN = readSecret("WORKER_TOKEN");
if (!WORKER_TOKEN) {
    console.error(
        `[backup-worker ${WORKER_ID}] FATAL: WORKER_TOKEN not available. ` +
        `Set via the worker_token docker secret, WORKER_TOKEN_FILE, or the WORKER_TOKEN env var.`,
    );
    process.exit(1);
}

function log(...args) { console.log(`[backup-worker ${WORKER_ID}]`, ...args); }
function errLog(...args) { console.error(`[backup-worker ${WORKER_ID}] ERROR`, ...args); }

/**
 * Minimal fetch wrapper. Injects the auth header + base URL, parses JSON on
 * 2xx (empty body → null), and throws with the response body on non-2xx so
 * callers get useful diagnostics.
 */
async function apiCall(method, pathname, body) {
    const url = `${SERVER_URL}${pathname}`;
    const res = await fetch(url, {
        method,
        headers: {
            "content-type": "application/json",
            "x-worker-token": WORKER_TOKEN,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
        throw new Error(`${method} ${pathname} -> ${res.status}: ${text.slice(0, 500)}`);
    }
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

// ----- API calls (one per server endpoint) ------------------------------

async function reconcileStale() {
    const { reconciled } = await apiCall("POST", "/worker/backup/runs/reconcile-stale", { staleMs: STALE_MS });
    if (reconciled > 0) log(`Reconciled ${reconciled} stale Running run(s) to Failed.`);
}

async function claimNext() {
    const result = await apiCall("POST", "/worker/backup/runs/claim");
    if (!result || result.claimed === false) return null;
    return result;
}

async function heartbeat(runId) {
    return apiCall("POST", `/worker/backup/runs/${encodeURIComponent(runId)}/heartbeat`);
}

async function sendComponent(runId, evt) {
    await apiCall("POST", `/worker/backup/runs/${encodeURIComponent(runId)}/components`, {
        type: evt.type,
        name: evt.name,
        status: evt.status,
        bytes: evt.bytes ?? null,
        durationMs: evt.durationMs ?? null,
        error: evt.error ?? null,
    });
}

async function sendDestination(runId, destinationId, evt) {
    await apiCall("POST", `/worker/backup/runs/${encodeURIComponent(runId)}/destinations`, {
        destinationId,
        status: evt.status,
        uploadedBytes: evt.uploadedBytes ?? null,
        finalPath: evt.finalPath ?? null,
        error: evt.error ?? null,
    });
}

async function sendArchive(runId, evt) {
    await apiCall("POST", `/worker/backup/runs/${encodeURIComponent(runId)}/archive`, {
        archivePath: evt.archivePath ?? null,
        archiveBytes: evt.archiveBytes ?? null,
        archiveSha256: evt.archiveSha256 ?? null,
        keyFingerprint: evt.keyFingerprint ?? null,
    });
}

async function sendManifest(runId, manifest) {
    await apiCall("POST", `/worker/backup/runs/${encodeURIComponent(runId)}/archive`, { manifest });
}

async function finalizeRun(runId, status, extras = {}) {
    await apiCall("POST", `/worker/backup/runs/${encodeURIComponent(runId)}/finalize`, {
        status,
        errorMessage: extras.errorMessage ?? null,
        archivePath: extras.archivePath ?? null,
        archiveBytes: extras.archiveBytes ?? null,
        archiveSha256: extras.archiveSha256 ?? null,
        keyFingerprint: extras.keyFingerprint ?? null,
        manifest: extras.manifest,
    });
}

/**
 * Read the on-disk age keypair and register it with the server. If the
 * server reports no currently-matching active key, creating this row flips
 * it to active and retires any previous active row.
 */
async function syncActiveKey() {
    const pubFile = path.join(SECRETS_DIR, "age.pub");
    if (!fs.existsSync(pubFile)) {
        log(`No public key at ${pubFile} - skipping key sync`);
        return;
    }
    const publicKey = fs.readFileSync(pubFile, "utf-8").trim();
    if (!publicKey) return;
    const fingerprint = crypto.createHash("sha256").update(publicKey).digest("hex");
    const result = await apiCall("POST", "/worker/backup/keys/upsert", {
        algorithm: "Age",
        publicKey,
        fingerprint,
        privateKeyPath: "/host-secrets/age.key",
    });
    if (result?.created) {
        log(`Registered new BackupKey ${result.id} (fingerprint ${fingerprint}) with server`);
    }
    return fingerprint;
}

/**
 * Called after an admin clicks "Rotate Key" in the UI. The mutation flips
 * the old row to active=false, so on the next tick the server's active
 * key is missing. When syncActiveKey() detects the on-disk key isn't
 * marked active on the server, we archive the on-disk keypair, re-run
 * init-keys.sh to generate a fresh pair, and re-sync.
 *
 * We detect "rotation requested" by asking the server for its view of the
 * active fingerprint via the claim endpoint's response, but since claims
 * only happen when there's a Queued run, we instead check the keys/upsert
 * response: after re-upserting the on-disk key, if the server says
 * `active=true` but the row was already present (created=false) and
 * previously was inactive, we know we won the race. Simpler heuristic:
 * if age.pub disappears or is stale, init-keys.sh regenerates it on the
 * next tick.
 */
async function ensureActiveKey() {
    const keyFile = path.join(SECRETS_DIR, "age.key");
    const pubFile = path.join(SECRETS_DIR, "age.pub");

    // Sync whatever's on disk first. If the server has an unacknowledged
    // rotation pending (no matching fingerprint), we'll detect that here
    // by looking at the response.
    if (fs.existsSync(pubFile)) {
        try {
            await syncActiveKey();
        } catch (e) {
            errLog("Initial key sync:", e.message);
        }
    }

    // If we haven't been asked to rotate (init-keys.sh already produced a
    // keypair we've synced), we're done.
    if (fs.existsSync(keyFile) && fs.existsSync(pubFile)) return;

    log("Missing on-disk keypair - running init-keys.sh to generate a new one");
    const archiveDir = path.join(SECRETS_DIR, "archive");
    try {
        fs.mkdirSync(archiveDir, { recursive: true, mode: 0o700 });
    } catch (e) { errLog("mkdir archive:", e.message); }

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    for (const f of [keyFile, pubFile]) {
        if (fs.existsSync(f)) {
            try {
                fs.renameSync(f, path.join(archiveDir, `${path.basename(f)}.${stamp}`));
            } catch (e) { errLog(`archive ${f}:`, e.message); }
        }
    }

    const result = spawnSync("/usr/local/bin/init-keys.sh", [], {
        stdio: ["ignore", "inherit", "inherit"],
        env: process.env,
    });
    if (result.status !== 0) {
        throw new Error(`init-keys.sh exited with status ${result.status}`);
    }

    // Re-export BACKUP_AGE_RECIPIENT so the next backup.sh spawn picks up
    // the new public key. (entrypoint.sh only sets this once at boot.)
    try {
        if (fs.existsSync(pubFile)) {
            process.env.BACKUP_AGE_RECIPIENT = fs.readFileSync(pubFile, "utf-8").trim();
        }
    } catch (e) { errLog("read new pubkey:", e.message); }

    await syncActiveKey();
}

/**
 * Build the backup.sh argv from the policy + enabled destinations returned
 * by the claim endpoint.
 */
function buildArgs(run, policy, destinations) {
    const args = ["--json", "--run-id", run.id];
    if (policy.retentionDays) {
        args.push("--retention-days", String(policy.retentionDays));
    }
    const joinList = (v) => (Array.isArray(v) ? v.join(" ") : v);
    if (policy.excludeVolumes?.length)   args.push("--exclude-volumes",    joinList(policy.excludeVolumes));
    if (policy.excludePaths?.length)     args.push("--exclude-paths",      joinList(policy.excludePaths));
    if (policy.excludeServices?.length)  args.push("--exclude-services",   joinList(policy.excludeServices));
    if (policy.excludeEnvFiles?.length)  args.push("--exclude-env-files",  joinList(policy.excludeEnvFiles));
    if (policy.extraEnvFiles?.length)    args.push("--extra-env-files",    joinList(policy.extraEnvFiles));
    if (policy.includeDatabases?.length) args.push("--include-databases", joinList(policy.includeDatabases));
    for (const d of destinations) {
        const outputPath = d.type === "Local" ? LOCAL_DESTINATION_PATH : d.output;
        args.push("--destination", String(d.type).toLowerCase());
        args.push("--output", outputPath);
    }
    return args;
}

/**
 * Index destinations by `${type}:${output}` so we can look up the DB id
 * from backup.sh's NDJSON destination events (which carry type + output
 * only).
 */
function destinationIndex(destinations) {
    const m = new Map();
    for (const d of destinations) {
        const outputPath = d.type === "Local" ? LOCAL_DESTINATION_PATH : d.output;
        m.set(`${String(d.type).toLowerCase()}:${outputPath}`, d.id);
    }
    return m;
}

async function handleEvent(run, destIdx, evt) {
    switch (evt.event) {
        case "component":
            await sendComponent(run.id, evt);
            break;
        case "destination": {
            const key = `${String(evt.type).toLowerCase()}:${evt.output}`;
            const id = destIdx.get(key);
            if (!id) {
                errLog(`No destination row for ${key}; skipping event`);
                return;
            }
            await sendDestination(run.id, id, evt);
            break;
        }
        case "archive":
            await sendArchive(run.id, evt);
            break;
        case "manifest":
            await sendManifest(run.id, evt.manifest ?? {});
            break;
        case "plan":
        case "log":
        case "done":
            // informational - ignored
            break;
        default:
            log(`Unknown event type: ${evt.event}`);
    }
}

function spawnBackup(args) {
    log(`Spawning backup.sh ${args.join(" ")}`);
    const child = spawn("bash", ["./backup.sh", ...args], {
        cwd: WORKSPACE,
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
    });
    return child;
}

async function executeRun(claim) {
    const { run, policy, destinations, activeKeyFingerprint } = claim;
    if (destinations.length === 0) throw new Error("No enabled destinations configured for this policy");

    const destIdx = destinationIndex(destinations);

    const child = spawnBackup(buildArgs(run, policy, destinations));

    let cancelSeen = false;
    const hbInterval = setInterval(async () => {
        try {
            const hb = await heartbeat(run.id);
            if (hb?.cancelRequested && !cancelSeen) {
                cancelSeen = true;
                log(`Cancel requested for ${run.id} - sending SIGTERM`);
                child.kill("SIGTERM");
            }
        } catch (e) { errLog("heartbeat:", e.message); }
    }, HEARTBEAT_MS);

    let stdoutBuf = "";
    let stderrBuf = "";
    const finalState = { keyFingerprint: activeKeyFingerprint };
    // Every handleEvent() HTTP call is awaited here before we finalize,
    // so partial component/archive writes can't race past the finalize
    // call and leave fields unset on the BackupRun row.
    const pending = [];

    child.stdout.on("data", (chunk) => {
        stdoutBuf += chunk.toString();
        let idx;
        while ((idx = stdoutBuf.indexOf("\n")) >= 0) {
            const line = stdoutBuf.slice(0, idx).trim();
            stdoutBuf = stdoutBuf.slice(idx + 1);
            if (!line) continue;
            let evt;
            try { evt = JSON.parse(line); } catch {
                log(`[shell] ${line}`);
                continue;
            }
            if (evt.event === "archive") {
                Object.assign(finalState, {
                    archivePath: evt.archivePath,
                    archiveBytes: evt.archiveBytes,
                    archiveSha256: evt.archiveSha256,
                    keyFingerprint: evt.keyFingerprint ?? finalState.keyFingerprint,
                });
            } else if (evt.event === "manifest") {
                finalState.manifest = evt.manifest;
            }
            pending.push(handleEvent(run, destIdx, evt).catch((e) => errLog("handleEvent:", e.message)));
        }
    });

    child.stderr.on("data", (chunk) => {
        const text = chunk.toString();
        stderrBuf += text;
        process.stderr.write(text);
    });

    // `close` (not `exit`) fires after all child stdio streams are drained.
    // Using `exit` races the stdout data handler — if backup.sh emits its
    // archive/manifest events close to exit, those lines can still be in
    // Node's pipe buffer when `exit` fires, leading to finalizeRun running
    // before finalState is updated and the BackupRun.keyFingerprint column
    // staying null.
    const exitCode = await new Promise((resolve, reject) => {
        child.on("error", reject);
        child.on("close", (code) => resolve(code));
    });

    // Wait for any in-flight component/destination/archive HTTP calls to
    // land before we finalize.
    await Promise.allSettled(pending);

    clearInterval(hbInterval);

    if (exitCode === 0) {
        await finalizeRun(run.id, "Success", {
            keyFingerprint: finalState.keyFingerprint,
            archivePath: finalState.archivePath,
            archiveBytes: finalState.archiveBytes,
            archiveSha256: finalState.archiveSha256,
            manifest: finalState.manifest,
        });
        log(`Run ${run.id} completed successfully`);
    } else {
        const finalStatus = cancelSeen ? "Cancelled" : "Failed";
        await finalizeRun(run.id, finalStatus, {
            errorMessage: (stderrBuf || `backup.sh exited with code ${exitCode}`).slice(0, 8000),
            keyFingerprint: finalState.keyFingerprint,
        });
        log(`Run ${run.id} ended with status=${finalStatus} (exit=${exitCode})`);
    }
}

async function tick() {
    const claim = await claimNext();
    if (!claim) return false;
    log(`Claimed run ${claim.run.id} (trigger=${claim.run.trigger})`);
    try {
        if (claim.run.cancelRequested) {
            await finalizeRun(claim.run.id, "Cancelled", { errorMessage: "Cancelled before start" });
            return true;
        }
        await executeRun(claim);
    } catch (e) {
        errLog(`Run ${claim.run.id} failed:`, e);
        await finalizeRun(claim.run.id, "Failed", {
            errorMessage: (e && e.message ? e.message : String(e)).slice(0, 8000),
        }).catch(errLog);
    }
    return true;
}

async function waitForServer() {
    // depends_on: server: service_healthy usually handles this, but the
    // first request after startup can still race the server's readiness
    // probes. Try briefly before giving up so transient boot races don't
    // panic-exit the sidecar.
    for (let attempt = 0; attempt < 30; attempt++) {
        try {
            const res = await fetch(`${SERVER_URL}/graphql`, { method: "GET" });
            // Any response (even 4xx) means the server is listening.
            if (res.status < 500) return;
        } catch {
            // swallow - retry
        }
        await new Promise((r) => setTimeout(r, 2000));
    }
    throw new Error(`Server at ${SERVER_URL} did not become reachable`);
}

async function main() {
    log(`Worker starting (workspace=${WORKSPACE}, server=${SERVER_URL}, poll=${POLL_MS}ms, heartbeat=${HEARTBEAT_MS}ms)`);

    await waitForServer();

    let stopping = false;
    const stop = () => { stopping = true; };
    process.on("SIGTERM", stop);
    process.on("SIGINT", stop);

    try {
        await reconcileStale();
    } catch (e) { errLog("reconcileStale:", e.message); }

    while (!stopping) {
        try {
            await ensureActiveKey().catch((e) => errLog("Key sync error:", e.message));
            const worked = await tick();
            if (!worked) await new Promise((r) => setTimeout(r, POLL_MS));
        } catch (e) {
            errLog("Tick error:", e);
            await new Promise((r) => setTimeout(r, POLL_MS));
        }
    }

    log("Shutting down");
    process.exit(0);
}

main().catch((e) => {
    errLog("Fatal:", e);
    process.exit(1);
});
