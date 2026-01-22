import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { IsPublicKey } from "./public.decorator";

/**
 * Guard that ensures a user is authenticated before allowing access.
 * Routes marked with @Public() decorator are accessible without authentication.
 * This guard should run before RolesGuard to ensure request.user is populated.
 */
@Injectable()
export class AuthenticatedGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IsPublicKey, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Allow access to public routes without authentication
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    // Allow access if user is authenticated (request.user exists)
    // Deny access if user is not authenticated
    return !!request.user;
  }
}
