import { Prisma } from "@prisma/client";
import { SchemaBuilderService } from "../builder.service";
export declare class LocationObject {
    readonly LocationObject: import("@pothos/plugin-prisma").PrismaObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma").PrismaModelTypes & {
        Name: "Location";
        Shape: import(".prisma/client").Location;
        Include: Prisma.LocationInclude;
        Select: Prisma.LocationSelect;
        OrderBy: Prisma.LocationOrderByWithRelationInput;
        WhereUnique: Prisma.LocationWhereUniqueInput;
        Where: Prisma.LocationWhereInput;
        Create: Prisma.LocationCreateInput;
        Update: Prisma.LocationUpdateInput;
        RelationName: "units";
        ListRelations: "units";
        Relations: {
            units: {
                Shape: import(".prisma/client").Unit[];
                Name: "Unit";
                Nullable: false;
            };
        };
    }, {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        latitude: number;
        longitude: number;
    }>;
    readonly LocationFields: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "name" | "id" | "createdAt" | "updatedAt" | "latitude" | "longitude", "name" | "id" | "createdAt" | "updatedAt" | "latitude" | "longitude">;
    constructor(builder: SchemaBuilderService);
}
