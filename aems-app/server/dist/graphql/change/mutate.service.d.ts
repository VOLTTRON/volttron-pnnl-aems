import { SchemaBuilderService } from "../builder.service";
import { ChangeQuery } from "./query.service";
import { ChangeObject } from "./object.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
export declare class ChangeMutation {
    constructor(builder: SchemaBuilderService, prismaService: PrismaService, subscriptionService: SubscriptionService, changeQuery: ChangeQuery, _changeObject: ChangeObject);
}
