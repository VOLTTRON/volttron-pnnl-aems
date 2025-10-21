import { Module } from "@nestjs/common";
import { LocalAuthjsService, LocalPassportService } from "./local.service";
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
      inject: [AuthService, AppConfigService.Key, PrismaService],
      useFactory: (authService: AuthService, configService: AppConfigService, prismaService: PrismaService) =>
        configService.auth.providers.includes(Provider)
          ? configService.auth.framework === "authjs"
            ? new LocalAuthjsService(authService, configService, prismaService)
            : new LocalPassportService(authService, configService, prismaService)
          : null,
    },
  ],
  // todo: make this cleaner
  controllers: new AppConfigService().auth.framework === "passport" ? [LocalController] : [],
})
export class LocalModule {
  static readonly provider = Provider;
}
