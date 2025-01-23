import { Prisma } from "@prisma/client";
import { builder } from "../builder";

export const LogObject = builder.prismaObject("Log", {
  authScopes: { admin: true },
  subscribe: (subscriptions, log, _context, _info) => {
    subscriptions.register(`Log/${log.id}`);
  },
  fields: (t) => ({
    // key
    id: t.exposeString("id"),
    // fields
    type: t.expose("type", { type: "LogType", nullable: true }),
    message: t.exposeString("message", { nullable: true }),
    // metadata
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

export const LogFields = builder.enumType("LogFields", {
  values: Object.values(Prisma.LogScalarFieldEnum),
});
