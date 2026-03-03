import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosObject } from "../pothos.decorator";
import {
  AggregationType,
  CalculationType,
  HistorianDataPoint,
  HistorianTimeSeries,
  HistorianAggregate,
  HistorianMetricCurrent,
  HistorianMultiUnitData,
} from "@/historian/historian.types";
import { GraphQLScalarType } from "graphql";

@Injectable()
@PothosObject()
export class HistorianObject {
  readonly HistorianDataPoint;
  readonly HistorianTimeSeries;
  readonly HistorianAggregate;
  readonly HistorianMetricCurrent;
  readonly HistorianMultiUnitData;
  readonly AggregationType;
  readonly CalculationType;

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

    this.HistorianMultiUnitData = builder.addScalarType(
      "HistorianMultiUnitData",
      new GraphQLScalarType<HistorianMultiUnitData, unknown>({ name: "HistorianMultiUnitData" }),
    );
  }
}
