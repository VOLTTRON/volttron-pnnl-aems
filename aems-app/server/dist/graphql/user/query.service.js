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
exports.UserQuery = void 0;
const common_1 = require("@nestjs/common");
const object_service_1 = require("./object.service");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const graphql_1 = require("graphql");
let UserQuery = class UserQuery {
    constructor(builder, prismaService, userObject) {
        const { StringFilter, DateTimeFilter, PagingInput } = builder;
        const { UserFields } = userObject;
        this.UserAggregate = builder.inputType("UserAggregate", {
            fields: (t) => ({
                average: t.field({ type: [UserFields] }),
                count: t.field({ type: [UserFields] }),
                maximum: t.field({ type: [UserFields] }),
                minimum: t.field({ type: [UserFields] }),
                sum: t.field({ type: [UserFields] }),
            }),
        });
        this.UserWhereUnique = builder.prismaWhereUnique("User", {
            fields: {
                id: "String",
            },
        });
        this.UserWhere = builder.prismaWhere("User", {
            fields: {
                OR: true,
                AND: true,
                NOT: true,
                id: StringFilter,
                name: StringFilter,
                email: StringFilter,
                image: StringFilter,
                role: StringFilter,
                emailVerified: DateTimeFilter,
                createdAt: DateTimeFilter,
                updatedAt: DateTimeFilter,
            },
        });
        this.UserOrderBy = builder.prismaOrderBy("User", {
            fields: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                emailVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        builder.addScalarType("UserGroupBy", new graphql_1.GraphQLScalarType({
            name: "UserGroupBy",
        }));
        const { UserWhere, UserWhereUnique, UserOrderBy, UserAggregate } = this;
        builder.queryField("pageUser", (t) => t.prismaConnection({
            description: "Paginate through multiple users.",
            authScopes: { admin: true },
            type: "User",
            cursor: "id",
            args: {
                where: t.arg({ type: UserWhere }),
            },
            resolve: async (query, _parent, args, _ctx, _info) => {
                return prismaService.prisma.user.findMany({
                    ...query,
                    where: args.where ?? {},
                });
            },
        }));
        builder.queryField("readUser", (t) => t.prismaField({
            description: "Read a unique user.",
            authScopes: { user: true },
            type: "User",
            args: {
                where: t.arg({ type: UserWhereUnique, required: true }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _parent, args, _context, _info) => {
                subscriptions.register(`User/${args.where.id}`);
            },
            resolve: async (query, _root, args, ctx, _info) => {
                if (!ctx.user?.authRoles.admin && ctx.user?.id !== args.where.id) {
                    throw new Error("Unauthorized: You can only access your own user data");
                }
                return prismaService.prisma.user.findUniqueOrThrow({
                    ...query,
                    where: args.where,
                });
            },
        }));
        builder.queryField("readUsers", (t) => t.prismaField({
            description: "Read a list of user.",
            authScopes: { admin: true },
            type: ["User"],
            args: {
                where: t.arg({ type: UserWhere }),
                distinct: t.arg({ type: [UserFields] }),
                orderBy: t.arg({ type: [UserOrderBy] }),
                paging: t.arg({ type: PagingInput }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _parent, _args, _context, _info) => {
                subscriptions.register("User");
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.user.findMany({
                    ...query,
                    where: args.where ?? {},
                    distinct: args.distinct ?? undefined,
                    orderBy: args.orderBy ?? {},
                    ...(args.paging ?? {}),
                });
            },
        }));
        builder.queryField("countUsers", (t) => t.field({
            description: "Count the number of user.",
            authScopes: { admin: true },
            type: "Int",
            args: {
                where: t.arg({ type: UserWhere }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _parent, _args, _context, _info) => {
                subscriptions.register("User");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.user.count({
                    where: args.where ?? {},
                });
            },
        }));
        builder.queryField("groupUsers", (t) => t.field({
            description: "Group a list of user.",
            authScopes: { admin: true },
            type: ["UserGroupBy"],
            args: {
                by: t.arg({ type: [UserFields], required: true }),
                where: t.arg({ type: UserWhere }),
                aggregate: t.arg({ type: UserAggregate }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _parent, _args, _context, _info) => {
                subscriptions.register("User");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.user.groupBy({
                    by: args.by ?? [],
                    ...builder_service_1.SchemaBuilderService.aggregateToGroupBy(args.aggregate),
                    where: args.where ?? {},
                });
            },
        }));
    }
};
exports.UserQuery = UserQuery;
exports.UserQuery = UserQuery = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosQuery)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService, prisma_service_1.PrismaService, object_service_1.UserObject])
], UserQuery);
//# sourceMappingURL=query.service.js.map