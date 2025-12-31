import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Request } from "express";

/**
 * Guard that ensures a user is authenticated before allowing access.
 * This guard should run before RolesGuard to ensure request.user is populated.
 */
@Injectable()
export class AuthenticatedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    // Allow access if user is authenticated (request.user exists)
    // Deny access if user is not authenticated
    return !!request.user;
  }
}
