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
exports.HistorianQuery = void 0;
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
const historian_service_1 = require("../../historian/historian.service");
const object_service_1 = require("./object.service");
let HistorianQuery = class HistorianQuery {
    constructor(builder, historianService, historianObject) {
        const { UnitMetric: UnitMetricEnum, WeatherMetric: WeatherMetricEnum, AggregationType: AggregationTypeEnum, } = historianObject;
        builder.queryField("historianUnitCurrentValue", (t) => t.field({
            description: "Get the current (latest) value for a unit metric",
            authScopes: { user: true },
            type: historianObject.HistorianMetricCurrent,
            nullable: true,
            args: {
                campus: t.arg.string({ required: true }),
                building: t.arg.string({ required: true }),
                system: t.arg.string({ required: true }),
                metric: t.arg({ type: UnitMetricEnum, required: true }),
            },
            resolve: async (_root, args, ctx, _info) => {
                const accessControl = await historianService.filterHistorianAccess(ctx.user?.id, ctx.user?.authRoles.admin ?? false, args.campus, args.building, args.system);
                if (accessControl?.isEmpty) {
                    return null;
                }
                return historianService.getUnitCurrentValue(args.campus, args.building, args.system, args.metric);
            },
        }));
        builder.queryField("historianUnitTimeSeries", (t) => t.field({
            description: "Get time series data for a unit metric",
            authScopes: { user: true },
            type: historianObject.HistorianTimeSeries,
            args: {
                campus: t.arg.string({ required: true }),
                building: t.arg.string({ required: true }),
                system: t.arg.string({ required: true }),
                metric: t.arg({ type: UnitMetricEnum, required: true }),
                startTime: t.arg({ type: builder.DateTime, required: true }),
                endTime: t.arg({ type: builder.DateTime, required: true }),
            },
            resolve: async (_root, args, ctx, _info) => {
                const accessControl = await historianService.filterHistorianAccess(ctx.user?.id, ctx.user?.authRoles.admin ?? false, args.campus, args.building, args.system);
                if (accessControl?.isEmpty) {
                    return { system: args.system, metric: args.metric, data: [] };
                }
                return historianService.getUnitTimeSeries(args.campus, args.building, args.system, args.metric, args.startTime, args.endTime);
            },
        }));
        builder.queryField("historianUnitAggregated", (t) => t.field({
            description: "Get aggregated data for a unit metric",
            authScopes: { user: true },
            type: [historianObject.HistorianAggregate],
            args: {
                campus: t.arg.string({ required: true }),
                building: t.arg.string({ required: true }),
                system: t.arg.string({ required: true }),
                metric: t.arg({ type: UnitMetricEnum, required: true }),
                startTime: t.arg({ type: builder.DateTime, required: true }),
                endTime: t.arg({ type: builder.DateTime, required: true }),
                interval: t.arg.string({ required: true, description: "e.g., '1m', '5m', '1h'" }),
                aggregation: t.arg({ type: AggregationTypeEnum, required: true }),
            },
            resolve: async (_root, args, ctx, _info) => {
                const accessControl = await historianService.filterHistorianAccess(ctx.user?.id, ctx.user?.authRoles.admin ?? false, args.campus, args.building, args.system);
                if (accessControl?.isEmpty) {
                    return [];
                }
                return historianService.getUnitAggregated(args.campus, args.building, args.system, args.metric, args.startTime, args.endTime, args.interval, args.aggregation);
            },
        }));
        builder.queryField("historianWeatherCurrentValue", (t) => t.field({
            description: "Get the current (latest) value for a weather metric",
            authScopes: { user: true },
            type: historianObject.HistorianMetricCurrent,
            nullable: true,
            args: {
                campus: t.arg.string({ required: true }),
                building: t.arg.string({ required: true }),
                metric: t.arg({ type: WeatherMetricEnum, required: true }),
            },
            resolve: async (_root, args, ctx, _info) => {
                const accessControl = await historianService.filterHistorianAccess(ctx.user?.id, ctx.user?.authRoles.admin ?? false, args.campus, args.building);
                if (accessControl?.isEmpty) {
                    return null;
                }
                return historianService.getWeatherCurrentValue(args.campus, args.building, args.metric);
            },
        }));
        builder.queryField("historianWeatherTimeSeries", (t) => t.field({
            description: "Get time series data for a weather metric",
            authScopes: { user: true },
            type: historianObject.HistorianTimeSeries,
            args: {
                campus: t.arg.string({ required: true }),
                building: t.arg.string({ required: true }),
                metric: t.arg({ type: WeatherMetricEnum, required: true }),
                startTime: t.arg({ type: builder.DateTime, required: true }),
                endTime: t.arg({ type: builder.DateTime, required: true }),
            },
            resolve: async (_root, args, ctx, _info) => {
                const accessControl = await historianService.filterHistorianAccess(ctx.user?.id, ctx.user?.authRoles.admin ?? false, args.campus, args.building);
                if (accessControl?.isEmpty) {
                    return { system: "weather", metric: args.metric, data: [] };
                }
                return historianService.getWeatherTimeSeries(args.campus, args.building, args.metric, args.startTime, args.endTime);
            },
        }));
        builder.queryField("historianWeatherAggregated", (t) => t.field({
            description: "Get aggregated data for a weather metric",
            authScopes: { user: true },
            type: [historianObject.HistorianAggregate],
            args: {
                campus: t.arg.string({ required: true }),
                building: t.arg.string({ required: true }),
                metric: t.arg({ type: WeatherMetricEnum, required: true }),
                startTime: t.arg({ type: builder.DateTime, required: true }),
                endTime: t.arg({ type: builder.DateTime, required: true }),
                interval: t.arg.string({ required: true, description: "e.g., '1m', '5m', '1h'" }),
                aggregation: t.arg({ type: AggregationTypeEnum, required: true }),
            },
            resolve: async (_root, args, ctx, _info) => {
                const accessControl = await historianService.filterHistorianAccess(ctx.user?.id, ctx.user?.authRoles.admin ?? false, args.campus, args.building);
                if (accessControl?.isEmpty) {
                    return [];
                }
                return historianService.getWeatherAggregated(args.campus, args.building, args.metric, args.startTime, args.endTime, args.interval, args.aggregation);
            },
        }));
        builder.queryField("historianMultiSystemUnit", (t) => t.field({
            description: "Get data for multiple systems with the same unit metric (for comparison charts)",
            authScopes: { user: true },
            type: [historianObject.HistorianMultiSystemData],
            args: {
                campus: t.arg.string({ required: true }),
                building: t.arg.string({ required: true }),
                systems: t.arg.stringList({ required: true }),
                metric: t.arg({ type: UnitMetricEnum, required: true }),
                startTime: t.arg({ type: builder.DateTime, required: true }),
                endTime: t.arg({ type: builder.DateTime, required: true }),
                interval: t.arg.string({ description: "Optional time interval for grouping" }),
            },
            resolve: async (_root, args, ctx, _info) => {
                const accessControl = await historianService.filterHistorianAccess(ctx.user?.id, ctx.user?.authRoles.admin ?? false, args.campus, args.building, args.systems);
                if (accessControl?.isEmpty) {
                    return [];
                }
                const allowedSystems = accessControl ? accessControl.allowedSystems.map((s) => s.system) : args.systems;
                const result = await historianService.getMultiSystemUnit(args.campus, args.building, allowedSystems, args.metric, args.startTime, args.endTime, args.interval ?? undefined);
                return Object.entries(result).map(([system, data]) => ({
                    system,
                    data,
                }));
            },
        }));
        builder.queryField("historianSetpointError", (t) => t.field({
            description: "Calculate setpoint error (zone temp - setpoint) for a system",
            authScopes: { user: true },
            type: [historianObject.HistorianDataPoint],
            args: {
                campus: t.arg.string({ required: true }),
                building: t.arg.string({ required: true }),
                system: t.arg.string({ required: true }),
                startTime: t.arg({ type: builder.DateTime, required: true }),
                endTime: t.arg({ type: builder.DateTime, required: true }),
            },
            resolve: async (_root, args, ctx, _info) => {
                const accessControl = await historianService.filterHistorianAccess(ctx.user?.id, ctx.user?.authRoles.admin ?? false, args.campus, args.building, args.system);
                if (accessControl?.isEmpty) {
                    return [];
                }
                return historianService.calculateSetpointError(args.campus, args.building, args.system, args.startTime, args.endTime);
            },
        }));
        builder.queryField("historianReplicationInfo", (t) => t.field({
            description: "Get historian database replication setup information and generated SQL (admin only)",
            authScopes: { admin: true },
            type: historianObject.HistorianReplicationInfo,
            resolve: async (_root, _args, _ctx, _info) => {
                return historianService.getReplicationInfo();
            },
        }));
    }
};
exports.HistorianQuery = HistorianQuery;
exports.HistorianQuery = HistorianQuery = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosQuery)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService, historian_service_1.HistorianService, object_service_1.HistorianObject])
], HistorianQuery);
//# sourceMappingURL=query.service.js.map