import { UnitMetric, WeatherMetric, MeterMetric, MetricAggregation, MetricTransform, MetricFormat } from "@local/common";
export type MetricMappingEntry = string | {
    topic?: string;
    aggregation?: MetricAggregation;
    transform?: MetricTransform;
    format?: MetricFormat;
    prefix?: string;
    suffix?: string;
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
