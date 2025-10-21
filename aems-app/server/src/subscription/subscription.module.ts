import { PrismaModule } from "@/prisma/prisma.module";
import { Module } from "@nestjs/common";
import { SubscriptionService } from "./subscription.service";

@Module({
  imports: [PrismaModule],
  providers: [SubscriptionService, { provide: "PUB_SUB", useClass: SubscriptionService }],
  exports: [SubscriptionService, { provide: "PUB_SUB", useClass: SubscriptionService }],
})
export class SubscriptionModule {}
