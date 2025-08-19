import { Module } from "@nestjs/common";
import { SuperController } from "./super.controller";
import { Provider } from ".";
import { AuthModule } from "../auth.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { SuperAuthjsService, SuperPassportService } from "./super.service";
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
            ? new SuperAuthjsService(authService, configService, prismaService)
            : new SuperPassportService(authService, configService, prismaService)
          : null,
    },
  ],
  // todo: make this cleaner
  controllers: new AppConfigService().auth.framework === "passport" ? [SuperController] : [],
})
export class SuperModule {
  static readonly provider = Provider;
}
