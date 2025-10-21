import { SchemaBuilderService } from "../builder.service";
import { Prisma } from "@prisma/client";
export declare class FileObject {
    readonly FileObject: import("@pothos/plugin-prisma").PrismaObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma").PrismaModelTypes & {
        Name: "File";
        Shape: import(".prisma/client").File;
        Include: Prisma.FileInclude;
        Select: Prisma.FileSelect;
        OrderBy: Prisma.FileOrderByWithRelationInput;
        WhereUnique: Prisma.FileWhereUniqueInput;
        Where: Prisma.FileWhereInput;
        Create: Prisma.FileCreateInput;
        Update: Prisma.FileUpdateInput;
        RelationName: "user" | "feedback";
        ListRelations: never;
        Relations: {
            user: {
                Shape: import(".prisma/client").User | null;
                Name: "User";
                Nullable: true;
            };
            feedback: {
                Shape: import(".prisma/client").Feedback | null;
                Name: "Feedback";
                Nullable: true;
            };
        };
    }, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        mimeType: string;
        contentLength: number;
        objectKey: string;
        feedbackId: string | null;
    }>;
    readonly FileFields: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "id" | "createdAt" | "updatedAt" | "userId" | "mimeType" | "contentLength" | "objectKey" | "feedbackId", "id" | "createdAt" | "updatedAt" | "userId" | "mimeType" | "contentLength" | "objectKey" | "feedbackId">;
    constructor(builder: SchemaBuilderService);
}
