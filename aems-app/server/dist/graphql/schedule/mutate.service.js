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
exports.ScheduleMutation = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@local/common");
const builder_service_1 = require("../builder.service");
const query_service_1 = require("./query.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const subscription_service_1 = require("../../subscription/subscription.service");
const mutate_service_1 = require("../setpoint/mutate.service");
const change_service_1 = require("../../change/change.service");
const client_1 = require("@prisma/client");
const lodash_1 = require("lodash");
let ScheduleMutation = class ScheduleMutation {
    constructor(builder, prismaService, subscriptionService, scheduleQuery, setpointMutation, changeService) {
        const { ScheduleWhereUnique } = scheduleQuery;
        const { SetpointCreate, SetpointUpdate } = setpointMutation;
        const ScheduleSetpointCreate = builder.prismaCreateRelation("Schedule", "setpoint", {
            fields: {
                create: SetpointCreate,
            },
        });
        this.ScheduleCreate = builder.prismaCreate("Schedule", {
            fields: {
                stage: builder.ModelStage,
                message: "String",
                correlation: "String",
                label: "String",
                startTime: "String",
                endTime: "String",
                occupied: "Boolean",
                setpointId: "String",
                setpoint: ScheduleSetpointCreate,
            },
        });
        const ScheduleSetpointUpdate = builder.prismaUpdateRelation("Schedule", "setpoint", {
            fields: {
                update: SetpointUpdate,
            },
        });
        this.ScheduleUpdate = builder.prismaUpdate("Schedule", {
            fields: {
                stage: builder.ModelStage,
                message: "String",
                correlation: "String",
                label: "String",
                startTime: "String",
                endTime: "String",
                occupied: "Boolean",
                setpointId: "String",
                setpoint: ScheduleSetpointUpdate,
            },
        });
        const { ScheduleCreate, ScheduleUpdate } = this;
        builder.mutationField("createSchedule", (t) => t.prismaField({
            description: "Create a new schedule.",
            authScopes: { admin: true },
            type: "Schedule",
            args: {
                create: t.arg({ type: ScheduleCreate, required: true }),
            },
            resolve: async (query, _root, args, ctx, _info) => {
                return prismaService.prisma.schedule
                    .create({
                    ...query,
                    data: { ...args.create },
                    include: { setpoint: true },
                })
                    .then(async (schedule) => {
                    await subscriptionService.publish("Schedule", {
                        topic: "Schedule",
                        id: schedule.id,
                        mutation: common_2.Mutation.Created,
                    });
                    await changeService.handleChange("Unknown", (0, lodash_1.omit)(schedule, ["stage", "message", "setpoint"]), "Schedule", client_1.ChangeMutation.Create, ctx.user);
                    if (schedule.setpoint) {
                        await changeService.handleChange("Unknown", (0, lodash_1.omit)(schedule.setpoint, ["stage", "message"]), "Setpoint", client_1.ChangeMutation.Create, ctx.user);
                    }
                    return schedule;
                });
            },
        }));
        builder.mutationField("updateSchedule", (t) => t.prismaField({
            description: "Update the specified schedule.",
            authScopes: { user: true },
            type: "Schedule",
            args: {
                where: t.arg({ type: ScheduleWhereUnique, required: true }),
                update: t.arg({ type: ScheduleUpdate, required: true }),
            },
            resolve: async (query, _root, args, ctx, _info) => {
                return prismaService.prisma.schedule
                    .update({
                    ...query,
                    where: args.where,
                    data: args.update,
                    include: { setpoint: true },
                })
                    .then(async (schedule) => {
                    await subscriptionService.publish("Schedule", {
                        topic: "Schedule",
                        id: schedule.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    await subscriptionService.publish(`Schedule/${schedule.id}`, {
                        topic: "Schedule",
                        id: schedule.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    await changeService.handleChange("Unknown", (0, lodash_1.omit)(schedule, ["stage", "message", "setpoint"]), "Schedule", client_1.ChangeMutation.Update, ctx.user);
                    if (schedule.setpoint) {
                        await changeService.handleChange("Unknown", (0, lodash_1.omit)(schedule.setpoint, ["stage", "message"]), "Setpoint", client_1.ChangeMutation.Update, ctx.user);
                    }
                    return schedule;
                });
            },
        }));
        builder.mutationField("deleteSchedule", (t) => t.prismaField({
            description: "Delete the specified schedule.",
            authScopes: { admin: true },
            type: "Schedule",
            args: {
                where: t.arg({ type: ScheduleWhereUnique, required: true }),
            },
            resolve: async (query, _root, args, ctx, _info) => {
                return prismaService.prisma.schedule
                    .delete({
                    ...query,
                    where: args.where,
                    include: { setpoint: true },
                })
                    .then(async (schedule) => {
                    await subscriptionService.publish("Schedule", {
                        topic: "Schedule",
                        id: schedule.id,
                        mutation: common_2.Mutation.Deleted,
                    });
                    await subscriptionService.publish(`Schedule/${schedule.id}`, {
                        topic: "Schedule",
                        id: schedule.id,
                        mutation: common_2.Mutation.Deleted,
                    });
                    await changeService.handleChange("Unknown", (0, lodash_1.omit)(schedule, ["stage", "message", "setpoint"]), "Schedule", client_1.ChangeMutation.Delete, ctx.user);
                    if (schedule.setpoint) {
                        await changeService.handleChange("Unknown", (0, lodash_1.omit)(schedule.setpoint, ["stage", "message"]), "Setpoint", client_1.ChangeMutation.Delete, ctx.user);
                    }
                    return schedule;
                });
            },
        }));
    }
};
exports.ScheduleMutation = ScheduleMutation;
exports.ScheduleMutation = ScheduleMutation = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosMutation)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService,
        query_service_1.ScheduleQuery,
        mutate_service_1.SetpointMutation,
        change_service_1.ChangeService])
], ScheduleMutation);
//# sourceMappingURL=mutate.service.js.map