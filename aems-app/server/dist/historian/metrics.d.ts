import { UnitMetric, WeatherMetric, MeterMetric } from "@local/common";
export interface MetricInfo {
    topic: UnitMetric | WeatherMetric | MeterMetric;
    category: "unit" | "weather" | "meter";
    description?: string;
    unit?: string;
}
export declare const UnitMetricInfo: Record<UnitMetric, MetricInfo>;
export declare const WeatherMetricInfo: Record<WeatherMetric, MetricInfo>;
export declare const MeterMetricInfo: Record<MeterMetric, MetricInfo>;
export declare function getMetricTopicName(metric: UnitMetric | WeatherMetric | MeterMetric): string;
export declare function buildUnitTopicPath(campus: string, building: string, system: string, metric: UnitMetric): string;
export declare function buildWeatherTopicPath(campus: string, building: string, metric: WeatherMetric): string;
export declare function buildMeterTopicPath(campus: string, building: string, metric: MeterMetric): string;
