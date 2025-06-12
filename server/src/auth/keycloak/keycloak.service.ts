import { Inject, Injectable } from "@nestjs/common";
import { AuthService } from "@/auth/auth.service";
import { buildExpressUser } from "@/auth";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-oauth2";
import { PrismaService } from "@/prisma/prisma.service";
import { KeycloakUser, Provider } from ".";
import { AppConfigService } from "@/app.config";
import { Credentials, ProviderInfo } from "@local/common";

@Injectable()
export class KeycloakService extends PassportStrategy(Strategy, Provider) implements ProviderInfo<Credentials> {
  readonly name = Provider;
  readonly label = "Keycloak";
  readonly credentials = {};

  constructor(
    authService: AuthService,
    private prismaService: PrismaService,
    @Inject(AppConfigService.Key) configService: AppConfigService,
  ) {
    super({
      authorizationURL: configService.keycloak.authUrl,
      tokenURL: configService.keycloak.tokenUrl,
      clientID: configService.keycloak.clientId,
      clientSecret: configService.keycloak.clientSecret,
    });
    authService.registerProvider(this);
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: KeycloakUser & Record<string, string>,
  ): Promise<Express.User | null> {
    const user = await this.prismaService.prisma.user.findUnique({ where: { email: profile.email } });
    if (user) {
      return buildExpressUser(user);
    } else {
      return null;
    }
  }
}
