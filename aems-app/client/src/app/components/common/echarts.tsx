import React, { useRef, useEffect } from "react";
import { init, getInstanceByDom } from "echarts";
import type { CSSProperties } from "react";
import type { EChartsOption, ECharts, SetOptionOpts } from "echarts";
import { Mode } from "@local/prisma";

const ICON_ALL =
  "path://M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M10,17L5,12L6.41,10.58L10,14.17L17.59,6.58L19,8L10,17Z";
const ICON_NONE =
  "path://M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,5V19H5V5H19Z";
const ICON_SOME =
  "path://M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M17,13H7V11H17V13Z";

type LegendState = "all" | "none" | "some";

function getLegendNames(option: any): string[] {
  const rawLegend = option?.legend;
  const legendCfg = Array.isArray(rawLegend) ? rawLegend[0] : rawLegend;
  if (legendCfg?.data && Array.isArray(legendCfg.data)) {
    return legendCfg.data
      .map((d: any) => (typeof d === "string" ? d : d?.name))
      .filter((n: any): n is string => typeof n === "string" && n.length > 0);
  }
  const series = Array.isArray(option?.series) ? option.series : option?.series ? [option.series] : [];
  return series.map((s: any) => s?.name).filter((n: any): n is string => typeof n === "string" && n.length > 0);
}

// Merge user-interactive runtime state (dataZoom range, legend toggles) from
// the live chart into an incoming option before setOption. Without this,
// callers that re-assert `dataZoom: [{start: 0, end: 100}, ...]` on every
// render snap the chart back to full zoom whenever data refreshes.
function preserveInteractiveState(chart: ECharts, incoming: EChartsOption): EChartsOption {
  const live: any = chart.getOption?.();
  if (!live) return incoming;

  const out: any = { ...incoming };

  const incomingDz = (incoming as any).dataZoom;
  const liveDz = live.dataZoom;
  if (Array.isArray(incomingDz) && Array.isArray(liveDz)) {
    out.dataZoom = incomingDz.map((dz: any, i: number) => {
      const liveEntry = liveDz[i];
      if (!liveEntry || typeof liveEntry.start !== "number" || typeof liveEntry.end !== "number") {
        return dz;
      }
      return { ...dz, start: liveEntry.start, end: liveEntry.end };
    });
  } else if (incomingDz && liveDz && !Array.isArray(incomingDz) && !Array.isArray(liveDz)) {
    if (typeof (liveDz as any).start === "number" && typeof (liveDz as any).end === "number") {
      out.dataZoom = { ...incomingDz, start: (liveDz as any).start, end: (liveDz as any).end };
    }
  }

  const incomingLegendRaw = (incoming as any).legend;
  const liveLegendRaw = live.legend;
  const incomingLegend = Array.isArray(incomingLegendRaw) ? incomingLegendRaw[0] : incomingLegendRaw;
  const liveLegend = Array.isArray(liveLegendRaw) ? liveLegendRaw[0] : liveLegendRaw;
  if (incomingLegend && liveLegend?.selected) {
    const incomingNames = new Set(getLegendNames(incoming));
    const merged: Record<string, boolean> = {};
    for (const [name, on] of Object.entries(liveLegend.selected as Record<string, boolean>)) {
      if (incomingNames.has(name)) merged[name] = on;
    }
    const patchedLegend = {
      ...incomingLegend,
      selected: { ...((incomingLegend as any).selected ?? {}), ...merged },
    };
    out.legend = Array.isArray(incomingLegendRaw)
      ? [patchedLegend, ...incomingLegendRaw.slice(1)]
      : patchedLegend;
  }

  return out as EChartsOption;
}

// Given a dataZoom config entry and the surrounding option, return the
// current visible x-range in Unix milliseconds. Prefers explicit
// startValue/endValue (set by the user or by dispatchAction), falls back to
// applying the start/end percentages against the xAxis min/max extent.
// Returns null when nothing usable is present.
function resolveVisibleRange(
  dz: { startValue?: number | string; endValue?: number | string; start?: number; end?: number },
  option: { xAxis?: { min?: number | string; max?: number | string } | Array<{ min?: number | string; max?: number | string }> },
): { startMs: number; endMs: number } | null {
  const toMs = (v: unknown): number | null => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const t = new Date(v).getTime();
      return Number.isFinite(t) ? t : null;
    }
    if (v instanceof Date) return v.getTime();
    return null;
  };
  const svMs = toMs(dz.startValue);
  const evMs = toMs(dz.endValue);
  if (svMs !== null && evMs !== null && evMs > svMs) {
    return { startMs: svMs, endMs: evMs };
  }
  const xAxis = Array.isArray(option.xAxis) ? option.xAxis[0] : option.xAxis;
  const axisMin = toMs(xAxis?.min);
  const axisMax = toMs(xAxis?.max);
  const start = typeof dz.start === "number" ? dz.start : 0;
  const end = typeof dz.end === "number" ? dz.end : 100;
  if (axisMin === null || axisMax === null || axisMax <= axisMin) return null;
  const span = axisMax - axisMin;
  return {
    startMs: axisMin + (span * start) / 100,
    endMs: axisMin + (span * end) / 100,
  };
}

function readLiveLegendState(chart: ECharts): { state: LegendState; names: string[] } {
  const opt: any = chart.getOption?.();
  const names = getLegendNames(opt);
  const rawLegend = opt?.legend;
  const legendCfg = Array.isArray(rawLegend) ? rawLegend[0] : rawLegend;
  const selected: Record<string, boolean> | undefined = legendCfg?.selected;
  if (!names.length || !selected) return { state: "all", names };
  let on = 0;
  let off = 0;
  for (const n of names) {
    if (selected[n] === false) off++;
    else on++;
  }
  if (off === 0) return { state: "all", names };
  if (on === 0) return { state: "none", names };
  return { state: "some", names };
}

function buildToggleFeature(state: LegendState, chartRef: React.RefObject<HTMLDivElement>) {
  const icon = state === "all" ? ICON_ALL : state === "none" ? ICON_NONE : ICON_SOME;
  const title = state === "all" ? "Hide all" : "Show all";
  return {
    show: true,
    title,
    icon,
    onclick: function () {
      const node = chartRef.current;
      if (!node) return;
      const chart = getInstanceByDom(node);
      if (!chart) return;
      const live = readLiveLegendState(chart);
      if (!live.names.length) return;
      if (live.state === "all") {
        for (const n of live.names) chart.dispatchAction({ type: "legendUnSelect", name: n });
      } else {
        chart.dispatchAction({ type: "legendAllSelect" });
      }
    },
  };
}

function buildFeatureMap(
  baseFeature: any,
  showLegendToggle: boolean | undefined,
  showDataZoomTools: boolean | undefined,
  state: LegendState,
  chartRef: React.RefObject<HTMLDivElement>,
) {
  const feature: Record<string, any> = { ...(baseFeature || {}) };
  if (showDataZoomTools) {
    feature.dataZoom = { ...(baseFeature?.dataZoom || {}) };
  }
  if (showLegendToggle) {
    feature.myToggleAll = buildToggleFeature(state, chartRef);
  }
  return feature;
}

function mergeToolbox(
  option: EChartsOption,
  state: LegendState,
  showLegendToggle: boolean | undefined,
  showDataZoomTools: boolean | undefined,
  chartRef: React.RefObject<HTMLDivElement>,
): EChartsOption {
  const existing = (option as any).toolbox;
  const base = Array.isArray(existing) ? existing[0] : existing;
  return {
    ...option,
    toolbox: {
      ...(base || {}),
      show: base?.show ?? true,
      top: base?.top ?? 0,
      right: base?.right ?? 10,
      feature: buildFeatureMap(base?.feature, showLegendToggle, showDataZoomTools, state, chartRef),
    },
  } as EChartsOption;
}

export interface ReactEChartsProps {
  option: EChartsOption;
  style?: CSSProperties;
  settings?: SetOptionOpts;
  loading?: boolean;
  theme?: "light" | "dark" | Mode;
  showLegendToggle?: boolean;
  showDataZoomTools?: boolean;
  /**
   * Fires when the user changes the visible x-axis range via the built-in
   * dataZoom slider or wheel/pan. The callback is invoked with the visible
   * range in Unix milliseconds and is trailing-debounced at 150ms so
   * downstream state updates fire once per gesture, not per animation frame.
   * Requires the chart's xAxis to be a time axis.
   */
  onDataZoom?: (range: { startMs: number; endMs: number }) => void;
}

/**
 * Build an ECharts `axisLabel.formatter` that renders a time-axis tick in the
 * caller-resolved IANA timezone. `undefined` falls through to the browser's
 * default rendering (`toLocaleString()` without a timeZone).
 *
 * ECharts calls the formatter with the raw ms timestamp when the axis type is
 * `"time"`, so this is the minimal wiring needed to make chart tick labels
 * respect the user's timezone preference.
 */
export function makeTimeAxisFormatter(timezone: string | undefined) {
  return (value: number | string | Date) => {
    const d = value instanceof Date ? value : new Date(value as string | number);
    return timezone
      ? d.toLocaleString(undefined, { timeZone: timezone, month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
      : d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };
}

const DATA_ZOOM_DEBOUNCE_MS = 150;

export function ECharts({
  option,
  style,
  settings,
  loading,
  theme,
  showLegendToggle,
  showDataZoomTools,
  onDataZoom,
}: ReactEChartsProps): React.ReactNode {
  const chartRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<LegendState>("all");
  // Keep the latest callback in a ref so the effect below can register the
  // datazoom listener once and read the current function on each fire —
  // avoids re-registering the listener every time a parent's inline arrow
  // function reference changes.
  const onDataZoomRef = useRef(onDataZoom);
  useEffect(() => {
    onDataZoomRef.current = onDataZoom;
  }, [onDataZoom]);

  useEffect(() => {
    let chart: ECharts | undefined;
    if (chartRef.current !== null) {
      chart = init(chartRef.current, theme, { renderer: "canvas" });
    }
    function resizeChart() {
      chart?.resize();
    }
    let detachLegendListener: (() => void) | undefined;
    if (showLegendToggle && chart) {
      const handler = () => {
        const node = chartRef.current;
        if (!node) return;
        const c = getInstanceByDom(node);
        if (!c) return;
        const { state: newState } = readLiveLegendState(c);
        if (newState !== stateRef.current) {
          stateRef.current = newState;
          const currentOption: any = c.getOption?.();
          const currentToolboxRaw = currentOption?.toolbox;
          const currentToolbox = Array.isArray(currentToolboxRaw) ? currentToolboxRaw[0] : currentToolboxRaw;
          c.setOption(
            {
              toolbox: {
                ...(currentToolbox || {}),
                show: currentToolbox?.show ?? true,
                top: currentToolbox?.top ?? 0,
                right: currentToolbox?.right ?? 10,
                feature: buildFeatureMap(
                  currentToolbox?.feature,
                  showLegendToggle,
                  showDataZoomTools,
                  newState,
                  chartRef,
                ),
              },
            } as any,
            { replaceMerge: ["toolbox"], lazyUpdate: true },
          );
        }
      };
      const legendEvents = [
        "legendselectchanged",
        "legendselected",
        "legendunselected",
        "legendselectall",
        "legendinverseselect",
      ];
      for (const ev of legendEvents) chart.on(ev, handler);
      detachLegendListener = () => {
        for (const ev of legendEvents) chart?.off(ev, handler);
      };
    }
    // Trailing-debounced datazoom listener. Reads current start/end from
    // the live option after each fire (ECharts's own dataZoom state is the
    // source of truth once the user has interacted). Falls back to computing
    // from start/end percentages when the slider config uses those instead
    // of startValue/endValue.
    let dzTimer: ReturnType<typeof setTimeout> | undefined;
    let detachDataZoomListener: (() => void) | undefined;
    if (chart) {
      const emit = () => {
        const cb = onDataZoomRef.current;
        if (!cb) return;
        const node = chartRef.current;
        if (!node) return;
        const c = getInstanceByDom(node);
        if (!c) return;
        const opt: any = c.getOption?.();
        const dzRaw = opt?.dataZoom;
        const dz = Array.isArray(dzRaw) ? dzRaw[0] : dzRaw;
        if (!dz) return;
        const range = resolveVisibleRange(dz, opt);
        if (range) cb(range);
      };
      const handler = () => {
        if (dzTimer) clearTimeout(dzTimer);
        dzTimer = setTimeout(emit, DATA_ZOOM_DEBOUNCE_MS);
      };
      chart.on("datazoom", handler);
      detachDataZoomListener = () => {
        if (dzTimer) clearTimeout(dzTimer);
        chart?.off("datazoom", handler);
      };
    }
    if (typeof window !== "undefined") {
      window.addEventListener("resize", resizeChart);
      return () => {
        detachLegendListener?.();
        detachDataZoomListener?.();
        chart?.dispose();
        window.removeEventListener("resize", resizeChart);
      };
    }
  }, [theme, showLegendToggle, showDataZoomTools]);

  useEffect(() => {
    if (chartRef.current !== null) {
      const chart = getInstanceByDom(chartRef.current);
      let finalOption = option;
      if (chart) {
        finalOption = preserveInteractiveState(chart, finalOption);
      }
      if ((showLegendToggle || showDataZoomTools) && chart) {
        const { state } = readLiveLegendState(chart);
        stateRef.current = state;
        finalOption = mergeToolbox(finalOption, state, showLegendToggle, showDataZoomTools, chartRef);
      }
      // Use notMerge: false for better performance on updates
      // Use lazyUpdate: true to batch rendering updates
      chart!.setOption(finalOption, { notMerge: false, lazyUpdate: true, ...settings });
    }
  }, [option, settings, theme, showLegendToggle, showDataZoomTools]);

  useEffect(() => {
    if (chartRef.current !== null) {
      const chart = getInstanceByDom(chartRef.current);
      if (loading === true) {
        const isDark = theme === "dark";
        chart!.showLoading(
          "default",
          isDark
            ? {
                maskColor: "rgba(45, 45, 45, 0.8)",
                textColor: "#fff",
                color: "#fff",
              }
            : undefined,
        );
      } else {
        chart!.hideLoading();
      }
    }
  }, [loading, theme]);

  return <div ref={chartRef} style={{ width: "100%", height: "100px", ...style }} />;
}
