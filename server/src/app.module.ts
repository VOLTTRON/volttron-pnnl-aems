import { MiddlewareConsumer, Module, RequestMethod } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { ExtRewriteMiddleware } from "@/ext/ext.middleware";
import { ApiModule } from "@/api/api.module";
import { RouterModule } from "@nestjs/core";
import { PothosGraphQLModule } from "@/graphql/pothos.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { ServicesModule } from "@/services/services.module";
import { ProviderModule } from "@/auth/provider.module";
import { AppConfigToken } from "@/app.config";
import { LoggingModule } from "@/logging/logging.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [AppConfigToken],
      envFilePath: [".env", ".env.local"],
    }),
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 1000,
        limit: 3,
      },
      {
        name: "medium",
        ttl: 10000,
        limit: 20,
      },
      {
        name: "long",
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    LoggingModule,
    ApiModule,
    RouterModule.register([{ path: "api", module: ApiModule }]),
    ProviderModule.register({ path: "api" }),
    PothosGraphQLModule.forRoot(),
    ServicesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ExtRewriteMiddleware).forRoutes({ path: "ext/*path", method: RequestMethod.ALL });
  }
}
