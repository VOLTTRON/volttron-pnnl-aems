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
exports.UserMutation = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@local/common");
const builder_service_1 = require("../builder.service");
const query_service_1 = require("./query.service");
const query_service_2 = require("../account/query.service");
const mutate_service_1 = require("../account/mutate.service");
const query_service_3 = require("../comment/query.service");
const query_service_4 = require("../banner/query.service");
const mutate_service_2 = require("../comment/mutate.service");
const mutate_service_3 = require("../banner/mutate.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const subscription_service_1 = require("../../subscription/subscription.service");
const object_service_1 = require("./object.service");
const query_service_5 = require("../unit/query.service");
let UserMutation = class UserMutation {
    constructor(builder, prismaService, subscriptionService, userObject, userQuery, accountQuery, commentQuery, bannerQuery, unitQuery, accountMutation, commentMutation, bannerMutation) {
        const { UserPreferences } = userObject;
        const { UserWhereUnique } = userQuery;
        const { AccountWhereUnique } = accountQuery;
        const { CommentWhereUnique } = commentQuery;
        const { BannerWhereUnique } = bannerQuery;
        const { UnitWhereUnique } = unitQuery;
        const { AccountCreate } = accountMutation;
        const { CommentCreate } = commentMutation;
        const { BannerCreate } = bannerMutation;
        const UserUpdateUnits = builder.prismaUpdateRelation("User", "units", {
            fields: {
                connect: UnitWhereUnique,
                disconnect: UnitWhereUnique,
            },
        });
        this.UserCreate = builder.prismaCreate("User", {
            fields: {
                name: "String",
                email: "String",
                image: "String",
                role: "String",
                emailVerified: builder.DateTime,
                preferences: UserPreferences,
                password: "String",
                units: UserUpdateUnits,
            },
        });
        this.UserUpdate = builder.prismaUpdate("User", {
            fields: {
                name: "String",
                email: "String",
                image: "String",
                role: "String",
                emailVerified: builder.DateTime,
                preferences: UserPreferences,
                password: "String",
                units: UserUpdateUnits,
            },
        });
        const { UserCreate, UserUpdate } = this;
        this.UserUpdateAccounts = builder.prismaUpdateRelation("User", "accounts", {
            fields: {
                create: AccountCreate,
                connect: AccountWhereUnique,
                disconnect: AccountWhereUnique,
                delete: AccountWhereUnique,
            },
        });
        this.UserUpdateComments = builder.prismaUpdateRelation("User", "comments", {
            fields: {
                create: CommentCreate,
                connect: CommentWhereUnique,
                disconnect: CommentWhereUnique,
                delete: CommentWhereUnique,
            },
        });
        this.UserUpdateBanners = builder.prismaUpdateRelation("User", "banners", {
            fields: {
                create: BannerCreate,
                connect: BannerWhereUnique,
                disconnect: BannerWhereUnique,
                delete: BannerWhereUnique,
            },
        });
        builder.mutationField("createUser", (t) => t.prismaField({
            description: "Create a new user.",
            authScopes: { admin: true },
            type: "User",
            args: {
                create: t.arg({ type: UserCreate, required: true }),
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.user
                    .create({
                    ...query,
                    data: { ...args.create },
                })
                    .then(async (user) => {
                    await subscriptionService.publish("User", { topic: "User", id: user.id, mutation: common_2.Mutation.Created });
                    return user;
                });
            },
        }));
        builder.mutationField("updateUser", (t) => t.prismaField({
            description: "Update the specified user.",
            authScopes: { user: true },
            type: "User",
            args: {
                where: t.arg({ type: UserWhereUnique, required: true }),
                update: t.arg({ type: UserUpdate, required: true }),
            },
            resolve: async (query, _root, args, ctx, _info) => {
                if (!ctx.user?.authRoles.admin && ctx.user?.id !== args.where.id) {
                    throw new Error("Unauthorized: You can only update your own user data");
                }
                let updateData = args.update;
                if (!ctx.user?.authRoles.admin) {
                    updateData = {};
                    if (args.update.password !== undefined) {
                        updateData.password = args.update.password;
                    }
                    if (args.update.preferences !== undefined) {
                        updateData.preferences = args.update.preferences;
                    }
                }
                return prismaService.prisma.user
                    .update({
                    ...query,
                    where: args.where,
                    data: updateData,
                })
                    .then(async (user) => {
                    await subscriptionService.publish("User", { topic: "User", id: user.id, mutation: common_2.Mutation.Updated });
                    await subscriptionService.publish(`User/${user.id}`, {
                        topic: "User",
                        id: user.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    return user;
                });
            },
        }));
        builder.mutationField("deleteUser", (t) => t.prismaField({
            description: "Delete the specified user.",
            authScopes: { admin: true },
            type: "User",
            args: {
                where: t.arg({ type: UserWhereUnique, required: true }),
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.user
                    .delete({
                    ...query,
                    where: args.where,
                })
                    .then(async (user) => {
                    await subscriptionService.publish("User", { topic: "User", id: user.id, mutation: common_2.Mutation.Deleted });
                    await subscriptionService.publish(`User/${user.id}`, {
                        topic: "User",
                        id: user.id,
                        mutation: common_2.Mutation.Deleted,
                    });
                    return user;
                });
            },
        }));
    }
};
exports.UserMutation = UserMutation;
exports.UserMutation = UserMutation = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosMutation)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService,
        object_service_1.UserObject,
        query_service_1.UserQuery,
        query_service_2.AccountQuery,
        query_service_3.CommentQuery,
        query_service_4.BannerQuery,
        query_service_5.UnitQuery,
        mutate_service_1.AccountMutation,
        mutate_service_2.CommentMutation,
        mutate_service_3.BannerMutation])
], UserMutation);
//# sourceMappingURL=mutate.service.js.map