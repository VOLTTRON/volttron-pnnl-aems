/**
 * Historian configuration types
 * These types are server-side only and used for configuration purposes
 */

import { UnitMetric, WeatherMetric, MeterMetric, MetricAggregation } from "@local/common";

/**
 * Per-metric mapping entry. Two equivalent forms are accepted in the
 * config JSON for ergonomics:
 *
 *  - bare string  -> just the topic name (aggregation falls back to the
 *                    default for that metric kind)
 *  - object form  -> explicit { topic, aggregation }; either field is
 *                    optional and falls back to the default
 */
export type MetricMappingEntry = string | { topic?: string; aggregation?: MetricAggregation };

/**
 * Configuration for historian topic path mapping
 * Allows customization of topic paths and per-metric binning algorithm
 */
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
