"use client";

import React from "react";
import { Card, Colors, SegmentedControl } from "@blueprintjs/core";
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
import styles from "./BuildingPowerChart.module.scss";

interface BuildingPowerChartProps {
  campus: string;
  building: string;
  startTime: string;
  endTime: string;
  mode: "light" | "dark";
  height?: string;
}

// Threshold below which the server returns raw historian samples (no binning).
// Passed as an override arg so building-power stays raw out to a full week,
// regardless of the global HISTORIAN_BINNING_START env setting.
const RAW_THRESHOLD = "7d";

type RawViz = "raw" | "15m" | "30m" | "all";
type BinnedViz = "line" | "range" | "boxplot";

interface AggregationSeries {
  aggregation: MetricAggregation;
  data: Array<{ timestamp: string; value: number | null }>;
}

interface DataPoint {
  timestamp: string;
  value: number | null;
}

// The aggregation set the server needs to satisfy each binned viz option.
// Kept outside the component so referential identity stays stable across renders.
const BINNED_AGGREGATIONS: Record<BinnedViz, MetricAggregation[] | undefined> = {
  line: undefined,
  range: [MetricAggregation.Min, MetricAggregation.Max],
  boxplot: [
    MetricAggregation.Min,
    MetricAggregation.Q1,
    MetricAggregation.Median,
    MetricAggregation.Q3,
    MetricAggregation.Max,
  ],
};

export function BuildingPowerChart({
  campus,
  building,
  startTime,
  endTime,
  mode,
  height = "380px",
}: BuildingPowerChartProps) {
  const [rawViz, setRawViz] = React.useState<RawViz>("raw");
  const [binnedViz, setBinnedViz] = React.useState<BinnedViz>("line");

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
      aggregations: BINNED_AGGREGATIONS[binnedViz],
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

  const primaryColor = secondaryPalette.secondary.hex;
  const rollingColor15 = tertiaryPalette.secondary.hex;
  const rollingColor30 = tertiaryPalette.tertiary.hex;
  const bandColor = secondaryPalette.quaternary.hex;

  const formatPower = React.useMemo(
    () =>
      makeValueFormatter(series?.metadata, {
        includeAggregation: true,
      }),
    [series?.metadata],
  );

  const rawPoints = React.useMemo<DataPoint[]>(() => series?.data ?? [], [series?.data]);

  const echartsSeries = React.useMemo(() => {
    if (!series?.data) return [];

    if (isRaw) {
      const primary = {
        name: "Building Power",
        type: "line" as const,
        smooth: true,
        sampling: "lttb" as const,
        showSymbol: false,
        itemStyle: { color: primaryColor },
        lineStyle: { color: primaryColor, width: 1.5 },
        tooltip: { valueFormatter: formatPower },
        data: rawPoints.map((p) => [p.timestamp, p.value]),
      };
      const overlays: unknown[] = [];
      const show15 = rawViz === "15m" || rawViz === "all";
      const show30 = rawViz === "30m" || rawViz === "all";
      if (show15) {
        overlays.push({
          name: "15m avg",
          type: "line",
          smooth: false,
          showSymbol: false,
          itemStyle: { color: rollingColor15 },
          lineStyle: { color: rollingColor15, width: 1.5, type: "dashed" as const },
          tooltip: { valueFormatter: formatPower },
          data: rollingAverage(rawPoints, 15 * 60_000).map((p) => [
            p.timestamp.toISOString(),
            p.value,
          ]),
        });
      }
      if (show30) {
        overlays.push({
          name: "30m avg",
          type: "line",
          smooth: false,
          showSymbol: false,
          itemStyle: { color: rollingColor30 },
          lineStyle: { color: rollingColor30, width: 2, type: "dashed" as const },
          tooltip: { valueFormatter: formatPower },
          data: rollingAverage(rawPoints, 30 * 60_000).map((p) => [
            p.timestamp.toISOString(),
            p.value,
          ]),
        });
      }
      return [primary, ...overlays];
    }

    // Binned mode. Look up requested aggregations by name.
    const aggByName = new Map<MetricAggregation, DataPoint[]>();
    for (const s of series.aggregations ?? []) {
      aggByName.set(s.aggregation, s.data);
    }
    const meanPoints = rawPoints;

    if (binnedViz === "line") {
      return [
        {
          name: "Building Power",
          type: "line" as const,
          smooth: true,
          sampling: "lttb" as const,
          showSymbol: false,
          itemStyle: { color: primaryColor },
          lineStyle: { color: primaryColor, width: 1.5 },
          tooltip: { valueFormatter: formatPower },
          data: meanPoints.map((p) => [p.timestamp, p.value]),
        },
      ];
    }

    if (binnedViz === "range") {
      const min = aggByName.get(MetricAggregation.Min) ?? [];
      const max = aggByName.get(MetricAggregation.Max) ?? [];
      // ECharts confidence-band pattern: draw an invisible line at "min" and a
      // stacked filled line at "max - min", so the fill runs between them.
      const spans = min.map((p, i) => {
        const mv = p.value;
        const xv = max[i]?.value;
        return [p.timestamp, typeof mv === "number" && typeof xv === "number" ? xv - mv : null];
      });
      return [
        {
          name: "Min",
          type: "line" as const,
          stack: "range" as const,
          symbol: "none" as const,
          lineStyle: { opacity: 0 },
          itemStyle: { color: bandColor },
          data: min.map((p) => [p.timestamp, p.value]),
        },
        {
          name: "Range",
          type: "line" as const,
          stack: "range" as const,
          symbol: "none" as const,
          lineStyle: { opacity: 0 },
          areaStyle: { color: bandColor, opacity: 0.3 },
          tooltip: { show: false },
          data: spans,
        },
        {
          name: "Mean",
          type: "line" as const,
          smooth: true,
          sampling: "lttb" as const,
          showSymbol: false,
          itemStyle: { color: primaryColor },
          lineStyle: { color: primaryColor, width: 1.5 },
          tooltip: { valueFormatter: formatPower },
          data: meanPoints.map((p) => [p.timestamp, p.value]),
        },
      ];
    }

    // boxplot
    const min = aggByName.get(MetricAggregation.Min) ?? [];
    const q1 = aggByName.get(MetricAggregation.Q1) ?? [];
    const median = aggByName.get(MetricAggregation.Median) ?? [];
    const q3 = aggByName.get(MetricAggregation.Q3) ?? [];
    const max = aggByName.get(MetricAggregation.Max) ?? [];
    const boxData = min
      .map((p, i) => {
        const values = [p.value, q1[i]?.value, median[i]?.value, q3[i]?.value, max[i]?.value];
        if (values.some((v) => typeof v !== "number")) return null;
        return [p.timestamp, ...values];
      })
      .filter((row): row is Array<string | number> => row !== null);
    return [
      {
        name: "Building Power",
        type: "boxplot" as const,
        itemStyle: { color: primaryColor, borderColor: primaryColor },
        tooltip: {
          valueFormatter: (v: unknown) => formatPower(v),
        },
        data: boxData,
      },
    ];
  }, [
    series,
    isRaw,
    rawViz,
    binnedViz,
    rawPoints,
    formatPower,
    primaryColor,
    rollingColor15,
    rollingColor30,
    bandColor,
  ]);

  // Segmented-control options are mode-dependent.
  const rawOptions = [
    { label: "Raw", value: "raw" },
    { label: "+ 15m", value: "15m" },
    { label: "+ 30m", value: "30m" },
    { label: "All", value: "all" },
  ];
  const binnedOptions = [
    { label: "Line", value: "line" },
    { label: "Range", value: "range" },
    { label: "Boxplot", value: "boxplot" },
  ];

  return (
    <Card className={styles.card} style={{ height: "auto" }}>
      <div className={styles.header}>
        <div className={styles.title}>Building Power</div>
        {isRaw ? (
          <SegmentedControl
            small
            options={rawOptions}
            value={rawViz}
            onValueChange={(v) => setRawViz(v as RawViz)}
          />
        ) : (
          <SegmentedControl
            small
            options={binnedOptions}
            value={binnedViz}
            onValueChange={(v) => setBinnedViz(v as BinnedViz)}
          />
        )}
      </div>
      <ECharts
        loading={loading}
        option={{
          animation: false,
          backgroundColor: mode === "dark" ? Colors.DARK_GRAY2 : Colors.WHITE,
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
          grid: { top: 30, right: 60, bottom: 110, left: 60 },
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
        style={{ height }}
        theme={mode}
        showLegendToggle
        showDataZoomTools
      />
    </Card>
  );
}
