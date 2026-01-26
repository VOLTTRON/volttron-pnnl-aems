import { Module } from "@nestjs/common";
import { KeycloakSyncService } from "./keycloak-sync.service";
import { KeycloakInternalController } from "./keycloak-internal.controller";
import { InternalNetworkGuard } from "./internal-network.guard";
import { PrismaModule } from "@/prisma/prisma.module";
import { SubscriptionModule } from "@/subscription/subscription.module";

@Module({
  imports: [PrismaModule, SubscriptionModule],
  controllers: [KeycloakInternalController],
  providers: [KeycloakSyncService, InternalNetworkGuard],
  exports: [KeycloakSyncService],
})
export class KeycloakSyncModule {}
