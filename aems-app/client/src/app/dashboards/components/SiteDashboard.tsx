"use client";

import React from "react";
import { Card, Spinner } from "@blueprintjs/core";
import { useQuery } from "@apollo/client";
import {
  HistorianMultiSystemUnitDocument,
  HistorianSetpointErrorDocument,
  HistorianWeatherTimeSeriesDocument,
  HistorianUnitTimeSeriesDocument,
  ReadUnitsQuery,
  UnitMetric,
  WeatherMetric,
  HistorianMeterTimeSeriesDocument,
} from "@/graphql-codegen/graphql";
import { ECharts } from "@/app/components/common/echarts";
import { graphic } from "echarts";
import { Colors } from "@blueprintjs/core";
import { TimeRangeSelector } from "./TimeRangeSelector";
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
        return {
          system: sys,
          data: result.data.data,
          metadata: { topics: {}, errors: [] },
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

  // Helper function to get state label and color using tertiary palette (status/states)
  const getOccupancyState = (value: number) => {
    if (value === 1) return { label: "Local Control", color: tertiaryPalette.primary.hex }; // High alert
    if (value === 2) return { label: "Occupied", color: tertiaryPalette.tertiary.hex }; // Neutral/middle
    if (value === 3) return { label: "Unoccupied", color: tertiaryPalette.quinary.hex }; // Low/passive
    return { label: "Unknown", color: tertiaryPalette.secondary.hex };
  };

  // Helper function to get setpoint error state with color coding.
  // Mirrors the deprecated Grafana site dashboard's BlYlRd threshold stops
  // at -3 / -2 / -1 / 1 / 2 / 3 °F.
  const setpointErrorBins: Array<{ label: string; color: string }> = [
    { label: "Very Cold (< -3°F)", color: primaryPalette.primary.hex },
    { label: "Cold (-3 to -2°F)", color: primaryPalette.secondary.hex },
    { label: "Slightly Cold (-2 to -1°F)", color: primaryPalette.tertiary.hex },
    { label: "Optimal (-1 to 1°F)", color: tertiaryPalette.tertiary.hex },
    { label: "Slightly Warm (1 to 2°F)", color: secondaryPalette.quaternary.hex },
    { label: "Warm (2 to 3°F)", color: secondaryPalette.secondary.hex },
    { label: "Very Warm (> 3°F)", color: secondaryPalette.primary.hex },
  ];
  const getSetpointErrorState = (errorValue: number) => {
    if (errorValue < -3) return setpointErrorBins[0];
    if (errorValue < -2) return setpointErrorBins[1];
    if (errorValue < -1) return setpointErrorBins[2];
    if (errorValue <= 1) return setpointErrorBins[3];
    if (errorValue <= 2) return setpointErrorBins[4];
    if (errorValue <= 3) return setpointErrorBins[5];
    return setpointErrorBins[6];
  };

  // Helper function to prepare timeline data for ECharts
  // Groups data by state/range so legend items match series names
  const prepareTimelineData = (
    data: typeof occupancyData,
    getStateInfo: (value: number) => { label: string; color: string },
    startTime: string,
    endTime: string,
    systems: string[],
    displayNames: string[],
    preSeededStates?: Array<{ label: string; color: string }>,
    unknownStateOverride?: { label: string; color: string },
  ) => {
    const series: any[] = [];

    // Create mapping from original system names to display names
    const systemToDisplayName = new Map<string, string>();
    systems.forEach((sys, idx) => {
      systemToDisplayName.set(sys, displayNames[idx] || sys);
    });

    // "Unknown" background series (rendered behind everything). Callers can
    // pass `unknownStateOverride` when 0 is a valid value in their state
    // space (e.g. setpoint error, where 0 falls in the Optimal bin).
    const unknownState = unknownStateOverride ?? getStateInfo(0);
    const unknownData = displayNames.map((displayName) => ({
      value: [displayName, startTime, endTime, unknownState.label, unknownState.color],
      itemStyle: { color: unknownState.color },
    }));

    series.push({
      name: unknownState.label,
      type: "custom" as const,
      itemStyle: {
        color: unknownState.color,
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
              opacity: 0.7,
              stroke: null,
            },
          }
        );
      },
      encode: {
        x: [1, 2],
        y: 0,
      },
      data: unknownData,
    });

    // Collect valid states (excluding "Unknown"). Pre-seed with the full
    // bin list (when provided) so every bin shows in the legend even if no
    // data point currently falls in it, and so legend order matches the
    // caller-supplied order.
    const stateMap = new Map<string, { label: string; color: string; data: any[] }>();
    preSeededStates?.forEach((state) => {
      if (state.label === unknownState.label) return;
      stateMap.set(state.label, { label: state.label, color: state.color, data: [] });
    });

    // Process each system's data
    (data?.historianMultiSystemUnit ?? []).forEach((systemData: any) => {
      const points = systemData.data || [];
      const systemName = systemData.system;

      points.forEach((point: any, i: number) => {
        // Skip invalid data points
        if (point.value == null || typeof point.value !== "number") {
          return;
        }

        const state = getStateInfo(point.value);

        // Skip "Unknown" states - they're already rendered as background
        if (state.label === "Unknown") {
          return;
        }

        const startTime = point.timestamp;
        // End time is either the next point's timestamp, or add a default duration (e.g., 5 minutes)
        const endTime =
          i < points.length - 1
            ? points[i + 1].timestamp
            : new Date(new Date(startTime).getTime() + 5 * 60 * 1000).toISOString();

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
        stateMap.get(state.label)!.data.push({
          value: [displayName, startTime, endTime, state.label, state.color],
          itemStyle: { color: state.color },
        });
      });
    });

    // Add valid state series (these render on top of "Unknown" background)
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

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>
          {campus} {building} - Site Overview
        </h1>
        <TimeRangeSelector onApply={onApplyTimeRange} />
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
                tooltip: {
                  trigger: "item",
                  valueFormatter: (value: any) => {
                    // For timeline custom series, value is an array: [systemName, startTime, endTime, label, color]
                    if (Array.isArray(value)) {
                      return value[3]; // Return just the occupancy label
                    }
                    return String(value);
                  },
                },
                legend: {
                  bottom: 0,
                  show: true,
                  data: ["Unknown", "Local Control", "Occupied", "Unoccupied"],
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
                ),
              }}
              style={{ height: "480px" }}
              theme={mode}
              showLegendToggle
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
                tooltip: {
                  trigger: "item",
                  valueFormatter: (value: any) => {
                    // For timeline custom series, value is an array: [systemName, startTime, endTime, label, color]
                    if (Array.isArray(value)) {
                      return value[3]; // Return just the error range label
                    }
                    return String(value);
                  },
                },
                legend: {
                  bottom: 0,
                  show: true,
                  data: ["Unknown", ...setpointErrorBins.map((b) => b.label)],
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
                  { label: "Unknown", color: tertiaryPalette.secondary.hex },
                ),
              }}
              style={{ height: "480px" }}
              theme={mode}
              showLegendToggle
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
                  valueFormatter: (value: any) => {
                    if (value == null) return "N/A";
                    if (typeof value !== "number") return String(value);
                    return `${value.toFixed(2)}°F`;
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
                yAxis: { type: "value", name: "Temperature (°F)", position: "left", nameTextStyle: { align: "left" } },
                series: [
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
                    data: systemData.data?.map((point: any) => [point.timestamp, point.value]) || [],
                  })) || []),
                ],
              }}
              style={{ height: "380px" }}
              theme={mode}
              showLegendToggle
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
                  valueFormatter: (value: any) => {
                    if (value == null) return "N/A";
                    if (typeof value !== "number") return String(value);
                    return `${value.toFixed(2)} W`;
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
                yAxis: { type: "value", name: "Power (W)", position: "left", nameTextStyle: { align: "left" } },
                series: powerData?.historianMeterTimeSeries
                  ? [
                      {
                        name: "Building Power",
                        type: "line",
                        smooth: true,
                        sampling: "lttb" as const,
                        showSymbol: false,
                        itemStyle: { color: secondaryPalette.secondary.hex }, // Use secondary palette for power/demand
                        lineStyle: { color: secondaryPalette.secondary.hex, width: 1.5 },
                        data:
                          powerData.historianMeterTimeSeries.data?.map((point: any) => [
                            point.timestamp,
                            point.value,
                          ]) || [],
                      },
                    ]
                  : [],
              }}
              style={{ height: "380px" }}
              theme={mode}
              showLegendToggle
            />
          )}
        </Card>
      </div>
    </div>
  );
}
