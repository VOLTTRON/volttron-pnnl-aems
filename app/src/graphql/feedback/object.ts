import { Prisma } from "@prisma/client";
import { builder } from "../builder";

export const FeedbackObject = builder.prismaObject("Feedback", {
  authScopes: { user: true },
  fields: (t) => ({
    // key
    id: t.exposeString("id", {}),
    // fields
    message: t.exposeString("message", {}),
    status: t.expose("status", { type: "FeedbackStatusType" }),
    assigneeId: t.exposeString("assigneeId"),

    // metadata
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),

    // foreign keys
    userId: t.exposeString("userId", {}),

    // direct relations
    user: t.relation("user", {}),
    assignee: t.relation("assignee", { authScopes: { admin: true } }),

    // indirect relations
    files: t.relation("files", { nullable: true }),
  }),
});

export const FeedbackFields = builder.enumType("FeedbackFields", {
  values: Object.values(Prisma.FeedbackScalarFieldEnum),
});