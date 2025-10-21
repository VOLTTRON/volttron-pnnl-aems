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
exports.ConfigurationMutation = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@local/common");
const builder_service_1 = require("../builder.service");
const query_service_1 = require("./query.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const subscription_service_1 = require("../../subscription/subscription.service");
const mutate_service_1 = require("../setpoint/mutate.service");
const mutate_service_2 = require("../schedule/mutate.service");
const mutate_service_3 = require("../occupancy/mutate.service");
const query_service_2 = require("../occupancy/query.service");
const mutate_service_4 = require("../holiday/mutate.service");
const query_service_3 = require("../holiday/query.service");
let ConfigurationMutation = class ConfigurationMutation {
    constructor(builder, prismaService, subscriptionService, configurationQuery, setpointMutation, scheduleMutation, occupancyQuery, occupancyMutation, holidayQuery, holidayMutation) {
        const { ConfigurationWhereUnique } = configurationQuery;
        const { SetpointUpdate } = setpointMutation;
        const { ScheduleUpdate } = scheduleMutation;
        const { OccupancyWhereUnique } = occupancyQuery;
        const { OccupancyCreate } = occupancyMutation;
        const { HolidayWhereUnique } = holidayQuery;
        const { HolidayCreate } = holidayMutation;
        const ConfigurationCreateOccupancy = builder.prismaCreateRelation("Configuration", "occupancies", {
            fields: {
                create: OccupancyCreate,
            },
        });
        const ConfigurationCreateHoliday = builder.prismaCreateRelation("Configuration", "holidays", {
            fields: {
                create: HolidayCreate,
            },
        });
        this.ConfigurationCreate = builder.prismaCreate("Configuration", {
            fields: {
                stage: builder.ModelStage,
                message: "String",
                correlation: "String",
                label: "String",
                setpointId: "String",
                mondayScheduleId: "String",
                tuesdayScheduleId: "String",
                wednesdayScheduleId: "String",
                thursdayScheduleId: "String",
                fridayScheduleId: "String",
                saturdayScheduleId: "String",
                sundayScheduleId: "String",
                holidayScheduleId: "String",
                occupancies: ConfigurationCreateOccupancy,
                holidays: ConfigurationCreateHoliday,
            },
        });
        const ConfigurationUpdateSetpoint = builder.prismaUpdateRelation("Configuration", "setpoint", {
            fields: {
                update: SetpointUpdate,
            },
        });
        const ConfigurationUpdateMondaySchedule = builder.prismaUpdateRelation("Configuration", "mondaySchedule", {
            fields: {
                update: ScheduleUpdate,
            },
        });
        const ConfigurationUpdateTuesdaySchedule = builder.prismaUpdateRelation("Configuration", "tuesdaySchedule", {
            fields: {
                update: ScheduleUpdate,
            },
        });
        const ConfigurationUpdateWednesdaySchedule = builder.prismaUpdateRelation("Configuration", "wednesdaySchedule", {
            fields: {
                update: ScheduleUpdate,
            },
        });
        const ConfigurationUpdateThursdaySchedule = builder.prismaUpdateRelation("Configuration", "thursdaySchedule", {
            fields: {
                update: ScheduleUpdate,
            },
        });
        const ConfigurationUpdateFridaySchedule = builder.prismaUpdateRelation("Configuration", "fridaySchedule", {
            fields: {
                update: ScheduleUpdate,
            },
        });
        const ConfigurationUpdateSaturdaySchedule = builder.prismaUpdateRelation("Configuration", "saturdaySchedule", {
            fields: {
                update: ScheduleUpdate,
            },
        });
        const ConfigurationUpdateSundaySchedule = builder.prismaUpdateRelation("Configuration", "sundaySchedule", {
            fields: {
                update: ScheduleUpdate,
            },
        });
        const ConfigurationUpdateHolidaySchedule = builder.prismaUpdateRelation("Configuration", "holidaySchedule", {
            fields: {
                update: ScheduleUpdate,
            },
        });
        const ConfigurationUpdateOccupancies = builder.prismaUpdateRelation("Configuration", "occupancies", {
            fields: {
                connect: OccupancyWhereUnique,
                delete: OccupancyWhereUnique,
            },
        });
        const ConfigurationUpdateHoliday = builder.prismaUpdateRelation("Configuration", "holidays", {
            fields: {
                connect: HolidayWhereUnique,
                delete: HolidayWhereUnique,
            },
        });
        this.ConfigurationUpdate = builder.prismaUpdate("Configuration", {
            fields: {
                stage: builder.ModelStage,
                message: "String",
                correlation: "String",
                label: "String",
                setpointId: "String",
                setpoint: ConfigurationUpdateSetpoint,
                mondayScheduleId: "String",
                mondaySchedule: ConfigurationUpdateMondaySchedule,
                tuesdayScheduleId: "String",
                tuesdaySchedule: ConfigurationUpdateTuesdaySchedule,
                wednesdayScheduleId: "String",
                wednesdaySchedule: ConfigurationUpdateWednesdaySchedule,
                thursdayScheduleId: "String",
                thursdaySchedule: ConfigurationUpdateThursdaySchedule,
                fridayScheduleId: "String",
                fridaySchedule: ConfigurationUpdateFridaySchedule,
                saturdayScheduleId: "String",
                saturdaySchedule: ConfigurationUpdateSaturdaySchedule,
                sundayScheduleId: "String",
                sundaySchedule: ConfigurationUpdateSundaySchedule,
                holidayScheduleId: "String",
                holidaySchedule: ConfigurationUpdateHolidaySchedule,
                occupancies: ConfigurationUpdateOccupancies,
                holidays: ConfigurationUpdateHoliday,
            },
        });
        const { ConfigurationCreate, ConfigurationUpdate } = this;
        builder.mutationField("createConfiguration", (t) => t.prismaField({
            description: "Create a new configuration.",
            authScopes: { admin: true },
            type: "Configuration",
            args: {
                create: t.arg({ type: ConfigurationCreate, required: true }),
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.configuration
                    .create({
                    ...query,
                    data: { ...args.create },
                })
                    .then(async (configuration) => {
                    await subscriptionService.publish("Configuration", {
                        topic: "Configuration",
                        id: configuration.id,
                        mutation: common_2.Mutation.Created,
                    });
                    return configuration;
                });
            },
        }));
        builder.mutationField("updateConfiguration", (t) => t.prismaField({
            description: "Update the specified configuration.",
            authScopes: { user: true },
            type: "Configuration",
            args: {
                where: t.arg({ type: ConfigurationWhereUnique, required: true }),
                update: t.arg({ type: ConfigurationUpdate, required: true }),
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.configuration
                    .update({
                    ...query,
                    where: args.where,
                    data: args.update,
                })
                    .then(async (configuration) => {
                    await subscriptionService.publish("Configuration", {
                        topic: "Configuration",
                        id: configuration.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    await subscriptionService.publish(`Configuration/${configuration.id}`, {
                        topic: "Configuration",
                        id: configuration.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    return configuration;
                });
            },
        }));
        builder.mutationField("deleteConfiguration", (t) => t.prismaField({
            description: "Delete the specified configuration.",
            authScopes: { admin: true },
            type: "Configuration",
            args: {
                where: t.arg({ type: ConfigurationWhereUnique, required: true }),
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.configuration
                    .delete({
                    ...query,
                    where: args.where,
                })
                    .then(async (configuration) => {
                    await subscriptionService.publish("Configuration", {
                        topic: "Configuration",
                        id: configuration.id,
                        mutation: common_2.Mutation.Deleted,
                    });
                    await subscriptionService.publish(`Configuration/${configuration.id}`, {
                        topic: "Configuration",
                        id: configuration.id,
                        mutation: common_2.Mutation.Deleted,
                    });
                    return configuration;
                });
            },
        }));
    }
};
exports.ConfigurationMutation = ConfigurationMutation;
exports.ConfigurationMutation = ConfigurationMutation = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosMutation)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService,
        query_service_1.ConfigurationQuery,
        mutate_service_1.SetpointMutation,
        mutate_service_2.ScheduleMutation,
        query_service_2.OccupancyQuery,
        mutate_service_3.OccupancyMutation,
        query_service_3.HolidayQuery,
        mutate_service_4.HolidayMutation])
], ConfigurationMutation);
//# sourceMappingURL=mutate.service.js.map