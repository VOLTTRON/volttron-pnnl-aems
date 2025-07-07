import { Injectable } from "@nestjs/common";
import { ConfigurationObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";
import { PothosQuery } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
@PothosQuery()
export class ConfigurationQuery {
  readonly ConfigurationAggregate;
  readonly ConfigurationWhereUnique;
  readonly ConfigurationWhere;
  readonly ConfigurationOrderBy;

  constructor(builder: SchemaBuilderService, prismaService: PrismaService, configurationObject: ConfigurationObject) {
    const { StringFilter, DateTimeFilter, PagingInput } = builder;
    const { ConfigurationFields } = configurationObject;

    this.ConfigurationAggregate = builder.inputType("ConfigurationAggregate", {
      fields: (t) => ({
        average: t.field({ type: [ConfigurationFields] }),
        count: t.field({ type: [ConfigurationFields] }),
        maximum: t.field({ type: [ConfigurationFields] }),
        minimum: t.field({ type: [ConfigurationFields] }),
        sum: t.field({ type: [ConfigurationFields] }),
      }),
    });

    this.ConfigurationWhereUnique = builder.prismaWhereUnique("Configuration", {
      fields: {
        id: "String",
      },
    });

    this.ConfigurationWhere = builder.prismaWhere("Configuration", {
      fields: {
        OR: true,
        AND: true,
        NOT: true,
        id: StringFilter,
        stage: builder.ModelStage,
        message: StringFilter,
        correlation: StringFilter,
        label: StringFilter,
        setpointId: StringFilter,
        mondayScheduleId: StringFilter,
        tuesdayScheduleId: StringFilter,
        wednesdayScheduleId: StringFilter,
        thursdayScheduleId: StringFilter,
        fridayScheduleId: StringFilter,
        saturdayScheduleId: StringFilter,
        sundayScheduleId: StringFilter,
        holidayScheduleId: StringFilter,
        createdAt: DateTimeFilter,
        updatedAt: DateTimeFilter,
      },
    });

    this.ConfigurationOrderBy = builder.prismaOrderBy("Configuration", {
      fields: {
        id: true,
        stage: true,
        message: true,
        correlation: true,
        label: true,
        setpointId: true,
        mondayScheduleId: true,
        tuesdayScheduleId: true,
        wednesdayScheduleId: true,
        thursdayScheduleId: true,
        fridayScheduleId: true,
        saturdayScheduleId: true,
        sundayScheduleId: true,
        holidayScheduleId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const { ConfigurationWhere, ConfigurationWhereUnique, ConfigurationOrderBy, ConfigurationAggregate } = this;

    builder.queryField("pageConfiguration", (t) =>
      t.prismaConnection({
        description: "Paginate through multiple configurations.",
        authScopes: { user: true },
        type: "Configuration",
        cursor: "id",
        args: {
          where: t.arg({ type: ConfigurationWhere }),
        },
        resolve: async (query, _parent, args, _ctx, _info) => {
          return prismaService.prisma.configuration.findMany({
            ...query,
            where: args.where ?? {},
          });
        },
      }),
    );

    builder.queryField("readConfiguration", (t) =>
      t.prismaField({
        description: "Read a unique configuration.",
        authScopes: { user: true },
        type: "Configuration",
        args: {
          where: t.arg({ type: ConfigurationWhereUnique, required: true }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, args, _context, _info) => {
          subscriptions.register(`Configuration/${args.where.id}`);
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.configuration.findUniqueOrThrow({
            ...query,
            where: args.where,
          });
        },
      }),
    );

    builder.queryField("readConfigurations", (t) =>
      t.prismaField({
        description: "Read a list of configurations.",
        authScopes: { user: true },
        type: ["Configuration"],
        args: {
          where: t.arg({ type: ConfigurationWhere }),
          distinct: t.arg({ type: [ConfigurationFields] }),
          orderBy: t.arg({ type: [ConfigurationOrderBy] }),
          paging: t.arg({ type: PagingInput }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, _args, _context, _info) => {
          subscriptions.register("Configuration");
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.configuration.findMany({
            ...query,
            where: args.where ?? {},
            distinct: args.distinct ?? undefined,
            orderBy: args.orderBy ?? {},
            ...(args.paging ?? {}),
          });
        },
      }),
    );

    builder.queryField("countConfigurations", (t) =>
      t.field({
        description: "Count the number of configurations.",
        authScopes: { user: true },
        type: "Int",
        args: {
          where: t.arg({ type: ConfigurationWhere }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, _args, _context, _info) => {
          subscriptions.register("Configuration");
        },
        resolve: async (_root, args, _ctx, _info) => {
          return prismaService.prisma.configuration.count({
            where: args.where ?? {},
          });
        },
      }),
    );

    builder.queryField("groupConfigurations", (t) =>
      t.field({
        description: "Group a list of configurations.",
        authScopes: { user: true },
        type: ["ConfigurationGroupBy"],
        args: {
          by: t.arg({ type: [ConfigurationFields], required: true }),
          where: t.arg({ type: ConfigurationWhere }),
          aggregate: t.arg({ type: ConfigurationAggregate }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, _args, _context, _info) => {
          subscriptions.register("Configuration");
        },
        resolve: async (_root, args, _ctx, _info) => {
          return prismaService.prisma.configuration.groupBy({
            by: args.by ?? [],
            ...SchemaBuilderService.aggregateToGroupBy(args.aggregate),
            where: args.where ?? {},
          });
        },
      }),
    );
  }
}
