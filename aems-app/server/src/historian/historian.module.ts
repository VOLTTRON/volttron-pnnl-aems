import { Module } from "@nestjs/common";
import { HistorianService } from "./historian.service";

@Module({
  providers: [HistorianService],
  exports: [HistorianService],
})
export class HistorianModule {}
