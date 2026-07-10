import { Inject, Injectable, Logger, NestMiddleware, OnModuleDestroy } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { Request, RequestHandler } from "express";
import { AppConfigService } from "@/app.config";
import { ExpressAuthConfig, getSession } from "@auth/express";
import { AuthError } from "@auth/core/errors";
import { buildConfig } from "./authjs.config";
import { buildExpressUser } from "..";
import { AuthjsProvider, AuthService, ExpressProvider } from "../auth.service";

@Injectable()
export class AuthjsMiddleware implements NestMiddleware, OnModuleDestroy {
  private logger = new Logger(AuthjsMiddleware.name);
  readonly config: ExpressAuthConfig;
  readonly use: RequestHandler;

  constructor(
    @Inject(AppConfigService.Key) private configService: AppConfigService,
    private prismaService: PrismaService,
    private authService: AuthService,
    private subscriptionService: SubscriptionService,
  ) {
    authService.subscribe(this.update.bind(this));
    this.config = buildConfig(this.configService, this.prismaService, this.authService, this.subscriptionService);
    if (this.configService.auth.framework === "authjs") {
      this.logger.log("Initializing Authjs middleware");
      this.use = async (req, _res, next) => {
        try {
          req.user = (await this.getAuthjsUser(req)) ?? req.user;
        } catch (error) {
          // AuthError subclasses (JWTSessionError, etc.) are expected during secret
          // rotation or when a browser presents an expired/invalid token. Treat them
          // as debug-level events — the user simply gets an unauthenticated request.
          if (error instanceof AuthError) {
            this.logger.debug(`Auth.js session error (${error.type}): ${error.message}`);
          } else {
            this.logger.error("Auth.js session middleware error:", error);
          }
        }
        return next();
      };
    } else {
      this.use = (_req, _res, next) => next();
    }
  }

  private update(provider: ExpressProvider | AuthjsProvider) {
    if ("create" in provider) {
      this.logger.warn(`Authjs provider registered after middleware initialization: ${provider.name}`);
    }
  }

  private async getAuthjsUser(req: Request): Promise<Express.User | undefined> {
    const authjsSession = await getSession(req, this.config);
    if (authjsSession?.user?.email) {
      return this.prismaService.prisma.user
        .findUniqueOrThrow({ where: { email: authjsSession.user.email }, omit: { password: true } })
        .then((user) => buildExpressUser(user))
        .catch(() => undefined);
    }
    return undefined;
  }

  onModuleDestroy() {
    this.authService.unsubscribe(this.update.bind(this));
    this.logger.debug("Authjs middleware shutdown");
  }
}
