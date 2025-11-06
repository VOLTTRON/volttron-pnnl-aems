import { Prisma } from "@prisma/client";
import { SchemaBuilderService } from "../builder.service";
import { Scalars } from "..";
export declare class ChangeObject {
    readonly ChangeData: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, Prisma.JsonValue, Prisma.JsonValue, Prisma.JsonValue>;
    readonly ChangeObject: import("@pothos/plugin-prisma").PrismaObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import("@pothos/plugin-prisma").PrismaModelTypes & {
        Name: "Change";
        Shape: import(".prisma/client").Change;
        Include: Prisma.ChangeInclude;
        Select: Prisma.ChangeSelect;
        OrderBy: Prisma.ChangeOrderByWithRelationInput;
        WhereUnique: Prisma.ChangeWhereUniqueInput;
        Where: Prisma.ChangeWhereInput;
        Create: Prisma.ChangeCreateInput;
        Update: Prisma.ChangeUpdateInput;
        RelationName: "user";
        ListRelations: never;
        Relations: {
            user: {
                Shape: import(".prisma/client").User | null;
                Name: "User";
                Nullable: true;
            };
        };
    }, {
        key: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        data: PrismaJson.ChangeData | null;
        table: string;
        mutation: import(".prisma/client").$Enums.ChangeMutation;
    }>;
    readonly ChangeFields: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, "key" | "id" | "createdAt" | "updatedAt" | "userId" | "data" | "table" | "mutation", "key" | "id" | "createdAt" | "updatedAt" | "userId" | "data" | "table" | "mutation">;
    readonly ChangeMutation: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, "Create" | "Update" | "Delete" | "Upsert", "Create" | "Update" | "Delete" | "Upsert">;
    constructor(builder: SchemaBuilderService);
}
