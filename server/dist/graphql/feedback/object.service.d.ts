import { Prisma } from "@prisma/client";
import { SchemaBuilderService } from "../builder.service";
export declare class FeedbackObject {
    readonly FeedbackObject: import("@pothos/plugin-prisma").PrismaObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma").PrismaModelTypes & {
        Name: "Feedback";
        Shape: import(".prisma/client").Feedback;
        Include: Prisma.FeedbackInclude;
        Select: Prisma.FeedbackSelect;
        OrderBy: Prisma.FeedbackOrderByWithRelationInput;
        WhereUnique: Prisma.FeedbackWhereUniqueInput;
        Where: Prisma.FeedbackWhereInput;
        Create: Prisma.FeedbackCreateInput;
        Update: Prisma.FeedbackUpdateInput;
        RelationName: "user" | "assignee" | "files";
        ListRelations: "files";
        Relations: {
            user: {
                Shape: import(".prisma/client").User;
                Name: "User";
                Nullable: false;
            };
            assignee: {
                Shape: import(".prisma/client").User | null;
                Name: "User";
                Nullable: true;
            };
            files: {
                Shape: import(".prisma/client").File[];
                Name: "File";
                Nullable: false;
            };
        };
    }, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        message: string;
        status: import(".prisma/client").$Enums.FeedbackStatus;
        assigneeId: string | null;
    }>;
    readonly FeedbackFields: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "id" | "createdAt" | "updatedAt" | "userId" | "message" | "status" | "assigneeId", "id" | "createdAt" | "updatedAt" | "userId" | "message" | "status" | "assigneeId">;
    constructor(builder: SchemaBuilderService);
}
