import { SchemaBuilderService } from "../builder.service";
import { LogObject } from "./object.service";
import { PrismaService } from "@/prisma/prisma.service";
export declare class LogQuery {
    readonly LogWhereUnique: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import(".prisma/client").Prisma.LogWhereUniqueInput>;
    readonly LogWhere: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.LogWhereInput, {
        OR: true;
        AND: true;
        NOT: true;
        id: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "equals" | "in" | "contains" | "mode">>;
        type: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<import(".prisma/client").$Enums.LogType>, "not" | "equals" | "in" | "mode">>;
        message: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "equals" | "in" | "contains" | "mode">>;
        createdAt: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<Date>, "not" | "lt" | "gte" | "equals" | "in" | "lte" | "gt" | "contains" | "mode">>;
        updatedAt: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<Date>, "not" | "lt" | "gte" | "equals" | "in" | "lte" | "gt" | "contains" | "mode">>;
    }>>;
    readonly LogOrderBy: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import(".prisma/client").Prisma.LogOrderByWithRelationInput>;
    readonly LogAggregate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, {
        count?: ("id" | "createdAt" | "updatedAt" | "type" | "message")[] | null | undefined;
        sum?: ("id" | "createdAt" | "updatedAt" | "type" | "message")[] | null | undefined;
        maximum?: ("id" | "createdAt" | "updatedAt" | "type" | "message")[] | null | undefined;
        minimum?: ("id" | "createdAt" | "updatedAt" | "type" | "message")[] | null | undefined;
        average?: ("id" | "createdAt" | "updatedAt" | "type" | "message")[] | null | undefined;
    }>;
    constructor(builder: SchemaBuilderService, prismaService: PrismaService, logObject: LogObject);
}
