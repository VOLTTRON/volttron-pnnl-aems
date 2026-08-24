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

// Toolbox icons (24x24 viewBox). Kept as `path://<svg d>` strings, matching
// the existing `buildRollupToolboxFeature` pattern in SiteDashboard.tsx. Each
// icon depicts the CURRENT state — clicking cycles to the next state.
const VIZ_ICON: Record<BinnedViz, string> = {
  line: "path://M3,17L9,11L13,15L21,7",
  range:
    "path://M3,15L9,10L13,12L21,6L21,10L13,16L9,14L3,19Z",
  boxplot:
    "path://M12,3V6M12,18V21M8,6H16V18H8V6M4,12H8M16,12H20",
};

const RAW_ICON: Record<RawViz, string> = {
  raw: "path://M3,17L9,11L13,15L21,7",
  "15m": "path://M2,12H5M7,12H10M12,12H15M17,12H20",
  "30m":
    "path://M2,10H5M7,10H10M12,10H15M17,10H20M2,14H5M7,14H10M12,14H15M17,14H20",
  all: "path://M3,7H21M3,12H21M3,17H21",
};

const nextBinned = (v: BinnedViz): BinnedViz =>
  v === "line" ? "range" : v === "range" ? "boxplot" : "line";

const nextRaw = (v: RawViz): RawViz =>
  v === "raw" ? "15m" : v === "15m" ? "30m" : v === "30m" ? "all" : "raw";

const BINNED_LABEL: Record<BinnedViz, string> = {
  line: "Line",
  range: "Range",
  boxplot: "Boxplot",
};

const RAW_LABEL: Record<RawViz, string> = {
  raw: "Raw only",
  "15m": "Raw + 15m avg",
  "30m": "Raw + 30m avg",
  all: "Raw + 15m + 30m",
};

export function BuildingPowerChart({
  campus,
  building,
  startTime,
  endTime,
  mode,
  height = "380px",
  className,
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

  // Cycling toolbox toggle — one button per mode, following the same pattern
  // as SiteDashboard's rollup toggle. Only the button for the currently
  // active mode (raw vs binned) is included. Uses the functional setter form
  // so the click handler can capture the correct successor even when ECharts
  // holds an older option reference internally.
  const vizToolboxFeature = isRaw
    ? {
        myRawViz: {
          show: true,
          title: `${RAW_LABEL[rawViz]} — click to cycle`,
          icon: RAW_ICON[rawViz],
          onclick: () => setRawViz((prev) => nextRaw(prev)),
        },
      }
    : {
        myBinnedViz: {
          show: true,
          title: `${BINNED_LABEL[binnedViz]} — click to cycle`,
          icon: VIZ_ICON[binnedViz],
          onclick: () => setBinnedViz((prev) => nextBinned(prev)),
        },
      };

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
        // toolbox on each render instead of index-merging them into the previous
        // option. Without this, switching from a single line to a boxplot (or
        // to 3 stacked lines) merges old series properties into new positions
        // and the chart never actually reflects the new mode.
        settings={{ replaceMerge: ["series", "toolbox"] }}
        style={{ height }}
        theme={mode}
        showLegendToggle
        showDataZoomTools
      />
    </Card>
  );
}
