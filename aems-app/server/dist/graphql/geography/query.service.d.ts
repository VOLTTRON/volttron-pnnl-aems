import { SchemaBuilderService } from "../builder.service";
import { GeographyObject } from "./object.service";
import { PrismaService } from "@/prisma/prisma.service";
import { Scalars } from "..";
export declare class GeographyQuery {
    private logger;
    readonly GeographyAggregate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, {
        average?: ("name" | "type" | "id" | "createdAt" | "updatedAt" | "group" | "geojson")[] | null | undefined;
        count?: ("name" | "type" | "id" | "createdAt" | "updatedAt" | "group" | "geojson")[] | null | undefined;
        maximum?: ("name" | "type" | "id" | "createdAt" | "updatedAt" | "group" | "geojson")[] | null | undefined;
        minimum?: ("name" | "type" | "id" | "createdAt" | "updatedAt" | "group" | "geojson")[] | null | undefined;
        sum?: ("name" | "type" | "id" | "createdAt" | "updatedAt" | "group" | "geojson")[] | null | undefined;
    }>;
    readonly GeographyWhereUnique: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import(".prisma/client").Prisma.GeographyWhereUniqueInput>;
    readonly GeographyWhere: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.GeographyWhereInput, {
        OR: true;
        AND: true;
        NOT: true;
        id: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "equals" | "in" | "not" | "contains" | "startsWith" | "endsWith" | "mode">>;
        name: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "equals" | "in" | "not" | "contains" | "startsWith" | "endsWith" | "mode">>;
        group: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "equals" | "in" | "not" | "contains" | "startsWith" | "endsWith" | "mode">>;
        type: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "equals" | "in" | "not" | "contains" | "startsWith" | "endsWith" | "mode">>;
        createdAt: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<Date>, "equals" | "in" | "lt" | "lte" | "gt" | "gte" | "not" | "contains" | "mode">>;
        updatedAt: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<Date>, "equals" | "in" | "lt" | "lte" | "gt" | "gte" | "not" | "contains" | "mode">>;
    }>>;
    readonly GeographyOrderBy: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import(".prisma/client").Prisma.GeographyOrderByWithRelationInput>;
    constructor(builder: SchemaBuilderService, prismaService: PrismaService, geographyObject: GeographyObject);
}
