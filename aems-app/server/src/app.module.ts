import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { ApiModule } from "@/api/api.module";
import { RouterModule } from "@nestjs/core";
import { PothosGraphQLModule } from "@/graphql/pothos.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { ServicesModule } from "@/services/services.module";
import { ProviderModule } from "@/auth/provider.module";
import { AppConfigToken } from "@/app.config";
import { LoggingModule } from "@/logging/logging.module";
import { AuthModule } from "./auth/auth.module";
import { FrameworkModule } from "./auth/framework.module";
import { MiddlewareModule } from "@/middleware/middleware.module";
import { ChangeModule } from "./change/change.module";
import { KeycloakSyncModule } from "./keycloak/keycloak.module";

@Module({
  imports: [
    ApiModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [AppConfigToken],
      envFilePath: [".env", ".env.local"],
    }),
    MiddlewareModule,
    FrameworkModule.register(),
    LoggingModule,
    PrismaModule,
    ChangeModule,
    KeycloakSyncModule,
    ProviderModule.register({ path: "api" }),
    PothosGraphQLModule.forRoot(),
    RouterModule.register([{ path: "api", module: ApiModule }]),
    ServicesModule,
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
