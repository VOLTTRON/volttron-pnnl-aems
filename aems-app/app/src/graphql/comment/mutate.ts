import { prisma } from "@/prisma";
import { builder } from "../builder";
import { UserWhereUnique } from "../user/query";
import { CommentWhereUnique } from "./query";
import { Mutation } from "../types";

const CommentCreateUser = builder.prismaCreateRelation("Comment", "user", {
  fields: {
    connect: UserWhereUnique,
  },
});

export const CommentCreate = builder.prismaCreate("Comment", {
  fields: {
    message: "String",
    user: CommentCreateUser,
  },
});

const CommentUpdateUser = builder.prismaUpdateRelation("Comment", "user", {
  fields: {
    connect: UserWhereUnique,
    disconnect: "Boolean",
  },
});

export const CommentUpdate = builder.prismaUpdate("Comment", {
  fields: {
    message: "String",
    user: CommentUpdateUser,
  },
});

builder.mutationField("createComment", (t) =>
  t.prismaField({
    description: "Create a new comment.",
    authScopes: { user: true },
    type: "Comment",
    args: {
      create: t.arg({ type: CommentCreate, required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      const auth = ctx.authUser;
      const create = args.create;
      if (!auth.roles.admin || !create.user) {
        delete create.user;
        create.user = { connect: { id: auth.id } };
      }
      return prisma.comment
        .create({
          ...query,
          data: create,
        })
        .then((comment) => {
          ctx.pubsub.publish("Comment", {
            topic: "Comment",
            id: comment.id,
            mutation: Mutation.Created,
          });
          return comment;
        });
    },
  })
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
      const auth = ctx.authUser;
      const where = args.where;
      if (!auth.roles.admin) {
        delete where.user;
        where.userId = auth.id;
      }
      return prisma.comment
        .update({
          ...query,
          where: where,
          data: args.update,
        })
        .then((comment) => {
          ctx.pubsub.publish("Comment", {
            topic: "Comment",
            id: comment.id,
            mutation: Mutation.Updated,
          });
          ctx.pubsub.publish(`Comment/${comment.id}`, {
            topic: "Comment",
            id: comment.id,
            mutation: Mutation.Updated,
          });
          return comment;
        });
    },
  })
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
      const auth = ctx.authUser;
      const where = args.where;
      if (!auth.roles.admin) {
        delete where.user;
        where.userId = auth.id;
      }
      return prisma.comment
        .delete({
          ...query,
          where: where,
        })
        .then((comment) => {
          ctx.pubsub.publish("Comment", {
            topic: "Comment",
            id: comment.id,
            mutation: Mutation.Deleted,
          });
          ctx.pubsub.publish(`Comment/${comment.id}`, {
            topic: "Comment",
            id: comment.id,
            mutation: Mutation.Deleted,
          });
          return comment;
        });
    },
  })
);
