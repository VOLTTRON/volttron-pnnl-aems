import { MiddlewareConsumer, Module, RequestMethod } from "@nestjs/common";
import { AuthjsMiddleware } from "@/auth/authjs/authjs.middleware";
import { AuthjsController } from "@/auth/authjs/authjs.controller";
import { ExtRewriteMiddleware } from "@/ext/ext.middleware";
import { AuthModule } from "@/auth/auth.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { SubscriptionModule } from "@/subscription/subscription.module";

@Module({
  imports: [AuthModule, PrismaModule, SubscriptionModule],
  providers: [AuthjsMiddleware, AuthjsController, ExtRewriteMiddleware],
  exports: [AuthjsMiddleware, AuthjsController, ExtRewriteMiddleware],
})
export class MiddlewareModule {
  configure(consumer: MiddlewareConsumer) {
    // Configure middleware in the correct execution order
    // 1. Auth middleware runs first to populate req.user
    consumer.apply(AuthjsMiddleware).forRoutes("*");

    // 2. AuthJS controller middleware for auth routes
    consumer.apply(AuthjsController).forRoutes("authjs");

    // 3. Ext middleware runs last, can access req.user for role checking
    consumer.apply(ExtRewriteMiddleware).forRoutes({ path: "ext/*path", method: RequestMethod.ALL });
  }
}
