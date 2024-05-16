import { pick } from "lodash";

import prisma from "@/prisma";
import { Prisma } from "@prisma/client";

import { builder } from "../builder";
import { CommentCreate, CommentUpdate } from "./input";

builder.mutationField("createComment", (t) =>
  t.prismaField({
    description: "Create a new comment.",
    authScopes: { user: true },
    type: "Comment",
    args: {
      create: t.arg({ type: CommentCreate }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      if (!args.create) {
        throw new Error("Create input required.");
      }
      const auth = ctx.authUser;
      const comment: Prisma.CommentCreateInput = pick(args.create, ["message"]);
      comment.user = { connect: { id: auth.id } };
      return prisma.comment.create({
        ...query,
        data: comment,
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
      id: t.arg({ type: "String", required: true }),
      update: t.arg({ type: CommentUpdate }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      const comment: Prisma.CommentUpdateInput = pick(args.update, ["message"]) ?? {};
      const auth = ctx.authUser;
      return prisma.comment.update({
        ...query,
        where: { id: args.id, ...(auth.roles.admin ? {} : { userId: auth.id }) },
        data: comment,
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
      id: t.arg({ type: "String", required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      const auth = ctx.authUser;
      return prisma.comment.delete({
        ...query,
        where: { id: args.id, ...(auth.roles.admin ? {} : { userId: auth.id }) },
      });
    },
  })
);
