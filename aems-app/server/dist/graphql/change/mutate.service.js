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
exports.ChangeMutation = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@local/common");
const builder_service_1 = require("../builder.service");
const query_service_1 = require("./query.service");
const object_service_1 = require("./object.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const subscription_service_1 = require("../../subscription/subscription.service");
let ChangeMutation = class ChangeMutation {
    constructor(builder, prismaService, subscriptionService, changeQuery, _changeObject) {
        const { ChangeWhereUnique } = changeQuery;
        builder.mutationField("deleteChange", (t) => t.prismaField({
            description: "Delete the specified change.",
            authScopes: { admin: true },
            type: "Change",
            args: {
                where: t.arg({ type: ChangeWhereUnique, required: true }),
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.change
                    .delete({
                    ...query,
                    where: args.where,
                })
                    .then(async (change) => {
                    await subscriptionService.publish("Change", {
                        topic: "Change",
                        id: change.id,
                        mutation: common_2.Mutation.Deleted,
                    });
                    await subscriptionService.publish(`Change/${change.id}`, {
                        topic: "Change",
                        id: change.id,
                        mutation: common_2.Mutation.Deleted,
                    });
                    return change;
                });
            },
        }));
    }
};
exports.ChangeMutation = ChangeMutation;
exports.ChangeMutation = ChangeMutation = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosMutation)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService,
        query_service_1.ChangeQuery,
        object_service_1.ChangeObject])
], ChangeMutation);
//# sourceMappingURL=mutate.service.js.map