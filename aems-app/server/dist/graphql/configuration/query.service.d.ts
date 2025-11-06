import { ConfigurationObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";
import { PrismaService } from "@/prisma/prisma.service";
import { Scalars } from "..";
export declare class ConfigurationQuery {
    readonly ConfigurationAggregate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, {
        count?: ("id" | "createdAt" | "updatedAt" | "message" | "stage" | "correlation" | "label" | "setpointId" | "mondayScheduleId" | "tuesdayScheduleId" | "wednesdayScheduleId" | "thursdayScheduleId" | "fridayScheduleId" | "saturdayScheduleId" | "sundayScheduleId" | "holidayScheduleId")[] | null | undefined;
        sum?: ("id" | "createdAt" | "updatedAt" | "message" | "stage" | "correlation" | "label" | "setpointId" | "mondayScheduleId" | "tuesdayScheduleId" | "wednesdayScheduleId" | "thursdayScheduleId" | "fridayScheduleId" | "saturdayScheduleId" | "sundayScheduleId" | "holidayScheduleId")[] | null | undefined;
        maximum?: ("id" | "createdAt" | "updatedAt" | "message" | "stage" | "correlation" | "label" | "setpointId" | "mondayScheduleId" | "tuesdayScheduleId" | "wednesdayScheduleId" | "thursdayScheduleId" | "fridayScheduleId" | "saturdayScheduleId" | "sundayScheduleId" | "holidayScheduleId")[] | null | undefined;
        minimum?: ("id" | "createdAt" | "updatedAt" | "message" | "stage" | "correlation" | "label" | "setpointId" | "mondayScheduleId" | "tuesdayScheduleId" | "wednesdayScheduleId" | "thursdayScheduleId" | "fridayScheduleId" | "saturdayScheduleId" | "sundayScheduleId" | "holidayScheduleId")[] | null | undefined;
        average?: ("id" | "createdAt" | "updatedAt" | "message" | "stage" | "correlation" | "label" | "setpointId" | "mondayScheduleId" | "tuesdayScheduleId" | "wednesdayScheduleId" | "thursdayScheduleId" | "fridayScheduleId" | "saturdayScheduleId" | "sundayScheduleId" | "holidayScheduleId")[] | null | undefined;
    }>;
    readonly ConfigurationWhereUnique: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import(".prisma/client").Prisma.ConfigurationWhereUniqueInput>;
    readonly ConfigurationWhere: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.ConfigurationWhereInput, {
        OR: true;
        AND: true;
        NOT: true;
        id: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "equals" | "in" | "contains" | "mode">>;
        stage: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, "Create" | "Read" | "Update" | "Delete" | "Process" | "Complete" | "Fail", "Create" | "Read" | "Update" | "Delete" | "Process" | "Complete" | "Fail">;
        message: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "equals" | "in" | "contains" | "mode">>;
        correlation: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "equals" | "in" | "contains" | "mode">>;
        label: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "equals" | "in" | "contains" | "mode">>;
        setpointId: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "equals" | "in" | "contains" | "mode">>;
        mondayScheduleId: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "equals" | "in" | "contains" | "mode">>;
        tuesdayScheduleId: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "equals" | "in" | "contains" | "mode">>;
        wednesdayScheduleId: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "equals" | "in" | "contains" | "mode">>;
        thursdayScheduleId: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "equals" | "in" | "contains" | "mode">>;
        fridayScheduleId: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "equals" | "in" | "contains" | "mode">>;
        saturdayScheduleId: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "equals" | "in" | "contains" | "mode">>;
        sundayScheduleId: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "equals" | "in" | "contains" | "mode">>;
        holidayScheduleId: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "equals" | "in" | "contains" | "mode">>;
        createdAt: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<Date>, "not" | "lt" | "gte" | "equals" | "in" | "lte" | "gt" | "contains" | "mode">>;
        updatedAt: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<Date>, "not" | "lt" | "gte" | "equals" | "in" | "lte" | "gt" | "contains" | "mode">>;
    }>>;
    readonly ConfigurationOrderBy: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import(".prisma/client").Prisma.ConfigurationOrderByWithRelationInput>;
    constructor(builder: SchemaBuilderService, prismaService: PrismaService, configurationObject: ConfigurationObject);
}
