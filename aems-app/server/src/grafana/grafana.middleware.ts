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

type DashboardURLs = Record<
  `RTU Overview - ${string}` | "Site Overview",
  string | { url: string; keycloak_role?: string; role_created?: boolean }
>;

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
    // Skip if no config path set (e.g., in services/seeders containers)
    if (!this.configService.grafana.configPath) {
      this.logger.debug('Grafana config path not set, skipping dashboard configuration');
      return;
    }

    const urls: ConfigURLs = {};
    this.logger.log("Loading Grafana dashboard configuration files...");
    const files = await getConfigFiles([this.configService.grafana.configPath], ".json", this.logger);
    
    // If no files found, log at debug level instead of error
    if (files.length === 0) {
      this.logger.debug(`No Grafana dashboard configuration files found in ${this.configService.grafana.configPath}`);
      return;
    }
    
    for (const file of files) {
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
            
            // Extract URL from either string (old format) or object (new format)
            const urlString = typeof value === 'string' ? value : value.url;
            
            if (key === "Site Overview") {
              urls[campus][building][SiteOverviewKey] = new URL(urlString);
            } else if (unit) {
              urls[campus][building][unit] = new URL(urlString);
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
      // Log incoming request details
      const clientIp = req.get("x-forwarded-for") || req.get("x-real-ip") || req.socket.remoteAddress || "unknown";
      this.logger.debug(`[Grafana Access] Incoming request from ${clientIp}`, {
        method: req.method,
        url: req.url,
        path: req.path,
        originalUrl: req.originalUrl,
        userAgent: req.get("user-agent"),
        origin: req.get("origin"),
        referer: req.get("referer"),
        host: req.get("host"),
        xForwardedFor: req.get("x-forwarded-for"),
        xForwardedHost: req.get("x-forwarded-host"),
        xForwardedProto: req.get("x-forwarded-proto"),
      });

      const config = this.configs.find((v) => req.url?.startsWith(v.path) || req.url?.startsWith(v.url.pathname));
      if (!config) {
        this.logger.debug(`[Grafana Access] No config matched for URL: ${req.url}`);
        return next();
      }

      this.logger.log(`[Grafana Access] Matched config for ${config.campus}/${config.building}/${config.unit} from ${clientIp}`);

      // Log authentication state
      if (!req.user) {
        this.logger.warn(`[Grafana Access] No user object found in request from ${clientIp}`, {
          url: req.url,
          config: { campus: config.campus, building: config.building, unit: config.unit },
          headers: {
            authorization: req.get("authorization") ? "present" : "missing",
            cookie: req.get("cookie") ? "present" : "missing",
          },
        });
        return res.status(HttpStatusType.Forbidden.status).json(HttpStatusType.Forbidden);
      }

      this.logger.log(`[Grafana Access] User authenticated`, {
        userId: req.user.id,
        email: req.user.email,
        roleString: req.user.role,
        rolesArray: req.user.roles?.map((r) => r.name) ?? [],
        clientIp,
      });

      const userRoles = req.user?.roles ?? [];
      const hasUserRole = Role.User.granted(...userRoles);
      
      this.logger.debug(`[Grafana Access] Role check for User role`, {
        userId: req.user.id,
        email: req.user.email,
        userRolesCount: userRoles.length,
        userRoleNames: userRoles.map((r) => r.name),
        hasUserRole,
        clientIp,
      });

      if (!hasUserRole) {
        this.logger.warn(
          `[Grafana Access] FORBIDDEN - No user role for ${req.user.email} from ${clientIp}`,
          {
            campus: config.campus,
            building: config.building,
            unit: config.unit,
            userId: req.user.id,
            email: req.user.email,
            roleString: req.user.role,
            rolesArray: userRoles.map((r) => r.name),
            rolesLength: userRoles.length,
          },
        );
        return res.status(HttpStatusType.Forbidden.status).json(HttpStatusType.Forbidden);
      }

      this.logger.log(`[Grafana Access] User role check passed for ${req.user.email}`);
      if (config.unit !== SitePublicKey && !Role.Admin.granted(...userRoles)) {
        this.logger.debug(`[Grafana Access] Non-admin user accessing protected unit, checking assignments`, {
          userId: req.user.id,
          email: req.user.email,
          campus: config.campus,
          building: config.building,
          unit: config.unit,
        });

        const units = await this.prismaService.prisma.unit.findMany({
          where: {
            campus: { equals: config.campus, mode: Prisma.QueryMode.insensitive },
            building: { equals: config.building, mode: Prisma.QueryMode.insensitive },
            ...(config.unit !== SiteOverviewKey
              ? { name: { equals: config.unit, mode: Prisma.QueryMode.insensitive } }
              : {}),
            users: { some: { id: req.user?.id } },
          },
        });

        this.logger.debug(`[Grafana Access] Unit assignment check result`, {
          userId: req.user.id,
          email: req.user.email,
          unitsFound: units.length,
          unitNames: units.map((u) => u.name),
        });

        if (units.length === 0) {
          this.logger.warn(
            `[Grafana Access] FORBIDDEN - No units assigned for ${req.user.email} from ${clientIp}`,
            {
              campus: config.campus,
              building: config.building,
              unit: config.unit,
              userId: req.user.id,
              email: req.user.email,
            },
          );
          return res.status(HttpStatusType.Forbidden.status).json(HttpStatusType.Forbidden);
        }

        this.logger.log(`[Grafana Access] Unit assignment check passed for ${req.user.email}`);
      } else if (config.unit !== SitePublicKey) {
        this.logger.log(`[Grafana Access] Admin user ${req.user.email} bypassing unit check`);
      }
      if (req.path === config.path) {
        const redirectUrl = new URL(`${config.url.pathname}${config.url.search}`, `${req.protocol}://${req.host}`);
        this.logger.log(`[Grafana Access] Redirecting ${req.user.email} from ${clientIp}: ${req.url} -> ${redirectUrl.toString()}`);
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
      this.logger.log(`[Grafana Access] Proxying request for ${req.user.email} from ${clientIp}: ${req.url} -> ${targetUrl.toString()}`);
      const client = targetUrl.protocol === "https:" ? https : http;

      let requestBody: Buffer | undefined;
      if (req.method && ["POST", "PUT", "PATCH"].includes(req.method.toUpperCase())) {
        if (req.body) {
          const contentType = req.get("content-type") || "";
          if (contentType.includes("application/json")) {
            requestBody = Buffer.from(JSON.stringify(req.body), "utf8");
          } else if (contentType.includes("application/x-www-form-urlencoded")) {
            requestBody = Buffer.from(new URLSearchParams(req.body).toString(), "utf8");
          } else {
            requestBody = Buffer.from(String(req.body), "utf8");
          }
        }
      }
      // Prepare headers, removing only CORS-problematic ones
      // Keep X-Forwarded headers as they're needed for proper proxy chain handling
      const headers = {
        ...req.headers,
        host: targetUrl.host,
      };

      // Log headers for diagnostics (useful for troubleshooting VPN vs on-site issues)
      this.logger.debug(`Request headers before proxying:`, {
        origin: req.get("origin"),
        referer: req.get("referer"),
        host: req.get("host"),
        xForwardedFor: req.get("x-forwarded-for"),
        xForwardedHost: req.get("x-forwarded-host"),
        xForwardedProto: req.get("x-forwarded-proto"),
      });

      // Remove only headers that can cause CORS "origin not allowed" errors
      // Preserve X-Forwarded-* headers as they're required by many proxy/load balancer setups
      delete headers.origin;
      delete headers.referer;

      if (requestBody) {
        headers["content-length"] = requestBody.length.toString();
      } else if (req.get("content-length")) {
        headers["content-length"] = req.get("content-length");
      } else {
        delete headers["content-length"];
      }

      const options: http.RequestOptions = {
        method: req.method,
        headers,
        ...(this.configService.grafana.username && this.configService.grafana.password
          ? { auth: `${this.configService.grafana.username}:${this.configService.grafana.password}` }
          : {}),
      };
      const proxyReq = client.request(targetUrl, options, (proxyRes) => {
        this.logger.debug(`[Grafana Access] Proxy response received`, {
          statusCode: proxyRes.statusCode,
          userId: req.user?.id,
          email: req.user?.email,
          clientIp,
        });
        res.writeHead(proxyRes.statusCode ?? 500, proxyRes.headers);
        proxyRes.pipe(res);
      });
      proxyReq.on("error", (err) => {
        this.logger.error(`[Grafana Access] Proxy request error for ${req.user?.email} from ${clientIp}`, {
          error: err.message,
          targetUrl: targetUrl.toString(),
          userId: req.user?.id,
        });
        if (!res.headersSent) {
          res.status(502).send("Bad Gateway");
        }
      });
      if (requestBody) {
        proxyReq.write(requestBody);
      }
      proxyReq.end();
    } catch (error) {
      this.logger.error(`[Grafana Access] Error in GrafanaRewriteMiddleware`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        url: req.url,
        userId: req.user?.id,
        email: req.user?.email,
      });
      next(error);
    }
  }
}
