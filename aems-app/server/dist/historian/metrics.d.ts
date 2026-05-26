import { UnitMetric, WeatherMetric, MeterMetric, MetricAggregation } from "@local/common";
import { HistorianTopicMapConfig } from "./types";
export declare const DefaultTopicTemplates: {
    readonly Unit: "{campus}/{building}/{system}/{metric}";
    readonly Weather: "{campus}/{building}/weather/{metric}";
    readonly Meter: "{campus}/{building}/meter/{metric}";
};
export interface MetricInfo {
    topic: UnitMetric | WeatherMetric | MeterMetric;
    category: "unit" | "weather" | "meter";
    description?: string;
    unit?: string;
}
export declare const UnitMetricInfo: Record<UnitMetric, MetricInfo>;
export declare const DefaultWeatherMetricMappings: Record<WeatherMetric, string>;
export declare const DefaultMeterMetricMappings: Record<MeterMetric, string>;
export declare const DefaultMetricAggregation = MetricAggregation.Mean;
export declare const DefaultUnitMetricAggregations: Record<UnitMetric, MetricAggregation>;
export declare const DefaultWeatherMetricAggregations: Record<WeatherMetric, MetricAggregation>;
export declare const DefaultMeterMetricAggregations: Record<MeterMetric, MetricAggregation>;
export declare const WeatherMetricInfo: Record<WeatherMetric, MetricInfo>;
export declare const MeterMetricInfo: Record<MeterMetric, MetricInfo>;
export declare function getMetricTopicName(metric: UnitMetric | WeatherMetric | MeterMetric): string;
export declare function resolveUnitMetricEntry(metric: UnitMetric, topicMap?: Partial<HistorianTopicMapConfig>): {
    topic: string;
    aggregation: MetricAggregation;
};
export declare function resolveWeatherMetricEntry(metric: WeatherMetric, topicMap?: Partial<HistorianTopicMapConfig>): {
    topic: string;
    aggregation: MetricAggregation;
};
export declare function resolveMeterMetricEntry(metric: MeterMetric, topicMap?: Partial<HistorianTopicMapConfig>): {
    topic: string;
    aggregation: MetricAggregation;
};
export declare function generateDefaultTopicMapConfig(): HistorianTopicMapConfig;
export declare function buildUnitTopicPath(campus: string, building: string, system: string, metric: UnitMetric, topicMap?: Partial<HistorianTopicMapConfig>): string;
export declare function buildWeatherTopicPath(campus: string, building: string, metric: WeatherMetric, topicMap?: Partial<HistorianTopicMapConfig>): string;
export declare function buildMeterTopicPath(campus: string, building: string, metric: MeterMetric, topicMap?: Partial<HistorianTopicMapConfig>): string;
export declare function aggregationSql(aggregation: MetricAggregation, valueExpr: string, tsExpr?: string): string;
