import { Request } from "express";
export declare class KeycloakController {
    login(req: Request, user: Express.User): Promise<Express.User | null>;
}
