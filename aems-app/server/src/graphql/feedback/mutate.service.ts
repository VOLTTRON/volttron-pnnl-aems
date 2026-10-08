import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { FileQuery } from "../file/query.service";
import { Mutation } from "@local/common";
import { FeedbackQuery } from "./query.service";
import { PothosMutation } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { FeedbackObject } from "./object.service";

@Injectable()
@PothosMutation()
export class FeedbackMutation {
  readonly FeedbackCreateFiles;
  readonly FeedbackCreate;
  readonly FeedbackUpdate;

  constructor(
    builder: SchemaBuilderService,
    prismaService: PrismaService,
    subscriptionService: SubscriptionService,
    feedbackObject: FeedbackObject,
    feedbackQuery: FeedbackQuery,
    fileQuery: FileQuery,
  ) {
    const { FeedbackStatus } = feedbackObject;
    const { FeedbackWhereUnique } = feedbackQuery;
    const { FileWhereUnique } = fileQuery;

    this.FeedbackCreateFiles = builder.prismaUpdateRelation("Feedback", "files", {
      fields: {
        connect: FileWhereUnique,
      },
    });

    this.FeedbackCreate = builder.prismaCreate("Feedback", {
      fields: {
        message: "String",
        files: this.FeedbackCreateFiles,
      },
    });

    this.FeedbackUpdate = builder.prismaUpdate("Feedback", {
      fields: {
        status: FeedbackStatus,
        assigneeId: "String",
      },
    });

    const { FeedbackCreate, FeedbackUpdate } = this;

    builder.mutationField("createFeedback", (t) =>
      t.prismaField({
        description: "Create new feedback.",
        authScopes: { user: true },
        type: "Feedback",
        args: {
          create: t.arg({ type: FeedbackCreate }),
        },
        resolve: async (query, _root, args, ctx, _info) => {
          if (!ctx.user?.id) {
            throw new Error("No user logged in");
          }
          if (!args.create) {
            throw new Error("Feedback message required");
          }

          // A non-admin may only attach files they own. Verify each connected id
          // belongs to the caller — otherwise refuse the whole create.
          if (!ctx.user.authRoles.admin && args.create.files?.connect) {
            const connect = args.create.files.connect;
            const connects = Array.isArray(connect) ? connect : [connect];
            const ids = connects
              .map((w) => w?.id)
              .filter((id): id is string => Boolean(id));
            if (ids.length) {
              const ownedCount = await prismaService.prisma.file.count({
                where: { id: { in: ids }, userId: ctx.user.id },
              });
              if (ownedCount !== ids.length) {
                throw new Error("Cannot attach files that do not belong to you.");
              }
            }
          }

          return prismaService.prisma.feedback
            .create({
              ...query,
              data: {
                userId: ctx.user.id,
                message: args.create.message,
                files: args.create.files,
              },
            })
            .then(async (feedback) => {
              await subscriptionService.publish("Feedback", {
                topic: "Feedback",
                id: feedback.id,
                mutation: Mutation.Created,
              });
              return feedback;
            });
        },
      }),
    );

    builder.mutationField("updateFeedback", (t) =>
      t.prismaField({
        description: "Update the specified feedback status.",
        authScopes: { admin: true },
        type: "Feedback",
        args: {
          where: t.arg({ type: FeedbackWhereUnique, required: true }),
          update: t.arg({ type: FeedbackUpdate, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.feedback
            .update({
              ...query,
              where: args.where,
              data: args.update,
            })
            .then(async (feedback) => {
              await subscriptionService.publish("Feedback", {
                topic: "Feedback",
                id: feedback.id,
                mutation: Mutation.Updated,
              });
              await subscriptionService.publish(`Feedback/${feedback.id}`, {
                topic: "Feedback",
                id: feedback.id,
                mutation: Mutation.Updated,
              });
              return feedback;
            });
        },
      }),
    );

    builder.mutationField("deleteFeedback", (t) =>
      t.prismaField({
        description: "Delete the specified feedback.",
        authScopes: { admin: true },
        type: "Feedback",
        args: {
          where: t.arg({ type: FeedbackWhereUnique, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.feedback
            .delete({
              ...query,
              where: args.where,
            })
            .then(async (feedback) => {
              await subscriptionService.publish("Feedback", {
                topic: "Feedback",
                id: feedback.id,
                mutation: Mutation.Deleted,
              });
              await subscriptionService.publish(`Feedback/${feedback.id}`, {
                topic: "Feedback",
                id: feedback.id,
                mutation: Mutation.Deleted,
              });
              return feedback;
            });
        },
      }),
    );
  }
}
