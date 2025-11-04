import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { ChangeMutation, Configuration, Control, Holiday, Location, Occupancy, Schedule, Setpoint, Unit } from "@prisma/client";
export declare class ChangeService {
    private prismaService;
    private subscriptionService;
    constructor(prismaService: PrismaService, subscriptionService: SubscriptionService);
    private transform;
    handleChange(key: string, entity: Partial<Schedule> & Required<Pick<Schedule, "id">>, type: "Schedule", mutation: ChangeMutation, user: Express.User | string): Promise<void>;
    handleChange(key: string, entity: Partial<Configuration> & Required<Pick<Configuration, "id">>, type: "Configuration", mutation: ChangeMutation, user: Express.User | string): Promise<void>;
    handleChange(key: string, entity: Partial<Control> & Required<Pick<Control, "id">>, type: "Control", mutation: ChangeMutation, user: Express.User | string): Promise<void>;
    handleChange(key: string, entity: Partial<Location> & Required<Pick<Location, "id">>, type: "Location", mutation: ChangeMutation, user: Express.User | string): Promise<void>;
    handleChange(key: string, entity: Partial<Unit> & Required<Pick<Unit, "id">>, type: "Unit", mutation: ChangeMutation, user: Express.User | string): Promise<void>;
    handleChange(key: string, entity: Partial<Occupancy> & Required<Pick<Occupancy, "id">>, type: "Occupancy", mutation: ChangeMutation, user: Express.User | string): Promise<void>;
    handleChange(key: string, entity: Partial<Holiday> & Required<Pick<Holiday, "id">>, type: "Holiday", mutation: ChangeMutation, user: Express.User | string): Promise<void>;
    handleChange(key: string, entity: Partial<Setpoint> & Required<Pick<Setpoint, "id">>, type: "Setpoint", mutation: ChangeMutation, user: Express.User | string): Promise<void>;
}
