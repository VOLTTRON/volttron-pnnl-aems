import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosObject } from "../pothos.decorator";
import {
  AggregationType,
  CalculationType,
  HistorianDataPoint,
  HistorianTimeSeries,
  HistorianAggregate,
  HistorianAggregateResult,
  HistorianMetricCurrent,
  HistorianMultiSystemData,
  HistorianReplicationInfo,
  PublisherInfo,
  SubscriberSetupSql,
  MonitoringSql,
  ReplicationSlot,
  UnitMetric,
  WeatherMetric,
  MeterMetric,
} from "@local/common";
import { GraphQLScalarType } from "graphql";

@Injectable()
@PothosObject()
export class HistorianObject {
  readonly HistorianDataPoint;
  readonly HistorianTimeSeries;
  readonly HistorianAggregate;
  readonly HistorianAggregateResult;
  readonly HistorianMetricCurrent;
  readonly HistorianMultiSystemData;
  readonly HistorianReplicationInfo;
  readonly PublisherInfo;
  readonly SubscriberSetupSql;
  readonly MonitoringSql;
  readonly ReplicationSlot;
  readonly AggregationType;
  readonly CalculationType;
  readonly UnitMetric;
  readonly WeatherMetric;
  readonly MeterMetric;

  constructor(builder: SchemaBuilderService) {
    // Enum types
    this.AggregationType = builder.enumType(AggregationType, {
      name: "AggregationType",
      description: "Type of aggregation to apply to historian data",
    });

    this.CalculationType = builder.enumType(CalculationType, {
      name: "CalculationType",
      description: "Type of calculation to perform on historian data",
    });

    this.UnitMetric = builder.enumType(UnitMetric, {
      name: "UnitMetric",
      description: "Available metrics for unit/system data (HVAC equipment)",
    });

    this.WeatherMetric = builder.enumType(WeatherMetric, {
      name: "WeatherMetric",
      description: "Available metrics for weather data",
    });

    this.MeterMetric = builder.enumType(MeterMetric, {
      name: "MeterMetric",
      description: "Available metrics for meter data (building-level power/demand)",
    });

    // Object types
    // Scalar types - registered with builder to match Scalars declaration
    this.HistorianDataPoint = builder.addScalarType(
      "HistorianDataPoint",
      new GraphQLScalarType<HistorianDataPoint, unknown>({ name: "HistorianDataPoint" }),
    );

    this.HistorianTimeSeries = builder.addScalarType(
      "HistorianTimeSeries",
      new GraphQLScalarType<HistorianTimeSeries, unknown>({ name: "HistorianTimeSeries" }),
    );

    this.HistorianAggregate = builder.addScalarType(
      "HistorianAggregate",
      new GraphQLScalarType<HistorianAggregate, unknown>({ name: "HistorianAggregate" }),
    );

    this.HistorianMetricCurrent = builder.addScalarType(
      "HistorianMetricCurrent",
      new GraphQLScalarType<HistorianMetricCurrent, unknown>({ name: "HistorianMetricCurrent" }),
    );

    this.HistorianAggregateResult = builder.addScalarType(
      "HistorianAggregateResult",
      new GraphQLScalarType<HistorianAggregateResult, unknown>({ name: "HistorianAggregateResult" }),
    );

    this.HistorianMultiSystemData = builder.addScalarType(
      "HistorianMultiSystemData",
      new GraphQLScalarType<HistorianMultiSystemData, unknown>({ name: "HistorianMultiSystemData" }),
    );

    // Replication types
    this.HistorianReplicationInfo = builder.addScalarType(
      "HistorianReplicationInfo",
      new GraphQLScalarType<HistorianReplicationInfo, unknown>({ name: "HistorianReplicationInfo" }),
    );

    this.PublisherInfo = builder.addScalarType(
      "PublisherInfo",
      new GraphQLScalarType<PublisherInfo, unknown>({ name: "PublisherInfo" }),
    );

    this.SubscriberSetupSql = builder.addScalarType(
      "SubscriberSetupSql",
      new GraphQLScalarType<SubscriberSetupSql, unknown>({ name: "SubscriberSetupSql" }),
    );

    this.MonitoringSql = builder.addScalarType(
      "MonitoringSql",
      new GraphQLScalarType<MonitoringSql, unknown>({ name: "MonitoringSql" }),
    );

    this.ReplicationSlot = builder.addScalarType(
      "ReplicationSlot",
      new GraphQLScalarType<ReplicationSlot, unknown>({ name: "ReplicationSlot" }),
    );
  }
}
