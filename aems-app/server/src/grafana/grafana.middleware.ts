import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { getConfigFiles } from "@/utils/file";
import { HttpStatusType, Role, typeofObject } from "@local/common";
import { Inject, Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import * as http from "node:http";
import * as https from "node:https";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const ConfigFilenameRegex = /(?<campus>.+)_(?<building>.+)_dashboard_urls\.json/i;

const ConfigUnitRegex = /RTU Overview - (?<unit>.+)|Site Overview/i;

type DashboardURLs = Record<`RTU Overview - ${string}` | "Site Overview", string>;

type ConfigURLs = Record<string, Record<string, Record<string, URL>>>;

const SiteOverviewKey = "site";
const SitePublicKey = "public";

type GrafanaConfig = {
  path: string;
  url: URL;
  campus: string;
  building: string;
  unit: string;
};

@Injectable()
export class GrafanaRewriteMiddleware implements NestMiddleware {
  private logger = new Logger(GrafanaRewriteMiddleware.name);
  private configs: GrafanaConfig[] = [];

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
    this.configs.push({
      path: `${this.configService.grafana.path}/public`,
      url: new URL(`${this.configService.grafana.url}/public`),
      campus: "",
      building: "",
      unit: SitePublicKey,
    });
    this.configs.push({
      path: `${this.configService.grafana.path}/api`,
      url: new URL(`${this.configService.grafana.url}/api`),
      campus: "",
      building: "",
      unit: SitePublicKey,
    });
    for (const campus of Object.keys(urls)) {
      for (const building of Object.keys(urls[campus])) {
        for (const unit of Object.keys(urls[campus][building])) {
          const url = urls[campus][building][unit];
          const path = `${this.configService.grafana.path}/${campus}/${building}/${unit}`;
          this.logger.log(`Configuring Grafana proxy for ${path}: ${url.pathname}${url.search}`);
          this.configs.push({
            path: path,
            url: url,
            campus: campus,
            building: building,
            unit: unit,
          });
          this.logger.log(`Successfully configured proxy for external service: ${url.toString()}`);
        }
      }
    }
  }

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const config = this.configs.find((v) => req.url?.startsWith(v.path) || req.url?.startsWith(v.url.pathname));
      if (!config) {
        return next();
      }
      const userRoles = req.user?.roles ?? [];
      if (!Role.User.granted(...userRoles)) {
        return res.status(HttpStatusType.Forbidden.status).json(HttpStatusType.Forbidden);
      }
      if (config.unit !== SitePublicKey && !Role.Admin.granted(...userRoles)) {
        if (config.unit === SiteOverviewKey) {
          return res.status(HttpStatusType.Forbidden.status).json(HttpStatusType.Forbidden);
        }
        const units = await this.prismaService.prisma.unit.findMany({
          where: {
            campus: { equals: config.campus, mode: Prisma.QueryMode.insensitive },
            building: { equals: config.building, mode: Prisma.QueryMode.insensitive },
            name: { equals: config.unit, mode: Prisma.QueryMode.insensitive },
            users: { some: { id: req.user?.id } },
          },
        });
        if (units.length === 0) {
          return res.status(HttpStatusType.Forbidden.status).json(HttpStatusType.Forbidden);
        }
      }
      if (req.path === config.path) {
        const redirectUrl = new URL(`${config.url.pathname}${config.url.search}`, `${req.protocol}://${req.host}`);
        this.logger.log(`Redirecting request: ${req.url.toString()} -> ${redirectUrl.toString()}`);
        return res.redirect(301, redirectUrl.toString());
      }
      const targetUrl = new URL(
        req.originalUrl.replace(new RegExp(`^${config.path}`, "i"), config.url.pathname),
        config.url.origin,
      );
      config.url.searchParams.forEach((value, key) => {
        if (!targetUrl.searchParams.has(key)) {
          targetUrl.searchParams.append(key, value);
        }
      });
      this.logger.log(`Proxying request: ${req.url.toString()} -> ${targetUrl.toString()}`);
      const client = targetUrl.protocol === "https:" ? https : http;
      const options: http.RequestOptions = {
        method: req.method,
        headers: {
          ...req.headers,
          host: targetUrl.host,
        },
        auth: `${this.configService.grafana.username}:${this.configService.grafana.password}`,
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
      this.logger.error(`Error in GrafanaRewriteMiddleware:`, error);
      next(error);
    }
  }
}
