import { MiddlewareConsumer, Module, RequestMethod } from "@nestjs/common";
import { AuthjsMiddleware } from "@/auth/authjs/authjs.middleware";
import { AuthjsController } from "@/auth/authjs/authjs.controller";
import { ExtRewriteMiddleware } from "@/ext/ext.middleware";
import { AuthModule } from "@/auth/auth.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { SubscriptionModule } from "@/subscription/subscription.module";
import { GrafanaModule } from "@/grafana/grafana.module";
import { GrafanaRewriteMiddleware } from "@/grafana/grafana.middleware";

@Module({
  imports: [AuthModule, PrismaModule, SubscriptionModule, GrafanaModule],
  providers: [AuthjsMiddleware, AuthjsController, ExtRewriteMiddleware, GrafanaRewriteMiddleware],
  exports: [AuthjsMiddleware, AuthjsController, ExtRewriteMiddleware, GrafanaRewriteMiddleware],
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

    // 4. Grafana middleware runs last, can access req.user for role checking
    consumer.apply(GrafanaRewriteMiddleware).forRoutes({ path: "gdb/*path", method: RequestMethod.ALL });
  }
}
