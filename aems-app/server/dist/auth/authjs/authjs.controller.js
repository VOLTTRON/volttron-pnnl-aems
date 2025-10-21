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
var AuthjsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthjsController = void 0;
const auth_service_1 = require("../auth.service");
const common_1 = require("@nestjs/common");
const app_config_1 = require("../../app.config");
const prisma_service_1 = require("../../prisma/prisma.service");
const subscription_service_1 = require("../../subscription/subscription.service");
const authjs_config_1 = require("./authjs.config");
const express_1 = require("@auth/express");
let AuthjsController = AuthjsController_1 = class AuthjsController {
    constructor(configService, prismaService, authService, subscriptionService) {
        this.configService = configService;
        this.logger = new common_1.Logger(AuthjsController_1.name);
        this.config = (0, authjs_config_1.buildConfig)(this.configService, prismaService, authService, subscriptionService);
        if (configService.auth.framework === "authjs") {
            this.logger.log("Initializing Authjs controller");
            this.use = (0, express_1.ExpressAuth)(this.config);
        }
        else {
            this.use = (_req, _res, next) => next();
        }
    }
};
exports.AuthjsController = AuthjsController;
exports.AuthjsController = AuthjsController = AuthjsController_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [app_config_1.AppConfigService,
        prisma_service_1.PrismaService,
        auth_service_1.AuthService,
        subscription_service_1.SubscriptionService])
], AuthjsController);
//# sourceMappingURL=authjs.controller.js.map