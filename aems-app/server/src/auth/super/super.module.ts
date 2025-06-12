import { Module } from "@nestjs/common";
import { SuperController } from "./super.controller";
import { Provider } from ".";
import { AuthModule } from "../auth.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { SuperService } from "./super.service";
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
        configService.auth.providers.includes(Provider) ? new SuperService(authService, prismaService) : null,
    },
  ],
  controllers: [SuperController],
})
export class SuperModule {
  static readonly provider = Provider;
}
