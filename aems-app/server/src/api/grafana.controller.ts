import { AppConfigService } from "@/app.config";
import { Roles } from "@/auth/roles.decorator";
import { getConfigFiles } from "@/utils/file";
import { HttpStatus, RoleType, typeofObject } from "@local/common";
import { Controller, Get, Inject, Logger, Param, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Response } from "express";
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

  @ApiTags("grafana", "dashboard")
  @Roles(RoleType.User)
  @Get("dashboard/:campus/:building/:unit")
  dashboard(
    @Res() res: Response,
    @Param("campus") campus: string,
    @Param("building") building: string,
    @Param("unit") unit: string,
  ) {
    const config = this.configs.find(
      (config) =>
        config.campus.toLocaleLowerCase().localeCompare(campus.toLocaleLowerCase()) === 0 &&
        config.building.toLocaleLowerCase().localeCompare(building.toLocaleLowerCase()) === 0 &&
        config.unit.toLocaleLowerCase().localeCompare(unit.toLocaleLowerCase()) === 0,
    );
    if (!config) {
      return res.status(HttpStatus.NotFound.status).json(HttpStatus.NotFound);
    }
    return res.redirect(HttpStatus.Found.status, config.url.toString());
  }
}
