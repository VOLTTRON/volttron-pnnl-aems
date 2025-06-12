import { convertToJsonObject, prisma, recordChange } from "@/prisma";
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
        .then((response) => {
          recordChange("Create", "Log", response.id, ctx.authUser, convertToJsonObject(response));
          ctx.pubsub.publish("Log", { topic: "Log", id: response.id, mutation: Mutation.Created });
          return response;
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
        .then((response) => {
          recordChange("Update", "Log", response.id, ctx.authUser, convertToJsonObject(response));
          ctx.pubsub.publish("Log", { topic: "Log", id: response.id, mutation: Mutation.Updated });
          ctx.pubsub.publish(`Log/${response.id}`, { topic: "Log", id: response.id, mutation: Mutation.Updated });
          return response;
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
        .then((response) => {
          recordChange("Delete", "Log", response.id, ctx.authUser);
          ctx.pubsub.publish("Log", { topic: "Log", id: response.id, mutation: Mutation.Deleted });
          ctx.pubsub.publish(`Log/${response.id}`, { topic: "Log", id: response.id, mutation: Mutation.Deleted });
          return response;
        });
    },
  })
);
