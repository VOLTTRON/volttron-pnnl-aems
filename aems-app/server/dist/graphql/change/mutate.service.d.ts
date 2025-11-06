import { SchemaBuilderService } from "../builder.service";
import { ChangeQuery } from "./query.service";
import { ChangeObject } from "./object.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
export declare class ChangeMutation {
    readonly ChangeCreate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.ChangeCreateInput, {
        table: "String";
        key: "String";
        mutation: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, "Create" | "Update" | "Delete" | "Upsert", "Create" | "Update" | "Delete" | "Upsert">;
        data: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, import("@prisma/client/runtime/library").JsonValue, import("@prisma/client/runtime/library").JsonValue, import("@prisma/client/runtime/library").JsonValue>;
        userId: "String";
    }>>;
    readonly ChangeUpdate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.ChangeUpdateInput, {
        table: "String";
        key: "String";
        mutation: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, "Create" | "Update" | "Delete" | "Upsert", "Create" | "Update" | "Delete" | "Upsert">;
        data: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, import("@prisma/client/runtime/library").JsonValue, import("@prisma/client/runtime/library").JsonValue, import("@prisma/client/runtime/library").JsonValue>;
        userId: "String";
    }>>;
    constructor(builder: SchemaBuilderService, prismaService: PrismaService, subscriptionService: SubscriptionService, changeQuery: ChangeQuery, changeObject: ChangeObject);
}
