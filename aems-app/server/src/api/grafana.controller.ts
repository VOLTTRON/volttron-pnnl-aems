import { AppConfigService } from "@/app.config";
import { PublicRoute } from "@/auth/public.decorator";
import { Roles } from "@/auth/roles.decorator";
import { User } from "@/auth/user.decorator";
import { HttpStatus, RoleType } from "@local/common";
import { Controller, Get, Inject, Logger, Param, Req, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { readDashboardConfigs } from "@/grafana/read-dashboard-configs";

const ConfigUnitRegex = /RTU Overview - (?<unit>.+)|Site Overview/i;

const SiteOverviewKey = "site";

type GrafanaConfig = {
  url: URL;
  campus: string;
  building: string;
  unit: string;
};

@ApiTags("grafana")
@Controller("grafana")
export class GrafanaController {
  private logger = new Logger(GrafanaController.name);

  constructor(@Inject(AppConfigService.Key) private configService: AppConfigService) {}

  async loadConfigs(): Promise<GrafanaConfig[]> {
    const files = await readDashboardConfigs(this.configService.grafana.configPath, this.logger);
    const configs: GrafanaConfig[] = [];
    for (const file of files) {
      for (const entry of file.entries) {
        let url: URL;
        try {
          url = new URL(entry.url);
        } catch {
          this.logger.warn(`Skipping malformed URL in ${file.file}: ${entry.url}`);
          continue;
        }
        if (entry.key === "Site Overview") {
          configs.push({ url, campus: file.campus, building: file.building, unit: SiteOverviewKey });
          continue;
        }
        const match = ConfigUnitRegex.exec(entry.key);
        const unit = match?.groups?.unit;
        if (unit) {
          configs.push({ url, campus: file.campus, building: file.building, unit: unit.toLowerCase() });
        } else {
          this.logger.warn(`Skipping invalid dashboard key in ${file.file}: ${entry.key}`);
        }
      }
    }
    return configs;
  }

  @ApiTags("grafana", "info", "building", "campus")
  @PublicRoute()
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
  async dashboard(
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

    const configs = await this.loadConfigs();
    const config = configs.find(
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
        availableConfigs: configs.length,
      });
      return res.status(HttpStatus.NotFound.status).json(HttpStatus.NotFound);
    }

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
