"use client";

import React from "react";
import { Card, Spinner } from "@blueprintjs/core";
import { useQuery } from "@apollo/client";
import {
  HistorianMultiSystemUnitDocument,
  HistorianSetpointErrorDocument,
  HistorianWeatherTimeSeriesDocument,
  ReadUnitsQuery,
  UnitMetric,
  WeatherMetric,
  HistorianMeterTimeSeriesDocument,
} from "@/graphql-codegen/graphql";
import { ECharts } from "@/app/components/common/echarts";
import { graphic } from "echarts";
import { Colors } from "@blueprintjs/core";
import { TimeRangeSelector } from "./TimeRangeSelector";
import { BinningCallout, pickBinningInfo } from "./BinningCallout";
import { paddedRange } from "../utils/chartAxis";
import styles from "./SiteDashboard.module.scss";
import { MeterMetric, typeofString } from "@local/common";
import { Palettes } from "@/utils/palette";
import { compilePreferences, PreferencesContext, CurrentContext } from "@/app/components/providers";
import { optimizeSystemNames } from "@/utils/systemNameOptimizer";
import { useMetricColors } from "@/utils/metricColors";

interface SystemSetpointErrorQueryProps {
  campus: string;
  building: string;
  system: string;
  startTime: string;
  endTime: string;
  onResult: (system: string, data: { data: any[] } | null, loading: boolean) => void;
}

// Fires one HistorianSetpointError query per system and bubbles the result
// up to the parent. Rendering one of these per RTU lets us support any number
// of systems while staying within the rules of hooks.
function SystemSetpointErrorQuery({
  campus,
  building,
  system,
  startTime,
  endTime,
  onResult,
}: SystemSetpointErrorQueryProps) {
  const { data, loading } = useQuery(HistorianSetpointErrorDocument, {
    variables: { campus, building, system, startTime, endTime },
    skip: !system,
  });
  React.useEffect(() => {
    onResult(system, data?.historianSetpointError ?? null, loading);
  }, [data, loading, system, onResult]);
  return null;
}

interface SiteDashboardProps {
  campus: string;
  building: string;
  system: string;
  units: ReadUnitsQuery["readUnits"];
  startTime: string;
  endTime: string;
  onApplyTimeRange: (startTime: string, endTime: string) => void;
  mode: "light" | "dark";
}

export function SiteDashboard({
  campus,
  building,
  system,
  units: optionalUnits,
  startTime,
  endTime,
  onApplyTimeRange,
  mode,
}: SiteDashboardProps) {
  const units = optionalUnits ?? [];

  // Get user palette preferences
  const { preferences } = React.useContext(PreferencesContext);
  const { current } = React.useContext(CurrentContext);
  const { palette1, palette2, palette3, paletteWarm, paletteCool } = compilePreferences(
    preferences,
    current?.preferences,
  );

  // Load palettes: primary for temps, secondary for demands, tertiary for status
  const primaryPalette = Palettes.getPalette(palette1 || "Radiant Harmony");
  const secondaryPalette = Palettes.getPalette(palette2 || "Desert Oasis");
  const tertiaryPalette = Palettes.getPalette(palette3 || "Pastel Dreams");
  const warmPalette = Palettes.getPalette(paletteWarm || "Red");
  const coolPalette = Palettes.getPalette(paletteCool || "Blue");

  // Shared metric → color map and unit color pool
  const { metricColors, getUnitColor } = useMetricColors(
    primaryPalette,
    secondaryPalette,
    tertiaryPalette,
    warmPalette,
    coolPalette,
  );

  // Extract system names for queries and unit names for display
  const unitSystems = units
    .map((u) => u.system)
    .filter(typeofString)
    .sort()
    .reverse();

  // Optimize system names for display in charts
  const { displayNames: optimizedSystemNames, leftMargin: chartLeftMargin } = React.useMemo(
    () => optimizeSystemNames(unitSystems),
    [unitSystems],
  );

  // Per-chart toggle: false = discrete (one segment per bucket), true =
  // rolled up (consecutive same-state buckets merged into a single segment).
  const [occupancyRolledUp, setOccupancyRolledUp] = React.useState(true);
  const [setpointRolledUp, setSetpointRolledUp] = React.useState(true);

  // Occupancy Status data using new multi-system query
  const { data: occupancyData, loading: occupancyLoading } = useQuery(HistorianMultiSystemUnitDocument, {
    variables: {
      campus: campus,
      building: building,
      systems: unitSystems,
      metric: UnitMetric.OccupancyCommand,
      startTime,
      endTime,
    },
    skip: unitSystems.length === 0,
  });

  // Setpoint error data - one query per system via a child component per RTU,
  // so every system in the building is covered (not just the first few).
  const [setpointErrorResults, setSetpointErrorResults] = React.useState<
    Record<string, { data: { data: any[] } | null; loading: boolean }>
  >({});
  const handleSetpointErrorResult = React.useCallback(
    (system: string, data: { data: any[] } | null, loading: boolean) => {
      setSetpointErrorResults((prev) => {
        const existing = prev[system];
        if (existing && existing.data === data && existing.loading === loading) return prev;
        return { ...prev, [system]: { data, loading } };
      });
    },
    [],
  );
  const setpointErrorLoading = unitSystems.some(
    (sys) => !setpointErrorResults[sys] || setpointErrorResults[sys].loading,
  );
  const setpointErrorData = React.useMemo(() => {
    const results = unitSystems
      .map((sys) => {
        const result = setpointErrorResults[sys];
        if (!result?.data) return null;
        const sourceMetadata = (result.data as { metadata?: any }).metadata;
        return {
          system: sys,
          data: result.data.data,
          metadata: sourceMetadata ?? { topics: {}, errors: [] },
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
    return results.length > 0 ? { historianMultiSystemUnit: results } : null;
  }, [setpointErrorResults, unitSystems]);

  // Weather data using new weather query
  const { data: weatherData, loading: weatherLoading } = useQuery(HistorianWeatherTimeSeriesDocument, {
    variables: {
      campus: campus,
      building: building,
      metric: WeatherMetric.AirTemperature,
      startTime,
      endTime,
    },
    skip: unitSystems.length === 0,
  });

  // Unit outdoor air temperature data - sensors on RTUs
  const { data: outdoorTempData, loading: outdoorTempLoading } = useQuery(HistorianMultiSystemUnitDocument, {
    variables: {
      campus: campus,
      building: building,
      systems: unitSystems,
      metric: UnitMetric.OutdoorAirTemperature,
      startTime,
      endTime,
    },
    skip: unitSystems.length === 0,
  });

  // Power data - using meter data
  const { data: powerData, loading: powerLoading } = useQuery(HistorianMeterTimeSeriesDocument, {
    variables: {
      campus: campus,
      building: building,
      metric: MeterMetric.Power, // Placeholder - actual power metric may need to be added to schema
      startTime,
      endTime,
    },
  });

  const unknownState = {
    label: "Missing Data",
    color: mode === "dark" ? Colors.DARK_GRAY4 : Colors.LIGHT_GRAY3,
  };

  // Helper function to get state label and color using tertiary palette (status/states)
  const occupancyStates: Array<{ label: string; color: string }> = [
    { label: "Local Control", color: tertiaryPalette.primary.hex },
    { label: "Occupied", color: tertiaryPalette.tertiary.hex },
    { label: "Unoccupied", color: tertiaryPalette.quinary.hex },
  ];
  const getOccupancyState = (value: number | null | undefined) => {
    if (value == null || !Number.isFinite(value)) return unknownState;
    if (value === 1) return occupancyStates[0];
    if (value === 2) return occupancyStates[1];
    if (value === 3) return occupancyStates[2];
    return unknownState;
  };

  // Setpoint error bins. The server forces any zone temp inside the
  // deadband [heat, cool] to a raw error of exactly 0, so Optimal is the
  // single value 0. Remaining bins span 1°F outward from the deadband
  // boundary in each direction.
  const setpointErrorBins: Array<{ label: string; color: string }> = [
    { label: "Very Cold", color: primaryPalette.primary.hex },
    { label: "Cold", color: primaryPalette.secondary.hex },
    { label: "Slightly Cold", color: primaryPalette.tertiary.hex },
    { label: "Optimal", color: tertiaryPalette.tertiary.hex },
    { label: "Slightly Warm", color: secondaryPalette.quaternary.hex },
    { label: "Warm", color: secondaryPalette.secondary.hex },
    { label: "Very Warm", color: secondaryPalette.primary.hex },
  ];
  const getSetpointErrorState = (errorValue: number | null | undefined) => {
    if (errorValue == null || !Number.isFinite(errorValue)) return unknownState;
    if (errorValue === 0) return setpointErrorBins[3];
    if (errorValue < -2) return setpointErrorBins[0];
    if (errorValue < -1) return setpointErrorBins[1];
    if (errorValue < 0) return setpointErrorBins[2];
    if (errorValue <= 1) return setpointErrorBins[4];
    if (errorValue <= 2) return setpointErrorBins[5];
    return setpointErrorBins[6];
  };

  // Format a duration in ms using the highest-level unit (and the next one
  // down when non-zero) so the tooltip stays compact: "2d 5h", "45m", "30s".
  const formatDuration = (ms: number) => {
    if (!Number.isFinite(ms) || ms <= 0) return "0s";
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remSec = seconds % 60;
    if (minutes < 60) return remSec ? `${minutes}m ${remSec}s` : `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remMin = minutes % 60;
    if (hours < 24) return remMin ? `${hours}h ${remMin}m` : `${hours}h`;
    const days = Math.floor(hours / 24);
    const remHr = hours % 24;
    return remHr ? `${days}d ${remHr}h` : `${days}d`;
  };

  // Toolbox icons for the rollup toggle. The icon hints at the action the
  // click will perform (single bar = "roll up", multi-bar = "show discrete").
  const ROLLUP_ICON = "path://M3,8H21V16H3V8Z";
  const DISCRETE_ICON = "path://M3,8H7V16H3V8M10,8H14V16H10V8M17,8H21V16H17V8Z";

  const buildRollupToolboxFeature = (rolledUp: boolean, toggle: () => void) => ({
    myRollup: {
      show: true,
      title: rolledUp ? "Show discrete bins" : "Roll up bins",
      icon: rolledUp ? DISCRETE_ICON : ROLLUP_ICON,
      onclick: toggle,
    },
  });

  // Custom tooltip body for the timeline charts. We build the HTML ourselves
  // so we can drop the default `seriesName: value` line (always a duplicate
  // of the bin label) and add start/end/duration on their own lines. When the
  // backing data is binned, the aggregation that produced each bucket value
  // is appended to the duration line.
  const formatTimelineTooltip = (
    params: any,
    formatLabel: (label: string, raw: number | null) => string,
    aggregation?: string | null,
  ) => {
    const value = params?.value;
    if (!Array.isArray(value)) return "";
    const [systemName, segmentStart, segmentEnd, label, , rawValue] = value as [
      string,
      string,
      string,
      string,
      string,
      number | null | undefined,
    ];
    const raw = typeof rawValue === "number" && Number.isFinite(rawValue) ? rawValue : null;
    const start = new Date(segmentStart);
    const end = new Date(segmentEnd);
    const validRange = !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime());
    const fmt = (d: Date) => d.toLocaleString();
    const marker = typeof params?.marker === "string" ? params.marker : "";
    const lines = [`${marker}<strong>${systemName}</strong> — ${formatLabel(label, raw)}`];
    if (validRange) {
      lines.push(`Start: ${fmt(start)}`);
      lines.push(`End: ${fmt(end)}`);
      lines.push(`Duration: ${formatDuration(end.getTime() - start.getTime())}`);
    }
    if (aggregation) {
      lines.push(`Aggregation: ${aggregation}`);
    }
    return lines.join("<br/>");
  };

  // Helper function to prepare timeline data for ECharts
  // Groups data by state/range so legend items match series names. The server
  // fills missing buckets with null values; here those collapse into discrete
  // "Missing Data" segments instead of a single full-width background bar.
  const prepareTimelineData = (
    data: typeof occupancyData,
    getStateInfo: (value: number | null | undefined) => { label: string; color: string },
    startTime: string,
    endTime: string,
    systems: string[],
    displayNames: string[],
    preSeededStates?: Array<{ label: string; color: string }>,
    rolledUp?: boolean,
  ) => {
    const series: any[] = [];

    // Create mapping from original system names to display names
    const systemToDisplayName = new Map<string, string>();
    systems.forEach((sys, idx) => {
      systemToDisplayName.set(sys, displayNames[idx] || sys);
    });

    // Pre-seed with Unknown plus any caller-supplied states so the legend
    // includes every state in a stable order, even when no data lands in
    // some of them.
    const stateMap = new Map<string, { label: string; color: string; data: any[] }>();
    stateMap.set(unknownState.label, { label: unknownState.label, color: unknownState.color, data: [] });
    preSeededStates?.forEach((state) => {
      if (!stateMap.has(state.label)) {
        stateMap.set(state.label, { label: state.label, color: state.color, data: [] });
      }
    });

    // In rolled-up mode, consecutive buckets with the same state are merged
    // into a single segment by mutating the previous segment's end time.
    const lastSegmentBySystem = new Map<string, any[]>();

    // Process each system's data
    (data?.historianMultiSystemUnit ?? []).forEach((systemData: any) => {
      const points = systemData.data || [];
      const systemName = systemData.system;

      points.forEach((point: any, i: number) => {
        const rawValue: number | null =
          typeof point.value === "number" && Number.isFinite(point.value) ? point.value : null;
        const state = getStateInfo(rawValue);

        const segmentStart = point.timestamp;
        // End time is either the next point's timestamp, or add a default duration (e.g., 5 minutes)
        const segmentEnd =
          i < points.length - 1
            ? points[i + 1].timestamp
            : new Date(new Date(segmentStart).getTime() + 5 * 60 * 1000).toISOString();

        if (rolledUp) {
          const last = lastSegmentBySystem.get(systemName);
          // last value tuple: [displayName, start, end, label, color, raw]
          if (last && last[3] === state.label && last[2] === segmentStart) {
            last[2] = segmentEnd;
            // The raw value no longer represents a single bucket once merged.
            last[5] = null;
            return;
          }
        }

        // Get or create state entry
        if (!stateMap.has(state.label)) {
          stateMap.set(state.label, {
            label: state.label,
            color: state.color,
            data: [],
          });
        }

        // Add data point to this state's series - use display name for Y-axis
        const displayName = systemToDisplayName.get(systemName) || systemName;
        const valueTuple: any[] = [displayName, segmentStart, segmentEnd, state.label, state.color, rawValue];
        stateMap.get(state.label)!.data.push({
          value: valueTuple,
          itemStyle: { color: state.color },
        });
        if (rolledUp) {
          lastSegmentBySystem.set(systemName, valueTuple);
        }
      });
    });

    // Emit one custom series per state.
    stateMap.forEach((stateData) => {
      series.push({
        name: stateData.label,
        type: "custom" as const,
        itemStyle: {
          color: stateData.color,
        },
        emphasis: {
          disabled: true,
        },
        renderItem: (params: any, api: any) => {
          const systemName = api.value(0);
          const start = api.coord([api.value(1), systemName]);
          const end = api.coord([api.value(2), systemName]);
          const height = api.size([0, 1])[1] * 0.6;
          const color = api.value(4);

          const rectShape = graphic.clipRectByRect(
            {
              x: start[0],
              y: start[1] - height / 2,
              width: Math.max(end[0] - start[0], 1),
              height: height,
            },
            {
              x: params.coordSys.x,
              y: params.coordSys.y,
              width: params.coordSys.width,
              height: params.coordSys.height,
            },
          );

          return (
            rectShape && {
              type: "rect" as const,
              shape: rectShape,
              style: {
                fill: color,
                stroke: null,
              },
            }
          );
        },
        encode: {
          x: [1, 2],
          y: 0,
        },
        data: stateData.data,
      });
    });

    return series;
  };

  // All charts in this dashboard share the same time range, so the binning
  // mode/interval is the same across queries. Pick the first one we find.
  const binningInfo = React.useMemo(
    () =>
      pickBinningInfo(
        occupancyData?.historianMultiSystemUnit,
        outdoorTempData?.historianMultiSystemUnit,
        weatherData?.historianWeatherTimeSeries,
        powerData?.historianMeterTimeSeries,
        setpointErrorData?.historianMultiSystemUnit,
      ),
    [occupancyData, outdoorTempData, weatherData, powerData, setpointErrorData],
  );

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>
          {campus} {building} - Site Overview
        </h1>
        <div className={styles.controls}>
          <BinningCallout binning={binningInfo} />
          <TimeRangeSelector onApply={onApplyTimeRange} />
        </div>
      </div>

      <div className={styles.timelineGrid}>
        <Card className={styles.timelineCard}>
          {occupancyLoading ? (
            <div className={styles.chartLoading}>
              <Spinner />
            </div>
          ) : (
            <ECharts
              option={{
                animation: false,
                title: { text: "Occupancy Status" },
                backgroundColor: mode === "dark" ? Colors.DARK_GRAY2 : Colors.WHITE,
                toolbox: {
                  feature: buildRollupToolboxFeature(occupancyRolledUp, () =>
                    setOccupancyRolledUp((prev) => !prev),
                  ),
                },
                tooltip: {
                  trigger: "item",
                  formatter: (params: any) =>
                    formatTimelineTooltip(
                      params,
                      (label) => label,
                      occupancyData?.historianMultiSystemUnit?.[0]?.metadata?.aggregation,
                    ),
                },
                legend: {
                  bottom: 0,
                  show: true,
                  data: [unknownState.label, ...occupancyStates.map((s) => s.label)],
                },
                dataZoom: [
                  {
                    type: "slider",
                    realtime: false,
                    xAxisIndex: 0,
                    filterMode: "none",
                    start: 0,
                    end: 100,
                    bottom: 60,
                    height: 20,
                  },
                  {
                    type: "inside",
                    xAxisIndex: 0,
                    filterMode: "none",
                    start: 0,
                    end: 100,
                  },
                ],
                grid: { top: 40, right: 40, bottom: 110, left: chartLeftMargin + 20 },
                xAxis: { type: "time", min: startTime, max: endTime },
                yAxis: {
                  type: "category",
                  data: optimizedSystemNames,
                  axisLabel: { interval: 0 },
                },
                series: prepareTimelineData(
                  occupancyData,
                  getOccupancyState,
                  startTime,
                  endTime,
                  unitSystems,
                  optimizedSystemNames,
                  occupancyStates,
                  occupancyRolledUp,
                ),
              }}
              style={{ height: "480px" }}
              theme={mode}
              showLegendToggle
              showDataZoomTools
            />
          )}
        </Card>

        {unitSystems.map((sys) => (
          <SystemSetpointErrorQuery
            key={sys}
            campus={campus}
            building={building}
            system={sys}
            startTime={startTime}
            endTime={endTime}
            onResult={handleSetpointErrorResult}
          />
        ))}
        <Card className={styles.timelineCard}>
          {setpointErrorLoading ? (
            <div className={styles.chartLoading}>
              <Spinner />
            </div>
          ) : (
            <ECharts
              option={{
                animation: false,
                title: { text: "Occupancy Setpoint Error" },
                backgroundColor: mode === "dark" ? Colors.DARK_GRAY2 : Colors.WHITE,
                toolbox: {
                  feature: buildRollupToolboxFeature(setpointRolledUp, () =>
                    setSetpointRolledUp((prev) => !prev),
                  ),
                },
                tooltip: {
                  trigger: "item",
                  formatter: (params: any) =>
                    formatTimelineTooltip(
                      params,
                      (label, raw) => {
                        if (raw == null) return label;
                        const sign = raw > 0 ? "+" : "";
                        return `${label} (${sign}${raw.toFixed(1)}°F)`;
                      },
                      setpointErrorData?.historianMultiSystemUnit?.[0]?.metadata?.aggregation,
                    ),
                },
                legend: {
                  bottom: 0,
                  show: true,
                  data: [unknownState.label, ...setpointErrorBins.map((b) => b.label)],
                },
                dataZoom: [
                  {
                    type: "slider",
                    realtime: false,
                    xAxisIndex: 0,
                    filterMode: "none",
                    start: 0,
                    end: 100,
                    bottom: 60,
                    height: 20,
                  },
                  {
                    type: "inside",
                    xAxisIndex: 0,
                    filterMode: "none",
                    start: 0,
                    end: 100,
                  },
                ],
                grid: { top: 40, right: 40, bottom: 110, left: chartLeftMargin + 20 },
                xAxis: { type: "time", min: startTime, max: endTime },
                yAxis: {
                  type: "category",
                  data: optimizedSystemNames,
                  axisLabel: { interval: 0 },
                },
                series: prepareTimelineData(
                  setpointErrorData || undefined,
                  getSetpointErrorState,
                  startTime,
                  endTime,
                  unitSystems,
                  optimizedSystemNames,
                  setpointErrorBins,
                  setpointRolledUp,
                ),
              }}
              style={{ height: "480px" }}
              theme={mode}
              showLegendToggle
              showDataZoomTools
            />
          )}
        </Card>
      </div>

      <div className={styles.timelineGrid}>
        <Card className={styles.chartCard}>
          {weatherLoading || outdoorTempLoading ? (
            <div className={styles.chartLoading}>
              <Spinner />
            </div>
          ) : (
            <ECharts
              option={{
                animation: false,
                title: { text: "Outdoor Temperature" },
                backgroundColor: mode === "dark" ? Colors.DARK_GRAY2 : Colors.WHITE,
                tooltip: {
                  trigger: "axis",
                  renderMode: "richText",
                  appendToBody: true,
                  axisPointer: {
                    animation: false,
                  },
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
                grid: { top: 60, right: 40, bottom: 110, left: 40 },
                xAxis: { type: "time", min: startTime, max: endTime },
                yAxis: {
                  type: "value",
                  name: "Temperature (°F)",
                  position: "left",
                  nameTextStyle: { align: "left" },
                  scale: true,
                  ...paddedRange(),
                },
                series: (() => {
                  // Per-series tooltip formatters carry each series's
                  // aggregation in a closure so binned views read
                  // "72.40°F (mean)" while raw views read "72.40°F".
                  const formatTempWith = (agg?: string | null) => (value: any) => {
                    if (value == null) return "N/A";
                    const text = typeof value === "number" ? `${value.toFixed(2)}°F` : String(value);
                    return agg ? `${text} (${agg})` : text;
                  };
                  const weatherAgg = weatherData?.historianWeatherTimeSeries?.metadata?.aggregation;
                  const outdoorAgg = outdoorTempData?.historianMultiSystemUnit?.[0]?.metadata?.aggregation;
                  return [
                    // Weather station outdoor temperature
                    ...(weatherData?.historianWeatherTimeSeries
                      ? [
                          {
                            name: "Weather Station",
                            type: "line" as const,
                            smooth: true,
                            sampling: "lttb" as const,
                            showSymbol: false,
                            itemStyle: { color: metricColors[WeatherMetric.AirTemperature] },
                            lineStyle: { color: metricColors[WeatherMetric.AirTemperature], width: 1.5 },
                            tooltip: { valueFormatter: formatTempWith(weatherAgg) },
                            data:
                              weatherData.historianWeatherTimeSeries.data?.map((point: any) => [
                                point.timestamp,
                                point.value,
                              ]) || [],
                          },
                        ]
                      : []),
                    // Unit sensor outdoor temperatures — each system gets a unique pool color
                    ...(outdoorTempData?.historianMultiSystemUnit?.map((systemData: any) => ({
                      name: `${systemData.system} Sensor`,
                      type: "line" as const,
                      smooth: true,
                      sampling: "lttb" as const,
                      showSymbol: false,
                      itemStyle: { color: getUnitColor(systemData.system) },
                      lineStyle: { color: getUnitColor(systemData.system), width: 1.5 },
                      tooltip: { valueFormatter: formatTempWith(outdoorAgg) },
                      data: systemData.data?.map((point: any) => [point.timestamp, point.value]) || [],
                    })) || []),
                  ];
                })(),
              }}
              style={{ height: "380px" }}
              theme={mode}
              showLegendToggle
              showDataZoomTools
            />
          )}
        </Card>

        <Card className={styles.chartCard}>
          {powerLoading ? (
            <div className={styles.chartLoading}>
              <Spinner />
            </div>
          ) : (
            <ECharts
              option={{
                animation: false,
                title: { text: "Building Power" },
                backgroundColor: mode === "dark" ? Colors.DARK_GRAY2 : Colors.WHITE,
                tooltip: {
                  trigger: "axis",
                  renderMode: "richText",
                  appendToBody: true,
                  axisPointer: {
                    animation: false,
                  },
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
                  name: "Power (W)",
                  position: "left",
                  nameTextStyle: { align: "left" },
                  scale: true,
                  ...paddedRange(),
                },
                series: powerData?.historianMeterTimeSeries
                  ? (() => {
                      const powerAgg = powerData.historianMeterTimeSeries.metadata?.aggregation;
                      const formatPower = (value: any) => {
                        if (value == null) return "N/A";
                        const text = typeof value === "number" ? `${value.toFixed(2)} W` : String(value);
                        return powerAgg ? `${text} (${powerAgg})` : text;
                      };
                      return [
                        {
                          name: "Building Power",
                          type: "line",
                          smooth: true,
                          sampling: "lttb" as const,
                          showSymbol: false,
                          itemStyle: { color: secondaryPalette.secondary.hex },
                          lineStyle: { color: secondaryPalette.secondary.hex, width: 1.5 },
                          tooltip: { valueFormatter: formatPower },
                          data:
                            powerData.historianMeterTimeSeries.data?.map((point: any) => [
                              point.timestamp,
                              point.value,
                            ]) || [],
                        },
                      ];
                    })()
                  : [],
              }}
              style={{ height: "380px" }}
              theme={mode}
              showLegendToggle
              showDataZoomTools
            />
          )}
        </Card>
      </div>
    </div>
  );
}
