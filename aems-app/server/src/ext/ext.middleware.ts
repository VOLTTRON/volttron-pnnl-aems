import { AppConfigService, ExtConfig } from "@/app.config";
import { HttpStatusType } from "@local/common";
import { Inject, Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction, RequestHandler } from "express";
import * as proxy from "express-http-proxy";

@Injectable()
export class ExtRewriteMiddleware implements NestMiddleware {
  private logger = new Logger(ExtRewriteMiddleware.name);
  private proxies: (ExtConfig & { proxy: RequestHandler })[] = [];

  constructor(@Inject(AppConfigService.Key) private configService: AppConfigService) {
    Object.entries(configService.ext).forEach(([key, option]) => {
      if (option.path && option.authorized) {
        this.proxies.push({
          ...option,
          proxy: proxy(option.authorized, {
            proxyReqPathResolver: (req) => {
              const query = new URLSearchParams(req.query as Record<string, string>).toString();
              const rewriteUrl = `${option.authorized}${req.url?.replace(new RegExp(`^${option.path}`, "i"), "") ?? ""}${query ? `?${query}` : ""}`;
              const url = new URL(rewriteUrl);
              return url.href;
            },
          }),
        });
      } else {
        this.logger.warn(`Ext option ${key} is missing path or authorized property.`);
      }
    });
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const option = this.proxies.find((v) => req.url?.startsWith(v.path ?? ""));
    if (!option) {
      return next();
    }
    if (option.role) {
      if (!option.role.granted(...(req.user?.roles ?? []))) {
        if (option.unauthorized) {
          return res.redirect(HttpStatusType.Found.status, option.unauthorized);
        } else {
          return res.status(HttpStatusType.Forbidden.status).json(HttpStatusType.Forbidden);
        }
      }
    }
    await option.proxy(req, res, next);
  }
}
