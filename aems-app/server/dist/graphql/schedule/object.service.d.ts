import { Prisma } from "@prisma/client";
import { SchemaBuilderService } from "../builder.service";
export declare class ScheduleObject {
    readonly ScheduleObject: import("@pothos/plugin-prisma").PrismaObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma").PrismaModelTypes & {
        Name: "Schedule";
        Shape: import(".prisma/client").Schedule;
        Include: Prisma.ScheduleInclude;
        Select: Prisma.ScheduleSelect;
        OrderBy: Prisma.ScheduleOrderByWithRelationInput;
        WhereUnique: Prisma.ScheduleWhereUniqueInput;
        Where: Prisma.ScheduleWhereInput;
        Create: Prisma.ScheduleCreateInput;
        Update: Prisma.ScheduleUpdateInput;
        RelationName: "setpoint" | "mondayConfigurations" | "tuesdayConfigurations" | "wednesdayConfigurations" | "thursdayConfigurations" | "fridayConfigurations" | "saturdayConfigurations" | "sundayConfigurations" | "holidayConfigurations" | "occupancies";
        ListRelations: "mondayConfigurations" | "tuesdayConfigurations" | "wednesdayConfigurations" | "thursdayConfigurations" | "fridayConfigurations" | "saturdayConfigurations" | "sundayConfigurations" | "holidayConfigurations" | "occupancies";
        Relations: {
            setpoint: {
                Shape: import(".prisma/client").Setpoint | null;
                Name: "Setpoint";
                Nullable: true;
            };
            mondayConfigurations: {
                Shape: import(".prisma/client").Configuration[];
                Name: "Configuration";
                Nullable: false;
            };
            tuesdayConfigurations: {
                Shape: import(".prisma/client").Configuration[];
                Name: "Configuration";
                Nullable: false;
            };
            wednesdayConfigurations: {
                Shape: import(".prisma/client").Configuration[];
                Name: "Configuration";
                Nullable: false;
            };
            thursdayConfigurations: {
                Shape: import(".prisma/client").Configuration[];
                Name: "Configuration";
                Nullable: false;
            };
            fridayConfigurations: {
                Shape: import(".prisma/client").Configuration[];
                Name: "Configuration";
                Nullable: false;
            };
            saturdayConfigurations: {
                Shape: import(".prisma/client").Configuration[];
                Name: "Configuration";
                Nullable: false;
            };
            sundayConfigurations: {
                Shape: import(".prisma/client").Configuration[];
                Name: "Configuration";
                Nullable: false;
            };
            holidayConfigurations: {
                Shape: import(".prisma/client").Configuration[];
                Name: "Configuration";
                Nullable: false;
            };
            occupancies: {
                Shape: import(".prisma/client").Occupancy[];
                Name: "Occupancy";
                Nullable: false;
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
        setpointId: string | null;
        startTime: string;
        endTime: string;
        occupied: boolean;
    }>;
    readonly ScheduleFields: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "id" | "createdAt" | "updatedAt" | "message" | "stage" | "correlation" | "label" | "setpointId" | "startTime" | "endTime" | "occupied", "id" | "createdAt" | "updatedAt" | "message" | "stage" | "correlation" | "label" | "setpointId" | "startTime" | "endTime" | "occupied">;
    constructor(builder: SchemaBuilderService);
}
