import { AuthRoles } from "@/auth";
import { Mode, Mutation } from "@local/common";
import SchemaBuilder from "@pothos/core";
import { Context, Scalars, Aggregate } from ".";
import { OnModuleInit } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { GraphQLSchema } from "graphql";
import { AppConfigService } from "@/app.config";
import PrismaTypes from "@local/prisma/dist/pothos";
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
    readonly PagingInput: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: Context;
        AuthScopes: AuthRoles;
        PrismaTypes: PrismaTypes;
        Scalars: Scalars;
    }>, {
        take: number;
        skip: number;
    }>;
    readonly ModelStage: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: Context;
        AuthScopes: AuthRoles;
        PrismaTypes: PrismaTypes;
        Scalars: Scalars;
    }>, "Create" | "Read" | "Update" | "Delete" | "Process" | "Complete" | "Fail", "Create" | "Read" | "Update" | "Delete" | "Process" | "Complete" | "Fail">;
    constructor(prismaService: PrismaService, configService: AppConfigService, subscriptionService: SubscriptionService);
    onModuleInit(): void;
    awaitSchema(): Promise<GraphQLSchema>;
    static aggregateToGroupBy<T extends {
        _avg?: any;
        _count?: any;
        _max?: any;
        _min?: any;
        _sum?: any;
    }, F extends string>(aggregate?: Aggregate<F> | null): {};
}
