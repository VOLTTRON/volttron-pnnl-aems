import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { getConfigFiles } from "@/utils/file";
import { HttpStatusType, Role, typeofObject } from "@local/common";
import { Inject, Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Request, Response, NextFunction, RequestHandler } from "express";
import * as proxy from "express-http-proxy";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { inspect } from "node:util";

const ConfigFilenameRegex = /(?<campus>.+)_(?<building>.+)_dashboard_urls\.json/i;

const ConfigUnitRegex = /RTU Overview - (?<unit>.+)|Site Overview/i;

type DashboardURLs = Record<`RTU Overview - ${string}` | "Site Overview", string>;

type ConfigURLs = Record<string, Record<string, Record<string, URL>>>;

const SiteOverviewKey = "site";

type GrafanaProxy = {
  path: string;
  url: URL;
  campus: string;
  building: string;
  unit: string;
  proxy: RequestHandler;
};

@Injectable()
export class GrafanaRewriteMiddleware implements NestMiddleware {
  private logger = new Logger(GrafanaRewriteMiddleware.name);
  private proxies: GrafanaProxy[] = [];

  constructor(
    @Inject(AppConfigService.Key) private configService: AppConfigService,
    private prismaService: PrismaService,
  ) {
    this.execute().catch((error) => {
      this.logger.error(`Failed to initialize GrafanaRewriteMiddleware:`, error);
    });
  }

  async execute(): Promise<void> {
    const urls: ConfigURLs = {};
    this.logger.log("Loading Grafana dashboard configuration files...");
    for (const file of await getConfigFiles([this.configService.grafana.configPath], ".json", this.logger)) {
      try {
        this.logger.log(`Parsing Grafana config file: ${file}`);
        const filename = basename(file);
        let { campus, building } = ConfigFilenameRegex.exec(filename)?.groups ?? {};
        if (!campus || !building) {
          this.logger.warn(`Skipping invalid Grafana config file name: ${file}`);
          continue;
        }
        campus = campus.toLocaleLowerCase();
        building = building.toLocaleLowerCase();
        urls[campus] = urls[campus] || {};
        urls[campus][building] = urls[campus][building] || {};
        const text = await readFile(resolve(file), "utf-8");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const json = JSON.parse(text);
        if (typeofObject<DashboardURLs>(json)) {
          Object.entries(json).forEach(([key, value]) => {
            const match = ConfigUnitRegex.exec(key);
            const { unit } = match?.groups ?? {};
            if (key === "Site Overview") {
              urls[campus][building][SiteOverviewKey] = new URL(value);
            } else if (unit) {
              urls[campus][building][unit] = new URL(value);
            } else {
              this.logger.warn(`Skipping invalid dashboard key in Grafana config file ${file}: ${key}`);
            }
          });
        }
      } catch (error: any) {
        this.logger.error(`Error parsing Grafana config file ${file}:`, error);
        continue;
      }
    }
    for (const campus of Object.keys(urls)) {
      for (const building of Object.keys(urls[campus])) {
        for (const unit of Object.keys(urls[campus][building])) {
          const url = urls[campus][building][unit];
          const path = `${this.configService.grafana.path}/${campus}/${building}/${unit}`;
          this.logger.log(`Configuring Grafana proxy for ${path}: ${url.pathname}${url.search}`);
          this.proxies.push({
            path: path,
            url: url,
            campus: campus,
            building: building,
            unit: unit,
            proxy: proxy(this.configService.grafana.url, {
              proxyReqPathResolver: (req) => {
                try {
                  const searchParams = new URLSearchParams(req.query as Record<string, string>);
                  const query = new URLSearchParams(req.query as Record<string, string>).toString();
                  const pathWithoutPrefix = req.url?.replace(new RegExp(`^${path}`, "i"), "") ?? "";
                  const rewriteUrl = `${this.configService.grafana.url}${pathWithoutPrefix}${query ? `?${query}` : ""}`;
                  const resolvedUrl = new URL(rewriteUrl);
                  resolvedUrl.searchParams.forEach((value, key) => {
                    if (!searchParams.has(key)) {
                      searchParams.append(key, value);
                    }
                  });
                  const resolvedPath = resolvedUrl.pathname + resolvedUrl.search;
                  return resolvedPath;
                } catch (error) {
                  this.logger.error(`Error in proxyReqPathResolver for ${url.toString()}:`, error);
                  throw error;
                }
              },
              proxyErrorHandler: (err, res, next) => {
                this.logger.error(`Proxy error for ${url.toString()}:`, err);
                next(err);
              },
            }),
          });
          this.logger.log(`Successfully configured proxy for external service: ${url.toString()}`);
        }
      }
    }
  }

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      this.logger.log("Proxies: ", inspect(this.proxies, { depth: null, colors: true }));
      this.logger.log(`Incoming request URL: ${req.url}`);
      const option = this.proxies.find((v) => req.url?.startsWith(v.path ?? ""));
      if (!option) {
        return next();
      }
      this.logger.log(`Matched proxy option: ${inspect(option, { depth: null, colors: true })}`);
      const userRoles = req.user?.roles ?? [];
      if (!Role.User.granted(...userRoles)) {
        return res.status(HttpStatusType.Forbidden.status).json(HttpStatusType.Forbidden);
      }
      if (Role.Admin.granted(...userRoles)) {
        // Admins have access to all dashboards
        await option.proxy(req, res, next);
        return;
      }
      if (option.unit === SiteOverviewKey) {
        return res.status(HttpStatusType.Forbidden.status).json(HttpStatusType.Forbidden);
      }
      const units = await this.prismaService.prisma.unit.findMany({
        where: {
          campus: { equals: option.campus, mode: Prisma.QueryMode.insensitive },
          building: { equals: option.building, mode: Prisma.QueryMode.insensitive },
          name: { equals: option.unit, mode: Prisma.QueryMode.insensitive },
          users: { some: { id: req.user?.id } },
        },
      });
      if (units.length === 0) {
        return res.status(HttpStatusType.Forbidden.status).json(HttpStatusType.Forbidden);
      }
      await option.proxy(req, res, next);
    } catch (error) {
      this.logger.error(`Error in ExtRewriteMiddleware:`, error);
      next(error);
    }
  }
}
