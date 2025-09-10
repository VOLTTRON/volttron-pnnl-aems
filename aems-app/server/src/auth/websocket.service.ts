import { Inject, Injectable, Logger } from "@nestjs/common";
import { AppConfigService } from "@/app.config";
import { Request, Response } from "express";
import { AuthjsMiddleware } from "./authjs/authjs.middleware";
import { PassportMiddleware } from "./passport/passport.middleware";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class WebSocketAuthService {
  private logger = new Logger(WebSocketAuthService.name);

  constructor(
    @Inject(AppConfigService.Key) private configService: AppConfigService,
    private authjsMiddleware: AuthjsMiddleware,
    private passportMiddleware: PassportMiddleware,
    private prismaService: PrismaService,
  ) {}

  async authenticateWebSocket(request: Request): Promise<Express.User | undefined> {
    try {
      const response = {} as Response;
      const next = () => {};

      switch (this.configService.auth.framework) {
        case "authjs":
          await this.authjsMiddleware.use(request, response, next);
          break;
        case "passport":
          await this.passportMiddleware.use(request, response, next);
          break;
        default:
          this.logger.log("No auth framework found for WebSocket connection");
          return undefined;
      }
      return request.user;
    } catch (error) {
      this.logger.error("WebSocket authentication error:", error);
      return undefined;
    }
  }
}
