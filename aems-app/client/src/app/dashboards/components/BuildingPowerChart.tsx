"use client";

import React from "react";
import { Card, Colors } from "@blueprintjs/core";
import { useQuery } from "@apollo/client";
import {
  HistorianMeterTimeSeriesDocument,
  MetricAggregation,
} from "@/graphql-codegen/graphql";
import { MeterMetric } from "@local/common";
import { ECharts } from "@/app/components/common/echarts";
import { paddedRange } from "../utils/chartAxis";
import { makeValueFormatter } from "@/utils/historianFormat";
import { rollingAverage } from "@/utils/rollingAverage";
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

const BOXPLOT_AGGREGATIONS: MetricAggregation[] = [
  MetricAggregation.Min,
  MetricAggregation.Q1,
  MetricAggregation.Median,
  MetricAggregation.Q3,
  MetricAggregation.Max,
];

interface AggregationSeries {
  aggregation: MetricAggregation;
  data: Array<{ timestamp: string; value: number | null }>;
}

interface DataPoint {
  timestamp: string;
  value: number | null;
}

// Toolbox icon (filled path — ECharts renders paths as filled shapes) for
// the boxplot toggle. Flips iconStyle.color between muted "off" and accent
// "on" to signal state. Follows the same shape as SiteDashboard's rollup
// toggle.
const BOXPLOT_ICON =
  "path://M11,3H13V7H11Z M7,7H17V17H7Z M11,17H13V21H11Z M3,11H7V13H3Z M17,11H21V13H17Z";

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

  const { data, loading } = useQuery(HistorianMeterTimeSeriesDocument, {
    variables: {
      campus,
      building,
      metric: MeterMetric.Power,
      startTime,
      endTime,
      rawThreshold: RAW_THRESHOLD,
      // Only ask the server for quartile aggregations when boxplot is toggled
      // on; the server ignores the arg entirely in raw mode.
      aggregations: boxplotOn ? BOXPLOT_AGGREGATIONS : undefined,
    },
  });

  const series = data?.historianMeterTimeSeries as
    | {
        data?: DataPoint[];
        aggregations?: AggregationSeries[] | null;
        metadata?: Parameters<typeof makeValueFormatter>[0];
      }
    | undefined;

  const binning = pickBinningInfo(data?.historianMeterTimeSeries);
  const isRaw = binning?.mode !== "binned";
  const binMs = binning?.intervalMs ?? 0;

  // Rolling-average overlays are always rendered when the current bucketing
  // makes them meaningful (window > bin size). In raw mode both windows are
  // always meaningful; in binned mode they degenerate to a no-op once the
  // bin size catches up, so we simply omit them from the chart at that point.
  // Users can further hide/show them via the built-in legend toggle.
  const show15m = isRaw || binMs < MS_15M;
  const show30m = isRaw || binMs < MS_30M;
  // Boxplot needs quartile aggregations, which the server only computes when
  // binning. In raw mode there are no aggregates to draw a distribution from.
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

  const echartsSeries = React.useMemo(() => {
    if (!series?.data) return [];

    if (effectiveBoxplot) {
      // The server serializes the TS enum VALUE (lowercase, "q1") inside
      // this scalar payload, while the client codegen enum uses the GraphQL
      // NAME ("Q1"). Compare on a canonical lowercase form so lookups match
      // regardless of which side any given identifier comes from.
      const canon = (a: string) => a.toLowerCase();
      const aggByName = new Map<string, DataPoint[]>();
      for (const s of series.aggregations ?? []) {
        aggByName.set(canon(s.aggregation as unknown as string), s.data);
      }
      const min = aggByName.get(canon(MetricAggregation.Min)) ?? [];
      const q1 = aggByName.get(canon(MetricAggregation.Q1)) ?? [];
      const median = aggByName.get(canon(MetricAggregation.Median)) ?? [];
      const q3 = aggByName.get(canon(MetricAggregation.Q3)) ?? [];
      const max = aggByName.get(canon(MetricAggregation.Max)) ?? [];
      const boxData = min
        .map((p, i) => {
          const values = [p.value, q1[i]?.value, median[i]?.value, q3[i]?.value, max[i]?.value];
          if (values.some((v) => typeof v !== "number")) return null;
          const t = new Date(p.timestamp).getTime();
          return [t, ...(values as number[])];
        })
        .filter((row): row is number[] => row !== null);
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
    show15m,
    show30m,
    primaryPoints,
    formatPower,
    primaryColor,
    rollingColor15,
    rollingColor30,
  ]);

  // The only toolbox toggle we surface is boxplot — it swaps the whole chart
  // rendering between line and box-and-whisker, which is a mode change users
  // can't get to through the built-in legend. The rolling-average overlays
  // are rendered by default (whenever their window is meaningful) and can be
  // hidden per-series via the legend toggle in the wrapper's toolbox.
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

  return (
    <Card className={className}>
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
      />
    </Card>
  );
}
