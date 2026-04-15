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
} from "@/graphql-codegen/graphql";
import { ECharts } from "@/app/components/common/echarts";
import { Colors } from "@blueprintjs/core";
import { TimeRangeSelector } from "./TimeRangeSelector";
import styles from "./SiteDashboard.module.scss";
import { typeofString } from "@local/common";
import { Palettes } from "@/utils/palette";
import { compilePreferences, PreferencesContext, CurrentContext } from "@/app/components/providers";

interface SiteDashboardProps {
  campus: string;
  building: string;
  units: ReadUnitsQuery["readUnits"];
  startTime: string;
  endTime: string;
  onApplyTimeRange: (startTime: string, endTime: string) => void;
  mode: "light" | "dark";
}

export function SiteDashboard({
  campus,
  building,
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
  const { palette1, palette2, palette3 } = compilePreferences(preferences, current?.preferences);

  // Load palettes: primary for temps, secondary for demands, tertiary for status
  const primaryPalette = Palettes.getPalette(palette1 || "Radiant Harmony");
  const secondaryPalette = Palettes.getPalette(palette2 || "Desert Oasis");
  const tertiaryPalette = Palettes.getPalette(palette3 || "Pastel Dreams");

  // Extract system names for queries and unit names for display
  const unitSystems = units
    .map((u) => u.system)
    .filter(typeofString)
    .sort()
    .reverse();

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

  // Setpoint error data - using multi-system query with each system
  const { data: setpointErrorData1, loading: setpointErrorLoading1 } = useQuery(HistorianSetpointErrorDocument, {
    variables: {
      campus,
      building,
      system: unitSystems[0] || "",
      startTime,
      endTime,
    },
    skip: unitSystems.length === 0,
  });
  const { data: setpointErrorData2, loading: setpointErrorLoading2 } = useQuery(HistorianSetpointErrorDocument, {
    variables: {
      campus,
      building,
      system: unitSystems[1] || "",
      startTime,
      endTime,
    },
    skip: unitSystems.length < 2,
  });
  const { data: setpointErrorData3, loading: setpointErrorLoading3 } = useQuery(HistorianSetpointErrorDocument, {
    variables: {
      campus,
      building,
      system: unitSystems[2] || "",
      startTime,
      endTime,
    },
    skip: unitSystems.length < 3,
  });

  const setpointErrorLoading = setpointErrorLoading1 || setpointErrorLoading2 || setpointErrorLoading3;
  const setpointErrorData = React.useMemo(() => {
    const results = [
      unitSystems[0] && setpointErrorData1?.historianSetpointError
        ? { system: unitSystems[0], data: setpointErrorData1.historianSetpointError }
        : null,
      unitSystems[1] && setpointErrorData2?.historianSetpointError
        ? { system: unitSystems[1], data: setpointErrorData2.historianSetpointError }
        : null,
      unitSystems[2] && setpointErrorData3?.historianSetpointError
        ? { system: unitSystems[2], data: setpointErrorData3.historianSetpointError }
        : null,
    ].filter((r) => r !== null);

    return results.length > 0 ? { historianMultiSystemUnit: results } : null;
  }, [setpointErrorData1, setpointErrorData2, setpointErrorData3, unitSystems]);

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
  // Note: The actual metric name for power may need to be verified in the schema
  const { data: powerData, loading: powerLoading } = useQuery(HistorianUnitTimeSeriesDocument, {
    variables: {
      campus: campus,
      building: building,
      system: "meter",
      metric: UnitMetric.HeartBeat, // Placeholder - actual power metric may need to be added to schema
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

  // Helper function to get setpoint error state with color coding
  // Using diverging scale: blue (cold) -> green (optimal) -> yellow/red (warm)
  const getSetpointErrorState = (errorValue: number) => {
    if (errorValue < -2) return { label: "Very Cold (< -2°F)", color: primaryPalette.primary.hex }; // Deep Navy
    if (errorValue < -1) return { label: "Slightly Cold (-2 to -1°F)", color: primaryPalette.tertiary.hex }; // Sky Blue
    if (errorValue <= 1) return { label: "Optimal (-1 to 1°F)", color: tertiaryPalette.tertiary.hex }; // Spring Green
    if (errorValue <= 2) return { label: "Slightly Warm (1 to 2°F)", color: secondaryPalette.quaternary.hex }; // Earth Amber
    return { label: "Very Warm (> 2°F)", color: secondaryPalette.primary.hex }; // Fire Red
  };

  // Helper function to prepare timeline data for ECharts
  // Groups data by state/range so legend items match series names
  const prepareTimelineData = (
    data: typeof occupancyData,
    getStateInfo: (value: number) => { label: string; color: string },
    startTime: string,
    endTime: string,
    systems: string[],
  ) => {
    if (!data?.historianMultiSystemUnit) return [];

    const series: any[] = [];

    // Create "Unknown" background series first (renders behind everything)
    const unknownState = getStateInfo(0); // Get "Unknown" state info
    const unknownData = systems.map((systemName) => ({
      value: [systemName, startTime, endTime, unknownState.label, unknownState.color],
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

        return {
          type: "rect" as const,
          shape: {
            x: start[0],
            y: start[1] - height / 2,
            width: Math.max(end[0] - start[0], 1),
            height: height,
          },
          style: {
            fill: color,
            opacity: 0.7,
            stroke: null,
          },
        };
      },
      encode: {
        x: [1, 2],
        y: 0,
      },
      data: unknownData,
    });

    // Collect valid states (excluding "Unknown")
    const stateMap = new Map<string, { label: string; color: string; data: any[] }>();

    // Process each system's data
    data.historianMultiSystemUnit.forEach((systemData: any) => {
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

        // Add data point to this state's series - use system name instead of index
        stateMap.get(state.label)!.data.push({
          value: [systemName, startTime, endTime, state.label, state.color],
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

          return {
            type: "rect" as const,
            shape: {
              x: start[0],
              y: start[1] - height / 2,
              width: Math.max(end[0] - start[0], 1),
              height: height,
            },
            style: {
              fill: color,
              stroke: null,
            },
          };
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
                },
                // tooltip: {
                //   formatter: (params: any) => {
                //     if (Array.isArray(params)) params = params[0];
                //     return `${params.seriesName}<br/>${params.value[3]}<br/>${new Date(params.value[1]).toLocaleString()}`;
                //   },
                // },
                legend: {
                  bottom: 0,
                  show: true,
                  data: ["Unknown", "Local Control", "Occupied", "Unoccupied"],
                },
                grid: { top: 40, right: 40, bottom: 80, left: 40 },
                xAxis: { type: "time", min: startTime, max: endTime },
                yAxis: {
                  type: "category",
                  data: unitSystems,
                  axisLabel: { interval: 0 },
                },
                series: prepareTimelineData(occupancyData, getOccupancyState, startTime, endTime, unitSystems),
              }}
              style={{ height: "400px" }}
              theme={mode}
            />
          )}
        </Card>

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
                },
                legend: {
                  bottom: 0,
                  show: true,
                  data: [
                    "Unknown",
                    "Very Cold (< -2°F)",
                    "Slightly Cold (-2 to -1°F)",
                    "Optimal (-1 to 1°F)",
                    "Slightly Warm (1 to 2°F)",
                    "Very Warm (> 2°F)",
                  ],
                },
                grid: { top: 40, right: 40, bottom: 80, left: 40 },
                xAxis: { type: "time", min: startTime, max: endTime },
                yAxis: {
                  type: "category",
                  data: unitSystems,
                  axisLabel: { interval: 0 },
                },
                series: prepareTimelineData(
                  setpointErrorData || undefined,
                  getSetpointErrorState,
                  startTime,
                  endTime,
                  unitSystems,
                ),
              }}
              style={{ height: "400px" }}
              theme={mode}
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
                title: { text: "Outdoor Temperature" },
                backgroundColor: mode === "dark" ? Colors.DARK_GRAY2 : Colors.WHITE,
                tooltip: { trigger: "axis" },
                legend: { bottom: 0, show: true },
                grid: { top: 60, right: 40, bottom: 80, left: 40 },
                xAxis: { type: "time", min: startTime, max: endTime },
                yAxis: { type: "value", name: "Temperature (°F)" },
                series: [
                  // Weather station outdoor temperature
                  ...(weatherData?.historianWeatherTimeSeries
                    ? [
                        {
                          name: "Weather Station",
                          type: "line" as const,
                          smooth: true,
                          itemStyle: { color: secondaryPalette.primary.hex },
                          lineStyle: { color: secondaryPalette.primary.hex, width: 2 },
                          data:
                            weatherData.historianWeatherTimeSeries.data?.map((point: any) => [
                              point.timestamp,
                              point.value,
                            ]) || [],
                        },
                      ]
                    : []),
                  // Unit sensor outdoor temperatures
                  ...(outdoorTempData?.historianMultiSystemUnit?.map((systemData: any, index: number) => ({
                    name: `${systemData.system} Sensor`,
                    type: "line" as const,
                    smooth: true,
                    itemStyle: { color: primaryPalette.getColor(index % 5).hex },
                    lineStyle: { color: primaryPalette.getColor(index % 5).hex },
                    data: systemData.data?.map((point: any) => [point.timestamp, point.value]) || [],
                  })) || []),
                ],
              }}
              style={{ height: "300px" }}
              theme={mode}
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
                title: { text: "Building Power" },
                backgroundColor: mode === "dark" ? Colors.DARK_GRAY2 : Colors.WHITE,
                tooltip: { trigger: "axis" },
                legend: { bottom: 0, show: true },
                grid: { top: 60, right: 60, bottom: 80, left: 60 },
                xAxis: { type: "time", min: startTime, max: endTime },
                yAxis: { type: "value", name: "Power (W)" },
                series: powerData?.historianUnitTimeSeries
                  ? [
                      {
                        name: "Building Power",
                        type: "line",
                        smooth: true,
                        itemStyle: { color: secondaryPalette.secondary.hex }, // Use secondary palette for power/demand
                        lineStyle: { color: secondaryPalette.secondary.hex },
                        data:
                          powerData.historianUnitTimeSeries.data?.map((point: any) => [point.timestamp, point.value]) ||
                          [],
                      },
                    ]
                  : [],
              }}
              style={{ height: "300px" }}
              theme={mode}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
