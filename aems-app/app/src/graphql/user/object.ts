import { Prisma } from "@prisma/client";
import { builder } from "../builder";
import { omit } from "lodash";

export const UserObject = builder.prismaObject("User", {
  authScopes: { user: true },
  subscribe(subscriptions, parent, _context, _info) {
    subscriptions.register(`User/${parent.id}`);
  },
  fields: (t) => ({
    // key
    id: t.exposeString("id"),
    // fields
    name: t.exposeString("name", { nullable: true }),
    email: t.exposeString("email"),
    image: t.exposeString("image", { nullable: true }),
    emailVerified: t.expose("emailVerified", { type: "DateTime", nullable: true }),
    role: t.exposeString("role", { nullable: true }),
    // password field is intentionally omitted
    preferences: t.expose("preferences", { type: "Preferences", nullable: true }),
    // metadata
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    // indirect relations
    comments: t.relation("comments", { nullable: true }),
    accounts: t.relation("accounts", { nullable: true }),
    banners: t.relation("banners", { nullable: true }),
  }),
});

export const UserFields = builder.enumType("UserFields", {
  values: Object.values(omit(Prisma.UserScalarFieldEnum, "password")),
});
