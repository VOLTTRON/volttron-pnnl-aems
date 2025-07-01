import { Injectable } from "@nestjs/common";
import { ScheduleObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";
import { PothosQuery } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
@PothosQuery()
export class ScheduleQuery {
  readonly ScheduleAggregate;
  readonly ScheduleWhereUnique;
  readonly ScheduleWhere;
  readonly ScheduleOrderBy;

  constructor(builder: SchemaBuilderService, prismaService: PrismaService, scheduleObject: ScheduleObject) {
    const { StringFilter, BooleanFilter, DateTimeFilter, PagingInput } = builder;
    const { ScheduleFields, ModelStage } = scheduleObject;

    this.ScheduleAggregate = builder.inputType("ScheduleAggregate", {
      fields: (t) => ({
        average: t.field({ type: [ScheduleFields] }),
        count: t.field({ type: [ScheduleFields] }),
        maximum: t.field({ type: [ScheduleFields] }),
        minimum: t.field({ type: [ScheduleFields] }),
        sum: t.field({ type: [ScheduleFields] }),
      }),
    });

    this.ScheduleWhereUnique = builder.prismaWhereUnique("Schedule", {
      fields: {
        id: "String",
      },
    });

    this.ScheduleWhere = builder.prismaWhere("Schedule", {
      fields: {
        OR: true,
        AND: true,
        NOT: true,
        id: StringFilter,
        stage: ModelStage,
        message: StringFilter,
        correlation: StringFilter,
        label: StringFilter,
        startTime: StringFilter,
        endTime: StringFilter,
        occupied: BooleanFilter,
        setpointId: StringFilter,
        createdAt: DateTimeFilter,
        updatedAt: DateTimeFilter,
      },
    });

    this.ScheduleOrderBy = builder.prismaOrderBy("Schedule", {
      fields: {
        id: true,
        stage: true,
        message: true,
        correlation: true,
        label: true,
        startTime: true,
        endTime: true,
        occupied: true,
        setpointId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const { ScheduleWhere, ScheduleWhereUnique, ScheduleOrderBy, ScheduleAggregate } = this;

    builder.queryField("pageSchedule", (t) =>
      t.prismaConnection({
        description: "Paginate through multiple schedules.",
        authScopes: { admin: true },
        type: "Schedule",
        cursor: "id",
        args: {
          where: t.arg({ type: ScheduleWhere }),
        },
        resolve: async (query, _parent, args, _ctx, _info) => {
          return prismaService.prisma.schedule.findMany({
            ...query,
            where: args.where ?? {},
          });
        },
      }),
    );

    builder.queryField("readSchedule", (t) =>
      t.prismaField({
        description: "Read a unique schedule.",
        authScopes: { admin: true },
        type: "Schedule",
        args: {
          where: t.arg({ type: ScheduleWhereUnique, required: true }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, args, _context, _info) => {
          subscriptions.register(`Schedule/${args.where.id}`);
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.schedule.findUniqueOrThrow({
            ...query,
            where: args.where,
          });
        },
      }),
    );

    builder.queryField("readSchedules", (t) =>
      t.prismaField({
        description: "Read a list of schedules.",
        authScopes: { admin: true },
        type: ["Schedule"],
        args: {
          where: t.arg({ type: ScheduleWhere }),
          distinct: t.arg({ type: [ScheduleFields] }),
          orderBy: t.arg({ type: [ScheduleOrderBy] }),
          paging: t.arg({ type: PagingInput }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, _args, _context, _info) => {
          subscriptions.register("Schedule");
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.schedule.findMany({
            ...query,
            where: args.where ?? {},
            distinct: args.distinct ?? undefined,
            orderBy: args.orderBy ?? {},
            ...(args.paging ?? {}),
          });
        },
      }),
    );

    builder.queryField("countSchedules", (t) =>
      t.field({
        description: "Count the number of schedules.",
        authScopes: { admin: true },
        type: "Int",
        args: {
          where: t.arg({ type: ScheduleWhere }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, _args, _context, _info) => {
          subscriptions.register("Schedule");
        },
        resolve: async (_root, args, _ctx, _info) => {
          return prismaService.prisma.schedule.count({
            where: args.where ?? {},
          });
        },
      }),
    );

    builder.queryField("groupSchedules", (t) =>
      t.field({
        description: "Group a list of schedules.",
        authScopes: { admin: true },
        type: ["ScheduleGroupBy"],
        args: {
          by: t.arg({ type: [ScheduleFields], required: true }),
          where: t.arg({ type: ScheduleWhere }),
          aggregate: t.arg({ type: ScheduleAggregate }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, _args, _context, _info) => {
          subscriptions.register("Schedule");
        },
        resolve: async (_root, args, _ctx, _info) => {
          return prismaService.prisma.schedule.groupBy({
            by: args.by ?? [],
            ...SchemaBuilderService.aggregateToGroupBy(args.aggregate),
            where: args.where ?? {},
          });
        },
      }),
    );
  }
}
