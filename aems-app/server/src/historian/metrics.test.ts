import {
  applyTransform,
  buildMeterTopicPath,
  buildUnitTopicPath,
  buildWeatherTopicPath,
  DefaultTopicTemplates,
  resolveMeterMetricEntry,
  resolveUnitMetricEntry,
  resolveWeatherMetricEntry,
} from "./metrics";
import { MeterMetric, MetricAggregation, MetricTransform, UnitMetric, WeatherMetric } from "@local/common";

describe("applyTransform", () => {
  it("passes null through for every transform", () => {
    for (const t of Object.values(MetricTransform)) {
      expect(applyTransform(null, t)).toBeNull();
    }
  });

  it("returns non-finite inputs unchanged", () => {
    expect(applyTransform(NaN, MetricTransform.Percent)).toBeNaN();
    expect(applyTransform(Infinity, MetricTransform.Integer)).toBe(Infinity);
    expect(applyTransform(-Infinity, MetricTransform.Decimal2)).toBe(-Infinity);
  });

  describe("percent", () => {
    it("scales 0-1 values to whole-number percentages", () => {
      expect(applyTransform(0.98346, MetricTransform.Percent)).toBe(98);
      expect(applyTransform(0, MetricTransform.Percent)).toBe(0);
      expect(applyTransform(1, MetricTransform.Percent)).toBe(100);
      expect(applyTransform(0.5, MetricTransform.Percent)).toBe(50);
    });

    it("does not clamp values outside [0, 1]", () => {
      expect(applyTransform(-0.05, MetricTransform.Percent)).toBe(-5);
      expect(applyTransform(1.5, MetricTransform.Percent)).toBe(150);
      expect(applyTransform(-1.2345, MetricTransform.Percent)).toBe(-123);
    });

    it("rounds to whole numbers", () => {
      expect(applyTransform(0.126, MetricTransform.Percent)).toBe(13);
      expect(applyTransform(0.124, MetricTransform.Percent)).toBe(12);
    });
  });
});

// scenario: topic-path-and-map
describe("historian topic paths", () => {
  it("default a unit topic to {campus}/{building}/{system}/{metric}", () => {
    expect(DefaultTopicTemplates.Unit).toBe("{campus}/{building}/{system}/{metric}");
    expect(buildUnitTopicPath("PNNL", "ROB", "rtu1", UnitMetric.ZoneTemperature)).toBe(
      `PNNL/ROB/rtu1/${UnitMetric.ZoneTemperature}`,
    );
  });

  it("default weather and meter topics to the fixed segment, not the system id", () => {
    expect(DefaultTopicTemplates.Weather).toBe("{campus}/{building}/weather/{metric}");
    expect(DefaultTopicTemplates.Meter).toBe("{campus}/{building}/meter/{metric}");
    expect(buildWeatherTopicPath("PNNL", "ROB", WeatherMetric.AirTemperature)).toBe(
      "PNNL/ROB/weather/air_temperature",
    );
    expect(buildMeterTopicPath("PNNL", "ROB", MeterMetric.Power)).toBe(
      "PNNL/ROB/meter/WholeBuildingPower",
    );
  });

  it("let a topic-map entry override the metric segment", () => {
    const unit = resolveUnitMetricEntry(UnitMetric.ZoneTemperature, {
      unitMetrics: {
        [UnitMetric.ZoneTemperature]: { topic: "ZoneTempF", aggregation: MetricAggregation.Mean },
      } as never,
    });
    expect(unit.topic).toBe("ZoneTempF");

    const weather = resolveWeatherMetricEntry(WeatherMetric.AirTemperature, {
      weatherMetrics: { [WeatherMetric.AirTemperature]: "outside_air_temp" } as never,
    });
    expect(weather.topic).toBe("outside_air_temp");

    const meter = resolveMeterMetricEntry(MeterMetric.Power, {
      meterMetrics: {
        [MeterMetric.Power]: { topic: "SitePower", aggregation: MetricAggregation.Mean },
      } as never,
    });
    expect(meter.topic).toBe("SitePower");

    expect(
      buildUnitTopicPath("PNNL", "ROB", "rtu1", UnitMetric.ZoneTemperature, {
        unitMetrics: { [UnitMetric.ZoneTemperature]: "ZoneTempF" } as never,
      }),
    ).toBe("PNNL/ROB/rtu1/ZoneTempF");
  });

  it("let a topic-map entry override the path template too", () => {
    expect(
      buildUnitTopicPath("PNNL", "ROB", "rtu1", UnitMetric.ZoneTemperature, {
        templates: { Unit: "historian/{campus}.{building}.{system}.{metric}" } as never,
      }),
    ).toBe(`historian/PNNL.ROB.rtu1.${UnitMetric.ZoneTemperature}`);
  });
});
