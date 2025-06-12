import { Injectable } from "@nestjs/common";
import { AuthService } from "@/auth/auth.service";
import { buildExpressUser } from "@/auth";
import { Strategy } from "passport-http-bearer";
import { PassportStrategy } from "@nestjs/passport";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "@/prisma/prisma.service";
import { Provider } from ".";
import { Credentials, ProviderInfo } from "@local/common";

@Injectable()
export class BearerService extends PassportStrategy(Strategy, Provider) implements ProviderInfo<Credentials> {
  readonly name = Provider;
  readonly label = "Bearer";
  readonly credentials = {};

  constructor(
    authService: AuthService,
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {
    super();
    authService.registerProvider(this);
  }

  async validate(token: string | null | undefined): Promise<Express.User | null> {
    if (typeof token === "string") {
      if (await this.jwtService.verifyAsync(token ?? "")) {
        const account = await this.prismaService.prisma.account.findFirst({
          where: { provider: Provider, accessToken: token },
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
