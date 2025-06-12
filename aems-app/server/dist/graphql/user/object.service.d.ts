import { Prisma } from "@prisma/client";
import { SchemaBuilderService } from "../builder.service";
export declare class UserObject {
    readonly UserObject: import("@pothos/plugin-prisma").PrismaObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma").PrismaModelTypes & {
        Name: "User";
        Shape: import(".prisma/client").User;
        Include: Prisma.UserInclude;
        Select: Prisma.UserSelect;
        OrderBy: Prisma.UserOrderByWithRelationInput;
        WhereUnique: Prisma.UserWhereUniqueInput;
        Where: Prisma.UserWhereInput;
        Create: Prisma.UserCreateInput;
        Update: Prisma.UserUpdateInput;
        RelationName: "accounts" | "comments" | "banners" | "feedbacks" | "assignedFeedbacks" | "files";
        ListRelations: "accounts" | "comments" | "banners" | "feedbacks" | "assignedFeedbacks" | "files";
        Relations: {
            accounts: {
                Shape: import(".prisma/client").Account[];
                Name: "Account";
                Nullable: false;
            };
            comments: {
                Shape: import(".prisma/client").Comment[];
                Name: "Comment";
                Nullable: false;
            };
            banners: {
                Shape: import(".prisma/client").Banner[];
                Name: "Banner";
                Nullable: false;
            };
            feedbacks: {
                Shape: import(".prisma/client").Feedback[];
                Name: "Feedback";
                Nullable: false;
            };
            assignedFeedbacks: {
                Shape: import(".prisma/client").Feedback[];
                Name: "Feedback";
                Nullable: false;
            };
            files: {
                Shape: import(".prisma/client").File[];
                Name: "File";
                Nullable: false;
            };
        };
    }, {
        name: string | null;
        role: string | null;
        id: string;
        email: string;
        image: string | null;
        emailVerified: Date | null;
        password: string | null;
        preferences: PrismaJson.UserPreferences | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    readonly UserFields: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "name" | "role" | "id" | "email" | "image" | "emailVerified" | "preferences" | "createdAt" | "updatedAt", "name" | "role" | "id" | "email" | "image" | "emailVerified" | "preferences" | "createdAt" | "updatedAt">;
    constructor(builder: SchemaBuilderService);
}
