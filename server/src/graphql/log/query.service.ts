import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { LogObject } from "./object.service";
import { PothosQuery } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { GraphQLScalarType } from "graphql";
import { Scalars } from "..";

@Injectable()
@PothosQuery()
export class LogQuery {
  readonly LogTypeFilter;
  readonly LogWhereUnique;
  readonly LogWhere;
  readonly LogOrderBy;
  readonly LogAggregate;

  constructor(builder: SchemaBuilderService, prismaService: PrismaService, logObject: LogObject) {
    const { StringFilter, DateTimeFilter, PagingInput } = builder;
    const { LogFields } = logObject;

    this.LogTypeFilter = builder.prismaFilter("LogType", {
      ops: ["equals", "not", "in", "mode"],
    });

    this.LogWhereUnique = builder.prismaWhereUnique("Log", {
      fields: {
        id: "String",
      },
    });

    this.LogWhere = builder.prismaWhere("Log", {
      fields: {
        OR: true,
        AND: true,
        NOT: true,
        id: StringFilter,
        type: this.LogTypeFilter,
        message: StringFilter,
        createdAt: DateTimeFilter,
        updatedAt: DateTimeFilter,
      },
    });

    this.LogOrderBy = builder.prismaOrderBy("Log", {
      fields: {
        id: true,
        type: true,
        message: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.LogAggregate = builder.inputType("LogAggregate", {
      fields: (t) => ({
        average: t.field({ type: [LogFields] }),
        count: t.field({ type: [LogFields] }),
        maximum: t.field({ type: [LogFields] }),
        minimum: t.field({ type: [LogFields] }),
        sum: t.field({ type: [LogFields] }),
      }),
    });

    builder.addScalarType(
      "LogGroupBy",
      new GraphQLScalarType<Scalars["LogGroupBy"]["Input"], Scalars["LogGroupBy"]["Output"]>({
        name: "LogGroupBy",
      }),
    );

    const { LogWhere, LogWhereUnique, LogOrderBy, LogAggregate } = this;

    builder.queryField("pageLog", (t) =>
      t.prismaConnection({
        description: "Paginate through multiple logs.",
        authScopes: { admin: true },
        type: "Log",
        cursor: "id",
        args: {
          where: t.arg({ type: LogWhere }),
        },
        resolve: async (query, _parent, args, _ctx, _info) => {
          return prismaService.prisma.log.findMany({
            ...query,
            where: args.where ?? {},
          });
        },
      }),
    );

    builder.queryField("readLog", (t) =>
      t.prismaField({
        description: "Read a unique log.",
        authScopes: { admin: true },
        type: "Log",
        args: {
          where: t.arg({ type: LogWhereUnique, required: true }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _log, args, _context, _info) => {
          subscriptions.register(`Log/${args.where.id}`);
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.log.findUniqueOrThrow({
            ...query,
            where: args.where,
          });
        },
      }),
    );

    builder.queryField("readLogs", (t) =>
      t.prismaField({
        description: "Read a list of logs.",
        authScopes: { admin: true },
        type: ["Log"],
        args: {
          where: t.arg({ type: LogWhere }),
          distinct: t.arg({ type: [LogFields] }),
          orderBy: t.arg({ type: [LogOrderBy] }),
          paging: t.arg({ type: PagingInput }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _log, _args, _context, _info) => {
          subscriptions.register("Log");
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.log.findMany({
            ...query,
            where: args.where ?? undefined,
            distinct: args.distinct ?? undefined,
            orderBy: args.orderBy ?? {},
            ...(args.paging ?? {}),
          });
        },
      }),
    );

    builder.queryField("countLogs", (t) =>
      t.field({
        description: "Count the number of logs.",
        authScopes: { admin: true },
        type: "Int",
        args: {
          where: t.arg({ type: LogWhere }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _log, _args, _context, _info) => {
          subscriptions.register("Log");
        },
        resolve: async (_root, args, _ctx, _info) => {
          return prismaService.prisma.log.count({
            where: args.where ?? undefined,
          });
        },
      }),
    );

    builder.queryField("groupLogs", (t) =>
      t.field({
        description: "Group a list of logs.",
        authScopes: { admin: true },
        type: ["LogGroupBy"],
        args: {
          by: t.arg({ type: [LogFields], required: true }),
          where: t.arg({ type: LogWhere }),
          aggregate: t.arg({ type: LogAggregate }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _log, _args, _context, _info) => {
          subscriptions.register("Log");
        },
        resolve: async (_root, args, _ctx, _info) => {
          return prismaService.prisma.log.groupBy({
            by: args.by ?? [],
            ...SchemaBuilderService.aggregateToGroupBy(args.aggregate),
            where: args.where ?? {},
          });
        },
      }),
    );
  }
}
