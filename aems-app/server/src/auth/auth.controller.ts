import { AuthService } from "@/auth/auth.service";
import { PrismaService } from "@/prisma/prisma.service";
import { Controller, Get, Logger, Post, Req, Res, Inject } from "@nestjs/common";
import { pick } from "lodash";
import { Request, Response } from "express";
import { User } from "./user.decorator";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { AppConfigService } from "@/app.config";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  private logger = new Logger(AuthController.name);

  constructor(
    private prismaService: PrismaService,
    private authService: AuthService,
    @Inject(AppConfigService.Key) private configService: AppConfigService,
  ) {}

  @ApiTags("auth", "providers")
  @ApiResponse({
    schema: {
      type: "object",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          label: { type: "string" },
          credentials: { type: "object", additionalProperties: { type: "string" } },
          endpoint: { type: "string", nullable: true },
        },
      },
    },
  })
  @Get()
  root() {
    return this.authService.getProviderNames().reduce(
      (out, value) => ({
        ...out,
        [value]: pick(this.authService.getProvider(value) ?? {}, ["name", "label", "credentials", "endpoint"]),
      }),
      {},
    );
  }

  @ApiTags("auth", "current", "user")
  @Get("current")
  current(@User() user: Express.User) {
    if (user) {
      return this.prismaService.prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        omit: { password: true },
      });
    } else {
      return null;
    }
  }

  @ApiTags("auth", "logout")
  @Post("logout")
  async logout(@Req() req: Request, @Res() res: Response, @User() user: Express.User) {
    // Determine if user logged in via Keycloak
    const isKeycloakUser = user
      ? await this.prismaService.prisma.account.findFirst({
          where: { userId: user.id, provider: "keycloak" },
        })
      : null;

    // Clear local session
    await new Promise<void>((resolve, reject) => req.logout((err: Error) => (err ? reject(err) : resolve())));

    // If user is logged in via Keycloak and using authjs framework, redirect to Keycloak logout
    if (isKeycloakUser && this.configService.auth.framework === "authjs") {
      const keycloakLogoutUrl = `${this.configService.keycloak.issuerUrl}/protocol/openid-connect/logout`;
      const postLogoutRedirectUri = encodeURIComponent(
        `${this.configService.cors.origin || req.headers.origin || ""}/auth/logout`,
      );
      const clientId = encodeURIComponent(this.configService.keycloak.clientId);

      const logoutUrl = `${keycloakLogoutUrl}?post_logout_redirect_uri=${postLogoutRedirectUri}&client_id=${clientId}`;

      this.logger.log(`Redirecting to Keycloak logout: ${logoutUrl}`);
      return res.redirect(logoutUrl);
    }

    // For non-Keycloak users, return success
    return res.status(200).send();
  }
}
