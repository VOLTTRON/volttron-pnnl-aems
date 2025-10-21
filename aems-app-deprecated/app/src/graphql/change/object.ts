import { Prisma } from "@prisma/client";
import { builder } from "../builder";

export const ChangeObject = builder.prismaObject("Change", {
  authScopes: { admin: true },
  subscribe: (subscriptions, change, _context, _info) => {
    subscriptions.register(`Change/${change.id}`);
  },
  fields: (t) => ({
    // key
    id: t.exposeString("id"),
    // fields
    table: t.exposeString("table"),
    key: t.exposeString("key"),
    mutation: t.expose("mutation", { type: "MutationType" }),
    data: t.expose("data", { type: "JSON", nullable: true }),
    // metadata
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    // foreign keys
    userId: t.exposeString("userId", { nullable: true }),
    // direct relations
    user: t.relation("user", { nullable: true }),
  }),
});

export const ChangeFields = builder.enumType("ChangeFields", {
  values: Object.values(Prisma.ChangeScalarFieldEnum),
});
