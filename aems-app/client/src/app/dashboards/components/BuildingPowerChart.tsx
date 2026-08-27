"use client";

import React from "react";
import { Card, Colors } from "@blueprintjs/core";
import { useQuery } from "@apollo/client";
import { HistorianMeterTimeSeriesDocument } from "@/graphql-codegen/graphql";
import { MeterMetric } from "@local/common";
import { ECharts } from "@/app/components/common/echarts";
import { paddedRange } from "../utils/chartAxis";
import { makeValueFormatter } from "@/utils/historianFormat";
import { rollingAverage } from "@/utils/rollingAverage";
import { bucketize } from "@/utils/bucketize";
import { Palettes } from "@/utils/palette";
import { compilePreferences, PreferencesContext, CurrentContext } from "@/app/components/providers";
import { pickBinningInfo } from "./BinningCallout";

interface BuildingPowerChartProps {
  campus: string;
  building: string;
  startTime: string;
  endTime: string;
  mode: "light" | "dark";
  height?: string;
  /**
   * Extra class applied to the outer Card. Parent dashboards pass their own
   * `chartCard` module class so the card picks up parent grid placement
   * (e.g. `grid-column: span 2` on SiteDashboard's 2-column timeline grid).
   */
  className?: string;
}

// Threshold below which the server returns raw historian samples (no binning).
// Passed as an override arg so building-power stays raw out to a full week,
// regardless of the global HISTORIAN_BINNING_START env setting.
const RAW_THRESHOLD = "7d";

const MS_15M = 15 * 60_000;
const MS_30M = 30 * 60_000;

// Target one box per ~32 px of chart width. Clamped so very narrow / very wide
// layouts stay reasonable. Kept as a constant so we can adjust density in one
// place if the visual review wants tighter or looser boxes.
const BOX_PIXEL_TARGET = 32;
const MIN_BOXES = 6;
const MAX_BOXES = 120;
const DEFAULT_BOXES_UNTIL_MEASURED = 40;
// Match the boxplot util's default so density-cap math and the utility's
// per-bucket filter use the same threshold.
const MIN_SAMPLES_PER_BOX = 3;
const RESIZE_DEBOUNCE_MS = 150;

interface DataPoint {
  timestamp: string;
  value: number | null;
}

const BOXPLOT_ICON =
  "path://M11,3H13V7H11Z M7,7H17V17H7Z M11,17H13V21H11Z M3,11H7V13H3Z M17,11H21V13H17Z";
// Undo / reset-zoom glyph: an anticlockwise curved arrow.
const RESET_ZOOM_ICON =
  "path://M12,5V1L7,6L12,11V7C15.31,7 18,9.69 18,13S15.31,19 12,19S6,16.31 6,13H4C4,17.42 7.58,21 12,21S20,17.42 20,13S16.42,5 12,5Z";

const OFF_COLOR = "#8f99a8";

export function BuildingPowerChart({
  campus,
  building,
  startTime,
  endTime,
  mode,
  height = "380px",
  className,
}: BuildingPowerChartProps) {
  const [boxplotOn, setBoxplotOn] = React.useState(false);

  // Palette lookup mirrors the parent dashboards so the meter color stays consistent.
  const { preferences } = React.useContext(PreferencesContext);
  const { current } = React.useContext(CurrentContext);
  const { palette2, palette3 } = compilePreferences(preferences, current?.preferences);
  const secondaryPalette = Palettes.getPalette(palette2 || "Desert Oasis");
  const tertiaryPalette = Palettes.getPalette(palette3 || "Pastel Dreams");

  // Outer range = the dashboard's TimeRangeSelector picked window. Stable
  // identity per-prop-change; used as the reset target for zoom.
  const outerStartMs = React.useMemo(() => new Date(startTime).getTime(), [startTime]);
  const outerEndMs = React.useMemo(() => new Date(endTime).getTime(), [endTime]);

  // Queried range = what the server call is currently for. Starts equal to
  // the outer range and narrows as the user zooms via the dataZoom slider —
  // both in line mode and in boxplot mode. In boxplot mode this keeps
  // sample density constant at any zoom depth; in line mode it gives the
  // primary series higher resolution as the user zooms in, which the raw-
  // threshold and default binning already handle nicely on the server.
  const [queriedRange, setQueriedRange] = React.useState<{ startMs: number; endMs: number }>({
    startMs: outerStartMs,
    endMs: outerEndMs,
  });
  React.useEffect(() => {
    setQueriedRange({ startMs: outerStartMs, endMs: outerEndMs });
  }, [outerStartMs, outerEndMs]);

  const queriedStartIso = React.useMemo(
    () => new Date(queriedRange.startMs).toISOString(),
    [queriedRange.startMs],
  );
  const queriedEndIso = React.useMemo(
    () => new Date(queriedRange.endMs).toISOString(),
    [queriedRange.endMs],
  );
  const isZoomed =
    queriedRange.startMs !== outerStartMs || queriedRange.endMs !== outerEndMs;

  const { data, previousData, loading } = useQuery(HistorianMeterTimeSeriesDocument, {
    variables: {
      campus,
      building,
      metric: MeterMetric.Power,
      startTime: queriedStartIso,
      endTime: queriedEndIso,
      rawThreshold: RAW_THRESHOLD,
    },
  });

  // Fall back on the previous fetch's response while a refetch is in flight
  // so the chart doesn't flash empty between zoom-triggered queries. Once the
  // new data arrives `data` becomes defined and `previousData` is ignored.
  const activeResponse = data ?? previousData;
  const series = activeResponse?.historianMeterTimeSeries as
    | {
        data?: DataPoint[];
        metadata?: Parameters<typeof makeValueFormatter>[0];
      }
    | undefined;

  const binning = pickBinningInfo(activeResponse?.historianMeterTimeSeries);
  const isRaw = binning?.mode !== "binned";
  const binMs = binning?.intervalMs ?? 0;

  // Rolling-average overlays are always rendered when the current bucketing
  // makes them meaningful (window > bin size). In raw mode both windows are
  // always meaningful; in binned mode they degenerate to a no-op once the
  // bin size catches up, so we simply omit them from the chart at that point.
  // Users can further hide/show them via the built-in legend toggle.
  const show15m = isRaw || binMs < MS_15M;
  const show30m = isRaw || binMs < MS_30M;
  // Boxplot is only meaningful in binned mode. In raw mode the primary line
  // already shows all samples; there's no aggregation to summarize.
  const canShowBoxplot = !isRaw;
  const effectiveBoxplot = boxplotOn && canShowBoxplot;

  const primaryColor = secondaryPalette.secondary.hex;
  const rollingColor15 = tertiaryPalette.secondary.hex;
  const rollingColor30 = tertiaryPalette.tertiary.hex;

  const formatPower = React.useMemo(
    () =>
      makeValueFormatter(series?.metadata, {
        includeAggregation: true,
      }),
    [series?.metadata],
  );

  const primaryPoints = React.useMemo<DataPoint[]>(() => series?.data ?? [], [series?.data]);

  // Visible x-range within the queried data — narrowed by the dataZoom slider.
  // Used to bound the client-side bucketize call. Reset to the queried range
  // whenever we refetch.
  const [visibleRange, setVisibleRange] = React.useState<{ startMs: number; endMs: number }>({
    startMs: queriedRange.startMs,
    endMs: queriedRange.endMs,
  });
  React.useEffect(() => {
    setVisibleRange({ startMs: queriedRange.startMs, endMs: queriedRange.endMs });
  }, [queriedRange.startMs, queriedRange.endMs]);

  // Chart width in CSS pixels, observed on the outer container so the
  // boxplot density scales with the card's actual rendered width. The
  // ResizeObserver fires on every frame during a window drag, so trail-
  // debounce updates to the same rate as onDataZoom.
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = React.useState(0);
  React.useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setChartWidth(w), RESIZE_DEBOUNCE_MS);
    });
    ro.observe(node);
    return () => {
      if (timer) clearTimeout(timer);
      ro.disconnect();
    };
  }, []);

  // Count samples in the currently-visible slice so the density safety net
  // can prevent rendering flat empty boxes when a refetch is in flight or
  // when the historian genuinely has almost no data.
  const visibleSampleCount = React.useMemo(() => {
    let count = 0;
    for (const p of primaryPoints) {
      const t = new Date(p.timestamp).getTime();
      if (t >= visibleRange.startMs && t <= visibleRange.endMs && p.value !== null) count++;
    }
    return count;
  }, [primaryPoints, visibleRange.startMs, visibleRange.endMs]);

  const widthBasedBoxes = chartWidth > 0
    ? Math.max(MIN_BOXES, Math.min(MAX_BOXES, Math.floor(chartWidth / BOX_PIXEL_TARGET)))
    : DEFAULT_BOXES_UNTIL_MEASURED;
  // Cap by data density so each box has at least MIN_SAMPLES_PER_BOX samples
  // on average. When the query is refetching for a narrower window, the
  // pre-fetch data may briefly be thin — the cap keeps the boxplot from
  // flickering to empty during those moments.
  const densityCap = Math.max(1, Math.floor(visibleSampleCount / MIN_SAMPLES_PER_BOX));
  const targetBoxes = Math.max(1, Math.min(widthBasedBoxes, densityCap));

  const handleDataZoom = React.useCallback(
    (range: { startMs: number; endMs: number }) => {
      setVisibleRange(range);
      // Refetch on every zoom (both line and boxplot modes). Debounced
      // inside the ECharts wrapper, so a drag fires exactly one refetch.
      setQueriedRange(range);
    },
    [],
  );

  const resetZoom = React.useCallback(() => {
    setQueriedRange({ startMs: outerStartMs, endMs: outerEndMs });
  }, [outerStartMs, outerEndMs]);

  const echartsSeries = React.useMemo(() => {
    if (!series?.data) return [];

    if (effectiveBoxplot) {
      // Bin client-side over whatever the server sent for the current
      // queried range. In binned mode this is technically the distribution
      // of sub-bin means within each display box — a legitimate rollup
      // view, and the reason we refetch on zoom is so the server always
      // provides fresh, tightly-bucketed sub-samples for the visible slice.
      const buckets = bucketize(
        primaryPoints,
        visibleRange.startMs,
        visibleRange.endMs,
        targetBoxes,
        MIN_SAMPLES_PER_BOX,
      );
      const boxData = buckets.map((b) => [b.midMs, b.min, b.q1, b.median, b.q3, b.max]);
      return [
        {
          name: "Distribution",
          type: "boxplot" as const,
          // On a time xAxis, echarts needs to be told which column indices map
          // to x and to the 5 boxplot dimensions. Without this, it treats the
          // whole row as a boxplot value and renders nothing.
          encode: { x: 0, y: [1, 2, 3, 4, 5], tooltip: [1, 2, 3, 4, 5] },
          boxWidth: [4, 30],
          itemStyle: { color: primaryColor, borderColor: primaryColor },
          data: boxData,
        },
      ];
    }

    const primary = {
      name: "Building Power",
      type: "line" as const,
      smooth: true,
      sampling: "lttb" as const,
      showSymbol: false,
      itemStyle: { color: primaryColor },
      lineStyle: { color: primaryColor, width: 1.5 },
      tooltip: { valueFormatter: formatPower },
      data: primaryPoints.map((p) => [p.timestamp, p.value]),
    };
    const overlays: unknown[] = [];
    if (show15m) {
      overlays.push({
        name: "15m avg",
        type: "line",
        smooth: false,
        showSymbol: false,
        itemStyle: { color: rollingColor15 },
        lineStyle: { color: rollingColor15, width: 1.5, type: "dashed" as const },
        tooltip: { valueFormatter: formatPower },
        data: rollingAverage(primaryPoints, MS_15M).map((p) => [
          p.timestamp.toISOString(),
          p.value,
        ]),
      });
    }
    if (show30m) {
      overlays.push({
        name: "30m avg",
        type: "line",
        smooth: false,
        showSymbol: false,
        itemStyle: { color: rollingColor30 },
        lineStyle: { color: rollingColor30, width: 2, type: "dashed" as const },
        tooltip: { valueFormatter: formatPower },
        data: rollingAverage(primaryPoints, MS_30M).map((p) => [
          p.timestamp.toISOString(),
          p.value,
        ]),
      });
    }
    return [primary, ...overlays];
  }, [
    series,
    effectiveBoxplot,
    visibleRange.startMs,
    visibleRange.endMs,
    targetBoxes,
    show15m,
    show30m,
    primaryPoints,
    formatPower,
    primaryColor,
    rollingColor15,
    rollingColor30,
  ]);

  // Toolbox toggles. Boxplot swaps the whole chart rendering; reset-zoom is
  // offered whenever the current query is narrower than the outer picked
  // range — dragging the slider back to 0-100 works too, but this is a
  // one-click shortcut. Both follow the same shape as SiteDashboard's
  // rollup toggle so styling stays consistent.
  interface CustomToolboxFeature {
    show: boolean;
    title: string;
    icon: string;
    iconStyle: { color: string };
    onclick: () => void;
  }
  const vizToolboxFeature: Record<string, CustomToolboxFeature> = {};
  if (canShowBoxplot) {
    vizToolboxFeature.myBoxplot = {
      show: true,
      title: boxplotOn ? "Hide distribution boxplot" : "Show distribution boxplot",
      icon: BOXPLOT_ICON,
      iconStyle: { color: boxplotOn ? primaryColor : OFF_COLOR },
      onclick: () => setBoxplotOn((prev) => !prev),
    };
  }
  if (isZoomed) {
    vizToolboxFeature.myResetZoom = {
      show: true,
      title: "Reset zoom",
      icon: RESET_ZOOM_ICON,
      iconStyle: { color: primaryColor },
      onclick: resetZoom,
    };
  }

  return (
    <Card className={className}>
      <div ref={containerRef}>
        <ECharts
          loading={loading}
          option={{
            animation: false,
            title: { text: "Building Power" },
            backgroundColor: mode === "dark" ? Colors.DARK_GRAY2 : Colors.WHITE,
            toolbox: { feature: vizToolboxFeature },
            tooltip: {
              trigger: "axis",
              renderMode: "richText",
              appendToBody: true,
              axisPointer: { animation: false },
            },
            legend: { bottom: 0, show: true },
            dataZoom: [
              {
                type: "slider",
                realtime: false,
                xAxisIndex: 0,
                start: 0,
                end: 100,
                bottom: 60,
                height: 20,
              },
              {
                type: "inside",
                xAxisIndex: 0,
                start: 0,
                end: 100,
              },
            ],
            grid: { top: 60, right: 60, bottom: 110, left: 60 },
            // xAxis is pinned to the outer picked range so the dataZoom
            // slider always represents the full window. Widening the slider
            // past the current query naturally fires onDataZoom with the
            // new visible range, and the refetch below fills in the extra
            // data. Data outside the current queriedRange simply doesn't
            // exist yet in the response — the plot area shows only the
            // slider's selected slice, so the chart still reads full.
            xAxis: { type: "time", min: startTime, max: endTime },
            yAxis: {
              type: "value",
              name: "Power (kW)",
              position: "left",
              nameTextStyle: { align: "left" },
              scale: true,
              ...paddedRange(),
            },
            series: echartsSeries as never,
          }}
          // `replaceMerge` forces ECharts to wholesale replace the series and
          // toolbox on each render instead of index-merging them into the
          // previous option. Without this, switching between line/boxplot or
          // toggling an overlay merges stale properties into new series slots
          // and the chart never actually reflects the new state.
          settings={{ replaceMerge: ["series", "toolbox"] }}
          style={{ height }}
          theme={mode}
          showLegendToggle
          showDataZoomTools
          onDataZoom={handleDataZoom}
        />
      </div>
    </Card>
  );
}
