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
exports.UnitMutation = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@local/common");
const builder_service_1 = require("../builder.service");
const query_service_1 = require("./query.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const subscription_service_1 = require("../../subscription/subscription.service");
const mutate_service_1 = require("../configuration/mutate.service");
const mutate_service_2 = require("../control/mutate.service");
const mutate_service_3 = require("../location/mutate.service");
const change_service_1 = require("../../change/change.service");
const client_1 = require("@prisma/client");
const lodash_1 = require("lodash");
let UnitMutation = class UnitMutation {
    constructor(builder, prismaService, subscriptionService, unitQuery, configurationMutation, controlMutation, locationMutation, changeService) {
        const { UnitWhereUnique } = unitQuery;
        const { ConfigurationUpdate } = configurationMutation;
        const { ControlUpdate } = controlMutation;
        const { LocationUpdate } = locationMutation;
        this.UnitCreate = builder.prismaCreate("Unit", {
            fields: {
                stage: builder.ModelStage,
                message: "String",
                correlation: "String",
                name: "String",
                campus: "String",
                building: "String",
                system: "String",
                timezone: "String",
                label: "String",
                coolingCapacity: "Float",
                compressors: "Int",
                coolingLockout: "Float",
                optimalStartLockout: "Float",
                optimalStartDeviation: "Float",
                earliestStart: "Int",
                latestStart: "Int",
                zoneLocation: "String",
                zoneMass: "String",
                zoneOrientation: "String",
                zoneBuilding: "String",
                heatPump: "Boolean",
                heatPumpBackup: "Float",
                economizer: "Boolean",
                heatPumpLockout: "Float",
                coolingPeakOffset: "Float",
                heatingPeakOffset: "Float",
                peakLoadExclude: "Boolean",
                economizerSetpoint: "Float",
                occupancyDetection: "Boolean",
                configurationId: "String",
                controlId: "String",
                locationId: "String",
            },
        });
        const UnitUpdateConfiguration = builder.prismaUpdateRelation("Unit", "configuration", {
            fields: {
                update: ConfigurationUpdate,
            },
        });
        const UnitUpdateControl = builder.prismaUpdateRelation("Unit", "control", {
            fields: {
                update: ControlUpdate,
            },
        });
        const UnitUpdateLocation = builder.prismaUpdateRelation("Unit", "location", {
            fields: {
                update: LocationUpdate,
            },
        });
        this.UnitUpdate = builder.prismaUpdate("Unit", {
            fields: {
                stage: builder.ModelStage,
                message: "String",
                correlation: "String",
                name: "String",
                campus: "String",
                building: "String",
                system: "String",
                timezone: "String",
                label: "String",
                coolingCapacity: "Float",
                compressors: "Int",
                coolingLockout: "Float",
                optimalStartLockout: "Float",
                optimalStartDeviation: "Float",
                earliestStart: "Int",
                latestStart: "Int",
                zoneLocation: "String",
                zoneMass: "String",
                zoneOrientation: "String",
                zoneBuilding: "String",
                heatPump: "Boolean",
                heatPumpBackup: "Float",
                economizer: "Boolean",
                heatPumpLockout: "Float",
                coolingPeakOffset: "Float",
                heatingPeakOffset: "Float",
                peakLoadExclude: "Boolean",
                economizerSetpoint: "Float",
                occupancyDetection: "Boolean",
                configurationId: "String",
                configuration: UnitUpdateConfiguration,
                controlId: "String",
                control: UnitUpdateControl,
                locationId: "String",
                location: UnitUpdateLocation,
            },
        });
        const { UnitCreate, UnitUpdate } = this;
        builder.mutationField("createUnit", (t) => t.prismaField({
            description: "Create a new unit.",
            authScopes: { admin: true },
            type: "Unit",
            args: {
                create: t.arg({ type: UnitCreate, required: true }),
            },
            resolve: async (query, _root, args, ctx, _info) => {
                return prismaService.prisma.unit
                    .create({
                    ...query,
                    data: { ...args.create },
                    include: {
                        configuration: {
                            include: {
                                setpoint: true,
                                mondaySchedule: true,
                                tuesdaySchedule: true,
                                wednesdaySchedule: true,
                                thursdaySchedule: true,
                                fridaySchedule: true,
                                saturdaySchedule: true,
                                sundaySchedule: true,
                                holidaySchedule: true,
                            },
                        },
                        control: true,
                        location: true,
                    },
                })
                    .then(async (unit) => {
                    await subscriptionService.publish("Unit", { topic: "Unit", id: unit.id, mutation: common_2.Mutation.Created });
                    if (unit) {
                        await changeService.handleChange(unit.label || unit.name || `Unit ${unit.id}`, (0, lodash_1.omit)(unit, ["stage", "message", "configuration", "control", "location"]), "Unit", client_1.ChangeMutation.Create, ctx.user);
                    }
                    if (unit.configuration) {
                        await changeService.handleChange(unit.label || unit.name || `Unit ${unit.id}`, (0, lodash_1.omit)(unit.configuration, [
                            "stage",
                            "message",
                            "setpoint",
                            "mondaySchedule",
                            "tuesdaySchedule",
                            "wednesdaySchedule",
                            "thursdaySchedule",
                            "fridaySchedule",
                            "saturdaySchedule",
                            "sundaySchedule",
                            "holidaySchedule",
                        ]), "Configuration", client_1.ChangeMutation.Create, ctx.user);
                        if (unit.configuration.setpoint) {
                            await changeService.handleChange(unit.label || unit.name || `Unit ${unit.id}`, (0, lodash_1.omit)(unit.configuration.setpoint, ["stage", "message"]), "Setpoint", client_1.ChangeMutation.Create, ctx.user);
                        }
                        const schedules = [
                            unit.configuration.mondaySchedule,
                            unit.configuration.tuesdaySchedule,
                            unit.configuration.wednesdaySchedule,
                            unit.configuration.thursdaySchedule,
                            unit.configuration.fridaySchedule,
                            unit.configuration.saturdaySchedule,
                            unit.configuration.sundaySchedule,
                            unit.configuration.holidaySchedule,
                        ];
                        for (const schedule of schedules) {
                            if (schedule) {
                                await changeService.handleChange(unit.label || unit.name || `Unit ${unit.id}`, (0, lodash_1.omit)(schedule, ["stage", "message"]), "Schedule", client_1.ChangeMutation.Create, ctx.user);
                            }
                        }
                    }
                    if (unit.control) {
                        await changeService.handleChange(unit.label || unit.name || `Unit ${unit.id}`, (0, lodash_1.omit)(unit.control, ["stage", "message"]), "Control", client_1.ChangeMutation.Create, ctx.user);
                    }
                    if (unit.location) {
                        await changeService.handleChange(unit.label || unit.name || `Unit ${unit.id}`, unit.location, "Location", client_1.ChangeMutation.Create, ctx.user);
                    }
                    return unit;
                });
            },
        }));
        builder.mutationField("updateUnit", (t) => t.prismaField({
            description: "Update the specified unit.",
            authScopes: { user: true },
            type: "Unit",
            args: {
                where: t.arg({ type: UnitWhereUnique, required: true }),
                update: t.arg({ type: UnitUpdate, required: true }),
            },
            resolve: async (query, _root, args, ctx, _info) => {
                const before = await prismaService.prisma.unit.findUnique({
                    where: args.where,
                    include: {
                        configuration: {
                            include: {
                                setpoint: true,
                                mondaySchedule: true,
                                tuesdaySchedule: true,
                                wednesdaySchedule: true,
                                thursdaySchedule: true,
                                fridaySchedule: true,
                                saturdaySchedule: true,
                                sundaySchedule: true,
                                holidaySchedule: true,
                            },
                        },
                        control: true,
                        location: true,
                    },
                });
                return prismaService.prisma.unit
                    .update({
                    ...query,
                    where: args.where,
                    data: args.update,
                    include: {
                        configuration: {
                            include: {
                                setpoint: true,
                                mondaySchedule: true,
                                tuesdaySchedule: true,
                                wednesdaySchedule: true,
                                thursdaySchedule: true,
                                fridaySchedule: true,
                                saturdaySchedule: true,
                                sundaySchedule: true,
                                holidaySchedule: true,
                            },
                        },
                        control: true,
                        location: true,
                    },
                })
                    .then(async (unit) => {
                    await subscriptionService.publish("Unit", { topic: "Unit", id: unit.id, mutation: common_2.Mutation.Updated });
                    await subscriptionService.publish(`Unit/${unit.id}`, {
                        topic: "Unit",
                        id: unit.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    if (unit &&
                        !(0, lodash_1.isEqual)((0, lodash_1.omit)(before, ["stage", "message", "corelation", "updatedAt", "configuration", "control", "location"]), (0, lodash_1.omit)(unit, ["stage", "message", "corelation", "updatedAt", "configuration", "control", "location"]))) {
                        await changeService.handleChange(unit.label || unit.name || `Unit ${unit.id}`, (0, lodash_1.omit)(unit, ["configuration", "control", "location"]), "Unit", client_1.ChangeMutation.Update, ctx.user);
                    }
                    if (unit.configuration &&
                        !(0, lodash_1.isEqual)((0, lodash_1.omit)(before?.configuration, [
                            "stage",
                            "message",
                            "corelation",
                            "updatedAt",
                            "setpoint",
                            "mondaySchedule",
                            "tuesdaySchedule",
                            "wednesdaySchedule",
                            "thursdaySchedule",
                            "fridaySchedule",
                            "saturdaySchedule",
                            "sundaySchedule",
                            "holidaySchedule",
                        ]), (0, lodash_1.omit)(unit.configuration, [
                            "stage",
                            "message",
                            "corelation",
                            "updatedAt",
                            "setpoint",
                            "mondaySchedule",
                            "tuesdaySchedule",
                            "wednesdaySchedule",
                            "thursdaySchedule",
                            "fridaySchedule",
                            "saturdaySchedule",
                            "sundaySchedule",
                            "holidaySchedule",
                        ]))) {
                        await changeService.handleChange(unit.label || unit.name || `Unit ${unit.id}`, (0, lodash_1.omit)(unit.configuration, [
                            "stage",
                            "message",
                            "setpoint",
                            "mondaySchedule",
                            "tuesdaySchedule",
                            "wednesdaySchedule",
                            "thursdaySchedule",
                            "fridaySchedule",
                            "saturdaySchedule",
                            "sundaySchedule",
                            "holidaySchedule",
                        ]), "Configuration", client_1.ChangeMutation.Update, ctx.user);
                    }
                    if (unit.configuration?.setpoint &&
                        !(0, lodash_1.isEqual)((0, lodash_1.omit)(before?.configuration?.setpoint, ["stage", "message", "corelation", "updatedAt"]), (0, lodash_1.omit)(unit.configuration.setpoint, ["stage", "message", "corelation", "updatedAt"]))) {
                        await changeService.handleChange(unit.label || unit.name || `Unit ${unit.id}`, (0, lodash_1.omit)(unit.configuration.setpoint, ["stage", "message"]), "Setpoint", client_1.ChangeMutation.Update, ctx.user);
                    }
                    const schedules = [
                        { before: before?.configuration?.mondaySchedule, after: unit.configuration?.mondaySchedule },
                        { before: before?.configuration?.tuesdaySchedule, after: unit.configuration?.tuesdaySchedule },
                        { before: before?.configuration?.wednesdaySchedule, after: unit.configuration?.wednesdaySchedule },
                        { before: before?.configuration?.thursdaySchedule, after: unit.configuration?.thursdaySchedule },
                        { before: before?.configuration?.fridaySchedule, after: unit.configuration?.fridaySchedule },
                        { before: before?.configuration?.saturdaySchedule, after: unit.configuration?.saturdaySchedule },
                        { before: before?.configuration?.sundaySchedule, after: unit.configuration?.sundaySchedule },
                        { before: before?.configuration?.holidaySchedule, after: unit.configuration?.holidaySchedule },
                    ];
                    for (const schedule of schedules) {
                        if (schedule.after &&
                            !(0, lodash_1.isEqual)((0, lodash_1.omit)(schedule.before, ["stage", "message", "corelation", "updatedAt"]), (0, lodash_1.omit)(schedule.after, ["stage", "message", "corelation", "updatedAt"]))) {
                            await changeService.handleChange(unit.label || unit.name || `Unit ${unit.id}`, (0, lodash_1.omit)(schedule.after, ["stage", "message"]), "Schedule", client_1.ChangeMutation.Update, ctx.user);
                        }
                    }
                    if (unit.control &&
                        !(0, lodash_1.isEqual)((0, lodash_1.omit)(before?.control, ["stage", "message", "corelation", "updatedAt"]), (0, lodash_1.omit)(unit.control, ["stage", "message", "corelation", "updatedAt"]))) {
                        await changeService.handleChange(unit.label || unit.name || `Unit ${unit.id}`, (0, lodash_1.omit)(unit.control, ["stage", "message"]), "Control", client_1.ChangeMutation.Update, ctx.user);
                    }
                    if (unit.location &&
                        !(0, lodash_1.isEqual)((0, lodash_1.omit)(before?.location, ["updatedAt"]), (0, lodash_1.omit)(unit.location, ["updatedAt"]))) {
                        await changeService.handleChange(unit.label || unit.name || `Unit ${unit.id}`, unit.location, "Location", client_1.ChangeMutation.Update, ctx.user);
                    }
                    return unit;
                });
            },
        }));
        builder.mutationField("deleteUnit", (t) => t.prismaField({
            description: "Delete the specified unit.",
            authScopes: { admin: true },
            type: "Unit",
            args: {
                where: t.arg({ type: UnitWhereUnique, required: true }),
            },
            resolve: async (query, _root, args, ctx, _info) => {
                return prismaService.prisma.unit
                    .delete({
                    ...query,
                    where: args.where,
                    include: {
                        configuration: {
                            include: {
                                setpoint: true,
                                mondaySchedule: true,
                                tuesdaySchedule: true,
                                wednesdaySchedule: true,
                                thursdaySchedule: true,
                                fridaySchedule: true,
                                saturdaySchedule: true,
                                sundaySchedule: true,
                                holidaySchedule: true,
                            },
                        },
                        control: true,
                        location: true,
                    },
                })
                    .then(async (unit) => {
                    await subscriptionService.publish("Unit", { topic: "Unit", id: unit.id, mutation: common_2.Mutation.Deleted });
                    await subscriptionService.publish(`Unit/${unit.id}`, {
                        topic: "Unit",
                        id: unit.id,
                        mutation: common_2.Mutation.Deleted,
                    });
                    if (unit) {
                        await changeService.handleChange(unit.label || unit.name || `Unit ${unit.id}`, (0, lodash_1.omit)(unit, ["stage", "message", "configuration", "control", "location"]), "Unit", client_1.ChangeMutation.Delete, ctx.user);
                    }
                    if (unit.configuration) {
                        await changeService.handleChange(unit.label || unit.name || `Unit ${unit.id}`, (0, lodash_1.omit)(unit.configuration, [
                            "stage",
                            "message",
                            "setpoint",
                            "mondaySchedule",
                            "tuesdaySchedule",
                            "wednesdaySchedule",
                            "thursdaySchedule",
                            "fridaySchedule",
                            "saturdaySchedule",
                            "sundaySchedule",
                            "holidaySchedule",
                        ]), "Configuration", client_1.ChangeMutation.Delete, ctx.user);
                        if (unit.configuration.setpoint) {
                            await changeService.handleChange(unit.label || unit.name || `Unit ${unit.id}`, (0, lodash_1.omit)(unit.configuration.setpoint, ["stage", "message"]), "Setpoint", client_1.ChangeMutation.Delete, ctx.user);
                        }
                        const schedules = [
                            unit.configuration.mondaySchedule,
                            unit.configuration.tuesdaySchedule,
                            unit.configuration.wednesdaySchedule,
                            unit.configuration.thursdaySchedule,
                            unit.configuration.fridaySchedule,
                            unit.configuration.saturdaySchedule,
                            unit.configuration.sundaySchedule,
                            unit.configuration.holidaySchedule,
                        ];
                        for (const schedule of schedules) {
                            if (schedule) {
                                await changeService.handleChange(unit.label || unit.name || `Unit ${unit.id}`, (0, lodash_1.omit)(schedule, ["stage", "message"]), "Schedule", client_1.ChangeMutation.Delete, ctx.user);
                            }
                        }
                    }
                    if (unit.control) {
                        await changeService.handleChange(unit.label || unit.name || `Unit ${unit.id}`, (0, lodash_1.omit)(unit.control, ["stage", "message"]), "Control", client_1.ChangeMutation.Delete, ctx.user);
                    }
                    if (unit.location) {
                        await changeService.handleChange(unit.label || unit.name || `Unit ${unit.id}`, unit.location, "Location", client_1.ChangeMutation.Delete, ctx.user);
                    }
                    return unit;
                });
            },
        }));
    }
};
exports.UnitMutation = UnitMutation;
exports.UnitMutation = UnitMutation = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosMutation)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService,
        query_service_1.UnitQuery,
        mutate_service_1.ConfigurationMutation,
        mutate_service_2.ControlMutation,
        mutate_service_3.LocationMutation,
        change_service_1.ChangeService])
], UnitMutation);
//# sourceMappingURL=mutate.service.js.map