import { Injectable } from "@nestjs/common";
import { ChangeObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";
import { PothosQuery } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { GraphQLScalarType } from "graphql";
import { Scalars } from "..";

@Injectable()
@PothosQuery()
export class ChangeQuery {
  readonly ChangeAggregate;
  readonly ChangeWhereUnique;
  readonly ChangeWhere;
  readonly ChangeOrderBy;

  constructor(builder: SchemaBuilderService, prismaService: PrismaService, changeObject: ChangeObject) {
    const { StringFilter, DateTimeFilter, PagingInput } = builder;
    const { ChangeFields, ChangeMutation } = changeObject;

    this.ChangeAggregate = builder.inputType("ChangeAggregate", {
      fields: (t) => ({
        average: t.field({ type: [ChangeFields] }),
        count: t.field({ type: [ChangeFields] }),
        maximum: t.field({ type: [ChangeFields] }),
        minimum: t.field({ type: [ChangeFields] }),
        sum: t.field({ type: [ChangeFields] }),
      }),
    });

    this.ChangeWhereUnique = builder.prismaWhereUnique("Change", {
      fields: {
        id: "String",
      },
    });

    this.ChangeWhere = builder.prismaWhere("Change", {
      fields: {
        OR: true,
        AND: true,
        NOT: true,
        id: StringFilter,
        table: StringFilter,
        key: StringFilter,
        mutation: ChangeMutation,
        userId: StringFilter,
        createdAt: DateTimeFilter,
        updatedAt: DateTimeFilter,
      },
    });

    this.ChangeOrderBy = builder.prismaOrderBy("Change", {
      fields: {
        id: true,
        table: true,
        key: true,
        mutation: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    builder.addScalarType(
      "ChangeGroupBy",
      new GraphQLScalarType<Scalars["ChangeGroupBy"]["Input"], Scalars["ChangeGroupBy"]["Output"]>({
        name: "ChangeGroupBy",
      }),
    );

    const { ChangeWhere, ChangeWhereUnique, ChangeOrderBy, ChangeAggregate } = this;

    builder.queryField("pageChange", (t) =>
      t.prismaConnection({
        description: "Paginate through multiple changes.",
        authScopes: { admin: true },
        type: "Change",
        cursor: "id",
        args: {
          where: t.arg({ type: ChangeWhere }),
        },
        resolve: async (query, _parent, args, _ctx, _info) => {
          return prismaService.prisma.change.findMany({
            ...query,
            where: args.where ?? {},
          });
        },
      }),
    );

    builder.queryField("readChange", (t) =>
      t.prismaField({
        description: "Read a unique change.",
        authScopes: { admin: true },
        type: "Change",
        args: {
          where: t.arg({ type: ChangeWhereUnique, required: true }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, args, _context, _info) => {
          subscriptions.register(`Change/${args.where.id}`);
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.change.findUniqueOrThrow({
            ...query,
            where: args.where,
          });
        },
      }),
    );

    builder.queryField("readChanges", (t) =>
      t.prismaField({
        description: "Read a list of changes.",
        authScopes: { admin: true },
        type: ["Change"],
        args: {
          where: t.arg({ type: ChangeWhere }),
          distinct: t.arg({ type: [ChangeFields] }),
          orderBy: t.arg({ type: [ChangeOrderBy] }),
          paging: t.arg({ type: PagingInput }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, _args, _context, _info) => {
          subscriptions.register("Change");
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.change.findMany({
            ...query,
            where: args.where ?? {},
            distinct: args.distinct ?? undefined,
            orderBy: args.orderBy ?? {},
            ...(args.paging ?? {}),
          });
        },
      }),
    );

    builder.queryField("countChanges", (t) =>
      t.field({
        description: "Count the number of changes.",
        authScopes: { admin: true },
        type: "Int",
        args: {
          where: t.arg({ type: ChangeWhere }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, _args, _context, _info) => {
          subscriptions.register("Change");
        },
        resolve: async (_root, args, _ctx, _info) => {
          return prismaService.prisma.change.count({
            where: args.where ?? {},
          });
        },
      }),
    );

    builder.queryField("groupChanges", (t) =>
      t.field({
        description: "Group a list of changes.",
        authScopes: { admin: true },
        type: ["ChangeGroupBy"],
        args: {
          by: t.arg({ type: [ChangeFields], required: true }),
          where: t.arg({ type: ChangeWhere }),
          aggregate: t.arg({ type: ChangeAggregate }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, _args, _context, _info) => {
          subscriptions.register("Change");
        },
        resolve: async (_root, args, _ctx, _info) => {
          return prismaService.prisma.change.groupBy({
            by: args.by ?? [],
            ...SchemaBuilderService.aggregateToGroupBy(args.aggregate),
            where: args.where ?? {},
          });
        },
      }),
    );
  }
}
