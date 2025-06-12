import { SchemaBuilderService } from "../builder.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
export declare class CurrentMutation {
    readonly CurrentCreate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.UserCreateInput, {
        name: "String";
        email: "String";
        image: "String";
        preferences: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, Partial<import("@local/prisma").Preferences>, Partial<import("@local/prisma").Preferences>, Partial<import("@local/prisma").Preferences>>;
        password: "String";
    }>>;
    readonly CurrentUpdate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.UserUpdateInput, {
        name: "String";
        email: "String";
        image: "String";
        preferences: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, Partial<import("@local/prisma").Preferences>, Partial<import("@local/prisma").Preferences>, Partial<import("@local/prisma").Preferences>>;
        password: "String";
    }>>;
    constructor(builder: SchemaBuilderService, prismaService: PrismaService, subscriptionService: SubscriptionService);
}
