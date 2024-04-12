import { pick } from "lodash";

import prisma from "@/prisma";
import { Prisma } from "@prisma/client";

import { builder } from "../builder";
import { UserCreate, UserUpdate } from "./input";

builder.mutationField("createUser", (t) =>
  t.prismaField({
    description: "Create a new user.",
    authScopes: { admin: true },
    type: "User",
    args: {
      create: t.arg({ type: UserCreate }),
    },
    resolve: async (query, _root, args, _ctx, _info) => {
      if (!args.create) {
        throw new Error("Create input required.");
      }
      if (!args.create?.email) {
        throw new Error(`email must be specified`);
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

builder.mutationField("updateUser", (t) =>
  t.prismaField({
    description: "Update the specified user.",
    authScopes: { admin: true },
    type: "User",
    args: {
      id: t.arg({ type: "String", required: true }),
      update: t.arg({ type: UserUpdate }),
    },
    resolve: async (query, _root, args, _ctx, _info) => {
      const user: Prisma.UserUpdateInput =
        pick(args.update, ["name", "email", "password", "role", "preferences"]) ?? {};
      return prisma.user.update({
        ...query,
        where: { id: args.id },
        data: user,
      });
    },
  })
);

builder.mutationField("deleteUser", (t) =>
  t.prismaField({
    description: "Delete the specified user.",
    authScopes: { admin: true },
    type: "User",
    args: {
      id: t.arg({ type: "String", required: true }),
    },
    resolve: async (query, _root, args, _ctx, _info) => {
      return prisma.user.delete({
        ...query,
        where: { id: args.id },
      });
    },
  })
);
