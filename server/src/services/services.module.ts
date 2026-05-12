import { Module } from "@nestjs/common";
import { LogService } from "./log/log.service";
import { SeedService } from "./seed/seed.service";
import { EventService } from "./event/event.service";
import { BackupService } from "./backup/backup.service";
import { BackupDiscoveryService } from "./backup/backup-discovery.service";
import { BackupSubscriptionPublisher } from "./backup/backup-publisher.service";
import { BackupArchiveService } from "./backup/backup-archive.service";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "@/prisma/prisma.module";
import { SubscriptionModule } from "@/subscription/subscription.module";

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, SubscriptionModule],
  controllers: [],
  providers: [
    LogService,
    SeedService,
    EventService,
    BackupService,
    BackupDiscoveryService,
    BackupSubscriptionPublisher,
    BackupArchiveService,
  ],
  exports: [BackupDiscoveryService, BackupSubscriptionPublisher, BackupArchiveService],
})
export class ServicesModule {}
