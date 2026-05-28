"use client";

import React from "react";
import { Tooltip } from "@blueprintjs/core";
import clsx from "clsx";
import styles from "./BinningCallout.module.scss";

export interface BinningInfo {
  mode?: "raw" | "binned" | string;
  intervalMs?: number | null;
  intervalLabel?: string | null;
}

interface BinningCalloutProps {
  binning?: BinningInfo | null;
  className?: string;
}

function formatIntervalLabel(info: BinningInfo): string | null {
  if (info.intervalLabel) return info.intervalLabel;
  if (typeof info.intervalMs === "number" && Number.isFinite(info.intervalMs) && info.intervalMs > 0) {
    const ms = info.intervalMs;
    if (ms % 86_400_000 === 0) return `${ms / 86_400_000}d`;
    if (ms % 3_600_000 === 0) return `${ms / 3_600_000}h`;
    if (ms % 60_000 === 0) return `${ms / 60_000}m`;
    return `${Math.round(ms / 1000)}s`;
  }
  return null;
}

// Inspect each query result the dashboard cares about and return the first
// binning record we find. Each result is treated as opaque (codegen scalars)
// so we walk the few known field names defensively.
export function pickBinningInfo(...results: Array<unknown>): BinningInfo | null {
  for (const r of results) {
    if (!r || typeof r !== "object") continue;
    const obj = r as Record<string, unknown>;
    const meta = obj.metadata as Record<string, unknown> | undefined;
    if (meta && typeof meta === "object" && meta.binning && typeof meta.binning === "object") {
      return meta.binning as BinningInfo;
    }
    if (Array.isArray(obj)) {
      for (const entry of obj) {
        const found = pickBinningInfo(entry);
        if (found) return found;
      }
    }
  }
  return null;
}

export function BinningCallout({ binning, className }: BinningCalloutProps) {
  if (!binning || !binning.mode) return null;

  const isBinned = binning.mode === "binned";
  const intervalLabel = isBinned ? formatIntervalLabel(binning) : null;

  const labelText = isBinned
    ? `Binned${intervalLabel ? ` · ${intervalLabel}` : ""}`
    : "Raw data";

  const tooltipContent = isBinned
    ? `Values are aggregated into ${intervalLabel ?? "fixed-width"} buckets. Hover a chart to see which aggregation produced each series, or pick a shorter time range to see raw historian samples.`
    : "Showing raw historian samples at native resolution — no aggregation applied.";

  return (
    <Tooltip content={tooltipContent} placement="top" compact>
      <span
        className={clsx(styles.callout, isBinned ? styles.binned : styles.raw, className)}
        role="status"
        aria-label={tooltipContent}
      >
        <span className={styles.dot} aria-hidden />
        <span className={styles.label}>{labelText}</span>
      </span>
    </Tooltip>
  );
}
