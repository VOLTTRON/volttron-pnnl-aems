import { AuthService } from "@/auth/auth.service";
import { PrismaService } from "@/prisma/prisma.service";
import { Controller, Get, Logger, NotFoundException, Param, Post, Req } from "@nestjs/common";
import { pick } from "lodash";
import { Request } from "express";
import { User } from "./user.decorator";
import { ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  private logger = new Logger(AuthController.name);

  constructor(
    private prismaService: PrismaService,
    private authService: AuthService,
  ) {}

  @ApiTags("auth", "providers")
  @ApiResponse({ schema: { type: "array", items: { type: "string" } } })
  @Get()
  root() {
    return this.authService.getProviderNames();
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

  @ApiTags("auth", "provider")
  @Get(":provider")
  provider(@Param("provider") provider: string) {
    const info = this.authService.getProvider(provider);
    if (!info) {
      throw new NotFoundException();
    }
    return pick(info, ["name", "label", "credentials"]);
  }

  @ApiTags("auth", "logout")
  @Post("logout")
  async logout(@Req() req: Request) {
    return new Promise<void>((resolve, reject) => req.logout((err: Error) => (err ? reject(err) : resolve())));
  }
}
