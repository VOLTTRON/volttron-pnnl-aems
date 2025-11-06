import { Prisma } from "@prisma/client";
import { SchemaBuilderService } from "../builder.service";
export declare class HolidayObject {
    readonly HolidayObject: import("@pothos/plugin-prisma").PrismaObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma").PrismaModelTypes & {
        Name: "Holiday";
        Shape: import(".prisma/client").Holiday;
        Include: Prisma.HolidayInclude;
        Select: Prisma.HolidaySelect;
        OrderBy: Prisma.HolidayOrderByWithRelationInput;
        WhereUnique: Prisma.HolidayWhereUniqueInput;
        Where: Prisma.HolidayWhereInput;
        Create: Prisma.HolidayCreateInput;
        Update: Prisma.HolidayUpdateInput;
        RelationName: "configurations";
        ListRelations: "configurations";
        Relations: {
            configurations: {
                Shape: import(".prisma/client").Configuration[];
                Name: "Configuration";
                Nullable: false;
            };
        };
    }, {
        day: number | null;
        month: number | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.HolidayType;
        message: string | null;
        stage: import(".prisma/client").$Enums.ModelStage;
        correlation: string | null;
        label: string;
        observance: string | null;
    }>;
    readonly HolidayFields: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "day" | "month" | "id" | "createdAt" | "updatedAt" | "type" | "message" | "stage" | "correlation" | "label" | "observance", "day" | "month" | "id" | "createdAt" | "updatedAt" | "type" | "message" | "stage" | "correlation" | "label" | "observance">;
    readonly HolidayType: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "Enabled" | "Disabled" | "Custom", "Enabled" | "Disabled" | "Custom">;
    constructor(builder: SchemaBuilderService);
}
