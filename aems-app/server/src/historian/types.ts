/**
 * Historian configuration types
 * These types are server-side only and used for configuration purposes
 */

import {
  UnitMetric,
  WeatherMetric,
  MeterMetric,
  MetricAggregation,
  MetricTransform,
  MetricFormat,
} from "@local/common";

/**
 * Per-metric mapping entry. Two equivalent forms are accepted in the
 * config JSON for ergonomics:
 *
 *  - bare string  -> just the topic name (every other field falls back to
 *                    the per-metric default)
 *  - object form  -> any combination of { topic, aggregation, transform,
 *                    format, prefix, suffix }; each field independently
 *                    overrides the per-metric default
 *
 *  - topic       : VOLTTRON topic segment for this metric
 *  - aggregation : SQL aggregation when bucketing samples (mean, mode, ...)
 *  - transform   : server-side number-to-number reduction applied to every
 *                  returned value (none, integer, decimal2, floor, ...)
 *  - format      : client-side number-to-string display style (thousands,
 *                  compact, scientific, none)
 *  - prefix      : free text inserted before the rendered value (no spacing)
 *  - suffix      : free text inserted after the rendered value (no spacing)
 */
export type MetricMappingEntry =
  | string
  | {
      topic?: string;
      aggregation?: MetricAggregation;
      transform?: MetricTransform;
      format?: MetricFormat;
      prefix?: string;
      suffix?: string;
    };

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
