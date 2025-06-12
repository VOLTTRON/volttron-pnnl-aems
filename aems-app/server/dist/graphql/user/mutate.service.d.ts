import { SchemaBuilderService } from "../builder.service";
import { UserQuery } from "./query.service";
import { AccountQuery } from "../account/query.service";
import { AccountMutation } from "../account/mutate.service";
import { CommentQuery } from "../comment/query.service";
import { BannerQuery } from "../banner/query.service";
import { CommentMutation } from "../comment/mutate.service";
import { BannerMutation } from "../banner/mutate.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
export declare class UserMutation {
    readonly UserCreate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.UserCreateInput, {
        name: "String";
        email: "String";
        image: "String";
        role: "String";
        emailVerified: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, Date, Date, Date>;
        preferences: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, Partial<import("@local/prisma").Preferences>, Partial<import("@local/prisma").Preferences>, Partial<import("@local/prisma").Preferences>>;
        password: "String";
    }>>;
    readonly UserUpdate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.UserUpdateInput, {
        name: "String";
        email: "String";
        image: "String";
        role: "String";
        emailVerified: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, Date, Date, Date>;
        preferences: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, Partial<import("@local/prisma").Preferences>, Partial<import("@local/prisma").Preferences>, Partial<import("@local/prisma").Preferences>>;
        password: "String";
    }>>;
    readonly UserUpdateAccounts: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import(".prisma/client").Prisma.AccountUpdateManyWithoutUserNestedInput>;
    readonly UserUpdateComments: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import(".prisma/client").Prisma.CommentUpdateManyWithoutUserNestedInput>;
    readonly UserUpdateBanners: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import(".prisma/client").Prisma.BannerUpdateManyWithoutUsersNestedInput>;
    constructor(builder: SchemaBuilderService, prismaService: PrismaService, subscriptionService: SubscriptionService, userQuery: UserQuery, accountQuery: AccountQuery, commentQuery: CommentQuery, bannerQuery: BannerQuery, accountMutation: AccountMutation, commentMutation: CommentMutation, bannerMutation: BannerMutation);
}
