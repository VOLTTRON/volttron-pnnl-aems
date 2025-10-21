import { Request } from "express";
export declare class BearerController {
    login(req: Request, user: Express.User): Promise<Express.User | null>;
}
