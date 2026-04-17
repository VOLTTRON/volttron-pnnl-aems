import { UnitMetric, WeatherMetric, MeterMetric } from "@local/common";
export interface HistorianTopicMapConfig {
    templates: {
        Unit: string;
        Weather: string;
        Meter: string;
    };
    unitMetrics: Record<UnitMetric, string>;
    weatherMetrics: Record<WeatherMetric, string>;
    meterMetrics: Record<MeterMetric, string>;
}
