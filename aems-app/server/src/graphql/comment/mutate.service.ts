import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { CommentQuery } from "./query.service";
import { UserQuery } from "../user/query.service";
import { Mutation } from "@local/common";
import { PothosMutation } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";

@Injectable()
@PothosMutation()
export class CommentMutation {
  readonly CommentCreateUser;
  readonly CommentCreate;
  readonly CommentUpdateUser;
  readonly CommentUpdate;

  constructor(
    builder: SchemaBuilderService,
    prismaService: PrismaService,
    subscriptionService: SubscriptionService,
    commentQuery: CommentQuery,
    userQuery: UserQuery,
  ) {
    const { CommentWhereUnique } = commentQuery;
    const { UserWhereUnique } = userQuery;

    this.CommentCreateUser = builder.prismaCreateRelation("Comment", "user", {
      fields: {
        connect: UserWhereUnique,
      },
    });

    this.CommentCreate = builder.prismaCreate("Comment", {
      fields: {
        message: "String",
        user: this.CommentCreateUser,
      },
    });

    this.CommentUpdateUser = builder.prismaUpdateRelation("Comment", "user", {
      fields: {
        connect: UserWhereUnique,
        disconnect: "Boolean",
      },
    });

    this.CommentUpdate = builder.prismaUpdate("Comment", {
      fields: {
        message: "String",
        user: this.CommentUpdateUser,
      },
    });

    const { CommentCreate, CommentUpdate } = this;

    builder.mutationField("createComment", (t) =>
      t.prismaField({
        description: "Create a new comment.",
        authScopes: { user: true },
        type: "Comment",
        args: {
          create: t.arg({ type: CommentCreate, required: true }),
        },
        resolve: async (query, _root, args, ctx, _info) => {
          const create = args.create;
          if (!ctx.user?.authRoles.admin || !create.user) {
            delete create.user;
            create.user = { connect: { id: ctx.user?.id } };
          }
          return prismaService.prisma.comment
            .create({
              ...query,
              data: create,
            })
            .then(async (comment) => {
              await subscriptionService.publish("Comment", {
                topic: "Comment",
                id: comment.id,
                mutation: Mutation.Created,
              });
              return comment;
            });
        },
      }),
    );

    builder.mutationField("updateComment", (t) =>
      t.prismaField({
        description: "Update the specified comment.",
        authScopes: { user: true },
        type: "Comment",
        args: {
          where: t.arg({ type: CommentWhereUnique, required: true }),
          update: t.arg({ type: CommentUpdate, required: true }),
        },
        resolve: async (query, _root, args, ctx, _info) => {
          const where = args.where ?? {};
          if (!ctx.user?.authRoles.admin) {
            delete where.user;
            where.userId = ctx.user?.id;
          }
          return prismaService.prisma.comment
            .update({
              ...query,
              where: where,
              data: args.update,
            })
            .then(async (comment) => {
              await subscriptionService.publish("Comment", {
                topic: "Comment",
                id: comment.id,
                mutation: Mutation.Updated,
              });
              await subscriptionService.publish(`Comment/${comment.id}`, {
                topic: "Comment",
                id: comment.id,
                mutation: Mutation.Updated,
              });
              return comment;
            });
        },
      }),
    );

    builder.mutationField("deleteComment", (t) =>
      t.prismaField({
        description: "Delete the specified comment.",
        authScopes: { user: true },
        type: "Comment",
        args: {
          where: t.arg({ type: CommentWhereUnique, required: true }),
        },
        resolve: async (query, _root, args, ctx, _info) => {
          const where = args.where ?? {};
          if (!ctx.user?.authRoles.admin) {
            delete where.user;
            where.userId = ctx.user?.id;
          }
          return prismaService.prisma.comment
            .delete({
              ...query,
              where: where,
            })
            .then(async (comment) => {
              await subscriptionService.publish("Comment", {
                topic: "Comment",
                id: comment.id,
                mutation: Mutation.Deleted,
              });
              await subscriptionService.publish(`Comment/${comment.id}`, {
                topic: "Comment",
                id: comment.id,
                mutation: Mutation.Deleted,
              });
              return comment;
            });
        },
      }),
    );
  }
}
