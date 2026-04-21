import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosQuery } from "../pothos.decorator";
import { HistorianService } from "@/historian/historian.service";
import { HistorianObject } from "./object.service";
import { UnitMetric } from "@local/common";

@Injectable()
@PothosQuery()
export class HistorianQuery {
  constructor(builder: SchemaBuilderService, historianService: HistorianService, historianObject: HistorianObject) {
    const {
      UnitMetric: UnitMetricEnum,
      WeatherMetric: WeatherMetricEnum,
      MeterMetric: MeterMetricEnum,
      AggregationType: AggregationTypeEnum,
    } = historianObject;

    // ========================================================================
    // UNIT METRIC QUERIES
    // ========================================================================

    // Query: Get current value for a unit metric
    builder.queryField("historianUnitCurrentValue", (t) =>
      t.field({
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
          const accessControl = await historianService.filterHistorianAccess(
            ctx.user!,
            args.campus,
            args.building,
            args.system,
          );

          if (accessControl.allowedSystems.length === 0) {
            return null;
          }

          return historianService.getUnitCurrentValue(args.campus, args.building, args.system, args.metric);
        },
      }),
    );

    // Query: Get time series data for a unit metric
    builder.queryField("historianUnitTimeSeries", (t) =>
      t.field({
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
          const accessControl = await historianService.filterHistorianAccess(
            ctx.user!,
            args.campus,
            args.building,
            args.system,
          );

          if (accessControl.allowedSystems.length === 0) {
            return { 
              system: args.system, 
              metric: args.metric, 
              data: [],
              metadata: {
                topics: {},
                errors: [`Access denied: User has no permissions for ${args.campus}/${args.building}/${args.system}`]
              }
            };
          }

          return historianService.getUnitTimeSeries(
            args.campus,
            args.building,
            args.system,
            args.metric,
            args.startTime,
            args.endTime,
          );
        },
      }),
    );

    // Query: Get aggregated data for a unit metric
    builder.queryField("historianUnitAggregated", (t) =>
      t.field({
        description: "Get aggregated data for a unit metric",
        authScopes: { user: true },
        type: historianObject.HistorianAggregateResult,
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
          const accessControl = await historianService.filterHistorianAccess(
            ctx.user!,
            args.campus,
            args.building,
            args.system,
          );

          if (accessControl.allowedSystems.length === 0) {
            return {
              aggregates: [],
              metadata: {
                topics: {},
                errors: [`Access denied: User has no permissions for ${args.campus}/${args.building}/${args.system}`],
              },
            };
          }

          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return historianService.getUnitAggregated(
            args.campus,
            args.building,
            args.system,
            args.metric,
            args.startTime,
            args.endTime,
            args.interval,
            args.aggregation,
          );
        },
      }),
    );

    // ========================================================================
    // WEATHER METRIC QUERIES
    // ========================================================================

    // Query: Get current value for a weather metric
    builder.queryField("historianWeatherCurrentValue", (t) =>
      t.field({
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
          const accessControl = await historianService.filterHistorianAccess(
            ctx.user!,
            args.campus,
            args.building,
            "weather",
          );

          if (accessControl.allowedSystems.length === 0) {
            return null;
          }

          return historianService.getWeatherCurrentValue(args.campus, args.building, args.metric);
        },
      }),
    );

    // Query: Get time series data for a weather metric
    builder.queryField("historianWeatherTimeSeries", (t) =>
      t.field({
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
          const accessControl = await historianService.filterHistorianAccess(
            ctx.user!,
            args.campus,
            args.building,
            "weather",
          );

          if (accessControl.allowedSystems.length === 0) {
            return { 
              system: "weather", 
              metric: args.metric, 
              data: [],
              metadata: {
                topics: {},
                errors: [`Access denied: User has no permissions for ${args.campus}/${args.building}/weather`]
              }
            };
          }

          return historianService.getWeatherTimeSeries(
            args.campus,
            args.building,
            args.metric,
            args.startTime,
            args.endTime,
          );
        },
      }),
    );

    // Query: Get aggregated data for a weather metric
    builder.queryField("historianWeatherAggregated", (t) =>
      t.field({
        description: "Get aggregated data for a weather metric",
        authScopes: { user: true },
        type: historianObject.HistorianAggregateResult,
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
          const accessControl = await historianService.filterHistorianAccess(
            ctx.user!,
            args.campus,
            args.building,
            "weather",
          );

          if (accessControl.allowedSystems.length === 0) {
            return {
              aggregates: [],
              metadata: {
                topics: {},
                errors: [`Access denied: User has no permissions for ${args.campus}/${args.building}/weather`],
              },
            };
          }

          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return historianService.getWeatherAggregated(
            args.campus,
            args.building,
            args.metric,
            args.startTime,
            args.endTime,
            args.interval,
            args.aggregation,
          );
        },
      }),
    );

    // ========================================================================
    // METER METRIC QUERIES
    // ========================================================================

    // Query: Get current value for a meter metric
    builder.queryField("historianMeterCurrentValue", (t) =>
      t.field({
        description: "Get the current (latest) value for a meter metric",
        authScopes: { user: true },
        type: historianObject.HistorianMetricCurrent,
        nullable: true,
        args: {
          campus: t.arg.string({ required: true }),
          building: t.arg.string({ required: true }),
          metric: t.arg({ type: MeterMetricEnum, required: true }),
        },
        resolve: async (_root, args, ctx, _info) => {
          const accessControl = await historianService.filterHistorianAccess(
            ctx.user!,
            args.campus,
            args.building,
            "meter",
          );

          if (accessControl.allowedSystems.length === 0) {
            return null;
          }

          return historianService.getMeterCurrentValue(args.campus, args.building, args.metric);
        },
      }),
    );

    // Query: Get time series data for a meter metric
    builder.queryField("historianMeterTimeSeries", (t) =>
      t.field({
        description: "Get time series data for a meter metric",
        authScopes: { user: true },
        type: historianObject.HistorianTimeSeries,
        args: {
          campus: t.arg.string({ required: true }),
          building: t.arg.string({ required: true }),
          metric: t.arg({ type: MeterMetricEnum, required: true }),
          startTime: t.arg({ type: builder.DateTime, required: true }),
          endTime: t.arg({ type: builder.DateTime, required: true }),
        },
        resolve: async (_root, args, ctx, _info) => {
          const accessControl = await historianService.filterHistorianAccess(
            ctx.user!,
            args.campus,
            args.building,
            "meter",
          );

          if (accessControl.allowedSystems.length === 0) {
            return { 
              system: "meter", 
              metric: args.metric, 
              data: [],
              metadata: {
                topics: {},
                errors: [`Access denied: User has no permissions for ${args.campus}/${args.building}/meter`]
              }
            };
          }

          return historianService.getMeterTimeSeries(
            args.campus,
            args.building,
            args.metric,
            args.startTime,
            args.endTime,
          );
        },
      }),
    );

    // Query: Get aggregated data for a meter metric
    builder.queryField("historianMeterAggregated", (t) =>
      t.field({
        description: "Get aggregated data for a meter metric",
        authScopes: { user: true },
        type: historianObject.HistorianAggregateResult,
        args: {
          campus: t.arg.string({ required: true }),
          building: t.arg.string({ required: true }),
          metric: t.arg({ type: MeterMetricEnum, required: true }),
          startTime: t.arg({ type: builder.DateTime, required: true }),
          endTime: t.arg({ type: builder.DateTime, required: true }),
          interval: t.arg.string({ required: true, description: "e.g., '1m', '5m', '1h'" }),
          aggregation: t.arg({ type: AggregationTypeEnum, required: true }),
        },
        resolve: async (_root, args, ctx, _info) => {
          const accessControl = await historianService.filterHistorianAccess(
            ctx.user!,
            args.campus,
            args.building,
            "meter",
          );

          if (accessControl.allowedSystems.length === 0) {
            return {
              aggregates: [],
              metadata: {
                topics: {},
                errors: [`Access denied: User has no permissions for ${args.campus}/${args.building}/meter`],
              },
            };
          }

          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return historianService.getMeterAggregated(
            args.campus,
            args.building,
            args.metric,
            args.startTime,
            args.endTime,
            args.interval,
            args.aggregation,
          );
        },
      }),
    );

    // ========================================================================
    // MULTI-SYSTEM QUERIES
    // ========================================================================

    // Query: Get multi-system data for a unit metric
    builder.queryField("historianMultiSystemUnit", (t) =>
      t.field({
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
          const accessControl = await historianService.filterHistorianAccess(
            ctx.user!,
            args.campus,
            args.building,
            args.systems,
          );

          const allowedSystems = accessControl.allowedSystems.map((s) => s.system);
          const deniedSystems = args.systems.filter(
            (s) => !allowedSystems.map((a) => a.toLowerCase()).includes(s.toLowerCase()),
          );

          return historianService.getMultiSystemUnit(
            args.campus,
            args.building,
            allowedSystems,
            deniedSystems,
            args.metric,
            args.startTime,
            args.endTime,
            args.interval ?? undefined,
          );
        },
      }),
    );

    // ========================================================================
    // CALCULATED METRICS
    // ========================================================================

    // Query: Calculate setpoint error for a system
    builder.queryField("historianSetpointError", (t) =>
      t.field({
        description: "Calculate setpoint error (zone temp - setpoint) for a system",
        authScopes: { user: true },
        type: historianObject.HistorianTimeSeries,
        args: {
          campus: t.arg.string({ required: true }),
          building: t.arg.string({ required: true }),
          system: t.arg.string({ required: true }),
          startTime: t.arg({ type: builder.DateTime, required: true }),
          endTime: t.arg({ type: builder.DateTime, required: true }),
        },
        resolve: async (_root, args, ctx, _info) => {
          const accessControl = await historianService.filterHistorianAccess(
            ctx.user!,
            args.campus,
            args.building,
            args.system,
          );

          if (accessControl.allowedSystems.length === 0) {
            return {
              system: args.system,
              metric: UnitMetric.ZoneTemperature,
              data: [],
              metadata: {
                topics: {},
                errors: [`Access denied: User has no permissions for ${args.campus}/${args.building}/${args.system}`],
              },
            };
          }

          return historianService.calculateSetpointError(
            args.campus,
            args.building,
            args.system,
            args.startTime,
            args.endTime,
          );
        },
      }),
    );

    // ========================================================================
    // REPLICATION & ADMIN
    // ========================================================================

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
