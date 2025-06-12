import { Role } from "@local/common";
export declare const RolesKey: unique symbol;
export declare const Roles: (...roles: (typeof Role.User)[]) => import("@nestjs/common").CustomDecorator<typeof RolesKey>;
