import { Module } from "@nestjs/common";
import { KeycloakService } from "./keycloak.service";
import { KeycloakController } from "./keycloak.controller";
import { Provider } from ".";
import { AuthModule } from "../auth.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { ConfigModule } from "@nestjs/config";
import { config } from "./keycloak.config";
import { AppConfigService } from "@/app.config";
import { AuthService } from "../auth.service";
import { PrismaService } from "@/prisma/prisma.service";

@Module({
  imports: [ConfigModule.forRoot({ load: [config] }), AuthModule, PrismaModule],
  providers: [
    {
      provide: Provider,
      inject: [AppConfigService.Key, AuthService, PrismaService],
      useFactory: (configService: AppConfigService, authService: AuthService, prismaService: PrismaService) =>
        configService.auth.providers.includes(Provider)
          ? new KeycloakService(authService, prismaService, configService)
          : null,
    },
  ],
  controllers: [KeycloakController],
})
export class KeycloakModule {
  static readonly provider = Provider;
}
