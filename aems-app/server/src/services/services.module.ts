import { Module } from "@nestjs/common";
import { LogService } from "./log/log.service";
import { SeedService } from "./seed/seed.service";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "@/prisma/prisma.module";

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule],
  controllers: [],
  providers: [LogService, SeedService],
})
export class ServicesModule {}
