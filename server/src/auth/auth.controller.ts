import { AuthService } from "@/auth/auth.service";
import { PrismaService } from "@/prisma/prisma.service";
import { Controller, Get, Logger, Post, Req, Inject } from "@nestjs/common";
import { pick } from "lodash";
import { Request } from "express";
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
  async logout(@Req() req: Request) {
    return new Promise<void>((resolve, reject) => req.logout((err: Error) => (err ? reject(err) : resolve())));
  }
}
