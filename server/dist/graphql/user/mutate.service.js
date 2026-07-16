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
var UserMutation_1;
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
const keycloak_admin_service_1 = require("../keycloak/keycloak-admin.service");
function validateRoleGrant(requestedRole, caller) {
    if (!requestedRole)
        return;
    const requested = requestedRole.split(/[, |]+/).filter(Boolean);
    const callerRoleNames = caller.roles.map((r) => r.name);
    for (const name of requested) {
        if (!common_2.RoleType.granted(name, ...callerRoleNames)) {
            throw new Error(`You do not have permission to grant the role '${name}'.`);
        }
    }
}
let UserMutation = UserMutation_1 = class UserMutation {
    constructor(builder, prismaService, subscriptionService, userObject, userQuery, accountQuery, commentQuery, bannerQuery, accountMutation, commentMutation, bannerMutation, keycloakAdminService) {
        this.logger = new common_1.Logger(UserMutation_1.name);
        const { UserPreferences } = userObject;
        const { UserWhereUnique } = userQuery;
        const { AccountWhereUnique } = accountQuery;
        const { CommentWhereUnique } = commentQuery;
        const { BannerWhereUnique } = bannerQuery;
        const { AccountCreate } = accountMutation;
        const { CommentCreate } = commentMutation;
        const { BannerCreate } = bannerMutation;
        this.UserCreate = builder.prismaCreate("User", {
            fields: {
                name: "String",
                email: "String",
                image: "String",
                role: "String",
                emailVerified: builder.DateTime,
                preferences: UserPreferences,
                password: "String",
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
            resolve: async (query, _root, args, ctx, _info) => {
                validateRoleGrant(args.create.role, ctx.user);
                return prismaService.prisma.user
                    .create({
                    ...query,
                    data: { ...args.create },
                })
                    .then(async (user) => {
                    await subscriptionService.publish("User", { topic: "User", id: user.id, mutation: common_2.Mutation.Created });
                    if (user.role && common_2.RoleType.Keycloak.granted(...user.role.split(/[, |]+/))) {
                        keycloakAdminService
                            .syncAdminRole(user.id, true)
                            .catch((e) => this.logger.warn(`Failed to sync Keycloak admin role for new user ${user.id}: ${String(e)}`));
                    }
                    return user;
                });
            },
        }));
        builder.mutationField("updateUser", (t) => t.prismaField({
            description: "Update the specified user.",
            authScopes: { admin: true },
            type: "User",
            args: {
                where: t.arg({ type: UserWhereUnique, required: true }),
                update: t.arg({ type: UserUpdate, required: true }),
            },
            resolve: async (query, _root, args, ctx, _info) => {
                let oldRole;
                if (args.update.role !== undefined) {
                    const roleValue = typeof args.update.role === "string" ? args.update.role : args.update.role?.set;
                    validateRoleGrant(roleValue, ctx.user);
                    const existing = await prismaService.prisma.user.findUnique({
                        where: args.where,
                        select: { role: true },
                    });
                    oldRole = existing?.role;
                }
                return prismaService.prisma.user
                    .update({
                    ...query,
                    where: args.where,
                    data: args.update,
                })
                    .then(async (user) => {
                    await subscriptionService.publish("User", { topic: "User", id: user.id, mutation: common_2.Mutation.Updated });
                    await subscriptionService.publish(`User/${user.id}`, {
                        topic: "User",
                        id: user.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    if (args.update.role !== undefined) {
                        const hadKeycloak = common_2.RoleType.Keycloak.granted(...((oldRole ?? "").split(/[, |]+/)));
                        const hasKeycloak = common_2.RoleType.Keycloak.granted(...((user.role ?? "").split(/[, |]+/)));
                        if (hadKeycloak !== hasKeycloak) {
                            keycloakAdminService
                                .syncAdminRole(user.id, hasKeycloak)
                                .catch((e) => this.logger.warn(`Failed to sync Keycloak admin role for user ${user.id}: ${String(e)}`));
                        }
                    }
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
exports.UserMutation = UserMutation = UserMutation_1 = __decorate([
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
        mutate_service_1.AccountMutation,
        mutate_service_2.CommentMutation,
        mutate_service_3.BannerMutation,
        keycloak_admin_service_1.KeycloakAdminService])
], UserMutation);
//# sourceMappingURL=mutate.service.js.map