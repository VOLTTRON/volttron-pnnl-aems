import { Prisma } from "@prisma/client";
import { SchemaBuilderService } from "../builder.service";
import { Scalars } from "..";
export declare class UserObject {
    readonly UserPreferences: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, Partial<import("@local/prisma").Preferences>, Partial<import("@local/prisma").Preferences>, Partial<import("@local/prisma").Preferences>>;
    readonly UserObject: import("@pothos/plugin-prisma").PrismaObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
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
        RelationName: "accounts" | "verificationTokens" | "sessions" | "comments" | "banners" | "feedbacks" | "assignedFeedbacks" | "files" | "units" | "changes";
        ListRelations: "accounts" | "verificationTokens" | "sessions" | "comments" | "banners" | "feedbacks" | "assignedFeedbacks" | "files" | "units" | "changes";
        Relations: {
            accounts: {
                Shape: import(".prisma/client").Account[];
                Name: "Account";
                Nullable: false;
            };
            verificationTokens: {
                Shape: import(".prisma/client").VerificationToken[];
                Name: "VerificationToken";
                Nullable: false;
            };
            sessions: {
                Shape: import(".prisma/client").Session[];
                Name: "Session";
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
            units: {
                Shape: import(".prisma/client").Unit[];
                Name: "Unit";
                Nullable: false;
            };
            changes: {
                Shape: import(".prisma/client").Change[];
                Name: "Change";
                Nullable: false;
            };
        };
    }, {
        name: string | null;
        email: string;
        image: string | null;
        role: string | null;
        emailVerified: Date | null;
        preferences: PrismaJson.UserPreferences | null;
        password: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    readonly UserFields: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, "name" | "email" | "image" | "role" | "emailVerified" | "preferences" | "id" | "createdAt" | "updatedAt", "name" | "email" | "image" | "role" | "emailVerified" | "preferences" | "id" | "createdAt" | "updatedAt">;
    constructor(builder: SchemaBuilderService);
}
