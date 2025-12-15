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
const http = require("node:http");
const https = require("node:https");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const ConfigFilenameRegex = /(?<campus>.+)_(?<building>.+)_dashboard_urls\.json/i;
const ConfigUnitRegex = /RTU Overview - (?<unit>.+)|Site Overview/i;
const SiteOverviewKey = "site";
const SitePublicKey = "public";
let GrafanaRewriteMiddleware = GrafanaRewriteMiddleware_1 = class GrafanaRewriteMiddleware {
    constructor(configService, prismaService) {
        this.configService = configService;
        this.prismaService = prismaService;
        this.logger = new common_2.Logger(GrafanaRewriteMiddleware_1.name);
        this.configs = [];
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
    async use(req, res, next) {
        try {
            const config = this.configs.find((v) => req.url?.startsWith(v.path) || req.url?.startsWith(v.url.pathname));
            if (!config) {
                return next();
            }
            const userRoles = req.user?.roles ?? [];
            if (!common_1.Role.User.granted(...userRoles)) {
                return res.status(common_1.HttpStatusType.Forbidden.status).json(common_1.HttpStatusType.Forbidden);
            }
            if (config.unit !== SitePublicKey && !common_1.Role.Admin.granted(...userRoles)) {
                if (config.unit === SiteOverviewKey) {
                    return res.status(common_1.HttpStatusType.Forbidden.status).json(common_1.HttpStatusType.Forbidden);
                }
                const units = await this.prismaService.prisma.unit.findMany({
                    where: {
                        campus: { equals: config.campus, mode: client_1.Prisma.QueryMode.insensitive },
                        building: { equals: config.building, mode: client_1.Prisma.QueryMode.insensitive },
                        name: { equals: config.unit, mode: client_1.Prisma.QueryMode.insensitive },
                        users: { some: { id: req.user?.id } },
                    },
                });
                if (units.length === 0) {
                    return res.status(common_1.HttpStatusType.Forbidden.status).json(common_1.HttpStatusType.Forbidden);
                }
            }
            if (req.path === config.path) {
                const redirectUrl = new URL(`${config.url.pathname}${config.url.search}`, `${req.protocol}://${req.host}`);
                this.logger.debug(`Redirecting request: ${req.url.toString()} -> ${redirectUrl.toString()}`);
                return res.redirect(301, redirectUrl.toString());
            }
            const targetUrl = new URL(req.originalUrl.replace(new RegExp(`^${config.path}`, "i"), config.url.pathname), config.url.origin);
            config.url.searchParams.forEach((value, key) => {
                if (!targetUrl.searchParams.has(key)) {
                    targetUrl.searchParams.append(key, value);
                }
            });
            this.logger.debug(`Proxying request: ${req.url.toString()} -> ${targetUrl.toString()}`);
            const client = targetUrl.protocol === "https:" ? https : http;
            let requestBody;
            if (req.method && ["POST", "PUT", "PATCH"].includes(req.method.toUpperCase())) {
                if (req.body) {
                    const contentType = req.get("content-type") || "";
                    if (contentType.includes("application/json")) {
                        requestBody = Buffer.from(JSON.stringify(req.body), "utf8");
                    }
                    else if (contentType.includes("application/x-www-form-urlencoded")) {
                        requestBody = Buffer.from(new URLSearchParams(req.body).toString(), "utf8");
                    }
                    else {
                        requestBody = Buffer.from(String(req.body), "utf8");
                    }
                }
            }
            const headers = {
                ...req.headers,
                host: targetUrl.host,
            };
            delete headers.origin;
            delete headers.referer;
            delete headers['x-forwarded-host'];
            delete headers['x-forwarded-proto'];
            delete headers['x-forwarded-for'];
            if (requestBody) {
                headers["content-length"] = requestBody.length.toString();
            }
            else if (req.get("content-length")) {
                headers["content-length"] = req.get("content-length");
            }
            else {
                delete headers["content-length"];
            }
            const options = {
                method: req.method,
                headers,
                ...(this.configService.grafana.username && this.configService.grafana.password
                    ? { auth: `${this.configService.grafana.username}:${this.configService.grafana.password}` }
                    : {}),
            };
            const proxyReq = client.request(targetUrl, options, (proxyRes) => {
                res.writeHead(proxyRes.statusCode ?? 500, proxyRes.headers);
                proxyRes.pipe(res);
            });
            proxyReq.on("error", (err) => {
                this.logger.warn("Proxy request error:", err.message);
                if (!res.headersSent) {
                    res.status(502).send("Bad Gateway");
                }
            });
            if (requestBody) {
                proxyReq.write(requestBody);
            }
            proxyReq.end();
        }
        catch (error) {
            this.logger.error(`Error in GrafanaRewriteMiddleware:`, error);
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