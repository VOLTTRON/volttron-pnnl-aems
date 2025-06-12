import { Module } from "@nestjs/common";
import { LocalService } from "./local.service";
import { LocalController } from "./local.controller";
import { Provider } from ".";
import { AuthModule } from "../auth.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { AppConfigService } from "@/app.config";
import { AuthService } from "../auth.service";
import { PrismaService } from "@/prisma/prisma.service";

@Module({
  imports: [AuthModule, PrismaModule],
  providers: [
    {
      provide: Provider,
      inject: [AppConfigService.Key, AuthService, PrismaService],
      useFactory: (configService: AppConfigService, authService: AuthService, prismaService: PrismaService) =>
        configService.auth.providers.includes(Provider) ? new LocalService(authService, prismaService) : null,
    },
  ],
  controllers: [LocalController],
})
export class LocalModule {
  static readonly provider = Provider;
}
