import { Prisma } from "@prisma/client";
import { SchemaBuilderService } from "../builder.service";
export declare class SetpointObject {
    readonly SetpointObject: import("@pothos/plugin-prisma").PrismaObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma").PrismaModelTypes & {
        Name: "Setpoint";
        Shape: import(".prisma/client").Setpoint;
        Include: Prisma.SetpointInclude;
        Select: Prisma.SetpointSelect;
        OrderBy: Prisma.SetpointOrderByWithRelationInput;
        WhereUnique: Prisma.SetpointWhereUniqueInput;
        Where: Prisma.SetpointWhereInput;
        Create: Prisma.SetpointCreateInput;
        Update: Prisma.SetpointUpdateInput;
        RelationName: "configurations" | "schedules";
        ListRelations: "configurations" | "schedules";
        Relations: {
            configurations: {
                Shape: import(".prisma/client").Configuration[];
                Name: "Configuration";
                Nullable: false;
            };
            schedules: {
                Shape: import(".prisma/client").Schedule[];
                Name: "Schedule";
                Nullable: false;
            };
        };
    }, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        setpoint: number;
        message: string | null;
        stage: import(".prisma/client").$Enums.ModelStage;
        correlation: string | null;
        label: string;
        deadband: number;
        heating: number;
        cooling: number;
    }>;
    readonly SetpointFields: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "id" | "createdAt" | "updatedAt" | "setpoint" | "message" | "stage" | "correlation" | "label" | "deadband" | "heating" | "cooling", "id" | "createdAt" | "updatedAt" | "setpoint" | "message" | "stage" | "correlation" | "label" | "deadband" | "heating" | "cooling">;
    constructor(builder: SchemaBuilderService);
}
