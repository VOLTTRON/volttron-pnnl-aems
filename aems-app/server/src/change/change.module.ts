import { PrismaModule } from "@/prisma/prisma.module";
import { Module } from "@nestjs/common";
import { ChangeService } from "./change.service";
import { SubscriptionModule } from "@/subscription/subscription.module";

@Module({
  imports: [PrismaModule, SubscriptionModule],
  controllers: [],
  providers: [ChangeService],
  exports: [ChangeService],
})
export class ChangeModule {}
