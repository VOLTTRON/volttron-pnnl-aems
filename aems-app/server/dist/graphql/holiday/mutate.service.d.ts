import { SchemaBuilderService } from "../builder.service";
import { HolidayQuery } from "./query.service";
import { HolidayObject } from "./object.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { ConfigurationQuery } from "../configuration/query.service";
export declare class HolidayMutation {
    readonly HolidayCreate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.HolidayCreateInput, {
        stage: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, "Create" | "Read" | "Update" | "Delete" | "Process" | "Complete" | "Fail", "Create" | "Read" | "Update" | "Delete" | "Process" | "Complete" | "Fail">;
        message: "String";
        correlation: "String";
        type: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, "Enabled" | "Disabled" | "Custom", "Enabled" | "Disabled" | "Custom">;
        label: "String";
        month: "Int";
        day: "Int";
        observance: "String";
        configurations: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, import(".prisma/client").Prisma.ConfigurationCreateNestedManyWithoutHolidaysInput>;
    }>>;
    readonly HolidayUpdate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.HolidayUpdateInput, {
        stage: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, "Create" | "Read" | "Update" | "Delete" | "Process" | "Complete" | "Fail", "Create" | "Read" | "Update" | "Delete" | "Process" | "Complete" | "Fail">;
        message: "String";
        correlation: "String";
        type: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, "Enabled" | "Disabled" | "Custom", "Enabled" | "Disabled" | "Custom">;
        label: "String";
        month: "Int";
        day: "Int";
        observance: "String";
        configurations: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, import(".prisma/client").Prisma.ConfigurationUpdateManyWithoutHolidaysNestedInput>;
    }>>;
    constructor(builder: SchemaBuilderService, prismaService: PrismaService, subscriptionService: SubscriptionService, holidayQuery: HolidayQuery, holidayObject: HolidayObject, configurationQuery: ConfigurationQuery);
}
