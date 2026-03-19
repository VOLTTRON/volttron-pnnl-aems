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

interface SiteDashboardProps {
  campus: string;
  building: string;
  units: ReadUnitsQuery["readUnits"];
  startTime: string;
  endTime: string;
  fromDate: Date;
  toDate: Date | null;
  useCurrentTime: boolean;
  selectedPreset: string;
  onApplyTimeRange: (fromDate: Date, toDate: Date | null, useCurrentTime: boolean) => void;
  onPresetChange: (preset: string) => void;
  mode: "light" | "dark";
}

export function SiteDashboard({
  campus,
  building,
  units: optionalUnits,
  startTime,
  endTime,
  fromDate,
  toDate,
  useCurrentTime,
  selectedPreset,
  onApplyTimeRange,
  onPresetChange,
  mode,
}: SiteDashboardProps) {
  const units = optionalUnits ?? [];
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

  // Power data - using unit metric for meter data
  const { data: powerData, loading: powerLoading } = useQuery(HistorianUnitTimeSeriesDocument, {
    variables: {
      campus: campus,
      building: building,
      system: "meter",
      metric: UnitMetric.HeartBeat, // Using a placeholder - may need adjustment based on actual meter metric
      startTime,
      endTime,
    },
    skip: unitSystems.length === 0,
  });

  // Helper function to get state label and color
  const getOccupancyState = (value: number) => {
    if (value === 0) return { label: "Unoccupied", color: Colors.BLUE3 };
    if (value === 1) return { label: "Occupied", color: Colors.GREEN3 };
    return { label: "Local Control", color: Colors.RED3 };
  };

  // Helper function to prepare timeline data for ECharts
  const prepareTimelineData = (
    data: typeof occupancyData,
    getStateInfo: (value: number) => { label: string; color: string },
  ) => {
    if (!data?.historianMultiSystemUnit) return [];

    return data.historianMultiSystemUnit.map((systemData: any, index: number) => {
      const timelineData =
        systemData.data?.map((point: any) => {
          const state = getStateInfo(point.value ?? 0);
          return {
            name: point.timestamp,
            value: [index, point.timestamp, point.timestamp, state.label],
            itemStyle: { color: state.color },
          };
        }) || [];

      return {
        name: systemData.system,
        type: "custom" as const,
        renderItem: (params: any, api: any) => {
          const categoryIndex = api.value(0);
          const start = api.coord([api.value(1), categoryIndex]);
          const end = api.coord([api.value(2), categoryIndex]);
          const height = api.size([0, 1])[1] * 0.6;

          return {
            type: "rect" as const,
            shape: {
              x: start[0],
              y: start[1] - height / 2,
              width: end[0] - start[0],
              height: height,
            },
            style: api.style(),
          };
        },
        encode: {
          x: [1, 2],
          y: 0,
        },
        data: timelineData,
      } as any;
    });
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>
          {campus} {building} - Site Overview
        </h1>
        <TimeRangeSelector
          fromDate={fromDate}
          toDate={toDate}
          useCurrentTime={useCurrentTime}
          selectedPreset={selectedPreset}
          onApply={onApplyTimeRange}
          onPresetChange={onPresetChange}
        />
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
                  data: ["Occupied", "Unoccupied", "Local Control"],
                },
                grid: { top: 40, right: 60, bottom: 60, left: 80 },
                xAxis: { type: "time" },
                yAxis: {
                  type: "category",
                  data: unitSystems,
                  axisLabel: { interval: 0 },
                },
                series: prepareTimelineData(occupancyData, getOccupancyState),
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
                title: { text: "Occupancy Setpoint Error" },
                backgroundColor: mode === "dark" ? Colors.DARK_GRAY2 : Colors.WHITE,
                tooltip: {
                  trigger: "item",
                },
                // tooltip: {
                //   formatter: (params: any) => {
                //     if (Array.isArray(params)) params = params[0];
                //     return `${params.seriesName}<br/>Error: ${params.value[3]}<br/>${new Date(params.value[1]).toLocaleString()}`;
                //   },
                // },
                grid: { top: 40, right: 60, bottom: 40, left: 80 },
                xAxis: { type: "time" },
                yAxis: {
                  type: "category",
                  data: unitSystems,
                  axisLabel: { interval: 0 },
                },
                series:
                  setpointErrorData?.historianMultiSystemUnit?.map((systemData: any, index: number) => ({
                    name: systemData.system,
                    type: "scatter",
                    symbolSize: 8,
                    data: systemData.data?.map((point: any) => [point.timestamp, index, point.value]) || [],
                    itemStyle: {
                      color: (params: any) => {
                        const value = params.data[2];
                        if (Math.abs(value) < 2) return Colors.BLUE3;
                        return Colors.ORANGE3;
                      },
                    },
                  })) || [],
              }}
              style={{ height: "400px" }}
              theme={mode}
            />
          )}
        </Card>
      </div>

      <div className={styles.timelineGrid}>
        <Card className={styles.chartCard}>
          {weatherLoading ? (
            <div className={styles.chartLoading}>
              <Spinner />
            </div>
          ) : (
            <ECharts
              option={{
                title: { text: "Weather" },
                backgroundColor: mode === "dark" ? Colors.DARK_GRAY2 : Colors.WHITE,
                tooltip: { trigger: "axis" },
                legend: { bottom: 0 },
                grid: { top: 60, right: 60, bottom: 60, left: 60 },
                xAxis: { type: "time" },
                yAxis: { type: "value", name: "Temperature (°F)" },
                series: weatherData?.historianWeatherTimeSeries
                  ? [
                      {
                        name: "Outdoor Temperature",
                        type: "line",
                        smooth: true,
                        data:
                          weatherData.historianWeatherTimeSeries.data?.map((point: any) => [
                            point.timestamp,
                            point.value,
                          ]) || [],
                      },
                    ]
                  : [],
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
                legend: { bottom: 0 },
                grid: { top: 60, right: 60, bottom: 60, left: 60 },
                xAxis: { type: "time" },
                yAxis: { type: "value", name: "Power (W)" },
                series: powerData?.historianUnitTimeSeries
                  ? [
                      {
                        name: "Building Power",
                        type: "line",
                        smooth: true,
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
