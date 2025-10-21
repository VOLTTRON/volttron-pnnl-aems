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
var AuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const prisma_service_1 = require("../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const lodash_1 = require("lodash");
const user_decorator_1 = require("./user.decorator");
const swagger_1 = require("@nestjs/swagger");
const app_config_1 = require("../app.config");
let AuthController = AuthController_1 = class AuthController {
    constructor(prismaService, authService, configService) {
        this.prismaService = prismaService;
        this.authService = authService;
        this.configService = configService;
        this.logger = new common_1.Logger(AuthController_1.name);
    }
    root() {
        return this.authService.getProviderNames().reduce((out, value) => ({
            ...out,
            [value]: (0, lodash_1.pick)(this.authService.getProvider(value) ?? {}, ["name", "label", "credentials", "endpoint"]),
        }), {});
    }
    current(user) {
        if (user) {
            return this.prismaService.prisma.user.findUniqueOrThrow({
                where: { id: user.id },
                omit: { password: true },
            });
        }
        else {
            return null;
        }
    }
    async logout(req) {
        return new Promise((resolve, reject) => req.logout((err) => (err ? reject(err) : resolve())));
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, swagger_1.ApiTags)("auth", "providers"),
    (0, swagger_1.ApiResponse)({
        schema: {
            type: "object",
            items: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    label: { type: "string" },
                    credentials: { type: "object", additionalProperties: { type: "string" } },
                    endpoint: { type: "string", nullable: true },
                },
            },
        },
    }),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "root", null);
__decorate([
    (0, swagger_1.ApiTags)("auth", "current", "user"),
    (0, common_1.Get)("current"),
    __param(0, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "current", null);
__decorate([
    (0, swagger_1.ApiTags)("auth", "logout"),
    (0, common_1.Post)("logout"),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = AuthController_1 = __decorate([
    (0, swagger_1.ApiTags)("auth"),
    (0, common_1.Controller)("auth"),
    __param(2, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_service_1.AuthService,
        app_config_1.AppConfigService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map