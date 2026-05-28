import { MetricFormat } from "@local/prisma";

export interface HistorianFormatMetadata {
  format?: MetricFormat | string | null;
  prefix?: string | null;
  suffix?: string | null;
  aggregation?: string | null;
}

export interface HistorianFormatOptions {
  includeAggregation?: boolean;
  nullText?: string;
}

const thousandsFormatter = new Intl.NumberFormat(undefined, { useGrouping: true });
const compactFormatter = new Intl.NumberFormat(undefined, { notation: "compact" });

const formatNumber = (value: number, format: MetricFormat | string | null | undefined): string => {
  switch (format) {
    case MetricFormat.Thousands:
      return thousandsFormatter.format(value);
    case MetricFormat.Compact:
      return compactFormatter.format(value);
    case MetricFormat.Scientific:
      return value.toExponential(2);
    default:
      return String(value);
  }
};

export function formatHistorianValue(
  value: number | string | null | undefined,
  metadata?: HistorianFormatMetadata,
  options?: HistorianFormatOptions,
): string {
  const nullText = options?.nullText ?? "N/A";
  if (value == null) return nullText;

  const prefix = metadata?.prefix ?? "";
  const suffix = metadata?.suffix ?? "";
  const text = typeof value === "number" ? formatNumber(value, metadata?.format) : String(value);
  const base = `${prefix}${text}${suffix}`;

  if (options?.includeAggregation && metadata?.aggregation) {
    return `${base} (${metadata.aggregation})`;
  }
  return base;
}

export function makeValueFormatter(
  metadata?: HistorianFormatMetadata,
  options?: HistorianFormatOptions,
): (value: unknown) => string {
  return (value: unknown) => formatHistorianValue(value as number | string | null | undefined, metadata, options);
}
