import { Prisma } from "@prisma/client";
import { builder } from "../builder";

export const BannerObject = builder.prismaObject("Banner", {
  authScopes: { user: true },
  subscribe: (subscriptions, banner, _context, _info) => {
    subscriptions.register(`Banner/${banner.id}`);
  },
  fields: (t) => ({
    // key
    id: t.exposeString("id", {}),
    // fields
    message: t.exposeString("message", { nullable: true }),
    expiration: t.expose("expiration", { type: "DateTime", nullable: true }),
    // metadata
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    // indirect relations
    users: t.relation("users", { authScopes: { admin: true }, nullable: true }),
  }),
});

export const BannerFields = builder.enumType("BannerFields", {
  values: Object.values(Prisma.BannerScalarFieldEnum),
});
