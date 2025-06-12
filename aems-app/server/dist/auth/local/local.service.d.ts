import { AuthService } from "@/auth/auth.service";
import { PrismaService } from "@/prisma/prisma.service";
import { Strategy } from "passport-local";
import { Credentials, ProviderInfo } from "@local/common";
declare const LocalService_base: new (...args: [] | [options: import("passport-local").IStrategyOptionsWithRequest] | [options: import("passport-local").IStrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class LocalService extends LocalService_base implements ProviderInfo<Credentials> {
    private prismaService;
    private logger;
    readonly name = "local";
    readonly label = "Local";
    readonly credentials: {
        email: {
            label: string;
            name: string;
            type: "text";
            placeholder: string;
        };
        password: {
            label: string;
            name: string;
            type: "password";
        };
    };
    constructor(authService: AuthService, prismaService: PrismaService);
    validate(email: string, password: string): Promise<Express.User | null>;
}
export {};
