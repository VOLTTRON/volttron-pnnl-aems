import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { FileObject } from "./object.service";
import { UserQuery } from "../user/query.service";
import { PothosQuery } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { GraphQLScalarType } from "graphql";
import { Scalars } from "..";
import { narrowToOwner } from "../own-records";

@Injectable()
@PothosQuery()
export class FileQuery {
  readonly FileWhereUnique;
  readonly FileWhere;
  readonly FileOrderBy;
  readonly FileAggregate;

  constructor(
    builder: SchemaBuilderService,
    prismaService: PrismaService,
    fileObject: FileObject,
    userQuery: UserQuery,
  ) {
    const { StringFilter, PagingInput } = builder;
    const { FileFields } = fileObject;
    const { UserWhereUnique } = userQuery;

    this.FileWhereUnique = builder.prismaWhereUnique("File", {
      fields: {
        id: "String",
      },
    });

    this.FileWhere = builder.prismaWhere("File", {
      fields: {
        OR: true,
        AND: true,
        NOT: true,
        id: StringFilter,
        feedbackId: StringFilter,
        userId: StringFilter,
        user: UserWhereUnique,
      },
    });

    this.FileOrderBy = builder.prismaOrderBy("File", {
      fields: {
        id: true,
        feedbackId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.FileAggregate = builder.inputType("FileAggregate", {
      fields: (t) => ({
        average: t.field({ type: [FileFields] }),
        count: t.field({ type: [FileFields] }),
        maximum: t.field({ type: [FileFields] }),
        minimum: t.field({ type: [FileFields] }),
        sum: t.field({ type: [FileFields] }),
      }),
    });

    builder.addScalarType(
      "FileGroupBy",
      new GraphQLScalarType<Scalars["FileGroupBy"]["Input"], Scalars["FileGroupBy"]["Output"]>({
        name: "FileGroupBy",
      }),
    );

    const { FileWhere, FileWhereUnique, FileOrderBy, FileAggregate } = this;

    builder.queryField("pageFile", (t) =>
      t.prismaConnection({
        description: "Paginate through multiple files.",
        authScopes: { user: true },
        type: "File",
        cursor: "id",
        args: {
          where: t.arg({ type: FileWhere }),
        },
        resolve: async (query, _parent, args, ctx, _info) => {
          return prismaService.prisma.file.findMany({
            ...query,
            where: narrowToOwner(args.where, ctx) ?? {},
          });
        },
      }),
    );

    builder.queryField("readFile", (t) =>
      t.prismaField({
        description: "Read a specific file by its ID",
        authScopes: { user: true },
        type: "File",
        args: {
          where: t.arg({ type: FileWhereUnique, required: true }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _feedback, args, _context, _info) => {
          subscriptions.register(`File/${args.where.id}`);
        },
        resolve: async (query, _root, args, ctx, _info) => {
          if (ctx.user?.authRoles.admin) {
            return prismaService.prisma.file.findUniqueOrThrow({
              ...query,
              where: args.where,
            });
          }
          return prismaService.prisma.file.findFirstOrThrow({
            ...query,
            where: narrowToOwner(args.where, ctx),
          });
        },
      }),
    );

    builder.queryField("readFiles", (t) =>
      t.prismaField({
        description: "Read a list of files.",
        authScopes: { user: true },
        type: ["File"],
        args: {
          where: t.arg({ type: FileWhere }),
          distinct: t.arg({ type: [FileFields] }),
          orderBy: t.arg({ type: [FileOrderBy] }),
          paging: t.arg({ type: PagingInput }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _feedback, _args, _context, _info) => {
          subscriptions.register(`File`);
        },
        resolve: async (query, _root, args, ctx, _info) => {
          return prismaService.prisma.file.findMany({
            ...query,
            where: narrowToOwner(args.where, ctx),
            distinct: args.distinct ?? undefined,
            orderBy: SchemaBuilderService.withOrderBy(args.orderBy, { createdAt: "desc" }),
            ...(args.paging ?? {}),
          });
        },
      }),
    );

    builder.queryField("countFiles", (t) =>
      t.field({
        description: "Count the number of files.",
        authScopes: { user: true },
        type: "Int",
        args: {
          where: t.arg({ type: FileWhere }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _file, _args, _context, _info) => {
          subscriptions.register("File");
        },
        resolve: async (_root, args, ctx, _info) => {
          return prismaService.prisma.file.count({
            where: narrowToOwner(args.where, ctx),
          });
        },
      }),
    );

    builder.queryField("groupFiles", (t) =>
      t.field({
        description: "Group a list of files.",
        authScopes: { user: true },
        type: ["FileGroupBy"],
        args: {
          by: t.arg({ type: [FileFields], required: true }),
          where: t.arg({ type: FileWhere }),
          aggregate: t.arg({ type: FileAggregate }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _file, _args, _context, _info) => {
          subscriptions.register("File");
        },
        resolve: async (_root, args, ctx, _info) => {
          return prismaService.prisma.file.groupBy({
            by: args.by ?? [],
            ...SchemaBuilderService.aggregateToGroupBy(args.aggregate),
            where: narrowToOwner(args.where, ctx),
          });
        },
      }),
    );
  }
}
