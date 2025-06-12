import { SchemaBuilderService } from "../builder.service";
import { FileQuery } from "./query.service";
import { UserQuery } from "../user/query.service";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
export declare class FileMutation {
    readonly FileUpdateUser: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, Prisma.UserCreateNestedOneWithoutFilesInput>;
    readonly FileCreate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<Prisma.FileCreateInput, {
        objectKey: "String";
        mimeType: "String";
        contentLength: "Int";
        user: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, Prisma.UserCreateNestedOneWithoutFilesInput>;
    }>>;
    readonly FileUpdate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<Prisma.FileUpdateInput, {
        objectKey: "String";
        mimeType: "String";
        contentLength: "Int";
        user: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, Prisma.UserCreateNestedOneWithoutFilesInput>;
    }>>;
    constructor(builder: SchemaBuilderService, prismaService: PrismaService, subscriptionService: SubscriptionService, fileQuery: FileQuery, userQuery: UserQuery);
}
