import { AppConfigService } from "@/app.config";
import { Public } from "@/auth/public.decorator";
import { Roles } from "@/auth/roles.decorator";
import { User } from "@/auth/user.decorator";
import { getConfigFiles } from "@/utils/file";
import { HttpStatus, RoleType, typeofObject } from "@local/common";
import { Controller, Get, Inject, Logger, Param, Req, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { info } from "node:console";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

// Primary regex: Handle new format with double-dash separator (e.g., campus--building_dashboard_urls.json)
const ConfigFilenameRegexNew = /(?<campus>[^-]+(?:_[^-]+)*)--(?<building>.+)_dashboard_urls\.json/i;

// Fallback regex: Handle old format with single underscores (backward compatibility)
// Note: This is ambiguous for complex names, but maintains compatibility with existing deployments
const ConfigFilenameRegexOld = /(?<campus>.+?)_(?<building>.+)_dashboard_urls\.json/i;

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

@ApiTags("grafana")
@Controller("grafana")
export class GrafanaController {
  private logger = new Logger(GrafanaController.name);
  private configs: GrafanaConfig[] = [];

  constructor(@Inject(AppConfigService.Key) private configService: AppConfigService) {
    this.execute().catch((error) => {
      this.logger.error(`Failed to initialize GrafanaRewriteMiddleware:`, error);
    });
  }

  async execute(): Promise<void> {
    // Skip if no config path set (e.g., in services/seeders containers)
    if (!this.configService.grafana.configPath) {
      this.logger.debug("Grafana config path not set, skipping dashboard configuration");
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

        // Try new format first (with double-dash separator)
        let match = ConfigFilenameRegexNew.exec(filename);
        let { campus, building } = match?.groups ?? {};

        // Fall back to old format if new format doesn't match
        if (!campus || !building) {
          match = ConfigFilenameRegexOld.exec(filename);
          ({ campus, building } = match?.groups ?? {});
        }

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
            const urlString = typeof value === "string" ? value : value.url;

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

  @ApiTags("grafana", "info", "building", "campus")
  @Public()
  @Get("info")
  info() {
    return {
      building: this.configService.volttron.building,
      campus: this.configService.volttron.campus,
    };
  }

  @ApiTags("grafana", "dashboard")
  @Roles(RoleType.User)
  @Get("dashboard/:campus/:building/:unit")
  dashboard(
    @Req() req: Request,
    @Res() res: Response,
    @User() user: Express.User,
    @Param("campus") campus: string,
    @Param("building") building: string,
    @Param("unit") unit: string,
  ) {
    const clientIp = req.get("x-forwarded-for") || req.get("x-real-ip") || req.socket.remoteAddress || "unknown";

    this.logger.log(`[Grafana Redirect] Dashboard request from ${user?.email || "unknown"} (${clientIp})`, {
      campus,
      building,
      unit,
      userId: user?.id,
      email: user?.email,
      path: req.path,
      userAgent: req.get("user-agent"),
    });

    const config = this.configs.find(
      (config) =>
        config.campus.toLocaleLowerCase().localeCompare(campus.toLocaleLowerCase()) === 0 &&
        config.building.toLocaleLowerCase().localeCompare(building.toLocaleLowerCase()) === 0 &&
        config.unit.toLocaleLowerCase().localeCompare(unit.toLocaleLowerCase()) === 0,
    );

    if (!config) {
      this.logger.warn(`[Grafana Redirect] Dashboard not found for ${user?.email || "unknown"} (${clientIp})`, {
        campus,
        building,
        unit,
        userId: user?.id,
        availableConfigs: this.configs.length,
      });
      return res.status(HttpStatus.NotFound.status).json(HttpStatus.NotFound);
    }

    // Authorization is handled by Grafana via Keycloak roles
    // Controller only verifies user has User/Admin role (via @Roles decorator)
    // and redirects to Grafana which enforces dashboard permissions
    this.logger.log(
      `[Grafana Redirect] Redirecting ${user?.email || "unknown"} (${clientIp}) to: ${config.url.toString()}`,
      {
        campus: config.campus,
        building: config.building,
        unit: config.unit,
        targetUrl: config.url.toString(),
      },
    );

    return res.redirect(HttpStatus.Found.status, config.url.toString());
  }
}
