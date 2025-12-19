import { Module } from "@nestjs/common";
import { FileController } from "./file.controller";
import { PrismaModule } from "@/prisma/prisma.module";
import { GrafanaController } from "./grafana.controller";

@Module({
  imports: [PrismaModule],
  providers: [],
  controllers: [FileController, GrafanaController],
})
export class ApiModule {}
