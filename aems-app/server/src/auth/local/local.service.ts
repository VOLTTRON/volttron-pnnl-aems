import { buildExpressUser } from "@/auth";
import { AuthjsProvider, AuthService, ExpressProvider } from "@/auth/auth.service";
import { PrismaService } from "@/prisma/prisma.service";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { compare } from "@node-rs/bcrypt";
import { Strategy } from "passport-local";
import { PassportStrategy } from "@nestjs/passport";
import { Provider } from ".";
import Credentials from "@auth/express/providers/credentials";
import { AppConfigService } from "@/app.config";

@Injectable()
export class LocalPassportService extends PassportStrategy(Strategy, Provider) implements ExpressProvider {
  private logger = new Logger(LocalPassportService.name);

  readonly name = Provider;
  readonly label = "Local";
  readonly credentials = {
    email: { label: "Email", name: "email", type: "text" as const, placeholder: "email" },
    password: { label: "Password", name: "password", type: "password" as const },
  };
  readonly endpoint = `/auth/${Provider}/login`;

  constructor(
    authService: AuthService,
    @Inject(AppConfigService.Key) configService: AppConfigService,
    private prismaService: PrismaService,
  ) {
    super({ usernameField: "email", passwordField: "password" });
    authService.registerProvider(this);
  }

  async validate(email: string, password: string): Promise<Express.User | null> {
    const user = await this.prismaService.prisma.user.findUnique({ where: { email: email } });
    // supplied password always checked to prevent timing attacks
    const authorized = await compare(password, user?.password ?? "");
    if (user && authorized) {
      return buildExpressUser(user);
    } else {
      return null;
    }
  }
}

@Injectable()
export class LocalAuthjsService implements AuthjsProvider {
  private logger = new Logger(LocalAuthjsService.name);

  readonly name = Provider;
  readonly label = "Local";
  readonly credentials = {
    email: { label: "Email", name: "email", type: "text" as const, placeholder: "email" },
    password: { label: "Password", name: "password", type: "password" as const },
  };
  readonly endpoint = `/authjs/signin/${Provider}`;

  constructor(
    authService: AuthService,
    @Inject(AppConfigService.Key) configService: AppConfigService,
    private prismaService: PrismaService,
  ) {
    authService.registerProvider(this);
  }

  create() {
    const prisma = this.prismaService.prisma;
    return Credentials({
      id: Provider,
      type: "credentials",
      credentials: this.credentials,
      async authorize({ email, password }, _request) {
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }
        const user = await prisma.user.findUnique({ where: { email: email } });
        // supplied password always checked to prevent timing attacks
        const authorized = await compare(password, user?.password ?? "");
        if (user && authorized) {
          return buildExpressUser(user);
        } else {
          return null;
        }
      },
    });
  }
}
