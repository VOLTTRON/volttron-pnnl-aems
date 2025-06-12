import { PrismaService } from "../prisma/prisma.service";
import { SessionData, Store } from "express-session";
export declare class PrismaSessionStore extends Store {
    private prismaService;
    constructor(prismaService: PrismaService);
    get(id: string, callback: (err: any, session?: SessionData | null) => void): void;
    set(id: string, session: SessionData, callback?: (err?: any) => void): void;
    destroy(id: string, callback?: (err?: any) => void): void;
}
