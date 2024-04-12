import { builder } from "../builder";

export const CommentObject = builder.prismaObject("Comment", {
  authScopes: { user: true },
  fields: (t) => ({
    // key
    id: t.exposeInt("id", { authScopes: { user: true } }),
    // fields
    message: t.exposeString("message", { authScopes: { user: true } }),
    // metadata
    createdAt: t.expose("createdAt", { type: "DateTime", authScopes: { user: true } }),
    updatedAt: t.expose("updatedAt", { type: "DateTime", authScopes: { user: true } }),
    // foreign keys
    userId: t.exposeString("userId", { authScopes: { user: true }, nullable: true }),
    // direct relations
    user: t.relation("user", { authScopes: { user: true }, nullable: true }),
  }),
});
