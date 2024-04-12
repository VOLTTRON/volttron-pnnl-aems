import { builder } from "../builder";

export const AccountObject = builder.prismaObject("Account", {
  authScopes: { user: true },
  fields: (t) => ({
    // key
    id: t.exposeString("id", { authScopes: { user: true } }),
    // fields
    type: t.exposeString("type", { authScopes: { user: true } }),
    provider: t.exposeString("provider", { authScopes: { user: true } }),
    providerAccountId: t.exposeString("providerAccountId", { authScopes: { user: true } }),
    refreshToken: t.exposeString("refreshToken", { authScopes: { admin: true }, nullable: true }),
    accessToken: t.exposeString("accessToken", { authScopes: { admin: true }, nullable: true }),
    expiresAt: t.exposeInt("expiresAt", { authScopes: { admin: true }, nullable: true }),
    tokenType: t.exposeString("tokenType", { authScopes: { admin: true }, nullable: true }),
    scope: t.exposeString("scope", { authScopes: { admin: true }, nullable: true }),
    idToken: t.exposeString("idToken", { authScopes: { admin: true }, nullable: true }),
    sessionState: t.exposeString("sessionState", { authScopes: { admin: true }, nullable: true }),
    // metadata
    createdAt: t.expose("createdAt", { type: "DateTime", authScopes: { user: true } }),
    updatedAt: t.expose("updatedAt", { type: "DateTime", authScopes: { user: true } }),
    // foreign keys
    userId: t.exposeString("userId", { authScopes: { user: true }, nullable: true }),
    // direct relations
    user: t.relation("user", { authScopes: { user: true }, nullable: true }),
  }),
});
