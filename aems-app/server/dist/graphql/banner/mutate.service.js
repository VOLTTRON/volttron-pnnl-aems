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
exports.BannerMutation = void 0;
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const query_service_1 = require("../user/query.service");
const common_2 = require("@local/common");
const query_service_2 = require("./query.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const subscription_service_1 = require("../../subscription/subscription.service");
let BannerMutation = class BannerMutation {
    constructor(builder, prismaService, subscriptionService, bannerQuery, userQuery) {
        const { BannerWhereUnique } = bannerQuery;
        const { UserWhereUnique } = userQuery;
        this.BannerCreate = builder.prismaCreate("Banner", {
            fields: {
                message: "String",
                expiration: "DateTime",
            },
        });
        this.BannerUpdateUsers = builder.prismaUpdateRelation("Banner", "users", {
            fields: {
                connect: UserWhereUnique,
                disconnect: UserWhereUnique,
            },
        });
        this.BannerUpdate = builder.prismaUpdate("Banner", {
            fields: {
                message: "String",
                expiration: "DateTime",
                users: this.BannerUpdateUsers,
            },
        });
        const { BannerCreate, BannerUpdate } = this;
        builder.mutationField("createBanner", (t) => t.prismaField({
            description: "Create a new banner.",
            authScopes: { admin: true },
            type: "Banner",
            args: {
                create: t.arg({ type: BannerCreate, required: true }),
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.banner
                    .create({
                    ...query,
                    data: args.create,
                })
                    .then(async (banner) => {
                    await subscriptionService.publish("Banner", {
                        topic: "Banner",
                        id: banner.id,
                        mutation: common_2.Mutation.Created,
                    });
                    return banner;
                });
            },
        }));
        builder.mutationField("updateBanner", (t) => t.prismaField({
            description: "Update the specified banner.",
            authScopes: { admin: true },
            type: "Banner",
            args: {
                where: t.arg({ type: BannerWhereUnique, required: true }),
                update: t.arg({ type: BannerUpdate, required: true }),
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.banner
                    .update({
                    ...query,
                    where: args.where,
                    data: args.update,
                })
                    .then(async (banner) => {
                    await subscriptionService.publish("Banner", {
                        topic: "Banner",
                        id: banner.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    await subscriptionService.publish(`Banner/${banner.id}`, {
                        topic: "Banner",
                        id: banner.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    return banner;
                });
            },
        }));
        builder.mutationField("deleteBanner", (t) => t.prismaField({
            description: "Delete the specified banner.",
            authScopes: { admin: true },
            type: "Banner",
            args: {
                where: t.arg({ type: BannerWhereUnique, required: true }),
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.banner
                    .delete({
                    ...query,
                    where: args.where,
                })
                    .then(async (banner) => {
                    await subscriptionService.publish("Banner", {
                        topic: "Banner",
                        id: banner.id,
                        mutation: common_2.Mutation.Deleted,
                    });
                    await subscriptionService.publish(`Banner/${banner.id}`, {
                        topic: "Banner",
                        id: banner.id,
                        mutation: common_2.Mutation.Deleted,
                    });
                    return banner;
                });
            },
        }));
    }
};
exports.BannerMutation = BannerMutation;
exports.BannerMutation = BannerMutation = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosMutation)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService,
        query_service_2.BannerQuery,
        query_service_1.UserQuery])
], BannerMutation);
//# sourceMappingURL=mutate.service.js.map