import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { AccountObject } from "./object.service";
import { UserQuery } from "../user/query.service";
import { PothosQuery } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { GraphQLScalarType } from "graphql";
import { Scalars } from "..";

@Injectable()
@PothosQuery()
export class AccountQuery {
  readonly AccountAggregate;
  readonly AccountWhereUnique;
  readonly AccountWhere;
  readonly AccountOrderBy;

  constructor(
    builder: SchemaBuilderService,
    prismaService: PrismaService,
    accountObject: AccountObject,
    userQuery: UserQuery,
  ) {
    const { StringFilter, DateTimeFilter, PagingInput } = builder;
    const { AccountFields } = accountObject;
    const { UserWhereUnique, UserOrderBy } = userQuery;

    this.AccountAggregate = builder.inputType("AccountAggregate", {
      fields: (t) => ({
        average: t.field({ type: [AccountFields] }),
        count: t.field({ type: [AccountFields] }),
        maximum: t.field({ type: [AccountFields] }),
        minimum: t.field({ type: [AccountFields] }),
        sum: t.field({ type: [AccountFields] }),
      }),
    });

    this.AccountWhereUnique = builder.prismaWhereUnique("Account", {
      fields: {
        id: "String",
      },
    });

    this.AccountWhere = builder.prismaWhere("Account", {
      fields: {
        OR: true,
        AND: true,
        NOT: true,
        id: StringFilter,
        type: StringFilter,
        provider: StringFilter,
        createdAt: DateTimeFilter,
        updatedAt: DateTimeFilter,
        userId: StringFilter,
        user: UserWhereUnique,
      },
    });

    this.AccountOrderBy = builder.prismaOrderBy("Account", {
      fields: {
        id: true,
        type: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        user: UserOrderBy,
      },
    });

    builder.addScalarType(
      "AccountGroupBy",
      new GraphQLScalarType<Scalars["AccountGroupBy"]["Input"], Scalars["AccountGroupBy"]["Output"]>({
        name: "AccountGroupBy",
      }),
    );

    const { AccountWhere, AccountWhereUnique, AccountOrderBy, AccountAggregate } = this;

    builder.queryField("pageAccount", (t) =>
      t.prismaConnection({
        description: "Paginate through multiple accounts.",
        authScopes: { user: true },
        type: "Account",
        cursor: "id",
        args: {
          where: t.arg({ type: AccountWhere }),
        },
        resolve: async (query, _parent, args, ctx, _info) => {
          const where = args.where ?? {};
          if (!ctx.user?.authRoles.admin) {
            delete where.user;
            where.userId = ctx.user?.id;
          }
          return prismaService.prisma.account.findMany({
            ...query,
            where: args.where ?? {},
          });
        },
      }),
    );

    builder.queryField("readAccount", (t) =>
      t.prismaField({
        description: "Read a unique account.",
        authScopes: { user: true },
        type: "Account",
        args: {
          where: t.arg({ type: AccountWhereUnique, required: true }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _account, args, _context, _info) => {
          subscriptions.register(`Account/${args.where.id}`);
        },
        resolve: async (query, _root, args, ctx, _info) => {
          const where = args.where ?? {};
          if (!ctx.user?.authRoles.admin) {
            delete where.user;
            where.userId = ctx.user?.id;
          }
          return prismaService.prisma.account.findUniqueOrThrow({
            ...query,
            where: where,
          });
        },
      }),
    );

    builder.queryField("readAccounts", (t) =>
      t.prismaField({
        description: "Read a list of accounts.",
        authScopes: { user: true },
        type: ["Account"],
        args: {
          where: t.arg({ type: AccountWhere }),
          distinct: t.arg({ type: [AccountFields] }),
          orderBy: t.arg({ type: [AccountOrderBy] }),
          paging: t.arg({ type: PagingInput }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _account, _args, _context, _info) => {
          subscriptions.register(`Account`);
        },
        resolve: async (query, _root, args, ctx, _info) => {
          const where = args.where ?? {};
          if (!ctx.user?.authRoles.admin) {
            delete where.user;
            where.userId = ctx.user?.id;
          }
          return prismaService.prisma.account.findMany({
            ...query,
            where: where,
            distinct: args.distinct ?? undefined,
            orderBy: args.orderBy ?? {},
            ...(args.paging ?? {}),
          });
        },
      }),
    );

    builder.queryField("countAccounts", (t) =>
      t.field({
        description: "Count the number of accounts.",
        authScopes: { user: true },
        type: "Int",
        args: {
          where: t.arg({ type: AccountWhere }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _account, _args, _context, _info) => {
          subscriptions.register(`Account`);
        },
        resolve: async (_root, args, ctx, _info) => {
          const where = args.where ?? {};
          if (!ctx.user?.authRoles.admin) {
            delete where.user;
            where.userId = ctx.user?.id;
          }
          return prismaService.prisma.account.count({
            where: where,
          });
        },
      }),
    );

    builder.queryField("groupAccounts", (t) =>
      t.field({
        description: "Group a list of accounts.",
        authScopes: { user: true },
        type: ["AccountGroupBy"],
        args: {
          by: t.arg({ type: [AccountFields], required: true }),
          where: t.arg({ type: AccountWhere }),
          aggregate: t.arg({ type: AccountAggregate }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _account, _args, _context, _info) => {
          subscriptions.register(`Account`);
        },
        resolve: async (_root, args, ctx, _info) => {
          const where = args.where ?? {};
          if (!ctx.user?.authRoles.admin) {
            delete where.user;
            where.userId = ctx.user?.id;
          }
          return prismaService.prisma.account.groupBy({
            by: args.by ?? [],
            ...SchemaBuilderService.aggregateToGroupBy(args.aggregate),
            where: where,
          });
        },
      }),
    );
  }
}
