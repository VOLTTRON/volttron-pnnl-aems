import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { CommentObject } from "./object.service";
import { UserQuery } from "../user/query.service";
import { PothosQuery } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
@PothosQuery()
export class CommentQuery {
  readonly CommentWhereUnique;
  readonly CommentWhere;
  readonly CommentOrderBy;
  readonly CommentAggregate;

  constructor(
    builder: SchemaBuilderService,
    prismaService: PrismaService,
    commentObject: CommentObject,
    userQuery: UserQuery,
  ) {
    const { PagingInput, DateTimeFilter, StringFilter } = builder;
    const { CommentFields } = commentObject;
    const { UserOrderBy, UserWhereUnique } = userQuery;

    this.CommentWhereUnique = builder.prismaWhereUnique("Comment", {
      fields: {
        id: "String",
      },
    });

    this.CommentWhere = builder.prismaWhere("Comment", {
      fields: {
        OR: true,
        AND: true,
        NOT: true,
        id: StringFilter,
        message: StringFilter,
        createdAt: DateTimeFilter,
        updatedAt: DateTimeFilter,
        userId: StringFilter,
        user: UserWhereUnique,
      },
    });

    this.CommentOrderBy = builder.prismaOrderBy("Comment", {
      fields: {
        id: true,
        message: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        user: UserOrderBy,
      },
    });

    this.CommentAggregate = builder.inputType("CommentAggregate", {
      fields: (t) => ({
        average: t.field({ type: [CommentFields] }),
        count: t.field({ type: [CommentFields] }),
        maximum: t.field({ type: [CommentFields] }),
        minimum: t.field({ type: [CommentFields] }),
        sum: t.field({ type: [CommentFields] }),
      }),
    });

    const { CommentWhere, CommentWhereUnique, CommentOrderBy, CommentAggregate } = this;

    builder.queryField("pageComment", (t) =>
      t.prismaConnection({
        description: "Paginate through multiple comments.",
        authScopes: { user: true },
        type: "Comment",
        cursor: "id",
        args: {
          where: t.arg({ type: CommentWhere }),
        },
        resolve: async (query, _parent, args, _ctx, _info) => {
          return prismaService.prisma.comment.findMany({
            ...query,
            where: args.where ?? {},
          });
        },
      }),
    );

    builder.queryField("readComment", (t) =>
      t.prismaField({
        description: "Read a unique comment.",
        authScopes: { user: true },
        type: "Comment",
        args: {
          where: t.arg({ type: CommentWhereUnique, required: true }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _comment, args, _context, _info) => {
          subscriptions.register(`Comment/${args.where.id}`);
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.comment.findUniqueOrThrow({
            ...query,
            where: args.where,
          });
        },
      }),
    );

    builder.queryField("readComments", (t) =>
      t.prismaField({
        description: "Read a list of comments.",
        authScopes: { user: true },
        type: ["Comment"],
        args: {
          where: t.arg({ type: CommentWhere }),
          distinct: t.arg({ type: [CommentFields] }),
          orderBy: t.arg({ type: [CommentOrderBy] }),
          paging: t.arg({ type: PagingInput }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _comment, _args, _context, _info) => {
          subscriptions.register("Comment");
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.comment.findMany({
            ...query,
            where: args.where ?? undefined,
            distinct: args.distinct ?? undefined,
            orderBy: args.orderBy ?? {},
            ...(args.paging ?? {}),
          });
        },
      }),
    );

    builder.queryField("countComments", (t) =>
      t.field({
        description: "Count the number of comments.",
        authScopes: { user: true },
        type: "Int",
        args: {
          where: t.arg({ type: CommentWhere }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _comment, _args, _context, _info) => {
          subscriptions.register("Comment");
        },
        resolve: async (_root, args, _ctx, _info) => {
          return prismaService.prisma.comment.count({
            where: args.where ?? undefined,
          });
        },
      }),
    );

    builder.queryField("groupComments", (t) =>
      t.field({
        description: "Group a list of comments.",
        authScopes: { user: true },
        type: ["CommentGroupBy"],
        args: {
          by: t.arg({ type: [CommentFields], required: true }),
          where: t.arg({ type: CommentWhere }),
          aggregate: t.arg({ type: CommentAggregate }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _comment, _args, _context, _info) => {
          subscriptions.register("Comment");
        },
        resolve: async (_root, args, _ctx, _info) => {
          return prismaService.prisma.comment.groupBy({
            by: args.by ?? [],
            ...SchemaBuilderService.aggregateToGroupBy(args.aggregate),
            where: args.where ?? undefined,
          });
        },
      }),
    );
  }
}
