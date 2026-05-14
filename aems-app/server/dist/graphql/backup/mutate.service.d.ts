import { SchemaBuilderService } from "../builder.service";
import { BackupObject } from "./object.service";
import { PrismaService } from "@/prisma/prisma.service";
import { BackupDiscoveryService } from "@/services/backup/backup-discovery.service";
import { BackupSubscriptionPublisher } from "@/services/backup/backup-publisher.service";
import { BackupArchiveService } from "@/services/backup/backup-archive.service";
export declare class BackupMutation {
    private static readonly DOWNLOAD_COOLDOWN_MS;
    private lastDownloadAt;
    private logger;
    constructor(builder: SchemaBuilderService, prismaService: PrismaService, publisher: BackupSubscriptionPublisher, _backupObject: BackupObject, backupDiscoveryService: BackupDiscoveryService, backupArchiveService: BackupArchiveService);
}
