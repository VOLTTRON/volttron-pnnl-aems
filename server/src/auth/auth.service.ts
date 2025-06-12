import { Inject, Injectable, Logger } from "@nestjs/common";
import { buildExpressUser } from ".";
import { PrismaService } from "@/prisma/prisma.service";
import { LoggerService } from "@nestjs/common";
import * as passport from "passport";
import * as session from "express-session";
import { PrismaSessionStore } from "@/auth/session.service";
import { RedisStore } from "connect-redis";
import Redis from "ioredis";
import { Request, RequestHandler } from "express";
import { AppConfigService } from "@/app.config";
import { Credentials, ProviderInfo } from "@local/common";
import { IncomingMessage } from "node:http";

export const Session = "session";

const sessionStoreFactory = (prismaService: PrismaService, configService: AppConfigService, logger: LoggerService) => {
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
export class AuthService {
  private logger = new Logger(AuthService.name);
  readonly passport = passport;
  readonly session: RequestHandler;
  readonly providers = new Map<string, ProviderInfo<Credentials>>();

  constructor(
    private prismaService: PrismaService,
    @Inject(AppConfigService.Key) private configService: AppConfigService,
  ) {
    this.logger.log("Initializing auth service");
    this.passport.serializeUser<Express.User, string>(this.serializeUser);
    this.passport.deserializeUser<Express.User, string>(this.deserializeUser);
    this.session = session({
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
  }

  serializeUser = (user: Express.User, done: (err: Error | null, id?: string) => void) => done(null, user?.id);

  deserializeUser = (id: string, done: (err: Error | null, user?: Express.User) => void) => {
    this.prismaService.prisma.user
      .findUniqueOrThrow({ where: { id }, omit: { password: true } })
      .then((user) => done(null, buildExpressUser(user)))
      .catch((err: Error) => done(err));
  };

  registerProvider = (provider: ProviderInfo<Credentials>) => {
    this.providers.set(provider.name, provider);
    this.logger.log(`Registered provider: ${provider.name}`);
  };

  getProviderNames = () => Array.from(this.providers.keys());

  getProvider = (name: string) => {
    const provider = this.providers.get(name);
    return provider && this.configService.auth.providers.includes(name) ? provider : undefined;
  };

  getAuthUser = async (req: Request | IncomingMessage): Promise<Express.User | undefined> => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await this.session(req as any, new Response() as any, () => {});
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const sessionStore = (req as any).sessionStore as session.Store;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const sessionID = (req as any).sessionID as string;
    return new Promise((resolve, _reject) => {
      sessionStore.get(sessionID, (err: Error | null, session) => {
        if (err || !session?.passport?.user) {
          return resolve(undefined);
        }
        this.deserializeUser(session.passport.user, (_err: Error | null, user: Express.User | undefined) =>
          resolve(user),
        );
      });
    });
  };
}
