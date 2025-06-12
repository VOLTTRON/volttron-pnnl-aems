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
exports.CurrentMutation = void 0;
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const common_2 = require("@local/common");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const subscription_service_1 = require("../../subscription/subscription.service");
let CurrentMutation = class CurrentMutation {
    constructor(builder, prismaService, subscriptionService) {
        this.CurrentCreate = builder.prismaCreate("User", {
            name: "CurrentCreateInput",
            fields: {
                name: "String",
                email: "String",
                image: "String",
                preferences: builder.UserPreferences,
                password: "String",
            },
        });
        this.CurrentUpdate = builder.prismaUpdate("User", {
            name: "CurrentUpdateInput",
            fields: {
                name: "String",
                email: "String",
                image: "String",
                preferences: builder.UserPreferences,
                password: "String",
            },
        });
        const { CurrentCreate, CurrentUpdate } = this;
        builder.mutationField("createCurrent", (t) => t.prismaField({
            description: "Create a new user.",
            authScopes: {},
            type: "User",
            args: {
                create: t.arg({ type: CurrentCreate, required: true }),
            },
            resolve: async (query, _root, args, ctx, _info) => {
                if (ctx.user?.id) {
                    throw new Error("User is currently logged in.");
                }
                return prismaService.prisma.user
                    .create({
                    ...query,
                    data: args.create,
                })
                    .then(async (user) => {
                    await subscriptionService.publish("User", {
                        topic: "User",
                        id: user.id,
                        mutation: common_2.Mutation.Created,
                    });
                    return user;
                });
            },
        }));
        builder.mutationField("updateCurrent", (t) => t.prismaField({
            description: "Update the currently logged in user.",
            authScopes: { user: true },
            type: "User",
            args: {
                update: t.arg({ type: CurrentUpdate, required: true }),
            },
            resolve: async (query, _root, args, ctx, _info) => {
                if (!ctx.user?.id) {
                    throw new Error("User must be logged in.");
                }
                return prismaService.prisma.user
                    .update({
                    ...query,
                    where: { id: ctx.user.id },
                    data: args.update,
                })
                    .then(async (user) => {
                    await subscriptionService.publish("User", {
                        topic: "User",
                        id: user.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    await subscriptionService.publish(`User/${user.id}`, {
                        topic: "User",
                        id: user.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    return user;
                });
            },
        }));
        builder.mutationField("deleteCurrent", (t) => t.prismaField({
            description: "Delete the currently logged in user.",
            authScopes: { user: true },
            type: "User",
            resolve: async (query, _root, _args, ctx, _info) => {
                if (!ctx.user?.id) {
                    throw new Error("User must be logged in.");
                }
                return prismaService.prisma.user
                    .delete({
                    ...query,
                    where: { id: ctx.user.id },
                })
                    .then(async (user) => {
                    await subscriptionService.publish("User", {
                        topic: "User",
                        id: user.id,
                        mutation: common_2.Mutation.Deleted,
                    });
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
exports.CurrentMutation = CurrentMutation;
exports.CurrentMutation = CurrentMutation = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosMutation)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService, prisma_service_1.PrismaService, subscription_service_1.SubscriptionService])
], CurrentMutation);
//# sourceMappingURL=mutate.service.js.map