import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { ServicesModule } from "@/services/services.module";
import { BackupWorkerController } from "./backup.controller";
import { BackupWorkerService } from "./backup.service";
import { WorkerTokenGuard } from "./token.guard";

/**
 * Internal REST surface for the backup sidecar. See
 * BackupWorkerController for the routing details. Not registered with
 * Nest's RouterModule — the controller's own @Controller prefix is the
 * full path (/worker/backup/*).
 */
@Module({
  imports: [PrismaModule, ServicesModule],
  controllers: [BackupWorkerController],
  providers: [BackupWorkerService, WorkerTokenGuard],
})
export class WorkerModule {}
