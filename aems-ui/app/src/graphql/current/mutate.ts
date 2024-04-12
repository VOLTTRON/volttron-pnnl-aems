import { pick } from "lodash";

import prisma from "@/prisma";
import { Prisma } from "@prisma/client";

import { builder } from "../builder";
import { UserCreate, UserUpdate } from "../users/input";

builder.mutationField("createCurrent", (t) =>
  t.prismaField({
    description: "Create a new user.",
    authScopes: {},
    type: "User",
    args: {
      create: t.arg({ type: UserCreate }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      if (!args.create) {
        throw new Error("Create input required.");
      }
      if (!args.create?.email) {
        throw new Error(`email must be specified`);
      }
      const auth = ctx.authUser;
      if (auth.id) {
        throw new Error("User is currently logged in.");
      }
      const user: Prisma.UserCreateInput = pick(args.create, ["name", "email", "password", "role", "preferences"]);
      user.preferences = user.preferences ?? {};
      return prisma.user.create({
        ...query,
        data: user,
      });
    },
  })
);

builder.mutationField("updateCurrent", (t) =>
  t.prismaField({
    description: "Update the currently logged in user.",
    authScopes: { user: true },
    type: "User",
    args: {
      update: t.arg({ type: UserUpdate }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      const user: Prisma.UserUpdateInput = pick(args.update, ["name", "email", "password", "preferences"]) ?? {};
      const auth = ctx.authUser;
      if (!auth.id) {
        throw new Error("User must be logged in.");
      }
      return prisma.user.update({
        ...query,
        where: { id: auth.id },
        data: user,
      });
    },
  })
);

builder.mutationField("deleteCurrent", (t) =>
  t.prismaField({
    description: "Delete the currently logged in user.",
    authScopes: { user: true },
    type: "User",
    resolve: async (query, _root, _args, ctx, _info) => {
      const auth = ctx.authUser;
      if (!auth.id) {
        throw new Error("User must be logged in.");
      }
      return prisma.user.delete({
        ...query,
        where: { id: auth.id },
      });
    },
  })
);
