import { Prisma } from "@prisma/client";
import { SchemaBuilderService } from "../builder.service";
export declare class ConfigurationObject {
    readonly ConfigurationObject: import("@pothos/plugin-prisma").PrismaObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma").PrismaModelTypes & {
        Name: "Configuration";
        Shape: import(".prisma/client").Configuration;
        Include: Prisma.ConfigurationInclude;
        Select: Prisma.ConfigurationSelect;
        OrderBy: Prisma.ConfigurationOrderByWithRelationInput;
        WhereUnique: Prisma.ConfigurationWhereUniqueInput;
        Where: Prisma.ConfigurationWhereInput;
        Create: Prisma.ConfigurationCreateInput;
        Update: Prisma.ConfigurationUpdateInput;
        RelationName: "setpoint" | "mondaySchedule" | "tuesdaySchedule" | "wednesdaySchedule" | "thursdaySchedule" | "fridaySchedule" | "saturdaySchedule" | "sundaySchedule" | "holidaySchedule" | "units" | "occupancies" | "holidays";
        ListRelations: "units" | "occupancies" | "holidays";
        Relations: {
            setpoint: {
                Shape: import(".prisma/client").Setpoint | null;
                Name: "Setpoint";
                Nullable: true;
            };
            mondaySchedule: {
                Shape: import(".prisma/client").Schedule | null;
                Name: "Schedule";
                Nullable: true;
            };
            tuesdaySchedule: {
                Shape: import(".prisma/client").Schedule | null;
                Name: "Schedule";
                Nullable: true;
            };
            wednesdaySchedule: {
                Shape: import(".prisma/client").Schedule | null;
                Name: "Schedule";
                Nullable: true;
            };
            thursdaySchedule: {
                Shape: import(".prisma/client").Schedule | null;
                Name: "Schedule";
                Nullable: true;
            };
            fridaySchedule: {
                Shape: import(".prisma/client").Schedule | null;
                Name: "Schedule";
                Nullable: true;
            };
            saturdaySchedule: {
                Shape: import(".prisma/client").Schedule | null;
                Name: "Schedule";
                Nullable: true;
            };
            sundaySchedule: {
                Shape: import(".prisma/client").Schedule | null;
                Name: "Schedule";
                Nullable: true;
            };
            holidaySchedule: {
                Shape: import(".prisma/client").Schedule | null;
                Name: "Schedule";
                Nullable: true;
            };
            units: {
                Shape: import(".prisma/client").Unit[];
                Name: "Unit";
                Nullable: false;
            };
            occupancies: {
                Shape: import(".prisma/client").Occupancy[];
                Name: "Occupancy";
                Nullable: false;
            };
            holidays: {
                Shape: import(".prisma/client").Holiday[];
                Name: "Holiday";
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
        mondayScheduleId: string | null;
        tuesdayScheduleId: string | null;
        wednesdayScheduleId: string | null;
        thursdayScheduleId: string | null;
        fridayScheduleId: string | null;
        saturdayScheduleId: string | null;
        sundayScheduleId: string | null;
        holidayScheduleId: string | null;
    }>;
    readonly ConfigurationFields: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "id" | "createdAt" | "updatedAt" | "message" | "stage" | "correlation" | "label" | "setpointId" | "mondayScheduleId" | "tuesdayScheduleId" | "wednesdayScheduleId" | "thursdayScheduleId" | "fridayScheduleId" | "saturdayScheduleId" | "sundayScheduleId" | "holidayScheduleId", "id" | "createdAt" | "updatedAt" | "message" | "stage" | "correlation" | "label" | "setpointId" | "mondayScheduleId" | "tuesdayScheduleId" | "wednesdayScheduleId" | "thursdayScheduleId" | "fridayScheduleId" | "saturdayScheduleId" | "sundayScheduleId" | "holidayScheduleId">;
    constructor(builder: SchemaBuilderService);
}
