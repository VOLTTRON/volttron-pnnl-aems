import { Inject, Injectable } from "@nestjs/common";
import { AuthService, ExpressProvider } from "@/auth/auth.service";
import { buildExpressUser } from "@/auth";
import { Strategy } from "passport-http-bearer";
import { PassportStrategy } from "@nestjs/passport";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "@/prisma/prisma.service";
import { Provider } from ".";
import { AppConfigService } from "@/app.config";

@Injectable()
export class BearerPassportService extends PassportStrategy(Strategy, Provider) implements ExpressProvider {
  readonly name = Provider;
  readonly label = "Bearer";
  readonly credentials = {};
  readonly endpoint;

  constructor(
    authService: AuthService,
    @Inject(AppConfigService.Key) configService: AppConfigService,
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {
    super();
    this.endpoint =
      configService.auth.framework === "authjs" ? `/authjs/signin/${Provider}` : `/auth/${Provider}/login`;
    authService.registerProvider(this);
  }

  async validate(token: string | null | undefined): Promise<Express.User | null> {
    if (typeof token === "string") {
      if (await this.jwtService.verifyAsync(token ?? "")) {
        const account = await this.prismaService.prisma.account.findFirst({
          where: { provider: Provider, access_token: token },
          include: { user: { omit: { password: true } } },
        });
        if (account) {
          return buildExpressUser(account.user);
        }
      }
    }
    return null;
  }
}
