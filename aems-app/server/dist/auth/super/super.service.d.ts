import { AuthService } from "@/auth/auth.service";
import { PrismaService } from "@/prisma/prisma.service";
import { Strategy } from "passport-local";
import { Credentials, ProviderInfo } from "@local/common";
declare const SuperService_base: new (...args: [] | [options: import("passport-local").IStrategyOptionsWithRequest] | [options: import("passport-local").IStrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class SuperService extends SuperService_base implements ProviderInfo<Credentials> {
    private prismaService;
    readonly name = "super";
    readonly label = "Super";
    readonly credentials: {
        id: {
            label: string;
            type: "text";
            required: boolean;
        };
    };
    constructor(authService: AuthService, prismaService: PrismaService);
    validate(id: string, _password: string): Promise<Express.User | null>;
}
export {};
