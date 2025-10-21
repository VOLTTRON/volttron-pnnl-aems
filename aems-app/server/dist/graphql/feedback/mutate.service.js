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
exports.FeedbackMutation = void 0;
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const query_service_1 = require("../file/query.service");
const common_2 = require("@local/common");
const query_service_2 = require("./query.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const subscription_service_1 = require("../../subscription/subscription.service");
const object_service_1 = require("./object.service");
let FeedbackMutation = class FeedbackMutation {
    constructor(builder, prismaService, subscriptionService, feedbackObject, feedbackQuery, fileQuery) {
        const { FeedbackStatus } = feedbackObject;
        const { FeedbackWhereUnique } = feedbackQuery;
        const { FileWhereUnique } = fileQuery;
        this.FeedbackCreateFiles = builder.prismaUpdateRelation("Feedback", "files", {
            fields: {
                connect: FileWhereUnique,
            },
        });
        this.FeedbackCreate = builder.prismaCreate("Feedback", {
            fields: {
                message: "String",
                files: this.FeedbackCreateFiles,
            },
        });
        this.FeedbackUpdate = builder.prismaUpdate("Feedback", {
            fields: {
                status: FeedbackStatus,
                assigneeId: "String",
            },
        });
        const { FeedbackCreate, FeedbackUpdate } = this;
        builder.mutationField("createFeedback", (t) => t.prismaField({
            description: "Create new feedback.",
            authScopes: { user: true },
            type: "Feedback",
            args: {
                create: t.arg({ type: FeedbackCreate }),
            },
            resolve: async (query, _root, args, ctx, _info) => {
                if (!ctx.user?.id) {
                    throw new Error("No user logged in");
                }
                if (!args.create) {
                    throw new Error("Feedback message required");
                }
                return prismaService.prisma.feedback
                    .create({
                    ...query,
                    data: {
                        userId: ctx.user.id,
                        message: args.create.message,
                        files: args.create.files,
                    },
                })
                    .then(async (feedback) => {
                    await subscriptionService.publish("Feedback", {
                        topic: "Feedback",
                        id: feedback.id,
                        mutation: common_2.Mutation.Created,
                    });
                    return feedback;
                });
            },
        }));
        builder.mutationField("updateFeedback", (t) => t.prismaField({
            description: "Update the specified feedback status.",
            authScopes: { admin: true },
            type: "Feedback",
            args: {
                where: t.arg({ type: FeedbackWhereUnique, required: true }),
                update: t.arg({ type: FeedbackUpdate, required: true }),
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.feedback
                    .update({
                    ...query,
                    where: args.where,
                    data: args.update,
                })
                    .then(async (feedback) => {
                    await subscriptionService.publish("Feedback", {
                        topic: "Feedback",
                        id: feedback.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    await subscriptionService.publish(`Feedback/${feedback.id}`, {
                        topic: "Feedback",
                        id: feedback.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    return feedback;
                });
            },
        }));
        builder.mutationField("deleteFeedback", (t) => t.prismaField({
            description: "Delete the specified feedback.",
            authScopes: { admin: true },
            type: "Feedback",
            args: {
                where: t.arg({ type: FeedbackWhereUnique, required: true }),
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.feedback
                    .delete({
                    ...query,
                    where: args.where,
                })
                    .then(async (feedback) => {
                    await subscriptionService.publish("Feedback", {
                        topic: "Feedback",
                        id: feedback.id,
                        mutation: common_2.Mutation.Deleted,
                    });
                    await subscriptionService.publish(`Feedback/${feedback.id}`, {
                        topic: "Feedback",
                        id: feedback.id,
                        mutation: common_2.Mutation.Deleted,
                    });
                    return feedback;
                });
            },
        }));
    }
};
exports.FeedbackMutation = FeedbackMutation;
exports.FeedbackMutation = FeedbackMutation = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosMutation)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService,
        object_service_1.FeedbackObject,
        query_service_2.FeedbackQuery,
        query_service_1.FileQuery])
], FeedbackMutation);
//# sourceMappingURL=mutate.service.js.map