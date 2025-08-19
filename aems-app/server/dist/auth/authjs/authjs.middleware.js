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
var AuthjsMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthjsMiddleware = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const subscription_service_1 = require("../../subscription/subscription.service");
const app_config_1 = require("../../app.config");
const express_1 = require("@auth/express");
const authjs_config_1 = require("./authjs.config");
const __1 = require("..");
const auth_service_1 = require("../auth.service");
let AuthjsMiddleware = AuthjsMiddleware_1 = class AuthjsMiddleware {
    constructor(configService, prismaService, authService, subscriptionService) {
        this.configService = configService;
        this.prismaService = prismaService;
        this.authService = authService;
        this.subscriptionService = subscriptionService;
        this.logger = new common_1.Logger(AuthjsMiddleware_1.name);
        authService.subscribe(this.update.bind(this));
        this.config = (0, authjs_config_1.buildConfig)(this.configService, this.prismaService, this.authService, this.subscriptionService);
        if (this.configService.auth.framework === "authjs") {
            this.logger.log("Initializing Authjs middleware");
            this.use = async (req, _res, next) => {
                try {
                    req.user = await this.getAuthjsUser(req);
                }
                catch (error) {
                    this.logger.error("Auth.js session middleware error:", error);
                }
                return next();
            };
        }
        else {
            this.use = (_req, _res, next) => next();
        }
    }
    update(provider) {
        if ("create" in provider) {
            this.logger.warn(`Authjs provider registered after middleware initialization: ${provider.name}`);
        }
    }
    async getAuthjsUser(req) {
        const authjsSession = await (0, express_1.getSession)(req, this.config);
        if (authjsSession?.user?.email) {
            return this.prismaService.prisma.user
                .findUniqueOrThrow({ where: { email: authjsSession.user.email }, omit: { password: true } })
                .then((user) => (0, __1.buildExpressUser)(user))
                .catch(() => undefined);
        }
        return undefined;
    }
    onModuleDestroy() {
        this.authService.unsubscribe(this.update.bind(this));
        this.logger.debug("Authjs middleware shutdown");
    }
};
exports.AuthjsMiddleware = AuthjsMiddleware;
exports.AuthjsMiddleware = AuthjsMiddleware = AuthjsMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [app_config_1.AppConfigService,
        prisma_service_1.PrismaService,
        auth_service_1.AuthService,
        subscription_service_1.SubscriptionService])
], AuthjsMiddleware);
//# sourceMappingURL=authjs.middleware.js.map