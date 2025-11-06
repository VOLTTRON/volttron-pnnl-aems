import { ChangeObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";
import { PrismaService } from "@/prisma/prisma.service";
import { Scalars } from "..";
import { UserQuery } from "../user/query.service";
export declare class ChangeQuery {
    readonly ChangeAggregate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, {
        count?: ("key" | "id" | "createdAt" | "updatedAt" | "userId" | "data" | "table" | "mutation")[] | null | undefined;
        sum?: ("key" | "id" | "createdAt" | "updatedAt" | "userId" | "data" | "table" | "mutation")[] | null | undefined;
        maximum?: ("key" | "id" | "createdAt" | "updatedAt" | "userId" | "data" | "table" | "mutation")[] | null | undefined;
        minimum?: ("key" | "id" | "createdAt" | "updatedAt" | "userId" | "data" | "table" | "mutation")[] | null | undefined;
        average?: ("key" | "id" | "createdAt" | "updatedAt" | "userId" | "data" | "table" | "mutation")[] | null | undefined;
    }>;
    readonly ChangeWhereUnique: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import(".prisma/client").Prisma.ChangeWhereUniqueInput>;
    readonly ChangeWhere: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.ChangeWhereInput, {
        OR: true;
        AND: true;
        NOT: true;
        id: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "equals" | "in" | "contains" | "mode">>;
        table: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "equals" | "in" | "contains" | "mode">>;
        key: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "equals" | "in" | "contains" | "mode">>;
        mutation: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, "Create" | "Update" | "Delete" | "Upsert", "Create" | "Update" | "Delete" | "Upsert">;
        userId: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
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
        user: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.UserWhereInput, {
            OR: true;
            AND: true;
            NOT: true;
            id: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
                Context: import("..").Context;
                AuthScopes: import("../../auth").AuthRoles;
                PrismaTypes: import("@local/prisma/dist/pothos").default;
                Scalars: Scalars;
            }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "equals" | "in" | "contains" | "mode">>;
            name: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
                Context: import("..").Context;
                AuthScopes: import("../../auth").AuthRoles;
                PrismaTypes: import("@local/prisma/dist/pothos").default;
                Scalars: Scalars;
            }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "equals" | "in" | "contains" | "mode">>;
            email: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
                Context: import("..").Context;
                AuthScopes: import("../../auth").AuthRoles;
                PrismaTypes: import("@local/prisma/dist/pothos").default;
                Scalars: Scalars;
            }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "equals" | "in" | "contains" | "mode">>;
            image: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
                Context: import("..").Context;
                AuthScopes: import("../../auth").AuthRoles;
                PrismaTypes: import("@local/prisma/dist/pothos").default;
                Scalars: Scalars;
            }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "equals" | "in" | "contains" | "mode">>;
            role: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
                Context: import("..").Context;
                AuthScopes: import("../../auth").AuthRoles;
                PrismaTypes: import("@local/prisma/dist/pothos").default;
                Scalars: Scalars;
            }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "equals" | "in" | "contains" | "mode">>;
            emailVerified: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
                Context: import("..").Context;
                AuthScopes: import("../../auth").AuthRoles;
                PrismaTypes: import("@local/prisma/dist/pothos").default;
                Scalars: Scalars;
            }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<Date>, "not" | "lt" | "gte" | "equals" | "in" | "lte" | "gt" | "contains" | "mode">>;
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
    }>>;
    readonly ChangeOrderBy: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import(".prisma/client").Prisma.ChangeOrderByWithRelationInput>;
    constructor(builder: SchemaBuilderService, prismaService: PrismaService, changeObject: ChangeObject, userQuery: UserQuery);
}
