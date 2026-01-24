import { Injectable, CanActivate, ExecutionContext, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesKey } from "./roles.decorator";
import { Role } from "@local/common";
import { Request } from "express";

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<(typeof Role.User)[]>(RolesKey, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    const roles = user?.roles ?? [];

    // Diagnostic logging
    this.logger.log(`[RolesGuard] Authorization check for user: ${user?.email || 'unknown'} (ID: ${user?.id || 'none'})`);
    this.logger.log(`[RolesGuard] Required roles: ${requiredRoles.map(r => r.name).join(', ')}`);
    this.logger.log(`[RolesGuard] User roles array length: ${roles.length}`);
    this.logger.log(`[RolesGuard] User roles: ${roles.map(r => typeof r === 'object' ? r.name : String(r)).join(', ')}`);
    this.logger.log(`[RolesGuard] User role types: ${roles.map(r => typeof r).join(', ')}`);

    const result = requiredRoles.every((requiredRole) => {
      const granted = requiredRole.granted(...roles);
      this.logger.log(`[RolesGuard] Checking if role '${requiredRole.name}' is granted by user roles: ${granted}`);
      
      // Additional debug for the granted check
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
}
