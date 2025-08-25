import { Prisma } from "@prisma/client";
import { SchemaBuilderService } from "../builder.service";
export declare class LogObject {
    readonly LogType: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "Trace" | "Debug" | "Info" | "Warn" | "Error" | "Fatal", "Trace" | "Debug" | "Info" | "Warn" | "Error" | "Fatal">;
    readonly LogObject: import("@pothos/plugin-prisma").PrismaObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma").PrismaModelTypes & {
        Name: "Log";
        Shape: import(".prisma/client").Log;
        Include: never;
        Select: Prisma.LogSelect;
        OrderBy: Prisma.LogOrderByWithRelationInput;
        WhereUnique: Prisma.LogWhereUniqueInput;
        Where: Prisma.LogWhereInput;
        Create: Prisma.LogCreateInput;
        Update: Prisma.LogUpdateInput;
        RelationName: never;
        ListRelations: never;
        Relations: {};
    }, {
        type: import(".prisma/client").$Enums.LogType | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
    }>;
    readonly LogFields: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "type" | "id" | "createdAt" | "updatedAt" | "message", "type" | "id" | "createdAt" | "updatedAt" | "message">;
    constructor(builder: SchemaBuilderService);
}
