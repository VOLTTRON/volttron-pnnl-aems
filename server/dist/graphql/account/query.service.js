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
exports.AccountQuery = void 0;
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const object_service_1 = require("./object.service");
const query_service_1 = require("../user/query.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
let AccountQuery = class AccountQuery {
    constructor(builder, prismaService, accountObject, userQuery) {
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
        const { AccountWhere, AccountWhereUnique, AccountOrderBy, AccountAggregate } = this;
        builder.queryField("pageAccount", (t) => t.prismaConnection({
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
        }));
        builder.queryField("readAccount", (t) => t.prismaField({
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
        }));
        builder.queryField("readAccounts", (t) => t.prismaField({
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
        }));
        builder.queryField("countAccounts", (t) => t.field({
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
        }));
        builder.queryField("groupAccounts", (t) => t.field({
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
                return prismaService.prisma.account
                    .groupBy({
                    by: args.by ?? [],
                    ...builder_service_1.SchemaBuilderService.aggregateToGroupBy(args.aggregate),
                    where: where,
                });
            },
        }));
    }
};
exports.AccountQuery = AccountQuery;
exports.AccountQuery = AccountQuery = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosQuery)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        prisma_service_1.PrismaService,
        object_service_1.AccountObject,
        query_service_1.UserQuery])
], AccountQuery);
//# sourceMappingURL=query.service.js.map