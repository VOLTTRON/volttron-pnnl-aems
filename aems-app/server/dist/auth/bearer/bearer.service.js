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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BearerService = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../auth.service");
const auth_1 = require("..");
const passport_http_bearer_1 = require("passport-http-bearer");
const passport_1 = require("@nestjs/passport");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../prisma/prisma.service");
const _1 = require(".");
let BearerService = class BearerService extends (0, passport_1.PassportStrategy)(passport_http_bearer_1.Strategy, _1.Provider) {
    constructor(authService, prismaService, jwtService) {
        super();
        this.prismaService = prismaService;
        this.jwtService = jwtService;
        this.name = _1.Provider;
        this.label = "Bearer";
        this.credentials = {};
        authService.registerProvider(this);
    }
    async validate(token) {
        if (typeof token === "string") {
            if (await this.jwtService.verifyAsync(token ?? "")) {
                const account = await this.prismaService.prisma.account.findFirst({
                    where: { provider: _1.Provider, accessToken: token },
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
exports.BearerService = BearerService;
exports.BearerService = BearerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        prisma_service_1.PrismaService,
        jwt_1.JwtService])
], BearerService);
//# sourceMappingURL=bearer.service.js.map