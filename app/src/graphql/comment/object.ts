import { Prisma } from "@prisma/client";
import { builder } from "../builder";

export const CommentObject = builder.prismaObject("Comment", {
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
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    // foreign keys
    userId: t.exposeString("userId", { nullable: true }),
    // direct relations
    user: t.relation("user", { nullable: true }),
  }),
});

export const CommentFields = builder.enumType("CommentFields", {
  values: Object.values(Prisma.CommentScalarFieldEnum),
});
