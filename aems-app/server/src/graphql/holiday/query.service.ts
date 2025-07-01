import { Injectable } from "@nestjs/common";
import { HolidayObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";
import { PothosQuery } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
@PothosQuery()
export class HolidayQuery {
  readonly HolidayAggregate;
  readonly HolidayWhereUnique;
  readonly HolidayWhere;
  readonly HolidayOrderBy;

  constructor(builder: SchemaBuilderService, prismaService: PrismaService, holidayObject: HolidayObject) {
    const { StringFilter, IntFilter, DateTimeFilter, PagingInput } = builder;
    const { HolidayFields, ModelStage, HolidayType } = holidayObject;

    this.HolidayAggregate = builder.inputType("HolidayAggregate", {
      fields: (t) => ({
        average: t.field({ type: [HolidayFields] }),
        count: t.field({ type: [HolidayFields] }),
        maximum: t.field({ type: [HolidayFields] }),
        minimum: t.field({ type: [HolidayFields] }),
        sum: t.field({ type: [HolidayFields] }),
      }),
    });

    this.HolidayWhereUnique = builder.prismaWhereUnique("Holiday", {
      fields: {
        id: "String",
      },
    });

    this.HolidayWhere = builder.prismaWhere("Holiday", {
      fields: {
        OR: true,
        AND: true,
        NOT: true,
        id: StringFilter,
        stage: ModelStage,
        message: StringFilter,
        correlation: StringFilter,
        type: HolidayType,
        label: StringFilter,
        month: IntFilter,
        day: IntFilter,
        observance: StringFilter,
        createdAt: DateTimeFilter,
        updatedAt: DateTimeFilter,
      },
    });

    this.HolidayOrderBy = builder.prismaOrderBy("Holiday", {
      fields: {
        id: true,
        stage: true,
        message: true,
        correlation: true,
        type: true,
        label: true,
        month: true,
        day: true,
        observance: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const { HolidayWhere, HolidayWhereUnique, HolidayOrderBy, HolidayAggregate } = this;

    builder.queryField("pageHoliday", (t) =>
      t.prismaConnection({
        description: "Paginate through multiple holidays.",
        authScopes: { admin: true },
        type: "Holiday",
        cursor: "id",
        args: {
          where: t.arg({ type: HolidayWhere }),
        },
        resolve: async (query, _parent, args, _ctx, _info) => {
          return prismaService.prisma.holiday.findMany({
            ...query,
            where: args.where ?? {},
          });
        },
      }),
    );

    builder.queryField("readHoliday", (t) =>
      t.prismaField({
        description: "Read a unique holiday.",
        authScopes: { admin: true },
        type: "Holiday",
        args: {
          where: t.arg({ type: HolidayWhereUnique, required: true }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, args, _context, _info) => {
          subscriptions.register(`Holiday/${args.where.id}`);
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.holiday.findUniqueOrThrow({
            ...query,
            where: args.where,
          });
        },
      }),
    );

    builder.queryField("readHolidays", (t) =>
      t.prismaField({
        description: "Read a list of holidays.",
        authScopes: { admin: true },
        type: ["Holiday"],
        args: {
          where: t.arg({ type: HolidayWhere }),
          distinct: t.arg({ type: [HolidayFields] }),
          orderBy: t.arg({ type: [HolidayOrderBy] }),
          paging: t.arg({ type: PagingInput }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, _args, _context, _info) => {
          subscriptions.register("Holiday");
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.holiday.findMany({
            ...query,
            where: args.where ?? {},
            distinct: args.distinct ?? undefined,
            orderBy: args.orderBy ?? {},
            ...(args.paging ?? {}),
          });
        },
      }),
    );

    builder.queryField("countHolidays", (t) =>
      t.field({
        description: "Count the number of holidays.",
        authScopes: { admin: true },
        type: "Int",
        args: {
          where: t.arg({ type: HolidayWhere }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, _args, _context, _info) => {
          subscriptions.register("Holiday");
        },
        resolve: async (_root, args, _ctx, _info) => {
          return prismaService.prisma.holiday.count({
            where: args.where ?? {},
          });
        },
      }),
    );

    builder.queryField("groupHolidays", (t) =>
      t.field({
        description: "Group a list of holidays.",
        authScopes: { admin: true },
        type: ["HolidayGroupBy"],
        args: {
          by: t.arg({ type: [HolidayFields], required: true }),
          where: t.arg({ type: HolidayWhere }),
          aggregate: t.arg({ type: HolidayAggregate }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, _args, _context, _info) => {
          subscriptions.register("Holiday");
        },
        resolve: async (_root, args, _ctx, _info) => {
          return prismaService.prisma.holiday.groupBy({
            by: args.by ?? [],
            ...SchemaBuilderService.aggregateToGroupBy(args.aggregate),
            where: args.where ?? {},
          });
        },
      }),
    );
  }
}
