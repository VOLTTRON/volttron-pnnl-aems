import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { FileQuery } from "../file/query.service";
import { Mutation } from "@local/common";
import { FeedbackQuery } from "./query.service";
import { PothosMutation } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";

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
    feedbackQuery: FeedbackQuery,
    fileQuery: FileQuery,
  ) {
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
        status: "FeedbackStatus",
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
