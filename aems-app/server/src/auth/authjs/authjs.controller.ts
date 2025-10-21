import { AuthService } from "@/auth/auth.service";
import { Logger, Inject, Injectable, NestMiddleware } from "@nestjs/common";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { buildConfig } from "./authjs.config";
import { ExpressAuth, ExpressAuthConfig } from "@auth/express";
import { RequestHandler } from "express";

@Injectable()
export class AuthjsController implements NestMiddleware {
  private logger = new Logger(AuthjsController.name);
  readonly config: ExpressAuthConfig;
  readonly use: RequestHandler;

  constructor(
    @Inject(AppConfigService.Key) private configService: AppConfigService,
    prismaService: PrismaService,
    authService: AuthService,
    subscriptionService: SubscriptionService,
  ) {
    this.config = buildConfig(this.configService, prismaService, authService, subscriptionService);
    if (configService.auth.framework === "authjs") {
      this.logger.log("Initializing Authjs controller");
      this.use = ExpressAuth(this.config);
    } else {
      this.use = (_req, _res, next) => next();
    }
  }
}
