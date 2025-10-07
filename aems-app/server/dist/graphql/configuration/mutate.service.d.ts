import { SchemaBuilderService } from "../builder.service";
import { ConfigurationQuery } from "./query.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { SetpointMutation } from "../setpoint/mutate.service";
import { ScheduleMutation } from "../schedule/mutate.service";
import { OccupancyMutation } from "../occupancy/mutate.service";
import { OccupancyQuery } from "../occupancy/query.service";
import { HolidayMutation } from "../holiday/mutate.service";
import { HolidayQuery } from "../holiday/query.service";
export declare class ConfigurationMutation {
    readonly ConfigurationCreate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.ConfigurationCreateInput, {
        stage: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, "Create" | "Read" | "Update" | "Delete" | "Process" | "Complete" | "Fail", "Create" | "Read" | "Update" | "Delete" | "Process" | "Complete" | "Fail">;
        message: "String";
        correlation: "String";
        label: "String";
        setpointId: "String";
        mondayScheduleId: "String";
        tuesdayScheduleId: "String";
        wednesdayScheduleId: "String";
        thursdayScheduleId: "String";
        fridayScheduleId: "String";
        saturdayScheduleId: "String";
        sundayScheduleId: "String";
        holidayScheduleId: "String";
        occupancies: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, import(".prisma/client").Prisma.OccupancyCreateNestedManyWithoutConfigurationInput>;
        holidays: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, import(".prisma/client").Prisma.HolidayCreateNestedManyWithoutConfigurationsInput>;
    }>>;
    readonly ConfigurationUpdate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.ConfigurationUpdateInput, {
        stage: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, "Create" | "Read" | "Update" | "Delete" | "Process" | "Complete" | "Fail", "Create" | "Read" | "Update" | "Delete" | "Process" | "Complete" | "Fail">;
        message: "String";
        correlation: "String";
        label: "String";
        setpointId: "String";
        setpoint: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, import(".prisma/client").Prisma.SetpointUpdateOneWithoutConfigurationsNestedInput>;
        mondayScheduleId: "String";
        mondaySchedule: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, import(".prisma/client").Prisma.ScheduleUpdateOneWithoutMondayConfigurationsNestedInput>;
        tuesdayScheduleId: "String";
        tuesdaySchedule: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, import(".prisma/client").Prisma.ScheduleUpdateOneWithoutTuesdayConfigurationsNestedInput>;
        wednesdayScheduleId: "String";
        wednesdaySchedule: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, import(".prisma/client").Prisma.ScheduleUpdateOneWithoutWednesdayConfigurationsNestedInput>;
        thursdayScheduleId: "String";
        thursdaySchedule: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, import(".prisma/client").Prisma.ScheduleUpdateOneWithoutThursdayConfigurationsNestedInput>;
        fridayScheduleId: "String";
        fridaySchedule: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, import(".prisma/client").Prisma.ScheduleUpdateOneWithoutFridayConfigurationsNestedInput>;
        saturdayScheduleId: "String";
        saturdaySchedule: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, import(".prisma/client").Prisma.ScheduleUpdateOneWithoutSaturdayConfigurationsNestedInput>;
        sundayScheduleId: "String";
        sundaySchedule: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, import(".prisma/client").Prisma.ScheduleUpdateOneWithoutSundayConfigurationsNestedInput>;
        holidayScheduleId: "String";
        holidaySchedule: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, import(".prisma/client").Prisma.ScheduleUpdateOneWithoutHolidayConfigurationsNestedInput>;
        occupancies: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, import(".prisma/client").Prisma.OccupancyUpdateManyWithoutConfigurationNestedInput>;
        holidays: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, import(".prisma/client").Prisma.HolidayUpdateManyWithoutConfigurationsNestedInput>;
    }>>;
    constructor(builder: SchemaBuilderService, prismaService: PrismaService, subscriptionService: SubscriptionService, configurationQuery: ConfigurationQuery, setpointMutation: SetpointMutation, scheduleMutation: ScheduleMutation, occupancyQuery: OccupancyQuery, occupancyMutation: OccupancyMutation, holidayQuery: HolidayQuery, holidayMutation: HolidayMutation);
}
