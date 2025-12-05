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
var GrafanaRewriteMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrafanaRewriteMiddleware = void 0;
const app_config_1 = require("../app.config");
const prisma_service_1 = require("../prisma/prisma.service");
const file_1 = require("../utils/file");
const common_1 = require("@local/common");
const common_2 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const proxy = require("express-http-proxy");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const node_util_1 = require("node:util");
const ConfigFilenameRegex = /(?<campus>.+)_(?<building>.+)_dashboard_urls\.json/i;
const ConfigUnitRegex = /RTU Overview - (?<unit>.+)|Site Overview/i;
const SiteOverviewKey = "site";
let GrafanaRewriteMiddleware = GrafanaRewriteMiddleware_1 = class GrafanaRewriteMiddleware {
    constructor(configService, prismaService) {
        this.configService = configService;
        this.prismaService = prismaService;
        this.logger = new common_2.Logger(GrafanaRewriteMiddleware_1.name);
        this.proxies = [];
        this.execute().catch((error) => {
            this.logger.error(`Failed to initialize GrafanaRewriteMiddleware:`, error);
        });
    }
    async execute() {
        const urls = {};
        this.logger.log("Loading Grafana dashboard configuration files...");
        for (const file of await (0, file_1.getConfigFiles)([this.configService.grafana.configPath], ".json", this.logger)) {
            try {
                this.logger.log(`Parsing Grafana config file: ${file}`);
                const filename = (0, node_path_1.basename)(file);
                let { campus, building } = ConfigFilenameRegex.exec(filename)?.groups ?? {};
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
                        if (key === "Site Overview") {
                            urls[campus][building][SiteOverviewKey] = new URL(value);
                        }
                        else if (unit) {
                            urls[campus][building][unit] = new URL(value);
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
                                    const searchParams = new URLSearchParams(req.query);
                                    const query = new URLSearchParams(req.query).toString();
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
                                }
                                catch (error) {
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
    async use(req, res, next) {
        try {
            this.logger.log("Proxies: ", (0, node_util_1.inspect)(this.proxies, { depth: null, colors: true }));
            this.logger.log(`Incoming request URL: ${req.url}`);
            const option = this.proxies.find((v) => req.url?.startsWith(v.path ?? ""));
            if (!option) {
                return next();
            }
            this.logger.log(`Matched proxy option: ${(0, node_util_1.inspect)(option, { depth: null, colors: true })}`);
            const userRoles = req.user?.roles ?? [];
            if (!common_1.Role.User.granted(...userRoles)) {
                return res.status(common_1.HttpStatusType.Forbidden.status).json(common_1.HttpStatusType.Forbidden);
            }
            if (common_1.Role.Admin.granted(...userRoles)) {
                await option.proxy(req, res, next);
                return;
            }
            if (option.unit === SiteOverviewKey) {
                return res.status(common_1.HttpStatusType.Forbidden.status).json(common_1.HttpStatusType.Forbidden);
            }
            const units = await this.prismaService.prisma.unit.findMany({
                where: {
                    campus: { equals: option.campus, mode: client_1.Prisma.QueryMode.insensitive },
                    building: { equals: option.building, mode: client_1.Prisma.QueryMode.insensitive },
                    name: { equals: option.unit, mode: client_1.Prisma.QueryMode.insensitive },
                    users: { some: { id: req.user?.id } },
                },
            });
            if (units.length === 0) {
                return res.status(common_1.HttpStatusType.Forbidden.status).json(common_1.HttpStatusType.Forbidden);
            }
            await option.proxy(req, res, next);
        }
        catch (error) {
            this.logger.error(`Error in ExtRewriteMiddleware:`, error);
            next(error);
        }
    }
};
exports.GrafanaRewriteMiddleware = GrafanaRewriteMiddleware;
exports.GrafanaRewriteMiddleware = GrafanaRewriteMiddleware = GrafanaRewriteMiddleware_1 = __decorate([
    (0, common_2.Injectable)(),
    __param(0, (0, common_2.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [app_config_1.AppConfigService,
        prisma_service_1.PrismaService])
], GrafanaRewriteMiddleware);
//# sourceMappingURL=grafana.middleware.js.map