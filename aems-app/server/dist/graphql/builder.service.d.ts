import { AuthRoles } from "@/auth";
import { Mode, Mutation } from "@local/common";
import SchemaBuilder from "@pothos/core";
import { Context, Scalars, Aggregate } from ".";
import { OnModuleInit } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { GraphQLSchema } from "graphql";
import { AppConfigService } from "@/app.config";
import PrismaTypes from "@local/prisma/dist/pothos";
import { JsonValue } from "@prisma/client/runtime/library";
import { SubscriptionService } from "@/subscription/subscription.service";
export declare class SchemaBuilderService extends SchemaBuilder<{
    Context: Context;
    AuthScopes: AuthRoles;
    PrismaTypes: PrismaTypes;
    Scalars: Scalars;
}> implements OnModuleInit {
    private initialized;
    readonly DateTime: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: Context;
        AuthScopes: AuthRoles;
        PrismaTypes: PrismaTypes;
        Scalars: Scalars;
    }>, Date, Date, Date>;
    readonly Json: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: Context;
        AuthScopes: AuthRoles;
        PrismaTypes: PrismaTypes;
        Scalars: Scalars;
    }>, object, object, object>;
    readonly LogType: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: Context;
        AuthScopes: AuthRoles;
        PrismaTypes: PrismaTypes;
        Scalars: Scalars;
    }>, import(".prisma/client").$Enums.LogType, import(".prisma/client").$Enums.LogType>;
    readonly FeedbackStatus: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: Context;
        AuthScopes: AuthRoles;
        PrismaTypes: PrismaTypes;
        Scalars: Scalars;
    }>, import(".prisma/client").$Enums.FeedbackStatus, import(".prisma/client").$Enums.FeedbackStatus>;
    readonly Mode: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: Context;
        AuthScopes: AuthRoles;
        PrismaTypes: PrismaTypes;
        Scalars: Scalars;
    }>, Mode, Mode>;
    readonly Mutation: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: Context;
        AuthScopes: AuthRoles;
        PrismaTypes: PrismaTypes;
        Scalars: Scalars;
    }>, Mutation, Mutation>;
    readonly UserPreferences: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: Context;
        AuthScopes: AuthRoles;
        PrismaTypes: PrismaTypes;
        Scalars: Scalars;
    }>, Partial<import("@local/prisma").Preferences>, Partial<import("@local/prisma").Preferences>, Partial<import("@local/prisma").Preferences>>;
    readonly SessionData: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: Context;
        AuthScopes: AuthRoles;
        PrismaTypes: PrismaTypes;
        Scalars: Scalars;
    }>, session.SessionData, session.SessionData, session.SessionData>;
    readonly EventPayload: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: Context;
        AuthScopes: AuthRoles;
        PrismaTypes: PrismaTypes;
        Scalars: Scalars;
    }>, PrismaJson.EventPayload, PrismaJson.EventPayload, PrismaJson.EventPayload>;
    readonly GeographyGeoJson: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: Context;
        AuthScopes: AuthRoles;
        PrismaTypes: PrismaTypes;
        Scalars: Scalars;
    }>, PrismaJson.GeographyGeoJson, PrismaJson.GeographyGeoJson, PrismaJson.GeographyGeoJson>;
    readonly ChangeData: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: Context;
        AuthScopes: AuthRoles;
        PrismaTypes: PrismaTypes;
        Scalars: Scalars;
    }>, JsonValue, JsonValue, JsonValue>;
    readonly BooleanFilter: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: Context;
        AuthScopes: AuthRoles;
        PrismaTypes: PrismaTypes;
        Scalars: Scalars;
    }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<boolean>, "not" | "equals">>;
    readonly IntFilter: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: Context;
        AuthScopes: AuthRoles;
        PrismaTypes: PrismaTypes;
        Scalars: Scalars;
    }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<number>, "not" | "lt" | "gte" | "equals" | "in" | "lte" | "gt">>;
    readonly FloatFilter: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: Context;
        AuthScopes: AuthRoles;
        PrismaTypes: PrismaTypes;
        Scalars: Scalars;
    }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<number>, "not" | "lt" | "gte" | "equals" | "in" | "lte" | "gt">>;
    readonly StringFilter: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: Context;
        AuthScopes: AuthRoles;
        PrismaTypes: PrismaTypes;
        Scalars: Scalars;
    }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "equals" | "in" | "contains" | "mode">>;
    readonly DateTimeFilter: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: Context;
        AuthScopes: AuthRoles;
        PrismaTypes: PrismaTypes;
        Scalars: Scalars;
    }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<Date>, "not" | "lt" | "gte" | "equals" | "in" | "lte" | "gt" | "contains" | "mode">>;
    readonly LogTypeFilter: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: Context;
        AuthScopes: AuthRoles;
        PrismaTypes: PrismaTypes;
        Scalars: Scalars;
    }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<import(".prisma/client").$Enums.LogType>, "not" | "equals" | "in" | "mode">>;
    readonly FeedbackStatusFilter: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: Context;
        AuthScopes: AuthRoles;
        PrismaTypes: PrismaTypes;
        Scalars: Scalars;
    }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<import(".prisma/client").$Enums.FeedbackStatus>, "not" | "equals" | "in" | "mode">>;
    readonly PagingInput: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: Context;
        AuthScopes: AuthRoles;
        PrismaTypes: PrismaTypes;
        Scalars: Scalars;
    }>, {
        take: number;
        skip: number;
    }>;
    constructor(prismaService: PrismaService, configService: AppConfigService, subscriptionService: SubscriptionService);
    onModuleInit(): void;
    awaitSchema(): GraphQLSchema | Promise<GraphQLSchema>;
    static aggregateToGroupBy<T extends {
        _avg?: any;
        _count?: any;
        _max?: any;
        _min?: any;
        _sum?: any;
    }, F extends string>(aggregate?: Aggregate<F> | null): {};
}
