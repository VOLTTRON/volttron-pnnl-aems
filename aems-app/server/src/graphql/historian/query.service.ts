import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosQuery } from "../pothos.decorator";
import { HistorianService } from "@/historian/historian.service";
import { AggregationType, CalculationType } from "@/historian/historian.types";
import { HistorianObject } from "./object.service";

@Injectable()
@PothosQuery()
export class HistorianQuery {
  readonly CalculationOptionsInput;

  constructor(builder: SchemaBuilderService, historianService: HistorianService, historianObject: HistorianObject) {
    const { AggregationType: AggregationTypeEnum, CalculationType: CalculationTypeEnum } = historianObject;

    // Input type for calculation options
    this.CalculationOptionsInput = builder.inputType("CalculationOptionsInput", {
      fields: (t) => ({
        window: t.string({
          description: "Time window for rolling calculations (e.g., '30 minutes', '1 hour')",
        }),
      }),
    });

    // Query: Get current (latest) values for metrics
    builder.queryField("historianCurrentValues", (t) =>
      t.field({
        description:
          "Get the current (latest) values for multiple topic patterns. Useful for gauges and stat displays.",
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
        resolve: async (_root, args, ctx, _info) => {
          // Apply access control
          const accessControl = await historianService.filterHistorianAccess(
            ctx.user?.id,
            ctx.user?.authRoles.admin ?? false,
            args.campus ?? undefined,
            args.building ?? undefined,
            args.unit ?? undefined,
          );

          // If user has no access, return empty results
          if (accessControl?.isEmpty) {
            return [];
          }

          // Use requested parameters (already validated by access control)
          const campus = args.campus ?? undefined;
          const building = args.building ?? undefined;
          const unit = args.unit ?? undefined;

          return historianService.getCurrentValues(args.topicPatterns, campus, building, unit);
        },
      }),
    );

    // Query: Get time series data
    builder.queryField("historianTimeSeries", (t) =>
      t.field({
        description:
          "Get time series data for multiple topic patterns. Useful for line charts and time-based visualizations.",
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
        resolve: async (_root, args, ctx, _info) => {
          // Apply access control
          const accessControl = await historianService.filterHistorianAccess(
            ctx.user?.id,
            ctx.user?.authRoles.admin ?? false,
            args.campus ?? undefined,
            args.building ?? undefined,
            args.unit ?? undefined,
          );

          // If user has no access, return empty results
          if (accessControl?.isEmpty) {
            return [];
          }

          // Use requested parameters (already validated by access control)
          const campus = args.campus ?? undefined;
          const building = args.building ?? undefined;
          const unit = args.unit ?? undefined;

          return historianService.getTimeSeries(
            args.topicPatterns,
            args.startTime,
            args.endTime,
            campus,
            building,
            unit,
          );
        },
      }),
    );

    // Query: Get aggregated data
    builder.queryField("historianAggregated", (t) =>
      t.field({
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
        resolve: async (_root, args, ctx, _info) => {
          // Apply access control
          const accessControl = await historianService.filterHistorianAccess(
            ctx.user?.id,
            ctx.user?.authRoles.admin ?? false,
            args.campus ?? undefined,
            args.building ?? undefined,
            args.unit ?? undefined,
          );

          // If user has no access, return empty results
          if (accessControl?.isEmpty) {
            return [];
          }

          // Use requested parameters (already validated by access control)
          const campus = args.campus ?? undefined;
          const building = args.building ?? undefined;
          const unit = args.unit ?? undefined;

          return historianService.getAggregated(
            args.topicPattern,
            args.startTime,
            args.endTime,
            args.interval,
            args.aggregation as AggregationType,
            campus,
            building,
            unit,
          );
        },
      }),
    );

    // Query: Get multi-unit data
    builder.queryField("historianMultiUnit", (t) =>
      t.field({
        description: "Get data for multiple units in a pivoted format. Useful for state timelines and comparisons.",
        authScopes: { user: true },
        type: [historianObject.HistorianMultiUnitData],
        args: {
          topicPattern: t.arg.string({
            required: true,
            description: "Topic pattern with %UNIT% placeholder (e.g., 'PNNL/ROB/%UNIT%/OccupancyCommand')",
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
          units: t.arg.stringList({
            required: true,
            description: "Array of unit names to query (e.g., ['rtu01', 'rtu02', 'rtu03'])",
          }),
        },
        resolve: async (_root, args, ctx, _info) => {
          // Apply access control for multi-unit query
          const accessControl = await historianService.filterHistorianAccess(
            ctx.user?.id,
            ctx.user?.authRoles.admin ?? false,
            args.campus ?? undefined,
            args.building ?? undefined,
            args.units, // Pass the array of requested units
          );

          // If user has no access, return empty results
          if (accessControl?.isEmpty) {
            return [];
          }

          // Use filtered unit list or original if admin
          const allowedUnitNames = accessControl ? accessControl.allowedUnits.map((u) => u.unit) : args.units;

          const result = await historianService.getMultiUnit(
            args.topicPattern,
            allowedUnitNames,
            args.startTime,
            args.endTime,
            args.interval ?? undefined,
            args.campus ?? undefined,
            args.building ?? undefined,
          );

          // Transform Record<string, DataPoint[]> to array format
          return Object.entries(result).map(([unit, data]) => ({
            unit,
            data,
          }));
        },
      }),
    );

    // Query: Get calculated metrics
    builder.queryField("historianCalculated", (t) =>
      t.field({
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
        resolve: async (_root, args, ctx, _info) => {
          // Apply access control
          const accessControl = await historianService.filterHistorianAccess(
            ctx.user?.id,
            ctx.user?.authRoles.admin ?? false,
            args.campus ?? undefined,
            args.building ?? undefined,
            args.unit ?? undefined,
          );

          // If user has no access, return empty results
          if (accessControl?.isEmpty) {
            return [];
          }

          // Use requested parameters (already validated by access control)
          const campus = args.campus ?? undefined;
          const building = args.building ?? undefined;
          const unit = args.unit ?? undefined;

          return historianService.getCalculated(
            args.calculation as CalculationType,
            args.topicPatterns,
            args.startTime,
            args.endTime,
            campus,
            building,
            unit,
            args.options as Record<string, string> | undefined,
          );
        },
      }),
    );

    // Query: Get replication information (admin only)
    builder.queryField("historianReplicationInfo", (t) =>
      t.field({
        description: "Get historian database replication setup information and generated SQL (admin only)",
        authScopes: { admin: true },
        type: historianObject.HistorianReplicationInfo,
        resolve: async (_root, _args, _ctx, _info) => {
          return historianService.getReplicationInfo();
        },
      }),
    );
  }
}
