import { pick } from "lodash";

import prisma from "@/prisma";
import { Prisma } from "@prisma/client";

import { builder } from "../builder";
import { ConfigurationsUpdate } from "./input";

builder.mutationField("updateConfigurations", (t) =>
  t.prismaField({
    description: "Update the specified configurations.",
    authScopes: { user: true },
    type: "Configurations",
    args: {
      id: t.arg({ type: "Int", required: true }),
      update: t.arg({ type: ConfigurationsUpdate }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      const configurations: Prisma.ConfigurationsUpdateInput = pick(args.update, ["message"]) ?? {};
      const auth = ctx.authUser;
      return prisma.configurations.update({
        ...query,
        where: { id: args.id, ...(auth.roles.admin ? {} : { userId: auth.id }) },
        data: configurations,
      });
    },
  })
);
