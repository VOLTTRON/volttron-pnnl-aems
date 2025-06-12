import { Prisma } from "@prisma/client";
import { SchemaBuilderService } from "../builder.service";
export declare class BannerObject {
    readonly BannerObject: import("@pothos/plugin-prisma").PrismaObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma").PrismaModelTypes & {
        Name: "Banner";
        Shape: import(".prisma/client").Banner;
        Include: Prisma.BannerInclude;
        Select: Prisma.BannerSelect;
        OrderBy: Prisma.BannerOrderByWithRelationInput;
        WhereUnique: Prisma.BannerWhereUniqueInput;
        Where: Prisma.BannerWhereInput;
        Create: Prisma.BannerCreateInput;
        Update: Prisma.BannerUpdateInput;
        RelationName: "users";
        ListRelations: "users";
        Relations: {
            users: {
                Shape: import(".prisma/client").User[];
                Name: "User";
                Nullable: false;
            };
        };
    }, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        expiration: Date | null;
    }>;
    readonly BannerFields: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "id" | "createdAt" | "updatedAt" | "message" | "expiration", "id" | "createdAt" | "updatedAt" | "message" | "expiration">;
    constructor(builder: SchemaBuilderService);
}
