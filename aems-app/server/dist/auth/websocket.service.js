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
var WebSocketAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketAuthService = void 0;
const common_1 = require("@nestjs/common");
const app_config_1 = require("../app.config");
const authjs_middleware_1 = require("./authjs/authjs.middleware");
const passport_middleware_1 = require("./passport/passport.middleware");
const prisma_service_1 = require("../prisma/prisma.service");
let WebSocketAuthService = WebSocketAuthService_1 = class WebSocketAuthService {
    constructor(configService, authjsMiddleware, passportMiddleware, prismaService) {
        this.configService = configService;
        this.authjsMiddleware = authjsMiddleware;
        this.passportMiddleware = passportMiddleware;
        this.prismaService = prismaService;
        this.logger = new common_1.Logger(WebSocketAuthService_1.name);
    }
    async authenticateWebSocket(request) {
        try {
            const response = {};
            const next = () => { };
            switch (this.configService.auth.framework) {
                case "authjs":
                    await this.authjsMiddleware.use(request, response, next);
                    break;
                case "passport":
                    await this.passportMiddleware.use(request, response, next);
                    break;
                default:
                    this.logger.log("No auth framework found for WebSocket connection");
                    return undefined;
            }
            return request.user;
        }
        catch (error) {
            this.logger.error("WebSocket authentication error:", error);
            return undefined;
        }
    }
};
exports.WebSocketAuthService = WebSocketAuthService;
exports.WebSocketAuthService = WebSocketAuthService = WebSocketAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [app_config_1.AppConfigService,
        authjs_middleware_1.AuthjsMiddleware,
        passport_middleware_1.PassportMiddleware,
        prisma_service_1.PrismaService])
], WebSocketAuthService);
//# sourceMappingURL=websocket.service.js.map