import { AuthService } from "@/auth/auth.service";
import { Strategy } from "passport-http-bearer";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "@/prisma/prisma.service";
import { Credentials, ProviderInfo } from "@local/common";
declare const BearerService_base: new (...args: [] | [options: import("passport-http-bearer").IStrategyOptions]) => Strategy<import("passport-http-bearer").VerifyFunctions> & {
    validate(...args: any[]): unknown;
};
export declare class BearerService extends BearerService_base implements ProviderInfo<Credentials> {
    private prismaService;
    private jwtService;
    readonly name = "bearer";
    readonly label = "Bearer";
    readonly credentials: {};
    constructor(authService: AuthService, prismaService: PrismaService, jwtService: JwtService);
    validate(token: string | null | undefined): Promise<Express.User | null>;
}
export {};
