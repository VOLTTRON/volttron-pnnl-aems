import { PrismaService } from "@/prisma/prisma.service";
import { BackupRunDestination } from "@prisma/client";
import { BackupSubscriptionPublisher } from "./backup-publisher.service";
export type BackupArchiveAvailability = "Available" | "Missing" | "Removed";
export declare const BackupArchiveAvailabilityValues: readonly ["Available", "Missing", "Removed"];
export declare class BackupArchiveService {
    private readonly prismaService;
    private readonly publisher;
    private readonly logger;
    private s3ClientInstance;
    constructor(prismaService: PrismaService, publisher: BackupSubscriptionPublisher);
    private get s3Client();
    private parseS3Uri;
    private s3Key;
    private isMissingError;
    getAvailability(runDestinationId: string): Promise<BackupArchiveAvailability>;
    getRunAvailability(runId: string): Promise<BackupArchiveAvailability>;
    deleteArchive(runDestinationId: string): Promise<BackupRunDestination>;
}
