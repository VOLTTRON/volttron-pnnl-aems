import { SetMetadata } from "@nestjs/common";

/**
 * A metadata key for marking routes as public (no authentication required).
 */
export const IsPublicKey = Symbol("isPublic");

/**
 * Decorator to mark a route as publicly accessible without authentication.
 * Use this on controller methods that should be accessible without login.
 * 
 * @example
 * ```typescript
 * @Public()
 * @Get('public-info')
 * getPublicInfo() {
 *   return { data: 'publicly accessible' };
 * }
 * ```
 */
export const Public = () => SetMetadata(IsPublicKey, true);
