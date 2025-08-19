import { MiddlewareConsumer, Module } from "@nestjs/common";
import { AuthjsMiddleware } from "./authjs.middleware";
import { AuthjsController } from "./authjs.controller";
import { PrismaModule } from "@/prisma/prisma.module";
import { SubscriptionModule } from "@/subscription/subscription.module";
import { AuthModule } from "../auth.module";

@Module({
  imports: [PrismaModule, SubscriptionModule, AuthModule],
})
export class AuthjsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthjsMiddleware).forRoutes("*");
    consumer.apply(AuthjsController).forRoutes("authjs");
  }
}
