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
        const { AggregationType: AggregationTypeEnum, CalculationType: CalculationTypeEnum } = historianObject;
        this.CalculationOptionsInput = builder.inputType("CalculationOptionsInput", {
            fields: (t) => ({
                window: t.string({
                    description: "Time window for rolling calculations (e.g., '30 minutes', '1 hour')",
                }),
            }),
        });
        builder.queryField("historianCurrentValues", (t) => t.field({
            description: "Get the current (latest) values for multiple topic patterns. Useful for gauges and stat displays.",
            authScopes: { user: true },
            type: [historianObject.HistorianMetricCurrent],
            args: {
                topicPatterns: t.arg.stringList({
                    required: true,
                    description: "Array of topic patterns to query (e.g., 'PNNL/ROB/%/ZoneTemperature')",
                }),
                campus: t.arg.string({
                    description: "Filter by campus",
                }),
                building: t.arg.string({
                    description: "Filter by building",
                }),
                unit: t.arg.string({
                    description: "Filter by unit",
                }),
            },
            resolve: async (_root, args, _ctx, _info) => {
                return historianService.getCurrentValues(args.topicPatterns, args.campus ?? undefined, args.building ?? undefined, args.unit ?? undefined);
            },
        }));
        builder.queryField("historianTimeSeries", (t) => t.field({
            description: "Get time series data for multiple topic patterns. Useful for line charts and time-based visualizations.",
            authScopes: { user: true },
            type: [historianObject.HistorianTimeSeries],
            args: {
                topicPatterns: t.arg.stringList({
                    required: true,
                    description: "Array of topic patterns to query",
                }),
                startTime: t.arg({
                    type: builder.DateTime,
                    required: true,
                    description: "Start time for the time series",
                }),
                endTime: t.arg({
                    type: builder.DateTime,
                    required: true,
                    description: "End time for the time series",
                }),
                campus: t.arg.string({
                    description: "Filter by campus",
                }),
                building: t.arg.string({
                    description: "Filter by building",
                }),
                unit: t.arg.string({
                    description: "Filter by unit",
                }),
            },
            resolve: async (_root, args, _ctx, _info) => {
                return historianService.getTimeSeries(args.topicPatterns, args.startTime, args.endTime, args.campus ?? undefined, args.building ?? undefined, args.unit ?? undefined);
            },
        }));
        builder.queryField("historianAggregated", (t) => t.field({
            description: "Get aggregated historian data with time grouping. Useful for downsampling and performance.",
            authScopes: { user: true },
            type: [historianObject.HistorianAggregate],
            args: {
                topicPattern: t.arg.string({
                    required: true,
                    description: "Topic pattern to query",
                }),
                startTime: t.arg({
                    type: builder.DateTime,
                    required: true,
                    description: "Start time",
                }),
                endTime: t.arg({
                    type: builder.DateTime,
                    required: true,
                    description: "End time",
                }),
                interval: t.arg.string({
                    required: true,
                    description: "Time interval for grouping (e.g., '1m', '5m', '1h')",
                }),
                aggregation: t.arg({
                    type: AggregationTypeEnum,
                    required: true,
                    description: "Type of aggregation to apply",
                }),
                campus: t.arg.string({
                    description: "Filter by campus",
                }),
                building: t.arg.string({
                    description: "Filter by building",
                }),
                unit: t.arg.string({
                    description: "Filter by unit",
                }),
            },
            resolve: async (_root, args, _ctx, _info) => {
                return historianService.getAggregated(args.topicPattern, args.startTime, args.endTime, args.interval, args.aggregation, args.campus ?? undefined, args.building ?? undefined, args.unit ?? undefined);
            },
        }));
        builder.queryField("historianMultiUnit", (t) => t.field({
            description: "Get data for multiple units in a pivoted format. Useful for state timelines and comparisons.",
            authScopes: { user: true },
            type: [historianObject.HistorianMultiUnitData],
            args: {
                topicPattern: t.arg.string({
                    required: true,
                    description: "Topic pattern with %UNIT% placeholder (e.g., 'PNNL/ROB/%UNIT%/OccupancyCommand')",
                }),
                units: t.arg.stringList({
                    required: true,
                    description: "Array of unit names to query (e.g., ['rtu01', 'rtu02', 'rtu03'])",
                }),
                startTime: t.arg({
                    type: builder.DateTime,
                    required: true,
                    description: "Start time",
                }),
                endTime: t.arg({
                    type: builder.DateTime,
                    required: true,
                    description: "End time",
                }),
                interval: t.arg.string({
                    description: "Optional time interval for grouping",
                }),
                campus: t.arg.string({
                    description: "Filter by campus",
                }),
                building: t.arg.string({
                    description: "Filter by building",
                }),
            },
            resolve: async (_root, args, _ctx, _info) => {
                const result = await historianService.getMultiUnit(args.topicPattern, args.units, args.startTime, args.endTime, args.interval ?? undefined, args.campus ?? undefined, args.building ?? undefined);
                return Object.entries(result).map(([unit, data]) => ({
                    unit,
                    data,
                }));
            },
        }));
        builder.queryField("historianCalculated", (t) => t.field({
            description: "Get calculated metrics like setpoint errors or rolling averages.",
            authScopes: { user: true },
            type: [historianObject.HistorianDataPoint],
            args: {
                calculation: t.arg({
                    type: CalculationTypeEnum,
                    required: true,
                    description: "Type of calculation to perform",
                }),
                topicPatterns: t.arg.stringList({
                    required: true,
                    description: "Topic patterns required for the calculation",
                }),
                startTime: t.arg({
                    type: builder.DateTime,
                    required: true,
                    description: "Start time",
                }),
                endTime: t.arg({
                    type: builder.DateTime,
                    required: true,
                    description: "End time",
                }),
                campus: t.arg.string({
                    description: "Filter by campus",
                }),
                building: t.arg.string({
                    description: "Filter by building",
                }),
                unit: t.arg.string({
                    description: "Filter by unit",
                }),
                options: t.arg({
                    type: this.CalculationOptionsInput,
                    description: "Additional options for calculations",
                }),
            },
            resolve: async (_root, args, _ctx, _info) => {
                return historianService.getCalculated(args.calculation, args.topicPatterns, args.startTime, args.endTime, args.campus ?? undefined, args.building ?? undefined, args.unit ?? undefined, args.options);
            },
        }));
    }
};
exports.HistorianQuery = HistorianQuery;
exports.HistorianQuery = HistorianQuery = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosQuery)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        historian_service_1.HistorianService,
        object_service_1.HistorianObject])
], HistorianQuery);
//# sourceMappingURL=query.service.js.map