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
exports.FeedbackQuery = void 0;
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const object_service_1 = require("./object.service");
const query_service_1 = require("../user/query.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const graphql_1 = require("graphql");
let FeedbackQuery = class FeedbackQuery {
    constructor(builder, prismaService, feedbackObject, userQuery) {
        const { DateTimeFilter, PagingInput, StringFilter } = builder;
        const { FeedbackFields } = feedbackObject;
        const { UserWhereUnique } = userQuery;
        this.FeedbackStatusFilter = builder.prismaFilter("FeedbackStatus", {
            ops: ["equals", "not", "in", "mode"],
        });
        this.FeedbackWhereUnique = builder.prismaWhereUnique("Feedback", {
            fields: {
                id: "String",
            },
        });
        this.FeedbackWhere = builder.prismaWhere("Feedback", {
            fields: {
                OR: true,
                AND: true,
                NOT: true,
                id: StringFilter,
                message: StringFilter,
                status: this.FeedbackStatusFilter,
                createdAt: DateTimeFilter,
                updatedAt: DateTimeFilter,
                userId: StringFilter,
                user: UserWhereUnique,
            },
        });
        this.FeedbackOrderBy = builder.prismaOrderBy("Feedback", {
            fields: {
                id: true,
                status: true,
                message: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        this.FeedbackAggregate = builder.inputType("FeedbackAggregate", {
            fields: (t) => ({
                average: t.field({ type: [FeedbackFields] }),
                count: t.field({ type: [FeedbackFields] }),
                maximum: t.field({ type: [FeedbackFields] }),
                minimum: t.field({ type: [FeedbackFields] }),
                sum: t.field({ type: [FeedbackFields] }),
            }),
        });
        builder.addScalarType("FeedbackGroupBy", new graphql_1.GraphQLScalarType({
            name: "FeedbackGroupBy",
        }));
        const { FeedbackWhere, FeedbackWhereUnique, FeedbackOrderBy, FeedbackAggregate } = this;
        builder.queryField("pageFeedback", (t) => t.prismaConnection({
            description: "Paginate through multiple feedback.",
            authScopes: { user: true },
            type: "Feedback",
            cursor: "id",
            args: {
                where: t.arg({ type: FeedbackWhere }),
            },
            resolve: async (query, _parent, args, _ctx, _info) => {
                return prismaService.prisma.feedback.findMany({
                    ...query,
                    where: args.where ?? {},
                });
            },
        }));
        builder.queryField("readFeedback", (t) => t.prismaField({
            description: "read a unique feedback",
            authScopes: { user: true },
            type: "Feedback",
            args: {
                where: t.arg({ type: FeedbackWhereUnique, required: true }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _feedback, args, _context, _info) => {
                subscriptions.register(`Feedback/${args.where.id}`);
            },
            resolve: async (_query, _root, args, ctx, _info) => {
                const where = args.where ?? {};
                if (!ctx.user?.authRoles.admin) {
                    delete where.user;
                    where.userId = ctx.user?.id;
                }
                return prismaService.prisma.feedback.findUniqueOrThrow({
                    where: args.where,
                });
            },
        }));
        builder.queryField("readFeedbacks", (t) => t.prismaField({
            description: "Read a list of feedback.",
            authScopes: { user: true },
            type: ["Feedback"],
            args: {
                where: t.arg({ type: FeedbackWhere }),
                distinct: t.arg({ type: [FeedbackFields] }),
                orderBy: t.arg({ type: [FeedbackOrderBy] }),
                paging: t.arg({ type: PagingInput }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _feedback, _args, _context, _info) => {
                subscriptions.register(`Feedback`);
            },
            resolve: async (query, _root, args, ctx, _info) => {
                const where = args.where ?? {};
                if (!ctx.user?.authRoles.admin) {
                    delete where.user;
                    where.userId = ctx.user?.id;
                }
                return prismaService.prisma.feedback.findMany({
                    ...query,
                    where: args.where ?? undefined,
                    distinct: args.distinct ?? undefined,
                    orderBy: args.orderBy ?? {},
                    ...(args.paging ?? {}),
                });
            },
        }));
        builder.queryField("countFeedbacks", (t) => t.field({
            description: "Count the number of feedbacks.",
            authScopes: { user: true },
            type: "Int",
            args: {
                where: t.arg({ type: FeedbackWhere }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _feedback, _args, _context, _info) => {
                subscriptions.register("Feedback");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.feedback.count({
                    where: args.where ?? undefined,
                });
            },
        }));
        builder.queryField("groupFeedbacks", (t) => t.field({
            description: "Group a list of feedbacks.",
            authScopes: { user: true },
            type: ["FeedbackGroupBy"],
            args: {
                by: t.arg({ type: [FeedbackFields], required: true }),
                where: t.arg({ type: FeedbackWhere }),
                aggregate: t.arg({ type: FeedbackAggregate }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _feedback, _args, _context, _info) => {
                subscriptions.register("Feedback");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.feedback.groupBy({
                    by: args.by ?? [],
                    ...builder_service_1.SchemaBuilderService.aggregateToGroupBy(args.aggregate),
                    where: args.where ?? undefined,
                });
            },
        }));
    }
};
exports.FeedbackQuery = FeedbackQuery;
exports.FeedbackQuery = FeedbackQuery = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosQuery)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        prisma_service_1.PrismaService,
        object_service_1.FeedbackObject,
        query_service_1.UserQuery])
], FeedbackQuery);
//# sourceMappingURL=query.service.js.map