import { Role } from "@local/common";
import { SetMetadata } from "@nestjs/common";

/**
 * A metadata key for authentication roles.
 */
export const RolesKey = Symbol("roles");

export const Roles = (...roles: (typeof Role.User)[]) => SetMetadata(RolesKey, roles);
