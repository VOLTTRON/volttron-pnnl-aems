"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentQuery = void 0;
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const object_service_1 = require("./object.service");
const query_service_1 = require("../user/query.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
let CommentQuery = class CommentQuery {
    constructor(builder, prismaService, commentObject, userQuery) {
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
        builder.queryField("pageComment", (t) => t.prismaConnection({
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
        }));
        builder.queryField("readComment", (t) => t.prismaField({
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
        }));
        builder.queryField("readComments", (t) => t.prismaField({
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
        }));
        builder.queryField("countComments", (t) => t.field({
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
        }));
        builder.queryField("groupComments", (t) => t.field({
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
                    ...builder_service_1.SchemaBuilderService.aggregateToGroupBy(args.aggregate),
                    where: args.where ?? undefined,
                });
            },
        }));
    }
};
exports.CommentQuery = CommentQuery;
exports.CommentQuery = CommentQuery = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosQuery)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        prisma_service_1.PrismaService,
        object_service_1.CommentObject,
        query_service_1.UserQuery])
], CommentQuery);
//# sourceMappingURL=query.service.js.map