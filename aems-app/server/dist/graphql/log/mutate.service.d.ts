import { SchemaBuilderService } from "../builder.service";
import { LogQuery } from "./query.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
export declare class LogMutation {
    readonly LogCreate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.LogCreateInput, {
        type: any;
        message: "String";
    }>>;
    readonly LogUpdate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.LogUpdateInput, {
        type: any;
        message: "String";
    }>>;
    constructor(builder: SchemaBuilderService, prismaService: PrismaService, subscriptionService: SubscriptionService, logQuery: LogQuery);
}
