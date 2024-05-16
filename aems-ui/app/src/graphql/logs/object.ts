import { builder } from "../builder";

export const LogObject = builder.prismaObject("Log", {
  authScopes: { user: true },
  fields: (t) => ({
    // key
    id: t.exposeString("id", { authScopes: { user: true } }),
    // fields
    type: t.expose("type", { type: "LogType", authScopes: { user: true }, nullable: true }),
    message: t.exposeString("message", { authScopes: { user: true }, nullable: true }),
    expiration: t.expose("expiration", { type: "DateTime", authScopes: { user: true }, nullable: true }),
    // metadata
    createdAt: t.expose("createdAt", { type: "DateTime", authScopes: { user: true } }),
    updatedAt: t.expose("updatedAt", { type: "DateTime", authScopes: { user: true } }),
  }),
});
