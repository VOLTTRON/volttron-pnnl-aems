import { UnitMetric, WeatherMetric, MeterMetric, MetricAggregation } from "@local/common";
export type MetricMappingEntry = string | {
    topic?: string;
    aggregation?: MetricAggregation;
};
export interface HistorianTopicMapConfig {
    templates: {
        Unit: string;
        Weather: string;
        Meter: string;
    };
    unitMetrics: Record<UnitMetric, MetricMappingEntry>;
    weatherMetrics: Record<WeatherMetric, MetricMappingEntry>;
    meterMetrics: Record<MeterMetric, MetricMappingEntry>;
}
