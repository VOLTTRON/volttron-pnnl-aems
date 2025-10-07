import { Prisma } from "@prisma/client";
import { SchemaBuilderService } from "../builder.service";
export declare class OccupancyObject {
    readonly OccupancyObject: import("@pothos/plugin-prisma").PrismaObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma").PrismaModelTypes & {
        Name: "Occupancy";
        Shape: import(".prisma/client").Occupancy;
        Include: Prisma.OccupancyInclude;
        Select: Prisma.OccupancySelect;
        OrderBy: Prisma.OccupancyOrderByWithRelationInput;
        WhereUnique: Prisma.OccupancyWhereUniqueInput;
        Where: Prisma.OccupancyWhereInput;
        Create: Prisma.OccupancyCreateInput;
        Update: Prisma.OccupancyUpdateInput;
        RelationName: "schedule" | "configuration";
        ListRelations: never;
        Relations: {
            schedule: {
                Shape: import(".prisma/client").Schedule | null;
                Name: "Schedule";
                Nullable: true;
            };
            configuration: {
                Shape: import(".prisma/client").Configuration | null;
                Name: "Configuration";
                Nullable: true;
            };
        };
    }, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        stage: import(".prisma/client").$Enums.ModelStage;
        correlation: string | null;
        label: string;
        configurationId: string | null;
        date: Date;
        scheduleId: string | null;
    }>;
    readonly OccupancyFields: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "id" | "createdAt" | "updatedAt" | "message" | "stage" | "correlation" | "label" | "configurationId" | "date" | "scheduleId", "id" | "createdAt" | "updatedAt" | "message" | "stage" | "correlation" | "label" | "configurationId" | "date" | "scheduleId">;
    constructor(builder: SchemaBuilderService);
}
