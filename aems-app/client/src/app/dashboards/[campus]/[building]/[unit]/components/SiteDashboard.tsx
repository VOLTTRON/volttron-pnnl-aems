"use client";

import React from "react";
import { Card, Spinner } from "@blueprintjs/core";
import { useQuery } from "@apollo/client";
import { HistorianTimeSeriesDocument, HistorianMultiUnitDocument } from "@/graphql-codegen/graphql";
import { HistorianTimeSeries, HistorianDataPoint } from "@local/prisma";
import { ECharts } from "@/app/components/common/echarts";
import { Colors } from "@blueprintjs/core";
import { TimeRangeSelector } from "./TimeRangeSelector";
import styles from "./SiteDashboard.module.scss";

interface Unit {
  name?: string | null;
  label?: string | null;
  campus?: string | null;
  building?: string | null;
  system?: string | null;
}

interface SiteDashboardProps {
  campus: string;
  building: string;
  units: Unit[];
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
  units,
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
  // Extract system names for queries and unit names for display
  const unitSystems = units.map((u) => u.system).filter(Boolean) as string[];
  const unitNames = units.map((u) => u.name || u.system).filter(Boolean) as string[];
  
  // Use the first unit's stored campus/building values, or fall back to props
  const siteCampus = units[0]?.campus || campus;
  const siteBuilding = units[0]?.building || building;

  // Occupancy Status data
  const { data: occupancyData, loading: occupancyLoading } = useQuery(HistorianMultiUnitDocument, {
    variables: {
      campus: siteCampus,
      building: siteBuilding,
      startTime,
      endTime,
      topicPattern: `${siteCampus}/${siteBuilding}/%UNIT%/OccupancyCommand`,
      units: unitSystems,
    },
    skip: unitSystems.length === 0,
  });

  // Zone Temperature data for setpoint error calculation
  const { data: zoneTempsData, loading: zoneTempsLoading } = useQuery(HistorianMultiUnitDocument, {
    variables: {
      campus: siteCampus,
      building: siteBuilding,
      startTime,
      endTime,
      topicPattern: `${siteCampus}/${siteBuilding}/%UNIT%/ZoneTemperature`,
      units: unitSystems,
    },
    skip: unitSystems.length === 0,
  });

  // Zone Setpoint data for setpoint error calculation
  const { data: zoneSetpointsData, loading: zoneSetpointsLoading } = useQuery(HistorianMultiUnitDocument, {
    variables: {
      campus: siteCampus,
      building: siteBuilding,
      startTime,
      endTime,
      topicPattern: `${siteCampus}/${siteBuilding}/%UNIT%/EffectiveZoneTemperatureSetPoint`,
      units: unitSystems,
    },
    skip: unitSystems.length === 0,
  });

  // Calculate setpoint errors
  const setpointErrorData = React.useMemo(() => {
    if (!zoneTempsData?.historianMultiUnit || !zoneSetpointsData?.historianMultiUnit) {
      return null;
    }

    const errors: any[] = [];
    
    zoneTempsData.historianMultiUnit.forEach((tempUnit: any) => {
      const setpointUnit = zoneSetpointsData.historianMultiUnit?.find((sp: any) => sp.unit === tempUnit.unit);
      if (!setpointUnit) return;

      const errorData: any[] = [];
      tempUnit.data?.forEach((tempPoint: any, index: number) => {
        const setpointPoint = setpointUnit.data?.[index];
        if (setpointPoint && tempPoint.value !== null && setpointPoint.value !== null) {
          errorData.push({
            timestamp: tempPoint.timestamp,
            value: tempPoint.value - setpointPoint.value,
          });
        }
      });

      errors.push({
        unit: tempUnit.unit,
        data: errorData,
      });
    });

    return { historianMultiUnit: errors };
  }, [zoneTempsData, zoneSetpointsData]);

  const setpointErrorLoading = zoneTempsLoading || zoneSetpointsLoading;

  const { data: weatherData, loading: weatherLoading } = useQuery(HistorianTimeSeriesDocument, {
    variables: {
      campus: siteCampus,
      building: siteBuilding,
      startTime,
      endTime,
      topicPatterns: [`${siteCampus}/${siteBuilding}/%/OutdoorAirTemperature`, "%/%/air_temperature"],
    },
    skip: unitSystems.length === 0,
  });

  const { data: powerData, loading: powerLoading } = useQuery(HistorianTimeSeriesDocument, {
    variables: {
      campus: siteCampus,
      building: siteBuilding,
      startTime,
      endTime,
      topicPatterns: [`${siteCampus}/${siteBuilding}/meter/Watts`],
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
  const prepareTimelineData = (data: any, getStateInfo: (value: number) => { label: string; color: string }) => {
    if (!data?.historianMultiUnit) return [];

    return data.historianMultiUnit.map((unitData: any, index: number) => {
      const timelineData = unitData.data?.map((point: any) => {
        const state = getStateInfo(point.value);
        return {
          name: point.timestamp,
          value: [index, point.timestamp, point.timestamp, state.label],
          itemStyle: { color: state.color },
        };
      }) || [];

      return {
        name: unitData.unit,
        type: "custom" as const,
        renderItem: (params: any, api: any) => {
          const categoryIndex = api.value(0);
          const start = api.coord([api.value(1), categoryIndex]);
          const end = api.coord([api.value(2), categoryIndex]);
          const height = api.size([0, 1])[1] * 0.6;

          return {
            type: "rect",
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
      };
    });
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>{siteBuilding} - Site Overview</h1>
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
          <h3>Occupancy Status</h3>
          {occupancyLoading ? (
            <div className={styles.chartLoading}>
              <Spinner />
            </div>
          ) : (
            <ECharts
              option={{
                backgroundColor: mode === "dark" ? Colors.DARK_GRAY5 : Colors.WHITE,
                tooltip: {
                  formatter: (params: any) => {
                    if (Array.isArray(params)) params = params[0];
                    return `${params.seriesName}<br/>${params.value[3]}<br/>${new Date(params.value[1]).toLocaleString()}`;
                  },
                },
                legend: {
                  bottom: 0,
                  data: ["Occupied", "Unoccupied", "Local Control"],
                },
                grid: { top: 40, right: 60, bottom: 60, left: 80 },
                xAxis: { type: "time" },
                yAxis: {
                  type: "category",
                  data: unitNames,
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
          <h3>Occupancy Setpoint Error</h3>
          {setpointErrorLoading ? (
            <div className={styles.chartLoading}>
              <Spinner />
            </div>
          ) : (
            <ECharts
              option={{
                backgroundColor: mode === "dark" ? Colors.DARK_GRAY5 : Colors.WHITE,
                tooltip: {
                  formatter: (params: any) => {
                    if (Array.isArray(params)) params = params[0];
                    return `${params.seriesName}<br/>Error: ${params.value[3]}<br/>${new Date(params.value[1]).toLocaleString()}`;
                  },
                },
                grid: { top: 40, right: 60, bottom: 40, left: 80 },
                xAxis: { type: "time" },
                yAxis: {
                  type: "category",
                  data: unitNames,
                  axisLabel: { interval: 0 },
                },
                series:
                  setpointErrorData?.historianMultiUnit?.map((unitData: any, index: number) => ({
                    name: unitData.unit,
                    type: "scatter",
                    symbolSize: 8,
                    data:
                      unitData.data?.map((point: any) => [
                        point.timestamp,
                        index,
                        point.value,
                      ]) || [],
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

      <div className={styles.grid}>
        <Card className={styles.chartCard}>
          <h3>Weather</h3>
          {weatherLoading ? (
            <div className={styles.chartLoading}>
              <Spinner />
            </div>
          ) : (
            <ECharts
              option={{
                backgroundColor: mode === "dark" ? Colors.DARK_GRAY5 : Colors.WHITE,
                tooltip: { trigger: "axis" },
                legend: { bottom: 0 },
                grid: { top: 40, right: 60, bottom: 60, left: 60 },
                xAxis: { type: "time" },
                yAxis: { type: "value", name: "Temperature (°F)" },
                series:
                  weatherData?.historianTimeSeries?.map((series: HistorianTimeSeries) => ({
                    name: series.topic,
                    type: "line",
                    smooth: true,
                    data: series.data?.map((point: HistorianDataPoint) => [point.timestamp, point.value]) || [],
                  })) || [],
              }}
              style={{ height: "300px" }}
              theme={mode}
            />
          )}
        </Card>

        <Card className={styles.chartCard}>
          <h3>Building Power</h3>
          {powerLoading ? (
            <div className={styles.chartLoading}>
              <Spinner />
            </div>
          ) : (
            <ECharts
              option={{
                backgroundColor: mode === "dark" ? Colors.DARK_GRAY5 : Colors.WHITE,
                tooltip: { trigger: "axis" },
                legend: { bottom: 0 },
                grid: { top: 40, right: 60, bottom: 60, left: 60 },
                xAxis: { type: "time" },
                yAxis: { type: "value", name: "Power (W)" },
                series:
                  powerData?.historianTimeSeries?.map((series: HistorianTimeSeries) => ({
                    name: series.topic,
                    type: "line",
                    smooth: true,
                    data: series.data?.map((point: HistorianDataPoint) => [point.timestamp, point.value]) || [],
                  })) || [],
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
