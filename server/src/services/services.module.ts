import { Module } from "@nestjs/common";
import { LogService } from "./log/log.service";
import { SeedService } from "./seed/seed.service";
import { EventService } from "./event/event.service";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "@/prisma/prisma.module";

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule],
  controllers: [],
  providers: [LogService, SeedService, EventService],
})
export class ServicesModule {}
