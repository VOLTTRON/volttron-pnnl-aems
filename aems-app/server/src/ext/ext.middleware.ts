import { AppConfigService, ExtConfig } from "@/app.config";
import { HttpStatusType } from "@local/common";
import { Inject, Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import * as http from "http";
import * as https from "https";

@Injectable()
export class ExtRewriteMiddleware implements NestMiddleware {
  private logger = new Logger(ExtRewriteMiddleware.name);
  private configs: ExtConfig[] = [];

  constructor(@Inject(AppConfigService.Key) configService: AppConfigService) {
    Object.entries(configService.ext).forEach(([key, config]) => {
      try {
        if (config.path && config.authorized) {
          this.configs.push(config);
          this.logger.log(`Successfully configured proxy for external service: ${key}`);
        } else {
          this.logger.warn(
            `Ext option ${key} is missing required properties - path: ${!!config.path}, authorized: ${!!config.authorized}`,
          );
        }
      } catch (error) {
        this.logger.error(`Failed to configure proxy for ${key}:`, error);
      }
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    try {
      const config = this.configs.find((v) => req.url?.startsWith(v.path ?? ""));
      if (!config) {
        return next();
      }
      if (config.role) {
        const userRoles = req.user?.roles ?? [];
        if (!config.role.granted(...userRoles)) {
          if (config.unauthorized) {
            return res.redirect(HttpStatusType.Found.status, config.unauthorized);
          } else {
            return res.status(HttpStatusType.Forbidden.status).json(HttpStatusType.Forbidden);
          }
        }
      }
      const targetUrl = new URL(req.originalUrl.replace(new RegExp(`^${config.path}`, "i"), ""), config.authorized);
      const client = targetUrl.protocol === "https:" ? https : http;
      const options = {
        method: req.method,
        headers: {
          ...req.headers,
          host: targetUrl.host,
        },
      };
      const proxyReq = client.request(targetUrl, options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode ?? 500, proxyRes.headers);
        proxyRes.pipe(res);
      });
      proxyReq.on("error", (err) => {
        this.logger.warn("Proxy request error:", err.message);
        res.status(502).send("Bad Gateway");
      });
      return req.pipe(proxyReq);
    } catch (error) {
      this.logger.error(`Error in ExtRewriteMiddleware:`, error);
      next(error);
    }
  }
}
