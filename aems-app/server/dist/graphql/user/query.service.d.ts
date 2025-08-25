import { UserObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";
import { PrismaService } from "@/prisma/prisma.service";
import { Scalars } from "..";
export declare class UserQuery {
    readonly UserAggregate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, {
        count?: ("name" | "role" | "id" | "email" | "image" | "emailVerified" | "preferences" | "createdAt" | "updatedAt")[] | null | undefined;
        sum?: ("name" | "role" | "id" | "email" | "image" | "emailVerified" | "preferences" | "createdAt" | "updatedAt")[] | null | undefined;
        maximum?: ("name" | "role" | "id" | "email" | "image" | "emailVerified" | "preferences" | "createdAt" | "updatedAt")[] | null | undefined;
        minimum?: ("name" | "role" | "id" | "email" | "image" | "emailVerified" | "preferences" | "createdAt" | "updatedAt")[] | null | undefined;
        average?: ("name" | "role" | "id" | "email" | "image" | "emailVerified" | "preferences" | "createdAt" | "updatedAt")[] | null | undefined;
    }>;
    readonly UserWhereUnique: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import(".prisma/client").Prisma.UserWhereUniqueInput>;
    readonly UserWhere: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
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
    readonly UserOrderBy: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import(".prisma/client").Prisma.UserOrderByWithRelationInput>;
    constructor(builder: SchemaBuilderService, prismaService: PrismaService, userObject: UserObject);
}
