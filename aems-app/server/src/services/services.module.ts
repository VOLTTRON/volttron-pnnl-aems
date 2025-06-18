import { Module } from "@nestjs/common";
import { LogService } from "./log/log.service";
import { SeedService } from "./seed/seed.service";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "@/prisma/prisma.module";
import { VolttronService } from "./volttron.service";
import { ConfigService } from "./config/config.service";
import { ControlService } from "./control/control.service";
import { SetupService } from "./setup/setup.service";

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule],
  controllers: [],
  providers: [LogService, SeedService, VolttronService, ConfigService, ControlService, SetupService],
})
export class ServicesModule {}
