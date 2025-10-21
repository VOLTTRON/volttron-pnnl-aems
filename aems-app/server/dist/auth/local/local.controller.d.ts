import { Request } from "express";
export declare class LocalController {
    login(req: Request, user: Express.User): Promise<Express.User | null>;
}
