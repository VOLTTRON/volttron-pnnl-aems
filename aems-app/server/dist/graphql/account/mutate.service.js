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
exports.AccountMutation = void 0;
const common_1 = require("@local/common");
const common_2 = require("@nestjs/common");
const query_service_1 = require("./query.service");
const builder_service_1 = require("../builder.service");
const query_service_2 = require("../user/query.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const subscription_service_1 = require("../../subscription/subscription.service");
let AccountMutation = class AccountMutation {
    constructor(builder, prismaService, subscriptionService, accountQuery, userQuery) {
        const { AccountWhereUnique } = accountQuery;
        const { UserWhereUnique } = userQuery;
        this.AccountCreateUser = builder.prismaCreateRelation("Account", "user", {
            fields: {
                connect: UserWhereUnique,
            },
        });
        this.AccountCreate = builder.prismaCreate("Account", {
            fields: {
                type: "String",
                provider: "String",
                providerAccountId: "String",
                expiresAt: "Int",
                scope: "String",
                idToken: "String",
                user: this.AccountCreateUser,
            },
        });
        this.AccountUpdateUser = builder.prismaUpdateRelation("Account", "user", {
            fields: {
                connect: UserWhereUnique,
                disconnect: "Boolean",
            },
        });
        this.AccountUpdate = builder.prismaUpdate("Account", {
            fields: {
                type: "String",
                provider: "String",
                providerAccountId: "String",
                expiresAt: "Int",
                scope: "String",
                idToken: "String",
                user: this.AccountUpdateUser,
            },
        });
        const { AccountCreate, AccountUpdate } = this;
        builder.mutationField("createAccount", (t) => t.prismaField({
            description: "Create a new account.",
            authScopes: { admin: true },
            type: "Account",
            args: {
                create: t.arg({ type: AccountCreate, required: true }),
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.account
                    .create({
                    ...query,
                    data: args.create,
                })
                    .then(async (account) => {
                    await subscriptionService.publish("Account", {
                        topic: "Account",
                        id: account.id,
                        mutation: common_1.Mutation.Created,
                    });
                    return account;
                });
            },
        }));
        builder.mutationField("updateAccount", (t) => t.prismaField({
            description: "Update the specified account.",
            authScopes: { admin: true },
            type: "Account",
            args: {
                where: t.arg({ type: AccountWhereUnique, required: true }),
                update: t.arg({ type: AccountUpdate, required: true }),
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.account
                    .update({
                    ...query,
                    where: args.where,
                    data: args.update,
                })
                    .then(async (account) => {
                    await subscriptionService.publish("Account", {
                        topic: "Account",
                        id: account.id,
                        mutation: common_1.Mutation.Updated,
                    });
                    await subscriptionService.publish(`Account/${account.id}`, {
                        topic: "Account",
                        id: account.id,
                        mutation: common_1.Mutation.Updated,
                    });
                    return account;
                });
            },
        }));
        builder.mutationField("deleteAccount", (t) => t.prismaField({
            description: "Delete the specified account.",
            authScopes: { admin: true },
            type: "Account",
            args: {
                where: t.arg({ type: AccountWhereUnique, required: true }),
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.account
                    .delete({
                    ...query,
                    where: args.where,
                })
                    .then(async (account) => {
                    await subscriptionService.publish("Account", {
                        topic: "Account",
                        id: account.id,
                        mutation: common_1.Mutation.Deleted,
                    });
                    await subscriptionService.publish(`Account/${account.id}`, {
                        topic: "Account",
                        id: account.id,
                        mutation: common_1.Mutation.Deleted,
                    });
                    return account;
                });
            },
        }));
    }
};
exports.AccountMutation = AccountMutation;
exports.AccountMutation = AccountMutation = __decorate([
    (0, common_2.Injectable)(),
    (0, pothos_decorator_1.PothosMutation)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService,
        query_service_1.AccountQuery,
        query_service_2.UserQuery])
], AccountMutation);
//# sourceMappingURL=mutate.service.js.map