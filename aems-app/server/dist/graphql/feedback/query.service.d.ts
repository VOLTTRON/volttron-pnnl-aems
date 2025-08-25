import { SchemaBuilderService } from "../builder.service";
import { FeedbackObject } from "./object.service";
import { UserQuery } from "../user/query.service";
import { PrismaService } from "@/prisma/prisma.service";
import { Scalars } from "..";
export declare class FeedbackQuery {
    readonly FeedbackStatusFilter: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<import(".prisma/client").$Enums.FeedbackStatus>, "equals" | "in" | "not" | "mode">>;
    readonly FeedbackWhereUnique: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import(".prisma/client").Prisma.FeedbackWhereUniqueInput>;
    readonly FeedbackWhere: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.FeedbackWhereInput, {
        OR: true;
        AND: true;
        NOT: true;
        id: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "equals" | "in" | "not" | "contains" | "startsWith" | "endsWith" | "mode">>;
        message: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "equals" | "in" | "not" | "contains" | "startsWith" | "endsWith" | "mode">>;
        status: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<import(".prisma/client").$Enums.FeedbackStatus>, "equals" | "in" | "not" | "mode">>;
        createdAt: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<Date>, "equals" | "in" | "lt" | "lte" | "gt" | "gte" | "not" | "contains" | "mode">>;
        updatedAt: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<Date>, "equals" | "in" | "lt" | "lte" | "gt" | "gte" | "not" | "contains" | "mode">>;
        userId: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "equals" | "in" | "not" | "contains" | "startsWith" | "endsWith" | "mode">>;
        user: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, import(".prisma/client").Prisma.UserWhereUniqueInput>;
    }>>;
    readonly FeedbackOrderBy: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import(".prisma/client").Prisma.FeedbackOrderByWithRelationInput>;
    readonly FeedbackAggregate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, {
        average?: ("id" | "createdAt" | "updatedAt" | "userId" | "message" | "status" | "assigneeId")[] | null | undefined;
        count?: ("id" | "createdAt" | "updatedAt" | "userId" | "message" | "status" | "assigneeId")[] | null | undefined;
        maximum?: ("id" | "createdAt" | "updatedAt" | "userId" | "message" | "status" | "assigneeId")[] | null | undefined;
        minimum?: ("id" | "createdAt" | "updatedAt" | "userId" | "message" | "status" | "assigneeId")[] | null | undefined;
        sum?: ("id" | "createdAt" | "updatedAt" | "userId" | "message" | "status" | "assigneeId")[] | null | undefined;
    }>;
    constructor(builder: SchemaBuilderService, prismaService: PrismaService, feedbackObject: FeedbackObject, userQuery: UserQuery);
}
