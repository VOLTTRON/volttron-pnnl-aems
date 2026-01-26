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
var InternalNetworkGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalNetworkGuard = void 0;
const app_config_1 = require("../app.config");
const common_1 = require("@nestjs/common");
let InternalNetworkGuard = InternalNetworkGuard_1 = class InternalNetworkGuard {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(InternalNetworkGuard_1.name);
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const clientIp = this.getClientIp(request);
        const isInternal = this.isInternalIp(clientIp);
        if (!isInternal) {
            this.logger.warn(`Rejected internal API request from external IP: ${clientIp}`);
        }
        else {
            this.logger.debug(`Allowed internal API request from: ${clientIp}`);
        }
        return isInternal;
    }
    getClientIp(request) {
        const forwardedFor = request.headers["x-forwarded-for"];
        if (forwardedFor) {
            const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
            return ips.split(",")[0].trim();
        }
        const realIp = request.headers["x-real-ip"];
        if (realIp) {
            return Array.isArray(realIp) ? realIp[0] : realIp;
        }
        const socketAddress = request.socket.remoteAddress;
        if (socketAddress) {
            return socketAddress;
        }
        const connectionAddress = request.connection?.remoteAddress;
        return connectionAddress || "unknown";
    }
    isInternalIp(ip) {
        if (ip === "::1" || ip === "::ffff:127.0.0.1") {
            return true;
        }
        if (ip === "127.0.0.1" || ip === "localhost") {
            return true;
        }
        if (this.isIpInRange(ip, "172.16.0.0", 12)) {
            return true;
        }
        if (this.isIpInRange(ip, "10.0.0.0", 8)) {
            return true;
        }
        if (this.isIpInRange(ip, "192.168.0.0", 16)) {
            return true;
        }
        return false;
    }
    isIpInRange(ip, network, prefixLength) {
        try {
            const ipParts = ip.split(".").map(Number);
            const networkParts = network.split(".").map(Number);
            if (ipParts.length !== 4 || networkParts.length !== 4) {
                return false;
            }
            const ipInt = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
            const networkInt = (networkParts[0] << 24) |
                (networkParts[1] << 16) |
                (networkParts[2] << 8) |
                networkParts[3];
            const mask = (-1 << (32 - prefixLength)) >>> 0;
            return (ipInt & mask) === (networkInt & mask);
        }
        catch (error) {
            this.logger.error(`Error checking IP range for ${ip}:`, error);
            return false;
        }
    }
};
exports.InternalNetworkGuard = InternalNetworkGuard;
exports.InternalNetworkGuard = InternalNetworkGuard = InternalNetworkGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [app_config_1.AppConfigService])
], InternalNetworkGuard);
//# sourceMappingURL=internal-network.guard.js.map