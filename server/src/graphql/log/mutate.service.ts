import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { LogQuery } from "./query.service";
import { Mutation } from "@local/common";
import { PothosMutation } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";

@Injectable()
@PothosMutation()
export class LogMutation {
  readonly LogCreate;
  readonly LogUpdate;

  constructor(
    builder: SchemaBuilderService,
    prismaService: PrismaService,
    subscriptionService: SubscriptionService,
    logQuery: LogQuery,
  ) {
    const { LogWhereUnique } = logQuery;

    this.LogCreate = builder.prismaCreate("Log", {
      fields: {
        type: builder.LogType,
        message: "String",
      },
    });

    this.LogUpdate = builder.prismaUpdate("Log", {
      fields: {
        type: builder.LogType,
        message: "String",
      },
    });

    const { LogCreate, LogUpdate } = this;

    builder.mutationField("createLog", (t) =>
      t.prismaField({
        description: "Create a new log.",
        authScopes: { admin: true },
        type: "Log",
        args: {
          create: t.arg({ type: LogCreate, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          const log = args.create;
          if (log.message) {
            log.message = `${"[web-ui]: "}${log.message || ""}`;
          }
          return prismaService.prisma.log
            .create({
              ...query,
              data: log,
            })
            .then(async (log) => {
              await subscriptionService.publish("Log", { topic: "Log", id: log.id, mutation: Mutation.Created });
              return log;
            });
        },
      }),
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
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.log
            .update({
              ...query,
              where: args.where,
              data: args.update,
            })
            .then(async (log) => {
              await subscriptionService.publish("Log", { topic: "Log", id: log.id, mutation: Mutation.Updated });
              await subscriptionService.publish(`Log/${log.id}`, {
                topic: "Log",
                id: log.id,
                mutation: Mutation.Updated,
              });
              return log;
            });
        },
      }),
    );

    builder.mutationField("deleteLog", (t) =>
      t.prismaField({
        description: "Delete the specified log.",
        authScopes: { admin: true },
        type: "Log",
        args: {
          where: t.arg({ type: LogWhereUnique, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.log
            .delete({
              ...query,
              where: args.where,
            })
            .then(async (log) => {
              await subscriptionService.publish("Log", { topic: "Log", id: log.id, mutation: Mutation.Deleted });
              await subscriptionService.publish(`Log/${log.id}`, {
                topic: "Log",
                id: log.id,
                mutation: Mutation.Deleted,
              });
              return log;
            });
        },
      }),
    );
  }
}
