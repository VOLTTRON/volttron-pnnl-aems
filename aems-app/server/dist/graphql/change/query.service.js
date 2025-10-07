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
exports.ChangeQuery = void 0;
const common_1 = require("@nestjs/common");
const object_service_1 = require("./object.service");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const graphql_1 = require("graphql");
const query_service_1 = require("../user/query.service");
let ChangeQuery = class ChangeQuery {
    constructor(builder, prismaService, changeObject, userQuery) {
        const { StringFilter, DateTimeFilter, PagingInput } = builder;
        const { ChangeFields, ChangeMutation } = changeObject;
        const { UserWhere } = userQuery;
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
                user: UserWhere,
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
        builder.addScalarType("ChangeGroupBy", new graphql_1.GraphQLScalarType({
            name: "ChangeGroupBy",
        }));
        const { ChangeWhere, ChangeWhereUnique, ChangeOrderBy, ChangeAggregate } = this;
        builder.queryField("pageChange", (t) => t.prismaConnection({
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
        }));
        builder.queryField("readChange", (t) => t.prismaField({
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
        }));
        builder.queryField("readChanges", (t) => t.prismaField({
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
        }));
        builder.queryField("countChanges", (t) => t.field({
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
        }));
        builder.queryField("groupChanges", (t) => t.field({
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
                    ...builder_service_1.SchemaBuilderService.aggregateToGroupBy(args.aggregate),
                    where: args.where ?? {},
                });
            },
        }));
    }
};
exports.ChangeQuery = ChangeQuery;
exports.ChangeQuery = ChangeQuery = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosQuery)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        prisma_service_1.PrismaService,
        object_service_1.ChangeObject,
        query_service_1.UserQuery])
], ChangeQuery);
//# sourceMappingURL=query.service.js.map