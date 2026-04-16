import { Module } from "@nestjs/common";
import { LogService } from "./log/log.service";
import { SeedService } from "./seed/seed.service";
import { EventService } from "./event/event.service";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "@/prisma/prisma.module";
import { VolttronService } from "./volttron.service";
import { ConfigService } from "./config/config.service";
import { ControlService } from "./control/control.service";
import { SetupService } from "./setup/setup.service";
import { SubscriptionModule } from "@/subscription/subscription.module";

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, SubscriptionModule],
  controllers: [],
  providers: [LogService, SeedService, EventService, VolttronService, ConfigService, ControlService, SetupService],
})
export class ServicesModule {}
