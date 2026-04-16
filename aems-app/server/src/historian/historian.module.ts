import { Module } from "@nestjs/common";
import { HistorianService } from "./historian.service";
import { PrismaModule } from "@/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [HistorianService],
  exports: [HistorianService],
})
export class HistorianModule {}
