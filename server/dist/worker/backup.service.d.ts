import { BackupComponentStatus, BackupComponentType, BackupKeyAlgorithm, BackupRunStatus } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { BackupSubscriptionPublisher } from "@/services/backup/backup-publisher.service";
import { BackupDiscoveryService } from "@/services/backup/backup-discovery.service";
export interface ClaimResult {
    run: {
        id: string;
        policyId: string;
        trigger: string;
        cancelRequested: boolean;
    };
    policy: {
        id: string;
        enabled: boolean;
        cron: string | null;
        retentionDays: number;
        excludeVolumes: string[];
        excludePaths: string[];
        excludeServices: string[];
        excludeEnvFiles: string[];
        extraEnvFiles: string[];
        includeDatabases: string[];
    };
    destinations: Array<{
        id: string;
        name: string;
        type: string;
        output: string | null;
        enabled: boolean;
        sseMode: string | null;
        sseKmsKeyId: string | null;
        order: number;
    }>;
    activeKeyFingerprint: string | null;
}
interface ComponentUpsertInput {
    type: BackupComponentType;
    name: string;
    status: BackupComponentStatus;
    bytes?: number | null;
    durationMs?: number | null;
    error?: string | null;
}
interface DestinationUpsertInput {
    destinationId: string;
    status: BackupComponentStatus;
    uploadedBytes?: number | null;
    finalPath?: string | null;
    error?: string | null;
}
interface ArchiveUpdateInput {
    archivePath?: string | null;
    archiveBytes?: number | null;
    archiveSha256?: string | null;
    keyFingerprint?: string | null;
    manifest?: unknown;
}
interface FinalizeInput extends ArchiveUpdateInput {
    status: BackupRunStatus;
    errorMessage?: string | null;
}
interface KeyUpsertInput {
    algorithm: BackupKeyAlgorithm;
    publicKey: string;
    fingerprint: string;
    privateKeyPath?: string | null;
}
export declare class BackupWorkerService {
    private readonly prismaService;
    private readonly publisher;
    private readonly discoveryService;
    private readonly logger;
    constructor(prismaService: PrismaService, publisher: BackupSubscriptionPublisher, discoveryService: BackupDiscoveryService);
    private get prisma();
    claimNextRun(): Promise<ClaimResult | null>;
    private findLocalArchive;
    reconcileStale(staleMs: number): Promise<number>;
    private recoverRun;
    heartbeat(runId: string): Promise<{
        cancelRequested: boolean;
        status: BackupRunStatus;
    }>;
    upsertComponent(runId: string, input: ComponentUpsertInput): Promise<void>;
    upsertRunDestination(runId: string, input: DestinationUpsertInput): Promise<void>;
    updateRunArchive(runId: string, input: ArchiveUpdateInput): Promise<void>;
    finalizeRun(runId: string, input: FinalizeInput): Promise<void>;
    upsertKey(input: KeyUpsertInput): Promise<{
        id: string;
        created: boolean;
        active: boolean;
    }>;
}
export {};
