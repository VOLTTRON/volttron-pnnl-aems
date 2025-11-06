import { Module } from "@nestjs/common";
import { AuthjsMiddleware } from "./authjs.middleware";
import { AuthjsController } from "./authjs.controller";
import { PrismaModule } from "@/prisma/prisma.module";
import { SubscriptionModule } from "@/subscription/subscription.module";
import { AuthModule } from "../auth.module";

@Module({
  imports: [PrismaModule, SubscriptionModule, AuthModule],
  providers: [AuthjsMiddleware, AuthjsController],
  exports: [AuthjsMiddleware, AuthjsController],
})
export class AuthjsModule {}
