import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ApiModule } from "@/api/api.module";
import { WorkerModule } from "@/worker/worker.module";
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
import { HistorianModule } from "./historian/historian.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [AppConfigToken],
      envFilePath: [".env", ".env.local"],
    }),
    ApiModule,
    WorkerModule,
    AuthModule,
    HistorianModule,
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
