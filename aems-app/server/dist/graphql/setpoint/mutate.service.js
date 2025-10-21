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
exports.SetpointMutation = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@local/common");
const builder_service_1 = require("../builder.service");
const query_service_1 = require("./query.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const subscription_service_1 = require("../../subscription/subscription.service");
let SetpointMutation = class SetpointMutation {
    constructor(builder, prismaService, subscriptionService, setpointQuery) {
        const { SetpointWhereUnique } = setpointQuery;
        this.SetpointCreate = builder.prismaCreate("Setpoint", {
            fields: {
                stage: builder.ModelStage,
                message: "String",
                correlation: "String",
                label: "String",
                setpoint: "Float",
                deadband: "Float",
                heating: "Float",
                cooling: "Float",
                standbyTime: "Int",
                standbyOffset: "Float",
            },
        });
        this.SetpointUpdate = builder.prismaUpdate("Setpoint", {
            fields: {
                stage: builder.ModelStage,
                message: "String",
                correlation: "String",
                label: "String",
                setpoint: "Float",
                deadband: "Float",
                heating: "Float",
                cooling: "Float",
                standbyTime: "Int",
                standbyOffset: "Float",
            },
        });
        const { SetpointCreate, SetpointUpdate } = this;
        builder.mutationField("createSetpoint", (t) => t.prismaField({
            description: "Create a new setpoint.",
            authScopes: { admin: true },
            type: "Setpoint",
            args: {
                create: t.arg({ type: SetpointCreate, required: true }),
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.setpoint
                    .create({
                    ...query,
                    data: { ...args.create },
                })
                    .then(async (setpoint) => {
                    await subscriptionService.publish("Setpoint", {
                        topic: "Setpoint",
                        id: setpoint.id,
                        mutation: common_2.Mutation.Created,
                    });
                    return setpoint;
                });
            },
        }));
        builder.mutationField("updateSetpoint", (t) => t.prismaField({
            description: "Update the specified setpoint.",
            authScopes: { user: true },
            type: "Setpoint",
            args: {
                where: t.arg({ type: SetpointWhereUnique, required: true }),
                update: t.arg({ type: SetpointUpdate, required: true }),
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.setpoint
                    .update({
                    ...query,
                    where: args.where,
                    data: args.update,
                })
                    .then(async (setpoint) => {
                    await subscriptionService.publish("Setpoint", {
                        topic: "Setpoint",
                        id: setpoint.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    await subscriptionService.publish(`Setpoint/${setpoint.id}`, {
                        topic: "Setpoint",
                        id: setpoint.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    return setpoint;
                });
            },
        }));
        builder.mutationField("deleteSetpoint", (t) => t.prismaField({
            description: "Delete the specified setpoint.",
            authScopes: { admin: true },
            type: "Setpoint",
            args: {
                where: t.arg({ type: SetpointWhereUnique, required: true }),
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.setpoint
                    .delete({
                    ...query,
                    where: args.where,
                })
                    .then(async (setpoint) => {
                    await subscriptionService.publish("Setpoint", {
                        topic: "Setpoint",
                        id: setpoint.id,
                        mutation: common_2.Mutation.Deleted,
                    });
                    await subscriptionService.publish(`Setpoint/${setpoint.id}`, {
                        topic: "Setpoint",
                        id: setpoint.id,
                        mutation: common_2.Mutation.Deleted,
                    });
                    return setpoint;
                });
            },
        }));
    }
};
exports.SetpointMutation = SetpointMutation;
exports.SetpointMutation = SetpointMutation = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosMutation)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService,
        query_service_1.SetpointQuery])
], SetpointMutation);
//# sourceMappingURL=mutate.service.js.map