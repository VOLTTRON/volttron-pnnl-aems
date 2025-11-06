import { Module } from "@nestjs/common";
import { AppLoggerService } from "./logging.service";
import { PrismaModule } from "@/prisma/prisma.module";
import { PrismaLogger } from "./logger.service";

@Module({
  imports: [PrismaModule],
  providers: [AppLoggerService, PrismaLogger],
  exports: [AppLoggerService],
})
export class LoggingModule {}
