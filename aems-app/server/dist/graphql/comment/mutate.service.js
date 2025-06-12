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
exports.CommentMutation = void 0;
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const query_service_1 = require("./query.service");
const query_service_2 = require("../user/query.service");
const common_2 = require("@local/common");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const subscription_service_1 = require("../../subscription/subscription.service");
let CommentMutation = class CommentMutation {
    constructor(builder, prismaService, subscriptionService, commentQuery, userQuery) {
        const { CommentWhereUnique } = commentQuery;
        const { UserWhereUnique } = userQuery;
        this.CommentCreateUser = builder.prismaCreateRelation("Comment", "user", {
            fields: {
                connect: UserWhereUnique,
            },
        });
        this.CommentCreate = builder.prismaCreate("Comment", {
            fields: {
                message: "String",
                user: this.CommentCreateUser,
            },
        });
        this.CommentUpdateUser = builder.prismaUpdateRelation("Comment", "user", {
            fields: {
                connect: UserWhereUnique,
                disconnect: "Boolean",
            },
        });
        this.CommentUpdate = builder.prismaUpdate("Comment", {
            fields: {
                message: "String",
                user: this.CommentUpdateUser,
            },
        });
        const { CommentCreate, CommentUpdate } = this;
        builder.mutationField("createComment", (t) => t.prismaField({
            description: "Create a new comment.",
            authScopes: { user: true },
            type: "Comment",
            args: {
                create: t.arg({ type: CommentCreate, required: true }),
            },
            resolve: async (query, _root, args, ctx, _info) => {
                const create = args.create;
                if (!ctx.user?.authRoles.admin || !create.user) {
                    delete create.user;
                    create.user = { connect: { id: ctx.user?.id } };
                }
                return prismaService.prisma.comment
                    .create({
                    ...query,
                    data: create,
                })
                    .then(async (comment) => {
                    await subscriptionService.publish("Comment", {
                        topic: "Comment",
                        id: comment.id,
                        mutation: common_2.Mutation.Created,
                    });
                    return comment;
                });
            },
        }));
        builder.mutationField("updateComment", (t) => t.prismaField({
            description: "Update the specified comment.",
            authScopes: { user: true },
            type: "Comment",
            args: {
                where: t.arg({ type: CommentWhereUnique, required: true }),
                update: t.arg({ type: CommentUpdate, required: true }),
            },
            resolve: async (query, _root, args, ctx, _info) => {
                const where = args.where ?? {};
                if (!ctx.user?.authRoles.admin) {
                    delete where.user;
                    where.userId = ctx.user?.id;
                }
                return prismaService.prisma.comment
                    .update({
                    ...query,
                    where: where,
                    data: args.update,
                })
                    .then(async (comment) => {
                    await subscriptionService.publish("Comment", {
                        topic: "Comment",
                        id: comment.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    await subscriptionService.publish(`Comment/${comment.id}`, {
                        topic: "Comment",
                        id: comment.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    return comment;
                });
            },
        }));
        builder.mutationField("deleteComment", (t) => t.prismaField({
            description: "Delete the specified comment.",
            authScopes: { user: true },
            type: "Comment",
            args: {
                where: t.arg({ type: CommentWhereUnique, required: true }),
            },
            resolve: async (query, _root, args, ctx, _info) => {
                const where = args.where ?? {};
                if (!ctx.user?.authRoles.admin) {
                    delete where.user;
                    where.userId = ctx.user?.id;
                }
                return prismaService.prisma.comment
                    .delete({
                    ...query,
                    where: where,
                })
                    .then(async (comment) => {
                    await subscriptionService.publish("Comment", {
                        topic: "Comment",
                        id: comment.id,
                        mutation: common_2.Mutation.Deleted,
                    });
                    await subscriptionService.publish(`Comment/${comment.id}`, {
                        topic: "Comment",
                        id: comment.id,
                        mutation: common_2.Mutation.Deleted,
                    });
                    return comment;
                });
            },
        }));
    }
};
exports.CommentMutation = CommentMutation;
exports.CommentMutation = CommentMutation = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosMutation)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService,
        query_service_1.CommentQuery,
        query_service_2.UserQuery])
], CommentMutation);
//# sourceMappingURL=mutate.service.js.map