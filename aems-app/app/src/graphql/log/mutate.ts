import { prisma } from "@/prisma";
import { builder } from "../builder";
import { LogWhereUnique } from "./query";
import { Mutation } from "../types";

export const LogCreate = builder.prismaCreate("Log", {
  fields: {
    type: "LogType",
    message: "String",
  },
});

export const LogUpdate = builder.prismaUpdate("Log", {
  fields: {
    type: "LogType",
    message: "String",
  },
});

builder.mutationField("createLog", (t) =>
  t.prismaField({
    description: "Create a new log.",
    authScopes: { admin: true },
    type: "Log",
    args: {
      create: t.arg({ type: LogCreate, required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      const log = args.create;
      if (log.message) {
        log.message = `${"[web-ui]: "}${log.message || ""}`;
      }
      return prisma.log
        .create({
          ...query,
          data: log,
        })
        .then((log) => {
          ctx.pubsub.publish("Log", { topic: "Log", id: log.id, mutation: Mutation.Created });
          return log;
        });
    },
  })
);

builder.mutationField("updateLog", (t) =>
  t.prismaField({
    description: "Update the specified log.",
    authScopes: { admin: true },
    type: "Log",
    args: {
      where: t.arg({ type: LogWhereUnique, required: true }),
      update: t.arg({ type: LogUpdate, required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      return prisma.log
        .update({
          ...query,
          where: args.where,
          data: args.update,
        })
        .then((log) => {
          ctx.pubsub.publish("Log", { topic: "Log", id: log.id, mutation: Mutation.Updated });
          ctx.pubsub.publish(`Log/${log.id}`, { topic: "Log", id: log.id, mutation: Mutation.Updated });
          return log;
        });
    },
  })
);

builder.mutationField("deleteLog", (t) =>
  t.prismaField({
    description: "Delete the specified log.",
    authScopes: { admin: true },
    type: "Log",
    args: {
      where: t.arg({ type: LogWhereUnique, required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      return prisma.log
        .delete({
          ...query,
          where: args.where,
        })
        .then((log) => {
          ctx.pubsub.publish("Log", { topic: "Log", id: log.id, mutation: Mutation.Deleted });
          ctx.pubsub.publish(`Log/${log.id}`, { topic: "Log", id: log.id, mutation: Mutation.Deleted });
          return log;
        });
    },
  })
);
