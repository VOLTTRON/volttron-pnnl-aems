import { AppConfigService, ExtConfig } from "@/app.config";
import { HttpStatusType } from "@local/common";
import { Inject, Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction, RequestHandler } from "express";
import * as proxy from "express-http-proxy";

@Injectable()
export class ExtRewriteMiddleware implements NestMiddleware {
  private logger = new Logger(ExtRewriteMiddleware.name);
  private proxies: (ExtConfig & { proxy: RequestHandler })[] = [];

  constructor(@Inject(AppConfigService.Key) configService: AppConfigService) {
    Object.entries(configService.ext).forEach(([key, option]) => {
      try {
        if (option.path && option.authorized) {
          this.proxies.push({
            ...option,
            proxy: proxy(option.authorized, {
              proxyReqPathResolver: (req) => {
                try {
                  const query = new URLSearchParams(req.query as Record<string, string>).toString();
                  const pathWithoutPrefix = req.url?.replace(new RegExp(`^${option.path}`, "i"), "") ?? "";
                  const rewriteUrl = `${option.authorized}${pathWithoutPrefix}${query ? `?${query}` : ""}`;
                  const url = new URL(rewriteUrl);
                  const resolvedPath = url.pathname + url.search;
                  return resolvedPath;
                } catch (error) {
                  this.logger.error(`Error in proxyReqPathResolver for ${key}:`, error);
                  throw error;
                }
              },
              proxyErrorHandler: (err, res, next) => {
                this.logger.error(`Proxy error for ${key}:`, err);
                next(err);
              },
            }),
          });
          this.logger.log(`Successfully configured proxy for external service: ${key}`);
        } else {
          this.logger.warn(
            `Ext option ${key} is missing required properties - path: ${!!option.path}, authorized: ${!!option.authorized}`,
          );
        }
      } catch (error) {
        this.logger.error(`Failed to configure proxy for ${key}:`, error);
      }
    });
  }

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const option = this.proxies.find((v) => req.url?.startsWith(v.path ?? ""));
      if (!option) {
        return next();
      }
      if (option.role) {
        const userRoles = req.user?.roles ?? [];
        if (!option.role.granted(...userRoles)) {
          if (option.unauthorized) {
            return res.redirect(HttpStatusType.Found.status, option.unauthorized);
          } else {
            return res.status(HttpStatusType.Forbidden.status).json(HttpStatusType.Forbidden);
          }
        }
      }
      await option.proxy(req, res, next);
    } catch (error) {
      this.logger.error(`Error in ExtRewriteMiddleware:`, error);
      next(error);
    }
  }
}
