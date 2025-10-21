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
exports.OccupancyMutation = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@local/common");
const builder_service_1 = require("../builder.service");
const query_service_1 = require("./query.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const subscription_service_1 = require("../../subscription/subscription.service");
const mutate_service_1 = require("../schedule/mutate.service");
const query_service_2 = require("../configuration/query.service");
let OccupancyMutation = class OccupancyMutation {
    constructor(builder, prismaService, subscriptionService, occupancyQuery, scheduleMutation, configurationQuery) {
        const { OccupancyWhereUnique } = occupancyQuery;
        const { ScheduleCreate, ScheduleUpdate } = scheduleMutation;
        const { ConfigurationWhereUnique } = configurationQuery;
        const OccupancyScheduleCreate = builder.prismaCreateRelation("Occupancy", "schedule", {
            fields: {
                create: ScheduleCreate,
            },
        });
        const OccupancyCreateConfiguration = builder.prismaCreateRelation("Occupancy", "configuration", {
            fields: {
                connect: ConfigurationWhereUnique,
            },
        });
        this.OccupancyCreate = builder.prismaCreate("Occupancy", {
            fields: {
                stage: builder.ModelStage,
                message: "String",
                correlation: "String",
                label: "String",
                date: "DateTime",
                scheduleId: "String",
                schedule: OccupancyScheduleCreate,
                configurationId: "String",
                configuration: OccupancyCreateConfiguration,
            },
        });
        const OccupancyScheduleUpdate = builder.prismaUpdateRelation("Occupancy", "schedule", {
            fields: {
                update: ScheduleUpdate,
            },
        });
        const OccupancyUpdateConfiguration = builder.prismaUpdateRelation("Occupancy", "configuration", {
            fields: {
                connect: ConfigurationWhereUnique,
            },
        });
        this.OccupancyUpdate = builder.prismaUpdate("Occupancy", {
            fields: {
                stage: builder.ModelStage,
                message: "String",
                correlation: "String",
                label: "String",
                date: "DateTime",
                scheduleId: "String",
                schedule: OccupancyScheduleUpdate,
                configurationId: "String",
                configuration: OccupancyUpdateConfiguration,
            },
        });
        const { OccupancyCreate, OccupancyUpdate } = this;
        builder.mutationField("createOccupancy", (t) => t.prismaField({
            description: "Create a new occupancy.",
            authScopes: { user: true },
            type: "Occupancy",
            args: {
                create: t.arg({ type: OccupancyCreate, required: true }),
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.occupancy
                    .create({
                    ...query,
                    data: { ...args.create },
                })
                    .then(async (occupancy) => {
                    await subscriptionService.publish("Occupancy", {
                        topic: "Occupancy",
                        id: occupancy.id,
                        mutation: common_2.Mutation.Created,
                    });
                    return occupancy;
                });
            },
        }));
        builder.mutationField("updateOccupancy", (t) => t.prismaField({
            description: "Update the specified occupancy.",
            authScopes: { user: true },
            type: "Occupancy",
            args: {
                where: t.arg({ type: OccupancyWhereUnique, required: true }),
                update: t.arg({ type: OccupancyUpdate, required: true }),
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.occupancy
                    .update({
                    ...query,
                    where: args.where,
                    data: args.update,
                })
                    .then(async (occupancy) => {
                    await subscriptionService.publish("Occupancy", {
                        topic: "Occupancy",
                        id: occupancy.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    await subscriptionService.publish(`Occupancy/${occupancy.id}`, {
                        topic: "Occupancy",
                        id: occupancy.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    return occupancy;
                });
            },
        }));
        builder.mutationField("deleteOccupancy", (t) => t.prismaField({
            description: "Delete the specified occupancy.",
            authScopes: { user: true },
            type: "Occupancy",
            args: {
                where: t.arg({ type: OccupancyWhereUnique, required: true }),
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.occupancy
                    .delete({
                    ...query,
                    where: args.where,
                })
                    .then(async (occupancy) => {
                    await subscriptionService.publish("Occupancy", {
                        topic: "Occupancy",
                        id: occupancy.id,
                        mutation: common_2.Mutation.Deleted,
                    });
                    await subscriptionService.publish(`Occupancy/${occupancy.id}`, {
                        topic: "Occupancy",
                        id: occupancy.id,
                        mutation: common_2.Mutation.Deleted,
                    });
                    return occupancy;
                });
            },
        }));
    }
};
exports.OccupancyMutation = OccupancyMutation;
exports.OccupancyMutation = OccupancyMutation = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosMutation)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService,
        query_service_1.OccupancyQuery,
        mutate_service_1.ScheduleMutation,
        query_service_2.ConfigurationQuery])
], OccupancyMutation);
//# sourceMappingURL=mutate.service.js.map