import { HistorianObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";

function makeBuilder(): SchemaBuilderService {
  return {
    enumType: jest.fn(() => ({})),
    addScalarType: jest.fn((name: string) => name),
  } as unknown as SchemaBuilderService;
}

describe("HistorianObject", () => {
  it("constructs without throwing", () => {
    const builder = makeBuilder();
    expect(() => new HistorianObject(builder)).not.toThrow();
  });

  it("registers all scalar types via addScalarType", () => {
    const builder = makeBuilder();
    new HistorianObject(builder);
    const calls = (builder.addScalarType as jest.Mock).mock.calls.map((c) => c[0]);
    expect(calls).toEqual(
      expect.arrayContaining([
        "HistorianDataPoint",
        "HistorianTimeSeries",
        "HistorianAggregate",
        "HistorianAggregateResult",
        "HistorianMetricCurrent",
        "HistorianMultiSystemData",
        "HistorianReplicationInfo",
        "PublisherInfo",
        "SubscriberSetupSql",
        "MonitoringSql",
        "ReplicationSlot",
      ]),
    );
  });

  it("registers metric and aggregation enum types", () => {
    const builder = makeBuilder();
    new HistorianObject(builder);
    const enumNames = (builder.enumType as jest.Mock).mock.calls.map((c) => c[1]?.name);
    expect(enumNames).toEqual(
      expect.arrayContaining([
        "AggregationType",
        "CalculationType",
        "UnitMetric",
        "WeatherMetric",
        "MeterMetric",
      ]),
    );
  });

  it("assigns all scalar and enum properties", () => {
    const builder = makeBuilder();
    const instance = new HistorianObject(builder);
    expect(instance.HistorianDataPoint).toBeDefined();
    expect(instance.HistorianTimeSeries).toBeDefined();
    expect(instance.HistorianAggregate).toBeDefined();
    expect(instance.HistorianAggregateResult).toBeDefined();
    expect(instance.HistorianMetricCurrent).toBeDefined();
    expect(instance.HistorianMultiSystemData).toBeDefined();
    expect(instance.AggregationType).toBeDefined();
    expect(instance.CalculationType).toBeDefined();
    expect(instance.UnitMetric).toBeDefined();
    expect(instance.WeatherMetric).toBeDefined();
    expect(instance.MeterMetric).toBeDefined();
  });
});
