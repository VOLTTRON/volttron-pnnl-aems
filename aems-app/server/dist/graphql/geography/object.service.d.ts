import { Prisma } from "@prisma/client";
import { SchemaBuilderService } from "../builder.service";
import { Scalars } from "..";
export declare class GeographyObject {
    readonly GeographyGeoJson: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, PrismaJson.GeographyGeoJson, PrismaJson.GeographyGeoJson, PrismaJson.GeographyGeoJson>;
    readonly GeographyObject: import("@pothos/plugin-prisma").PrismaObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import("@pothos/plugin-prisma").PrismaModelTypes & {
        Name: "Geography";
        Shape: import(".prisma/client").Geography;
        Include: never;
        Select: Prisma.GeographySelect;
        OrderBy: Prisma.GeographyOrderByWithRelationInput;
        WhereUnique: Prisma.GeographyWhereUniqueInput;
        Where: Prisma.GeographyWhereInput;
        Create: Prisma.GeographyCreateInput;
        Update: Prisma.GeographyUpdateInput;
        RelationName: never;
        ListRelations: never;
        Relations: {};
    }, {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        group: string;
        geojson: PrismaJson.GeographyGeoJson;
    }>;
    readonly GeographyFields: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, "name" | "id" | "createdAt" | "updatedAt" | "type" | "group" | "geojson", "name" | "id" | "createdAt" | "updatedAt" | "type" | "group" | "geojson">;
    constructor(builder: SchemaBuilderService);
}
