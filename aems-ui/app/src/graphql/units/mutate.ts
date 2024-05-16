import { pick } from "lodash";

import prisma from "@/prisma";
import { Prisma } from "@prisma/client";

import { builder } from "../builder";
import { UnitsUpdate } from "./input";

builder.mutationField("updateUnit", (t) =>
  t.prismaField({
    description: "Update the specified unit.",
    authScopes: { admin: true },
    type: "Units",
    args: {
      id: t.arg({ type: "Int", required: true }),
      update: t.arg({ type: UnitsUpdate }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      const units: Prisma.UnitsUpdateInput = pick(args.update, ["message"]) ?? {};
      const auth = ctx.authUser;
      return prisma.units.update({
        ...query,
        where: { id: args.id, ...(auth.roles.admin ? {} : { userId: auth.id }) },
        data: units,
      });
    },
  })
);
