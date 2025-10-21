import { Module } from "@nestjs/common";
import { FileController } from "./file.controller";
import { PrismaModule } from "@/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [],
  controllers: [FileController],
})
export class ApiModule {}
