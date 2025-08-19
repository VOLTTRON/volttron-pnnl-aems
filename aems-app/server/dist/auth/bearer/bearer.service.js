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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BearerPassportService = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../auth.service");
const auth_1 = require("..");
const passport_http_bearer_1 = require("passport-http-bearer");
const passport_1 = require("@nestjs/passport");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../prisma/prisma.service");
const _1 = require(".");
const app_config_1 = require("../../app.config");
let BearerPassportService = class BearerPassportService extends (0, passport_1.PassportStrategy)(passport_http_bearer_1.Strategy, _1.Provider) {
    constructor(authService, configService, prismaService, jwtService) {
        super();
        this.prismaService = prismaService;
        this.jwtService = jwtService;
        this.name = _1.Provider;
        this.label = "Bearer";
        this.credentials = {};
        this.endpoint =
            configService.auth.framework === "authjs" ? `/authjs/signin/${_1.Provider}` : `/auth/${_1.Provider}/login`;
        authService.registerProvider(this);
    }
    async validate(token) {
        if (typeof token === "string") {
            if (await this.jwtService.verifyAsync(token ?? "")) {
                const account = await this.prismaService.prisma.account.findFirst({
                    where: { provider: _1.Provider, access_token: token },
                    include: { user: { omit: { password: true } } },
                });
                if (account) {
                    return (0, auth_1.buildExpressUser)(account.user);
                }
            }
        }
        return null;
    }
};
exports.BearerPassportService = BearerPassportService;
exports.BearerPassportService = BearerPassportService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        app_config_1.AppConfigService,
        prisma_service_1.PrismaService,
        jwt_1.JwtService])
], BearerPassportService);
//# sourceMappingURL=bearer.service.js.map