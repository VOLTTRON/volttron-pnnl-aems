import { Prisma } from "@prisma/client";
import { SchemaBuilderService } from "../builder.service";
export declare class AccountObject {
    readonly AccountObject: import("@pothos/plugin-prisma").PrismaObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma").PrismaModelTypes & {
        Name: "Account";
        Shape: import(".prisma/client").Account;
        Include: Prisma.AccountInclude;
        Select: Prisma.AccountSelect;
        OrderBy: Prisma.AccountOrderByWithRelationInput;
        WhereUnique: Prisma.AccountWhereUniqueInput;
        Where: Prisma.AccountWhereInput;
        Create: Prisma.AccountCreateInput;
        Update: Prisma.AccountUpdateInput;
        RelationName: "user";
        ListRelations: never;
        Relations: {
            user: {
                Shape: import(".prisma/client").User;
                Name: "User";
                Nullable: false;
            };
        };
    }, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        provider: string;
        providerAccountId: string;
        refreshToken: string | null;
        accessToken: string | null;
        expiresAt: number | null;
        tokenType: string | null;
        scope: string | null;
        idToken: string | null;
        sessionState: string | null;
        userId: string;
    }>;
    readonly AccountFields: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "id" | "createdAt" | "updatedAt" | "type" | "provider" | "providerAccountId" | "refreshToken" | "accessToken" | "expiresAt" | "tokenType" | "scope" | "idToken" | "sessionState" | "userId", "id" | "createdAt" | "updatedAt" | "type" | "provider" | "providerAccountId" | "refreshToken" | "accessToken" | "expiresAt" | "tokenType" | "scope" | "idToken" | "sessionState" | "userId">;
    constructor(builder: SchemaBuilderService);
}
