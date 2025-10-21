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
var SuperPassportService_1, SuperAuthjsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAuthjsService = exports.SuperPassportService = void 0;
const auth_1 = require("..");
const auth_service_1 = require("../auth.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const passport_local_1 = require("passport-local");
const passport_1 = require("@nestjs/passport");
const _1 = require(".");
const app_config_1 = require("../../app.config");
const credentials_1 = require("@auth/express/providers/credentials");
let SuperPassportService = SuperPassportService_1 = class SuperPassportService extends (0, passport_1.PassportStrategy)(passport_local_1.Strategy, _1.Provider) {
    constructor(authService, configService, prismaService) {
        super({ usernameField: "email", passwordField: "password" });
        this.prismaService = prismaService;
        this.logger = new common_1.Logger(SuperPassportService_1.name);
        this.name = _1.Provider;
        this.label = "Super";
        this.credentials = {
            email: { label: "Email", name: "email", type: "text", placeholder: "email" },
        };
        this.endpoint = `/auth/${_1.Provider}/login`;
        authService.registerProvider(this);
    }
    async validate(id, _password) {
        const user = await this.prismaService.prisma.user.findUnique({ where: { id: id } });
        if (user) {
            return (0, auth_1.buildExpressUser)(user);
        }
        else {
            return null;
        }
    }
};
exports.SuperPassportService = SuperPassportService;
exports.SuperPassportService = SuperPassportService = SuperPassportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        app_config_1.AppConfigService,
        prisma_service_1.PrismaService])
], SuperPassportService);
let SuperAuthjsService = SuperAuthjsService_1 = class SuperAuthjsService {
    constructor(authService, configService, prismaService) {
        this.prismaService = prismaService;
        this.logger = new common_1.Logger(SuperAuthjsService_1.name);
        this.name = _1.Provider;
        this.label = "Super";
        this.credentials = {
            email: { label: "Email", name: "email", type: "text", placeholder: "email" },
        };
        this.endpoint = `/authjs/signin/${_1.Provider}`;
        authService.registerProvider(this);
    }
    create() {
        const prisma = this.prismaService.prisma;
        return (0, credentials_1.default)({
            id: _1.Provider,
            name: "another User",
            credentials: this.credentials,
            async authorize({ email }, request) {
                if (typeof email !== "string") {
                    return null;
                }
                const user = await prisma.user.findUnique({ where: { email: email } });
                const authorized = request.user?.authRoles.super;
                if (user && authorized) {
                    return (0, auth_1.buildExpressUser)(user);
                }
                else {
                    return null;
                }
            },
        });
    }
};
exports.SuperAuthjsService = SuperAuthjsService;
exports.SuperAuthjsService = SuperAuthjsService = SuperAuthjsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        app_config_1.AppConfigService,
        prisma_service_1.PrismaService])
], SuperAuthjsService);
//# sourceMappingURL=super.service.js.map