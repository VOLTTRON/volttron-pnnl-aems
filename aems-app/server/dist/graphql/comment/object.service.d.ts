import { Prisma } from "@prisma/client";
import { SchemaBuilderService } from "../builder.service";
export declare class CommentObject {
    readonly CommentObject: import("@pothos/plugin-prisma").PrismaObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma").PrismaModelTypes & {
        Name: "Comment";
        Shape: import(".prisma/client").Comment;
        Include: Prisma.CommentInclude;
        Select: Prisma.CommentSelect;
        OrderBy: Prisma.CommentOrderByWithRelationInput;
        WhereUnique: Prisma.CommentWhereUniqueInput;
        Where: Prisma.CommentWhereInput;
        Create: Prisma.CommentCreateInput;
        Update: Prisma.CommentUpdateInput;
        RelationName: "user";
        ListRelations: never;
        Relations: {
            user: {
                Shape: import(".prisma/client").User | null;
                Name: "User";
                Nullable: true;
            };
        };
    }, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        message: string;
    }>;
    readonly CommentFields: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "id" | "createdAt" | "updatedAt" | "userId" | "message", "id" | "createdAt" | "updatedAt" | "userId" | "message">;
    constructor(builder: SchemaBuilderService);
}
