import { builder } from "../builder";
import { convertToJsonObject, prisma, recordChange } from "@/prisma";
import { FileWhereUnique } from "../file/query";
import { FeedbackWhereUnique } from "./query";
import { Mutation } from "../types";

const FeedbackCreateFiles = builder.prismaUpdateRelation("Feedback", "files", {
  fields: {
    connect: FileWhereUnique,
  },
});

export const FeedbackCreate = builder.prismaCreate("Feedback", {
  fields: {
    message: "String",
    files: FeedbackCreateFiles,
  },
});

export const FeedbackUpdate = builder.prismaUpdate("Feedback", {
  fields: {
    status: "FeedbackStatusType",
    assigneeId: "String",
  },
});

builder.mutationField("updateFeedback", (t) =>
  t.prismaField({
    description: "Update the specified feedback status.",
    authScopes: { admin: true },
    type: "Feedback",
    args: {
      where: t.arg({ type: FeedbackWhereUnique, required: true }),
      update: t.arg({ type: FeedbackUpdate, required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      return prisma.feedback
        .update({
          ...query,
          where: args.where,
          data: args.update,
        })
        .then((response) => {
          recordChange("Update", "Feedback", response.id, ctx.authUser, convertToJsonObject(response));
          ctx.pubsub.publish("Feedback", {
            topic: "Feedback",
            id: response.id,
            mutation: Mutation.Updated,
          });
          ctx.pubsub.publish(`Feedback/${response.id}`, {
            topic: "Feedback",
            id: response.id,
            mutation: Mutation.Updated,
          });
          return response;
        });
    },
  })
);

builder.mutationField("createFeedback", (t) =>
  t.prismaField({
    description: "Create new feedback.",
    authScopes: { user: true },
    type: "Feedback",
    args: {
      create: t.arg({ type: FeedbackCreate }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      if (typeof ctx.authUser.id !== "string") {
        throw new Error("No user logged in");
      }
      if (!args.create) {
        throw new Error("Feedback message required");
      }

      return prisma.feedback
        .create({
          ...query,
          data: {
            userId: ctx.authUser.id,
            message: args.create.message,
            files: args.create.files,
          },
        })
        .then((response) => {
          recordChange("Create", "Feedback", response.id, ctx.authUser, convertToJsonObject(response));
          ctx.pubsub.publish("Feedback", {
            topic: "Feedback",
            id: response.id,
            mutation: Mutation.Created,
          });
          ctx.pubsub.publish(`Feedback/${response.id}`, {
            topic: "Feedback",
            id: response.id,
            mutation: Mutation.Created,
          });
          return response;
        });
    },
  })
);
