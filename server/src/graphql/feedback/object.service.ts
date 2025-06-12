import { Prisma } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosObject } from "../pothos.decorator";

@Injectable()
@PothosObject()
export class FeedbackObject {
  readonly FeedbackObject;
  readonly FeedbackFields;

  constructor(builder: SchemaBuilderService) {
    this.FeedbackObject = builder.prismaObject("Feedback", {
      authScopes: { user: true },
      fields: (t) => ({
        // key
        id: t.exposeString("id", {}),
        // fields
        message: t.exposeString("message", {}),
        status: t.expose("status", { type: builder.FeedbackStatus }),
        assigneeId: t.exposeString("assigneeId"),
        // metadata
        createdAt: t.expose("createdAt", { type: builder.DateTime }),
        updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
        // foreign keys
        userId: t.exposeString("userId", {}),
        // direct relations
        user: t.relation("user", {}),
        assignee: t.relation("assignee", { authScopes: { admin: true } }),
        // indirect relations
        files: t.relation("files", { nullable: true }),
      }),
    });

    this.FeedbackFields = builder.enumType("FeedbackFields", {
      values: Object.values(Prisma.FeedbackScalarFieldEnum),
    });
  }
}
