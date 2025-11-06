import { Inject, Injectable, Logger } from "@nestjs/common";
import { AuthjsProvider, AuthService, ExpressProvider } from "@/auth/auth.service";
import { buildExpressUser } from "@/auth";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-oauth2";
import { PrismaService } from "@/prisma/prisma.service";
import { KeycloakUser, Provider } from ".";
import { AppConfigService } from "@/app.config";
import { Mutation, RoleType, typeofEnum } from "@local/common";
import { SubscriptionService } from "@/subscription/subscription.service";
import { randomUUID } from "node:crypto";
import { merge, omit } from "lodash";
import { JwtService } from "@nestjs/jwt";
import { JwtPayload } from "jsonwebtoken";
import { RoleEnum } from "@local/common/dist/constants";
import Keycloak from "@auth/express/providers/keycloak";

@Injectable()
export class KeycloakPassportService extends PassportStrategy(Strategy, Provider) implements ExpressProvider {
  private logger = new Logger(KeycloakPassportService.name);
  readonly name = Provider;
  readonly label = "Keycloak";
  readonly credentials = {};
  readonly endpoint = `/auth/${Provider}/login`;

  constructor(
    authService: AuthService,
    @Inject(AppConfigService.Key) private configService: AppConfigService,
    private prismaService: PrismaService,
    private subscriptionService: SubscriptionService,
    private jwtService: JwtService,
  ) {
    super({
      authorizationURL: configService.keycloak.authUrl,
      tokenURL: configService.keycloak.tokenUrl,
      callbackURL: configService.keycloak.callbackUrl,
      clientID: configService.keycloak.clientId,
      clientSecret: configService.keycloak.clientSecret,
      scope: configService.keycloak.scope,
    });
    authService.registerProvider(this);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: KeycloakUser & Record<string, string>,
  ): Promise<Express.User | null> {
    this.logger.debug(`Keycloak initial profile: `, profile);
    const token = this.jwtService.decode<JwtPayload>(accessToken);
    this.logger.debug(`Keycloak decoded token: `, token);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const rolesFromToken: string[] = token?.realm_access?.roles || [];
    const roles: RoleEnum[] = rolesFromToken.map((v: string) => RoleType.parse(v)?.enum).filter(typeofEnum(RoleEnum));
    if (!profile.email || !profile.name) {
      merge(profile, token);
    }
    if (!profile.email || !profile.name) {
      merge(
        profile,
        await fetch(`${this.configService.keycloak.userinfoUrl}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
          .then((res) => res.json())
          .catch((err) => this.logger.warn("Failed to fetch user info from Keycloak.", err)),
      );
    }
    this.logger.debug(`Keycloak profile populated with token and user info: `, profile);
    const id = profile.id || profile.sub;
    let user = await this.prismaService.prisma.user
      .findFirst({
        where: {
          OR: [{ email: profile.email }, { accounts: { some: { provider: "keycloak", providerAccountId: id } } }],
        },
        include: { accounts: { where: { provider: "keycloak" } } },
      })
      .then((user) => (user ? omit(user, ["password"]) : null));
    if (user) {
      if (
        profile.name !== user.name ||
        profile.email !== user.email ||
        profile.email_verified !== !!user.emailVerified
      ) {
        user = await this.prismaService.prisma.user
          .update({
            where: { id: user.id },
            data: {
              name: profile.name,
              email: profile.email,
              emailVerified: profile.email_verified ? new Date() : null,
              ...(this.configService.keycloak.passRoles ? { role: roles.join(" ") ?? "" } : {}),
            },
            include: { accounts: { where: { provider: "keycloak" } } },
          })
          .then(async (user) => {
            await this.subscriptionService.publish("User", { topic: "User", id: user.id, mutation: Mutation.Updated });
            await this.subscriptionService.publish(`User/${user.id}`, {
              topic: "User",
              id: user.id,
              mutation: Mutation.Updated,
            });
            return user;
          });
      }
    } else {
      user = await this.prismaService.prisma.user
        .create({
          data: {
            name: profile.name,
            email: profile.email,
            emailVerified: profile.email_verified ? new Date() : null,
            password: randomUUID(),
            ...(this.configService.keycloak.passRoles
              ? { role: roles.join(" ") ?? "" }
              : { role: RoleType.parse(this.configService.keycloak.defaultRole ?? "")?.enum ?? "" }),
          },
          include: { accounts: { where: { provider: "keycloak" } } },
        })
        .then(async (user) => {
          await this.subscriptionService.publish("User", { topic: "User", id: user.id, mutation: Mutation.Created });
          return user;
        });
    }
    this.logger.debug(`Keycloak user found or created: `, user);
    if (!user) {
      throw new Error("Failed to update or create user");
    }
    if (user.accounts.length === 0) {
      const value = await this.prismaService.prisma.account
        .create({
          data: {
            type: "oauth",
            provider: "keycloak",
            providerAccountId: id,
            access_token: accessToken,
            refresh_token: refreshToken,
            session_state: null,
            user: { connect: { id: user.id } },
          },
          include: { user: { include: { accounts: { where: { provider: "keycloak" } } } } },
        })
        .then(async (account) => {
          await this.subscriptionService.publish("Account", {
            topic: "Account",
            id: account.id,
            mutation: Mutation.Created,
          });
          return account;
        });
      user = value.user;
    } else {
      const value = await this.prismaService.prisma.account
        .update({
          where: { id: user.accounts[0].id },
          data: {
            providerAccountId: id,
            access_token: accessToken,
            refresh_token: refreshToken,
            session_state: null,
          },
          include: { user: { include: { accounts: { where: { provider: "keycloak" } } } } },
        })
        .then(async (account) => {
          await this.subscriptionService.publish("Account", {
            topic: "Account",
            id: account.id,
            mutation: Mutation.Updated,
          });
          return account;
        });
      user = value.user;
    }
    return buildExpressUser(user);
  }
}

@Injectable()
export class KeycloakAuthjsService implements AuthjsProvider {
  private logger = new Logger(KeycloakAuthjsService.name);
  readonly name = Provider;
  readonly label = "Keycloak";
  readonly credentials = {};
  readonly endpoint = `/authjs/signin/${Provider}`;

  constructor(
    authService: AuthService,
    @Inject(AppConfigService.Key) private configService: AppConfigService,
  ) {
    authService.registerProvider(this);
  }

  create() {
    return Keycloak({
      // we trust our Keycloak server to provide the correct user information
      allowDangerousEmailAccountLinking: true,
      id: Provider,
      checks: this.configService.keycloak.checks,
      clientId: this.configService.keycloak.clientId,
      clientSecret: this.configService.keycloak.clientSecret,
      issuer: this.configService.keycloak.issuerUrl || undefined,
      redirectProxyUrl: this.configService.keycloak.callbackUrl || undefined,
      wellKnown: this.configService.keycloak.wellKnownUrl || undefined,
      authorization: this.configService.keycloak.authUrl || undefined,
      token: this.configService.keycloak.tokenUrl || undefined,
      userinfo: this.configService.keycloak.userinfoUrl || undefined,
    });
  }
}
