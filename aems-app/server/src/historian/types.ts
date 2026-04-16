/**
 * Historian configuration types
 * These types are server-side only and used for configuration purposes
 */

import { UnitMetric, WeatherMetric, MeterMetric } from "@local/common";

/**
 * Configuration for historian topic path mapping
 * Allows customization of topic paths and metric names
 */
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
