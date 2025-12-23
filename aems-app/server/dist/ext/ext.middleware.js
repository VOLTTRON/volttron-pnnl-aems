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
var ExtRewriteMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtRewriteMiddleware = void 0;
const app_config_1 = require("../app.config");
const common_1 = require("@local/common");
const common_2 = require("@nestjs/common");
const http = require("http");
const https = require("https");
let ExtRewriteMiddleware = ExtRewriteMiddleware_1 = class ExtRewriteMiddleware {
    constructor(configService) {
        this.logger = new common_2.Logger(ExtRewriteMiddleware_1.name);
        this.configs = [];
        Object.entries(configService.ext).forEach(([key, config]) => {
            try {
                if (config.path && config.authorized) {
                    this.configs.push(config);
                    this.logger.log(`Successfully configured proxy for external service: ${key}`);
                }
                else {
                    this.logger.warn(`Ext option ${key} is missing required properties - path: ${!!config.path}, authorized: ${!!config.authorized}`);
                }
            }
            catch (error) {
                this.logger.error(`Failed to configure proxy for ${key}:`, error);
            }
        });
    }
    use(req, res, next) {
        try {
            const config = this.configs.find((v) => req.url?.startsWith(v.path ?? ""));
            if (!config) {
                return next();
            }
            if (config.role) {
                const userRoles = req.user?.roles ?? [];
                if (!config.role.granted(...userRoles)) {
                    if (config.unauthorized) {
                        return res.redirect(common_1.HttpStatusType.Found.status, config.unauthorized);
                    }
                    else {
                        return res.status(common_1.HttpStatusType.Forbidden.status).json(common_1.HttpStatusType.Forbidden);
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
        }
        catch (error) {
            this.logger.error(`Error in ExtRewriteMiddleware:`, error);
            next(error);
        }
    }
};
exports.ExtRewriteMiddleware = ExtRewriteMiddleware;
exports.ExtRewriteMiddleware = ExtRewriteMiddleware = ExtRewriteMiddleware_1 = __decorate([
    (0, common_2.Injectable)(),
    __param(0, (0, common_2.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [app_config_1.AppConfigService])
], ExtRewriteMiddleware);
//# sourceMappingURL=ext.middleware.js.map