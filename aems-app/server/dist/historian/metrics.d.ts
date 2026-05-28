import { UnitMetric, WeatherMetric, MeterMetric, MetricAggregation, MetricTransform, MetricFormat } from "@local/common";
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
export declare const DefaultMetricTransform = MetricTransform.None;
export declare const DefaultMetricFormat = MetricFormat.None;
export declare const DefaultUnitMetricTransforms: Record<UnitMetric, MetricTransform>;
export declare const DefaultWeatherMetricTransforms: Record<WeatherMetric, MetricTransform>;
export declare const DefaultMeterMetricTransforms: Record<MeterMetric, MetricTransform>;
export declare const DefaultUnitMetricFormats: Record<UnitMetric, MetricFormat>;
export declare const DefaultWeatherMetricFormats: Record<WeatherMetric, MetricFormat>;
export declare const DefaultMeterMetricFormats: Record<MeterMetric, MetricFormat>;
export declare const DefaultUnitMetricSuffixes: Record<UnitMetric, string>;
export declare const DefaultWeatherMetricSuffixes: Record<WeatherMetric, string>;
export declare const DefaultMeterMetricSuffixes: Record<MeterMetric, string>;
export declare const DefaultUnitMetricPrefixes: Record<UnitMetric, string>;
export declare const DefaultWeatherMetricPrefixes: Record<WeatherMetric, string>;
export declare const DefaultMeterMetricPrefixes: Record<MeterMetric, string>;
export declare const WeatherMetricInfo: Record<WeatherMetric, MetricInfo>;
export declare const MeterMetricInfo: Record<MeterMetric, MetricInfo>;
export declare function getMetricTopicName(metric: UnitMetric | WeatherMetric | MeterMetric): string;
export interface ResolvedMetricEntry {
    topic: string;
    aggregation: MetricAggregation;
    transform: MetricTransform;
    format: MetricFormat;
    prefix: string;
    suffix: string;
}
export declare function resolveUnitMetricEntry(metric: UnitMetric, topicMap?: Partial<HistorianTopicMapConfig>): ResolvedMetricEntry;
export declare function resolveWeatherMetricEntry(metric: WeatherMetric, topicMap?: Partial<HistorianTopicMapConfig>): ResolvedMetricEntry;
export declare function resolveMeterMetricEntry(metric: MeterMetric, topicMap?: Partial<HistorianTopicMapConfig>): ResolvedMetricEntry;
export declare function applyTransform(value: number | null, transform: MetricTransform): number | null;
export declare function generateDefaultTopicMapConfig(): HistorianTopicMapConfig;
export declare function buildUnitTopicPath(campus: string, building: string, system: string, metric: UnitMetric, topicMap?: Partial<HistorianTopicMapConfig>): string;
export declare function buildWeatherTopicPath(campus: string, building: string, metric: WeatherMetric, topicMap?: Partial<HistorianTopicMapConfig>): string;
export declare function buildMeterTopicPath(campus: string, building: string, metric: MeterMetric, topicMap?: Partial<HistorianTopicMapConfig>): string;
export declare function aggregationSql(aggregation: MetricAggregation, valueExpr: string, tsExpr?: string): string;
