import { BackupComponentStatus, BackupComponentType, BackupKeyAlgorithm, BackupRunStatus } from "@prisma/client";
import { BackupWorkerService, ClaimResult } from "./backup.service";
export declare class BackupWorkerController {
    private readonly workerService;
    private readonly logger;
    constructor(workerService: BackupWorkerService);
    claim(): Promise<ClaimResult | {
        claimed: false;
    }>;
    reconcileStale(body: {
        staleMs: number;
    }): Promise<{
        reconciled: number;
    }>;
    heartbeat(id: string): Promise<{
        cancelRequested: boolean;
        status: BackupRunStatus;
    }>;
    component(id: string, body: {
        type: BackupComponentType;
        name: string;
        status: BackupComponentStatus;
        bytes?: number | null;
        durationMs?: number | null;
        error?: string | null;
    }): Promise<void>;
    destination(id: string, body: {
        destinationId: string;
        status: BackupComponentStatus;
        uploadedBytes?: number | null;
        finalPath?: string | null;
        error?: string | null;
    }): Promise<void>;
    archive(id: string, body: {
        archivePath?: string | null;
        archiveBytes?: number | null;
        archiveSha256?: string | null;
        keyFingerprint?: string | null;
        manifest?: unknown;
    }): Promise<void>;
    finalize(id: string, body: {
        status: BackupRunStatus;
        errorMessage?: string | null;
        archivePath?: string | null;
        archiveBytes?: number | null;
        archiveSha256?: string | null;
        keyFingerprint?: string | null;
        manifest?: unknown;
    }): Promise<{
        ok: true;
    }>;
    upsertKey(body: {
        algorithm: BackupKeyAlgorithm;
        publicKey: string;
        fingerprint: string;
        privateKeyPath?: string | null;
    }): Promise<{
        id: string;
        created: boolean;
        active: boolean;
    }>;
}
