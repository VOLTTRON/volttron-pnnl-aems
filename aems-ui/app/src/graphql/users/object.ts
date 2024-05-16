import { builder } from "../builder";

export const UserObject = builder.prismaObject("User", {
  authScopes: { user: true },
  fields: (t) => ({
    // key
    id: t.exposeString("id", { authScopes: { user: true } }),
    // fields
    name: t.exposeString("name", { authScopes: { user: true } }),
    email: t.exposeString("email", { authScopes: { user: true } }),
    image: t.exposeString("image", { authScopes: { user: true }, nullable: true }),
    emailVerified: t.expose("emailVerified", { type: "DateTime", authScopes: { user: true }, nullable: true }),
    role: t.exposeString("role", { authScopes: { user: true }, nullable: true }),
    preferences: t.expose("preferences", { type: "JSON", authScopes: { user: true }, nullable: true }),
    // metadata
    createdAt: t.expose("createdAt", { type: "DateTime", authScopes: { user: true } }),
    updatedAt: t.expose("updatedAt", { type: "DateTime", authScopes: { user: true } }),
    // indirect relations
    comments: t.relation("comments", { authScopes: { user: true }, nullable: true }),
    accounts: t.relation("accounts", { authScopes: { user: true }, nullable: true }),
  }),
});
