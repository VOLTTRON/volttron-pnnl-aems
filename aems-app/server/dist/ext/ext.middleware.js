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
const proxy = require("express-http-proxy");
let ExtRewriteMiddleware = ExtRewriteMiddleware_1 = class ExtRewriteMiddleware {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_2.Logger(ExtRewriteMiddleware_1.name);
        this.proxies = [];
        Object.entries(configService.ext).forEach(([key, option]) => {
            if (option.path && option.authorized) {
                this.proxies.push({
                    ...option,
                    proxy: proxy(option.authorized, {
                        proxyReqPathResolver: (req) => {
                            const query = new URLSearchParams(req.query).toString();
                            const rewriteUrl = `${option.authorized}${req.url?.replace(new RegExp(`^${option.path}`, "i"), "") ?? ""}${query ? `?${query}` : ""}`;
                            const url = new URL(rewriteUrl);
                            return url.href;
                        },
                    }),
                });
            }
            else {
                this.logger.warn(`Ext option ${key} is missing path or authorized property.`);
            }
        });
    }
    async use(req, res, next) {
        const option = this.proxies.find((v) => req.url?.startsWith(v.path ?? ""));
        if (!option) {
            return next();
        }
        if (option.role) {
            if (!option.role.granted(...(req.user?.roles ?? []))) {
                if (option.unauthorized) {
                    return res.redirect(common_1.HttpStatusType.Found.status, option.unauthorized);
                }
                else {
                    return res.status(common_1.HttpStatusType.Forbidden.status).json(common_1.HttpStatusType.Forbidden);
                }
            }
        }
        await option.proxy(req, res, next);
    }
};
exports.ExtRewriteMiddleware = ExtRewriteMiddleware;
exports.ExtRewriteMiddleware = ExtRewriteMiddleware = ExtRewriteMiddleware_1 = __decorate([
    (0, common_2.Injectable)(),
    __param(0, (0, common_2.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [app_config_1.AppConfigService])
], ExtRewriteMiddleware);
//# sourceMappingURL=ext.middleware.js.map