"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var GrafanaController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrafanaController = void 0;
const app_config_1 = require("../app.config");
const public_decorator_1 = require("../auth/public.decorator");
const roles_decorator_1 = require("../auth/roles.decorator");
const user_decorator_1 = require("../auth/user.decorator");
const file_1 = require("../utils/file");
const common_1 = require("@local/common");
const common_2 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const ConfigFilenameRegexNew = /(?<campus>[^-]+(?:_[^-]+)*)--(?<building>.+)_dashboard_urls\.json/i;
const ConfigFilenameRegexOld = /(?<campus>.+?)_(?<building>.+)_dashboard_urls\.json/i;
const ConfigUnitRegex = /RTU Overview - (?<unit>.+)|Site Overview/i;
const SiteOverviewKey = "site";
const SitePublicKey = "public";
let GrafanaController = GrafanaController_1 = class GrafanaController {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_2.Logger(GrafanaController_1.name);
        this.configs = [];
        this.execute().catch((error) => {
            this.logger.error(`Failed to initialize GrafanaRewriteMiddleware:`, error);
        });
    }
    async execute() {
        if (!this.configService.grafana.configPath) {
            this.logger.debug("Grafana config path not set, skipping dashboard configuration");
            return;
        }
        const urls = {};
        this.logger.log("Loading Grafana dashboard configuration files...");
        const files = await (0, file_1.getConfigFiles)([this.configService.grafana.configPath], ".json", this.logger);
        if (files.length === 0) {
            this.logger.debug(`No Grafana dashboard configuration files found in ${this.configService.grafana.configPath}`);
            return;
        }
        for (const file of files) {
            try {
                this.logger.log(`Parsing Grafana config file: ${file}`);
                const filename = (0, node_path_1.basename)(file);
                let match = ConfigFilenameRegexNew.exec(filename);
                let { campus, building } = match?.groups ?? {};
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
                const text = await (0, promises_1.readFile)((0, node_path_1.resolve)(file), "utf-8");
                const json = JSON.parse(text);
                if ((0, common_1.typeofObject)(json)) {
                    Object.entries(json).forEach(([key, value]) => {
                        const match = ConfigUnitRegex.exec(key);
                        const { unit } = match?.groups ?? {};
                        const urlString = typeof value === "string" ? value : value.url;
                        if (key === "Site Overview") {
                            urls[campus][building][SiteOverviewKey] = new URL(urlString);
                        }
                        else if (unit) {
                            urls[campus][building][unit] = new URL(urlString);
                        }
                        else {
                            this.logger.warn(`Skipping invalid dashboard key in Grafana config file ${file}: ${key}`);
                        }
                    });
                }
            }
            catch (error) {
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
    info() {
        return {
            building: this.configService.volttron.building,
            campus: this.configService.volttron.campus,
        };
    }
    dashboard(req, res, user, campus, building, unit) {
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
        const config = this.configs.find((config) => config.campus.toLocaleLowerCase().localeCompare(campus.toLocaleLowerCase()) === 0 &&
            config.building.toLocaleLowerCase().localeCompare(building.toLocaleLowerCase()) === 0 &&
            config.unit.toLocaleLowerCase().localeCompare(unit.toLocaleLowerCase()) === 0);
        if (!config) {
            this.logger.warn(`[Grafana Redirect] Dashboard not found for ${user?.email || "unknown"} (${clientIp})`, {
                campus,
                building,
                unit,
                userId: user?.id,
                availableConfigs: this.configs.length,
            });
            return res.status(common_1.HttpStatus.NotFound.status).json(common_1.HttpStatus.NotFound);
        }
        this.logger.log(`[Grafana Redirect] Redirecting ${user?.email || "unknown"} (${clientIp}) to: ${config.url.toString()}`, {
            campus: config.campus,
            building: config.building,
            unit: config.unit,
            targetUrl: config.url.toString(),
        });
        return res.redirect(common_1.HttpStatus.Found.status, config.url.toString());
    }
};
exports.GrafanaController = GrafanaController;
__decorate([
    (0, swagger_1.ApiTags)("grafana", "info", "building", "campus"),
    (0, public_decorator_1.Public)(),
    (0, common_2.Get)("info"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GrafanaController.prototype, "info", null);
__decorate([
    (0, swagger_1.ApiTags)("grafana", "dashboard"),
    (0, roles_decorator_1.Roles)(common_1.RoleType.User),
    (0, common_2.Get)("dashboard/:campus/:building/:unit"),
    __param(0, (0, common_2.Req)()),
    __param(1, (0, common_2.Res)()),
    __param(2, (0, user_decorator_1.User)()),
    __param(3, (0, common_2.Param)("campus")),
    __param(4, (0, common_2.Param)("building")),
    __param(5, (0, common_2.Param)("unit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, String, String, String]),
    __metadata("design:returntype", void 0)
], GrafanaController.prototype, "dashboard", null);
exports.GrafanaController = GrafanaController = GrafanaController_1 = __decorate([
    (0, swagger_1.ApiTags)("grafana"),
    (0, common_2.Controller)("grafana"),
    __param(0, (0, common_2.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [app_config_1.AppConfigService])
], GrafanaController);
//# sourceMappingURL=grafana.controller.js.map