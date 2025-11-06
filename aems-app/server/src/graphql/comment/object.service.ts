import { Prisma } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosObject } from "../pothos.decorator";

@Injectable()
@PothosObject()
export class CommentObject {
  readonly CommentObject;
  readonly CommentFields;

  constructor(builder: SchemaBuilderService) {
    this.CommentObject = builder.prismaObject("Comment", {
      authScopes: { user: true },
      subscribe: (subscriptions, comment, _context, _info) => {
        subscriptions.register(`Comment/${comment.id}`);
      },
      fields: (t) => ({
        // key
        id: t.exposeString("id"),
        // fields
        message: t.exposeString("message"),
        // metadata
        createdAt: t.expose("createdAt", { type: builder.DateTime }),
        updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
        // foreign keys
        userId: t.exposeString("userId", { nullable: true }),
        // direct relations
        user: t.relation("user", { nullable: true }),
      }),
    });

    this.CommentFields = builder.enumType("CommentFields", {
      values: Object.values(Prisma.CommentScalarFieldEnum),
    });
  }
}
