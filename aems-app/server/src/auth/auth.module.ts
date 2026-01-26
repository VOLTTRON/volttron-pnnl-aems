import { Module } from "@nestjs/common";
import { AuthService } from "@/auth/auth.service";
import { APP_GUARD } from "@nestjs/core";
import { AuthenticatedGuard } from "@/auth/authenticated.guard";
import { RolesGuard } from "@/auth/roles.guard";
import { JwtModule } from "@nestjs/jwt";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "@/prisma/prisma.module";
import { SubscriptionModule } from "@/subscription/subscription.module";
import { AuthController } from "./auth.controller";
import { AppConfigService } from "@/app.config";

@Module({
  imports: [
    PrismaModule,
    SubscriptionModule,
    ScheduleModule.forRoot(),
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
      provide: APP_GUARD,
      useClass: AuthenticatedGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    AuthService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {
  static forRoot() {
    return {
      module: AuthModule,
    };
  }
}
