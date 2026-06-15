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
var WorkerTokenGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerTokenGuard = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const app_config_1 = require("../app.config");
const HEADER = "x-worker-token";
let WorkerTokenGuard = WorkerTokenGuard_1 = class WorkerTokenGuard {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(WorkerTokenGuard_1.name);
        const token = this.configService.service.backup.workerToken.trim() ?? "";
        if (!token) {
            this.logger.error("WORKER_TOKEN is empty; the /worker endpoints will reject every request until it is configured.");
        }
        this.expected = Buffer.from(token, "utf8");
    }
    canActivate(context) {
        if (this.expected.length === 0) {
            throw new common_1.UnauthorizedException("Worker token not configured on server");
        }
        const request = context.switchToHttp().getRequest();
        const header = request.headers[HEADER];
        const presented = typeof header === "string" ? header : Array.isArray(header) ? header[0] : "";
        const presentedBuf = Buffer.from(presented ?? "", "utf8");
        if (presentedBuf.length !== this.expected.length) {
            throw new common_1.UnauthorizedException("Invalid worker token");
        }
        if (!(0, node_crypto_1.timingSafeEqual)(presentedBuf, this.expected)) {
            throw new common_1.UnauthorizedException("Invalid worker token");
        }
        return true;
    }
};
exports.WorkerTokenGuard = WorkerTokenGuard;
exports.WorkerTokenGuard = WorkerTokenGuard = WorkerTokenGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [app_config_1.AppConfigService])
], WorkerTokenGuard);
//# sourceMappingURL=token.guard.js.map