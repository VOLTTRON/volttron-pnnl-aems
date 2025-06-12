import { Request } from "express";
export declare class SuperController {
    login(req: Request, user: Express.User): Promise<Express.User | null>;
}
