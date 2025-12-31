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
var RolesGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const roles_decorator_1 = require("./roles.decorator");
let RolesGuard = RolesGuard_1 = class RolesGuard {
    constructor(reflector) {
        this.reflector = reflector;
        this.logger = new common_1.Logger(RolesGuard_1.name);
    }
    canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(roles_decorator_1.RolesKey, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const roles = user?.roles ?? [];
        this.logger.log(`[RolesGuard] Authorization check for user: ${user?.email || 'unknown'} (ID: ${user?.id || 'none'})`);
        this.logger.log(`[RolesGuard] Required roles: ${requiredRoles.map(r => r.name).join(', ')}`);
        this.logger.log(`[RolesGuard] User roles array length: ${roles.length}`);
        this.logger.log(`[RolesGuard] User roles: ${roles.map(r => typeof r === 'object' ? r.name : String(r)).join(', ')}`);
        this.logger.log(`[RolesGuard] User role types: ${roles.map(r => typeof r).join(', ')}`);
        const result = requiredRoles.every((requiredRole) => {
            const granted = requiredRole.granted(...roles);
            this.logger.log(`[RolesGuard] Checking if role '${requiredRole.name}' is granted by user roles: ${granted}`);
            if (!granted) {
                this.logger.warn(`[RolesGuard] Role '${requiredRole.name}' NOT granted for user ${user?.email || 'unknown'}`);
                this.logger.log(`[RolesGuard] Role grants: ${requiredRole.grants?.join(', ') || 'none'}`);
            }
            return granted;
        });
        this.logger.log(`[RolesGuard] Final authorization result: ${result ? 'ALLOWED' : 'DENIED'}`);
        if (!result) {
            this.logger.warn(`[RolesGuard] Access DENIED for user ${user?.email || 'unknown'} (ID: ${user?.id || 'none'})`);
        }
        return result;
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = RolesGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RolesGuard);
//# sourceMappingURL=roles.guard.js.map