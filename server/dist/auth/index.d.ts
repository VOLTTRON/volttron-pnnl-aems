import { HttpStatus, Role, Credentials } from "@local/common";
import { ZxcvbnResult } from "@zxcvbn-ts/core";
import { User as PrismaUser, User } from "@prisma/client";
declare global {
    namespace Express {
        interface User extends Omit<PrismaUser, "password"> {
            authRoles: AuthRoles;
            roles: (typeof Role.User)[];
        }
        interface Request {
            user?: Express.User;
        }
    }
}
declare module "express-session" {
    interface SessionData {
        passport?: {
            user?: string;
        };
    }
}
export type AuthRoles = {
    [key in typeof Role.User.enum]: boolean;
};
interface IAuthUser {
    id?: string;
    roles: AuthRoles;
}
export type Values<T extends Credentials> = {
    [K in keyof T]: string;
};
export interface AuthResponse {
    user?: Express.User;
    cookies?: Record<string, string>;
    redirect?: string;
    error?: string;
}
export type Authorize<T extends Credentials, V extends Values<T>> = (credentials: V | null | undefined, options: {
    auth: AuthUser;
}) => Promise<(AuthResponse & typeof HttpStatus.Accepted) | AuthResponse> | (AuthResponse & typeof HttpStatus.Accepted) | AuthResponse;
export declare class AuthUser implements IAuthUser {
    readonly id?: string;
    readonly roles: AuthRoles;
    constructor(user?: Partial<User>);
    constructor(user?: Partial<Express.User>);
    constructor(id?: string, role?: string);
    constructor(id?: string, roles?: AuthRoles);
}
export declare function buildExpressUser(user: User | Omit<User, "password">): Express.User;
export declare const checkPassword: (password: string, userInputs?: (string | number)[]) => ZxcvbnResult;
export {};
