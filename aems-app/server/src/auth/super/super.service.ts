import { buildExpressUser } from "@/auth";
import { AuthjsProvider, AuthService, ExpressProvider } from "@/auth/auth.service";
import { PrismaService } from "@/prisma/prisma.service";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { Strategy } from "passport-local";
import { PassportStrategy } from "@nestjs/passport";
import { Provider } from ".";
import { AppConfigService } from "@/app.config";
import Credentials from "@auth/express/providers/credentials";
import { Request } from "express";

@Injectable()
export class SuperPassportService extends PassportStrategy(Strategy, Provider) implements ExpressProvider {
  private logger = new Logger(SuperPassportService.name);

  readonly name = Provider;
  readonly label = "Super";
  readonly credentials = {
    email: { label: "Email", name: "email", type: "text" as const, placeholder: "email" },
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

  async validate(id: string, _password: string): Promise<Express.User | null> {
    const user = await this.prismaService.prisma.user.findUnique({ where: { id: id } });
    if (user) {
      return buildExpressUser(user);
    } else {
      return null;
    }
  }
}

@Injectable()
export class SuperAuthjsService implements AuthjsProvider {
  private logger = new Logger(SuperAuthjsService.name);

  readonly name = Provider;
  readonly label = "Super";
  readonly credentials = {
    email: { label: "Email", name: "email", type: "text" as const, placeholder: "email" },
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
      name: "another User",
      credentials: this.credentials,
      async authorize({ email }, request) {
        if (typeof email !== "string") {
          return null;
        }
        const user = await prisma.user.findUnique({ where: { email: email } });
        const authorized = (request as unknown as Request).user?.authRoles.super;
        if (user && authorized) {
          return buildExpressUser(user);
        } else {
          return null;
        }
      },
    });
  }
}
