import { Prisma } from "@prisma/client";
import { builder } from "../builder";

export const AccountObject = builder.prismaObject("Account", {
  authScopes: { user: true },
  subscribe: (subscriptions, account, _context, _info) => {
    subscriptions.register(`Account/${account.id}`);
  },
  fields: (t) => ({
    // key
    id: t.exposeString("id"),
    // fields
    type: t.exposeString("type"),
    provider: t.exposeString("provider"),
    providerAccountId: t.exposeString("providerAccountId"),
    refreshToken: t.exposeString("refreshToken", { authScopes: { admin: true }, nullable: true }),
    accessToken: t.exposeString("accessToken", { authScopes: { admin: true }, nullable: true }),
    expiresAt: t.exposeInt("expiresAt", { authScopes: { admin: true }, nullable: true }),
    tokenType: t.exposeString("tokenType", { authScopes: { admin: true }, nullable: true }),
    scope: t.exposeString("scope", { authScopes: { admin: true }, nullable: true }),
    idToken: t.exposeString("idToken", { authScopes: { admin: true }, nullable: true }),
    sessionState: t.exposeString("sessionState", { authScopes: { admin: true }, nullable: true }),
    // metadata
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    // foreign keys
    userId: t.exposeString("userId", { nullable: true }),
    // direct relations
    user: t.relation("user", { nullable: true }),
  }),
});

export const AccountFields = builder.enumType("AccountFields", {
  values: Object.values(Prisma.AccountScalarFieldEnum),
});
