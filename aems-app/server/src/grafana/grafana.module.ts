import { Module } from "@nestjs/common";
import { GrafanaRewriteMiddleware } from "./grafana.middleware";
import { PrismaModule } from "@/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [GrafanaRewriteMiddleware],
  exports: [GrafanaRewriteMiddleware],
})
export class GrafanaModule {}
