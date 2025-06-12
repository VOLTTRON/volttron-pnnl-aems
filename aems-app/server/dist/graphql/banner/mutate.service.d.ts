import { SchemaBuilderService } from "../builder.service";
import { UserQuery } from "../user/query.service";
import { BannerQuery } from "./query.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
export declare class BannerMutation {
    readonly BannerCreate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.BannerCreateInput, {
        message: "String";
        expiration: "DateTime";
    }>>;
    readonly BannerUpdateUsers: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import(".prisma/client").Prisma.UserUpdateManyWithoutBannersNestedInput>;
    readonly BannerUpdate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.BannerUpdateInput, {
        message: "String";
        expiration: "DateTime";
        users: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, import(".prisma/client").Prisma.UserUpdateManyWithoutBannersNestedInput>;
    }>>;
    constructor(builder: SchemaBuilderService, prismaService: PrismaService, subscriptionService: SubscriptionService, bannerQuery: BannerQuery, userQuery: UserQuery);
}
