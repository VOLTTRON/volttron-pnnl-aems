import { Module } from "@nestjs/common";
import { BearerPassportService } from "./bearer.service";
import { BearerController } from "./bearer.controller";
import { Provider } from ".";
import { AuthModule } from "../auth.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { AppConfigService } from "@/app.config";
import { AuthService } from "../auth.service";
import { PrismaService } from "@/prisma/prisma.service";

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    JwtModule.registerAsync({
      inject: [AppConfigService.Key],
      useFactory: (configService: AppConfigService) => ({
        secret: configService.jwt.secret,
        signOptions: { expiresIn: configService.jwt.expiresIn },
      }),
    }),
  ],
  providers: [
    {
      provide: Provider,
      inject: [AuthService, AppConfigService.Key, PrismaService, JwtService],
      useFactory: (
        authService: AuthService,
        configService: AppConfigService,
        prismaService: PrismaService,
        jwtService: JwtService,
      ) =>
        configService.auth.providers.includes(Provider)
          ? configService.auth.framework === "passport"
            ? new BearerPassportService(authService, configService, prismaService, jwtService)
            : null
          : null,
    },
  ],
  // todo: make this cleaner
  controllers: new AppConfigService().auth.framework === "passport" ? [BearerController] : [],
})
export class BearerModule {
  static readonly provider = Provider;
}
