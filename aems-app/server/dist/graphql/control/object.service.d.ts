import { Prisma } from "@prisma/client";
import { SchemaBuilderService } from "../builder.service";
export declare class ControlObject {
    readonly ControlObject: import("@pothos/plugin-prisma").PrismaObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma").PrismaModelTypes & {
        Name: "Control";
        Shape: import(".prisma/client").Control;
        Include: Prisma.ControlInclude;
        Select: Prisma.ControlSelect;
        OrderBy: Prisma.ControlOrderByWithRelationInput;
        WhereUnique: Prisma.ControlWhereUniqueInput;
        Where: Prisma.ControlWhereInput;
        Create: Prisma.ControlCreateInput;
        Update: Prisma.ControlUpdateInput;
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
        message: string | null;
        stage: import(".prisma/client").$Enums.ModelStage;
        correlation: string | null;
        campus: string;
        building: string;
        label: string;
        peakLoadExclude: boolean;
    }>;
    readonly ControlFields: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "name" | "id" | "createdAt" | "updatedAt" | "message" | "stage" | "correlation" | "campus" | "building" | "label" | "peakLoadExclude", "name" | "id" | "createdAt" | "updatedAt" | "message" | "stage" | "correlation" | "campus" | "building" | "label" | "peakLoadExclude">;
    constructor(builder: SchemaBuilderService);
}
