import { Inject, Injectable, Logger, NestMiddleware, OnModuleDestroy } from "@nestjs/common";
import { buildExpressUser } from "..";
import { PrismaService } from "@/prisma/prisma.service";
import { LoggerService } from "@nestjs/common";
import * as passport from "passport";
import * as session from "express-session";
import { PrismaSessionStore } from "@/auth/passport/session.service";
import { RedisStore } from "connect-redis";
import Redis from "ioredis";
import { RequestHandler } from "express";
import { AppConfigService } from "@/app.config";
import { AuthjsProvider, AuthService, ExpressProvider } from "../auth.service";

export const Session = "session";

export const sessionStoreFactory = (
  prismaService: PrismaService,
  configService: AppConfigService,
  logger: LoggerService,
) => {
  switch (configService.session.store) {
    case "prisma":
    case "database":
    case "postgres":
    case "postgresql":
      logger.log("Creating Prisma database session store");
      return new PrismaSessionStore(prismaService);
    case "redis":
    case "ioredis":
      logger.log("Creating Redis session store");
      return new RedisStore({
        client: new Redis({
          host: configService.redis.host,
          port: configService.redis.port,
          username: configService.redis.username,
          password: configService.redis.password,
          db: configService.redis.db,
        }),
      });
    case "memory":
    case "":
    case undefined:
      return undefined;
    default:
      logger.warn(`Unknown session store specified: ${configService.session.store}`);
      return undefined;
  }
};

@Injectable()
export class PassportMiddleware implements NestMiddleware, OnModuleDestroy {
  private logger = new Logger(PassportMiddleware.name);
  readonly passport = passport;
  readonly use: RequestHandler;

  constructor(
    @Inject(AppConfigService.Key) private configService: AppConfigService,
    private prismaService: PrismaService,
    private authService: AuthService,
  ) {
    authService.subscribe(this.update.bind(this));
    if (this.configService.auth.framework === "passport") {
      this.logger.log("Initializing Passport auth service");
      this.passport.serializeUser<Express.User, string>(this.serializeUser);
      this.passport.deserializeUser<Express.User, string>(this.deserializeUser);
      this.use = session({
        cookie: {
          maxAge: configService.session.maxAge,
          secure: false,
          httpOnly: true,
          sameSite: "lax",
        },
        resave: false,
        saveUninitialized: false,
        secret: configService.session.secret,
        store: sessionStoreFactory(prismaService, configService, this.logger),
      });
    } else {
      this.use = (_req, _res, next) => next();
    }
  }

  private update(provider: ExpressProvider | AuthjsProvider) {
    if ("validate" in provider) {
      this.logger.warn(`Authjs provider registered after middleware initialization: ${provider.name}`);
    }
  }

  serializeUser = (user: Express.User, done: (err: Error | null, id?: string) => void) => done(null, user?.id);

  deserializeUser = (id: string, done: (err: Error | null, user?: Express.User) => void) => {
    this.prismaService.prisma.user
      .findUniqueOrThrow({ where: { id }, omit: { password: true } })
      .then((user) => done(null, buildExpressUser(user)))
      .catch((err: Error) => done(err));
  };

  onModuleDestroy() {
    this.authService.unsubscribe(this.update.bind(this));
    this.logger.debug("Passport middleware shutdown");
  }
}
