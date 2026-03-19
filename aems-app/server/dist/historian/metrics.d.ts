export { UnitMetric, WeatherMetric } from "@local/prisma";
import { UnitMetric, WeatherMetric } from "@local/prisma";
export interface MetricInfo {
    topic: UnitMetric | WeatherMetric;
    category: "unit" | "weather";
    description?: string;
    unit?: string;
}
export declare const UnitMetricInfo: Record<UnitMetric, MetricInfo>;
export declare const WeatherMetricInfo: Record<WeatherMetric, MetricInfo>;
export declare function getMetricTopicName(metric: UnitMetric | WeatherMetric): string;
export declare function buildUnitTopicPath(campus: string, building: string, system: string, metric: UnitMetric): string;
export declare function buildWeatherTopicPath(campus: string, building: string, metric: WeatherMetric): string;
