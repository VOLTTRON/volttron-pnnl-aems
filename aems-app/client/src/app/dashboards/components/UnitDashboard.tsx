"use client";

import React from "react";
import { Card, Spinner } from "@blueprintjs/core";
import { useQuery } from "@apollo/client";
import {
  HistorianUnitTimeSeriesDocument,
  HistorianUnitCurrentValueDocument,
  HistorianWeatherTimeSeriesDocument,
  UnitMetric,
  WeatherMetric,
} from "@/graphql-codegen/graphql";
import { ECharts } from "@/app/components/common/echarts";
import { Colors } from "@blueprintjs/core";
import { TimeRangeSelector } from "./TimeRangeSelector";
import styles from "./UnitDashboard.module.scss";
import { Palettes } from "@/utils/palette";
import { compilePreferences, PreferencesContext, CurrentContext } from "@/app/components/providers";

interface Unit {
  name?: string | null;
  label?: string | null;
  campus?: string | null;
  building?: string | null;
  system?: string | null;
}

interface UnitDashboardProps {
  campus: string;
  building: string;
  unit: Unit;
  startTime: string;
  endTime: string;
  onApplyTimeRange: (startTime: string, endTime: string) => void;
  mode: "light" | "dark";
}

export function UnitDashboard({
  campus,
  building,
  unit,
  startTime,
  endTime,
  onApplyTimeRange,
  mode,
}: UnitDashboardProps) {
  // Get user palette preferences
  const { preferences } = React.useContext(PreferencesContext);
  const { current } = React.useContext(CurrentContext);
  const { palette1, palette2, palette3, paletteWarm, paletteCool, paletteGradient } = compilePreferences(
    preferences,
    current?.preferences,
  );

  // Load palettes: primary for temps, secondary for demands, tertiary for status
  const primaryPalette = Palettes.getPalette(palette1 || "Radiant Harmony");
  const secondaryPalette = Palettes.getPalette(palette2 || "Desert Oasis");
  const tertiaryPalette = Palettes.getPalette(palette3 || "Pastel Dreams");
  const warmPalette = Palettes.getPalette(paletteWarm || "Red");
  const coolPalette = Palettes.getPalette(paletteCool || "Blue");
  const gradientPalette = Palettes.getPalette(paletteGradient || "Teal");

  // Helper function to blend two hex colors (50/50 mix)
  const blendColors = (color1: string, color2: string): string => {
    const hex1 = color1.replace("#", "");
    const hex2 = color2.replace("#", "");

    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);

    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);

    const r = Math.round((r1 + r2) / 2);
    const g = Math.round((g1 + g2) / 2);
    const b = Math.round((b1 + b2) / 2);

    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  };

  // Build smooth temperature gradient with blended intermediate colors
  const buildTemperatureGradient = React.useMemo(() => {
    const gradient: [number, string][] = [];

    // Cool palette section (0-60°F = 0-0.5 of range)
    const coolColors = [];
    for (let i = 0; i < 5; i++) {
      coolColors.push(coolPalette.getColor(i).hex);
    }

    // Add cool colors with blends
    for (let i = 0; i < coolColors.length; i++) {
      const position = (i / (coolColors.length - 1)) * 0.5; // Map to 0-0.5
      gradient.push([position, coolColors[i]]);

      // Add blend between this and next color
      if (i < coolColors.length - 1) {
        const blendPosition = ((i + 0.5) / (coolColors.length - 1)) * 0.5;
        gradient.push([blendPosition, blendColors(coolColors[i], coolColors[i + 1])]);
      }
    }

    // Warm palette section (60-120°F = 0.5-1.0 of range) - reversed
    const warmColors = [];
    for (let i = 4; i >= 0; i--) {
      // Reverse order
      warmColors.push(warmPalette.getColor(i).hex);
    }

    // Add transition blend between cool and warm
    const transitionBlend = blendColors(coolColors[coolColors.length - 1], warmColors[0]);
    gradient.push([0.5, transitionBlend]);

    // Add warm colors with blends
    for (let i = 0; i < warmColors.length; i++) {
      const position = 0.5 + (i / (warmColors.length - 1)) * 0.5; // Map to 0.5-1.0
      if (i > 0) {
        // Skip first as we already added transition blend at 0.5
        gradient.push([position, warmColors[i]]);
      }

      // Add blend between this and next color
      if (i < warmColors.length - 1) {
        const blendPosition = 0.5 + ((i + 0.5) / (warmColors.length - 1)) * 0.5;
        gradient.push([blendPosition, blendColors(warmColors[i], warmColors[i + 1])]);
      }
    }

    // Sort by position to ensure correct order
    return gradient.sort((a, b) => a[0] - b[0]);
  }, [coolPalette, warmPalette]);

  // Build smooth humidity gradient with blended intermediate colors
  const buildHumidityGradient = React.useMemo(() => {
    const gradient: [number, string][] = [];

    // Get gradient palette colors in reverse order
    const colors = [];
    for (let i = 4; i >= 0; i--) {
      // Reverse order
      colors.push(gradientPalette.getColor(i).hex);
    }

    // Add colors with blends
    for (let i = 0; i < colors.length; i++) {
      const position = i / (colors.length - 1); // Map evenly across 0-1
      gradient.push([position, colors[i]]);

      // Add blend between this and next color
      if (i < colors.length - 1) {
        const blendPosition = (i + 0.5) / (colors.length - 1);
        gradient.push([blendPosition, blendColors(colors[i], colors[i + 1])]);
      }
    }

    // Sort by position to ensure correct order
    return gradient.sort((a, b) => a[0] - b[0]);
  }, [gradientPalette]);

  // Use unit's stored campus, building, and system for historian queries
  const unitCampus = unit.campus || campus;
  const unitBuilding = unit.building || building;
  const unitSystem = unit.system || unit.name || "";

  // Current values for unit metrics
  const { data: heatingSetpoint } = useQuery(HistorianUnitCurrentValueDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      system: unitSystem,
      metric: UnitMetric.OccupiedHeatingSetPoint,
    },
  });
  const { data: coolingSetpoint } = useQuery(HistorianUnitCurrentValueDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      system: unitSystem,
      metric: UnitMetric.OccupiedCoolingSetPoint,
    },
  });
  const { data: unoccupiedHeatingSetpoint } = useQuery(HistorianUnitCurrentValueDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      system: unitSystem,
      metric: UnitMetric.UnoccupiedHeatingSetPoint,
    },
  });
  const { data: unoccupiedCoolingSetpoint } = useQuery(HistorianUnitCurrentValueDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      system: unitSystem,
      metric: UnitMetric.UnoccupiedCoolingSetPoint,
    },
  });
  // Time series for unit metrics
  const { data: zoneTempSeries, loading: zoneTempLoading } = useQuery(HistorianUnitTimeSeriesDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      system: unitSystem,
      metric: UnitMetric.ZoneTemperature,
      startTime,
      endTime,
    },
  });
  const { data: heatingSetpointSeries } = useQuery(HistorianUnitTimeSeriesDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      system: unitSystem,
      metric: UnitMetric.OccupiedHeatingSetPoint,
      startTime,
      endTime,
    },
  });
  const { data: coolingSetpointSeries } = useQuery(HistorianUnitTimeSeriesDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      system: unitSystem,
      metric: UnitMetric.OccupiedCoolingSetPoint,
      startTime,
      endTime,
    },
  });
  const { data: unoccupiedHeatingSetpointSeries } = useQuery(HistorianUnitTimeSeriesDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      system: unitSystem,
      metric: UnitMetric.UnoccupiedHeatingSetPoint,
      startTime,
      endTime,
    },
  });
  const { data: unoccupiedCoolingSetpointSeries } = useQuery(HistorianUnitTimeSeriesDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      system: unitSystem,
      metric: UnitMetric.UnoccupiedCoolingSetPoint,
      startTime,
      endTime,
    },
  });
  const { data: zoneHumiditySeries } = useQuery(HistorianUnitTimeSeriesDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      system: unitSystem,
      metric: UnitMetric.ZoneHumidity,
      startTime,
      endTime,
    },
  });
  const { data: outdoorTempSeries } = useQuery(HistorianWeatherTimeSeriesDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      metric: WeatherMetric.AirTemperature,
      startTime,
      endTime,
    },
  });
  const { data: occupancyCommandSeries } = useQuery(HistorianUnitTimeSeriesDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      system: unitSystem,
      metric: UnitMetric.OccupancyCommand,
      startTime,
      endTime,
    },
  });
  const { data: fanStatusSeries } = useQuery(HistorianUnitTimeSeriesDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      system: unitSystem,
      metric: UnitMetric.SupplyFanStatus,
      startTime,
      endTime,
    },
  });
  const { data: coolingDemandSeries } = useQuery(HistorianUnitTimeSeriesDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      system: unitSystem,
      metric: UnitMetric.CoolingDemand,
      startTime,
      endTime,
    },
  });
  const { data: heatingDemandSeries } = useQuery(HistorianUnitTimeSeriesDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      system: unitSystem,
      metric: UnitMetric.HeatingDemand,
      startTime,
      endTime,
    },
  });
  const { data: firstStageCoolingSeries } = useQuery(HistorianUnitTimeSeriesDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      system: unitSystem,
      metric: UnitMetric.FirstStageCooling,
      startTime,
      endTime,
    },
  });
  const { data: secondStageCoolingSeries } = useQuery(HistorianUnitTimeSeriesDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      system: unitSystem,
      metric: UnitMetric.SecondStageCooling,
      startTime,
      endTime,
    },
  });
  const { data: firstStageHeatingSeries } = useQuery(HistorianUnitTimeSeriesDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      system: unitSystem,
      metric: UnitMetric.FirstStageHeating,
      startTime,
      endTime,
    },
  });
  const { data: auxHeatSeries } = useQuery(HistorianUnitTimeSeriesDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      system: unitSystem,
      metric: UnitMetric.AuxiliaryHeatCommand,
      startTime,
      endTime,
    },
  });
  const { data: reversingValveSeries } = useQuery(HistorianUnitTimeSeriesDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      system: unitSystem,
      metric: UnitMetric.ReversingValve,
      startTime,
      endTime,
    },
  });

  // Compute cooling stage series (sum of first and second stage)
  const coolingStageSeriesData = React.useMemo(() => {
    const first = firstStageCoolingSeries?.historianUnitTimeSeries?.data || [];
    const second = secondStageCoolingSeries?.historianUnitTimeSeries?.data || [];

    // Create a map of timestamps to values
    const stageMap = new Map<string, number>();

    first.forEach((point: any) => {
      stageMap.set(point.timestamp, point.value || 0);
    });

    second.forEach((point: any) => {
      const existing = stageMap.get(point.timestamp) || 0;
      stageMap.set(point.timestamp, existing + (point.value || 0));
    });

    return Array.from(stageMap.entries())
      .map(([timestamp, value]) => [timestamp, value])
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
  }, [firstStageCoolingSeries, secondStageCoolingSeries]);

  // Extract gauge values from time series data (value at end of time range)
  const outdoorTempValue = React.useMemo(() => {
    const data = outdoorTempSeries?.historianWeatherTimeSeries?.data;
    if (!data || data.length === 0) return null;
    return data[data.length - 1]?.value ?? null;
  }, [outdoorTempSeries]);

  const zoneHumidityValue = React.useMemo(() => {
    const data = zoneHumiditySeries?.historianUnitTimeSeries?.data;
    if (!data || data.length === 0) return null;
    return data[data.length - 1]?.value ?? null;
  }, [zoneHumiditySeries]);

  const zoneTempValue = React.useMemo(() => {
    const data = zoneTempSeries?.historianUnitTimeSeries?.data;
    if (!data || data.length === 0) return null;
    return data[data.length - 1]?.value ?? null;
  }, [zoneTempSeries]);

  const occupancyCommandValue = React.useMemo(() => {
    const data = occupancyCommandSeries?.historianUnitTimeSeries?.data;
    if (!data || data.length === 0) return null;
    return data[data.length - 1]?.value ?? null;
  }, [occupancyCommandSeries]);

  const heatingCommandValue = React.useMemo(() => {
    const data = firstStageHeatingSeries?.historianUnitTimeSeries?.data;
    if (!data || data.length === 0) return null;
    return data[data.length - 1]?.value ?? null;
  }, [firstStageHeatingSeries]);

  const supplyFanValue = React.useMemo(() => {
    const data = fanStatusSeries?.historianUnitTimeSeries?.data;
    if (!data || data.length === 0) return null;
    return data[data.length - 1]?.value ?? null;
  }, [fanStatusSeries]);

  const coolingStageValue = React.useMemo(() => {
    const first = firstStageCoolingSeries?.historianUnitTimeSeries?.data;
    const second = secondStageCoolingSeries?.historianUnitTimeSeries?.data;
    if (!first || !second || first.length === 0 || second.length === 0) return null;
    const firstVal = first[first.length - 1]?.value ?? null;
    const secondVal = second[second.length - 1]?.value ?? null;
    if (firstVal === null || secondVal === null) return null;
    return firstVal + secondVal;
  }, [firstStageCoolingSeries, secondStageCoolingSeries]);

  const currentLoading = false; // All queries are separate now
  const timeSeriesLoading = zoneTempLoading; // Use one as indicator

  // Calculate 24-hour range for sparkline charts
  const sparklineStartTime = React.useMemo(() => {
    const end = new Date(endTime);
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    return start.toISOString();
  }, [endTime]);

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>{unit.label || unit.name}</h1>
        <TimeRangeSelector onApply={onApplyTimeRange} />
      </div>

      <div className={styles.gauges}>
        <Card className={styles.gauge}>
          <h4>Outdoor Air Temperature</h4>
          {outdoorTempValue === null ? (
            <div
              style={{
                height: "160px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "36px",
                fontWeight: "bold",
                color: mode === "dark" ? "#fff" : "#000",
              }}
            >
              N/A
            </div>
          ) : (
            <ECharts
              option={{
                backgroundColor: mode === "dark" ? Colors.DARK_GRAY2 : Colors.WHITE,
                series: [
                  {
                    type: "gauge",
                    center: ["50%", "60%"],
                    radius: "95%",
                    startAngle: 200,
                    endAngle: -20,
                    min: 0,
                    max: 120,
                    splitNumber: 12,
                    itemStyle: {
                      color: mode === "dark" ? "#ffffff" : "#333333",
                    },
                    progress: {
                      show: true,
                      width: 14,
                      itemStyle: {
                        color: mode === "dark" ? "#ffffff" : "#333333",
                      },
                    },
                    pointer: {
                      show: false,
                    },
                    axisLine: {
                      lineStyle: {
                        width: 22,
                        color: buildTemperatureGradient,
                      },
                    },
                    axisTick: {
                      distance: -28,
                      length: 5,
                      lineStyle: {
                        color: mode === "dark" ? "#fff" : "#000",
                        width: 1,
                      },
                    },
                    splitLine: {
                      distance: -34,
                      length: 8,
                      lineStyle: {
                        color: mode === "dark" ? "#fff" : "#000",
                        width: 2,
                      },
                    },
                    axisLabel: {
                      show: false,
                    },
                    detail: {
                      fontSize: 36,
                      fontWeight: "bold",
                      color: mode === "dark" ? "#fff" : "#000",
                      formatter: function (value: number) {
                        return Math.round(value) + "°F";
                      },
                      offsetCenter: [0, "15%"],
                    },
                    data: [
                      {
                        value: outdoorTempValue,
                      },
                    ],
                  },
                ],
              }}
              style={{ height: "160px", overflow: "hidden" }}
              theme={mode}
            />
          )}
        </Card>
        <Card className={styles.gauge}>
          <h4>Zone Humidity</h4>
          {zoneHumidityValue === null ? (
            <div
              style={{
                height: "160px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "36px",
                fontWeight: "bold",
                color: mode === "dark" ? "#fff" : "#000",
              }}
            >
              N/A
            </div>
          ) : (
            <ECharts
              option={{
                backgroundColor: mode === "dark" ? Colors.DARK_GRAY2 : Colors.WHITE,
                series: [
                  {
                    type: "gauge",
                    center: ["50%", "60%"],
                    radius: "95%",
                    startAngle: 200,
                    endAngle: -20,
                    min: 0,
                    max: 100,
                    splitNumber: 10,
                    itemStyle: {
                      color: mode === "dark" ? "#ffffff" : "#333333",
                    },
                    progress: {
                      show: true,
                      width: 14,
                      itemStyle: {
                        color: mode === "dark" ? "#ffffff" : "#333333",
                      },
                    },
                    pointer: {
                      show: false,
                    },
                    axisLine: {
                      lineStyle: {
                        width: 22,
                        color: buildHumidityGradient,
                      },
                    },
                    axisTick: {
                      distance: -28,
                      length: 5,
                      lineStyle: {
                        color: mode === "dark" ? "#fff" : "#000",
                        width: 1,
                      },
                    },
                    splitLine: {
                      distance: -34,
                      length: 8,
                      lineStyle: {
                        color: mode === "dark" ? "#fff" : "#000",
                        width: 2,
                      },
                    },
                    axisLabel: {
                      show: false,
                    },
                    detail: {
                      fontSize: 36,
                      fontWeight: "bold",
                      color: mode === "dark" ? "#fff" : "#000",
                      formatter: function (value: number) {
                        return Math.round(value) + "%";
                      },
                      offsetCenter: [0, "15%"],
                    },
                    data: [
                      {
                        value: zoneHumidityValue,
                      },
                    ],
                  },
                ],
              }}
              style={{ height: "160px", overflow: "hidden" }}
              theme={mode}
            />
          )}
        </Card>
        <Card className={styles.gauge}>
          <h4>Zone Temperature</h4>
          {zoneTempValue === null ? (
            <div
              style={{
                height: "160px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "36px",
                fontWeight: "bold",
                color: mode === "dark" ? "#fff" : "#000",
              }}
            >
              N/A
            </div>
          ) : (
            <ECharts
              option={{
                backgroundColor: mode === "dark" ? Colors.DARK_GRAY2 : Colors.WHITE,
                series: [
                  {
                    type: "gauge",
                    center: ["50%", "60%"],
                    radius: "95%",
                    startAngle: 200,
                    endAngle: -20,
                    min: 0,
                    max: 120,
                    splitNumber: 12,
                    itemStyle: {
                      color: mode === "dark" ? "#ffffff" : "#333333",
                    },
                    progress: {
                      show: true,
                      width: 14,
                      itemStyle: {
                        color: mode === "dark" ? "#ffffff" : "#333333",
                      },
                    },
                    pointer: {
                      show: false,
                    },
                    axisLine: {
                      lineStyle: {
                        width: 22,
                        color: buildTemperatureGradient,
                      },
                    },
                    axisTick: {
                      distance: -28,
                      length: 5,
                      lineStyle: {
                        color: mode === "dark" ? "#fff" : "#000",
                        width: 1,
                      },
                    },
                    splitLine: {
                      distance: -34,
                      length: 8,
                      lineStyle: {
                        color: mode === "dark" ? "#fff" : "#000",
                        width: 2,
                      },
                    },
                    axisLabel: {
                      show: false,
                    },
                    detail: {
                      fontSize: 36,
                      fontWeight: "bold",
                      color: mode === "dark" ? "#fff" : "#000",
                      formatter: function (value: number) {
                        return Math.round(value) + "°F";
                      },
                      offsetCenter: [0, "15%"],
                    },
                    data: [
                      {
                        value: zoneTempValue,
                      },
                    ],
                  },
                ],
              }}
              style={{ height: "160px", overflow: "hidden" }}
              theme={mode}
            />
          )}
        </Card>
        <Card className={styles.gauge}>
          <h4>Setpoints</h4>
          <div className={styles.setpointGrid}>
            {/* Column headers */}
            <div className={styles.columnHeader}>HEAT</div>
            <div className={styles.columnHeader}>COOL</div>

            {/* Occupied label - spans both columns */}
            <div className={styles.rowLabel}>OCCUPIED</div>

            {/* Occupied values */}
            <div className={styles.setpointValue} style={{ color: warmPalette.tertiary.hex }}>
              {heatingSetpoint?.historianUnitCurrentValue?.value?.toFixed(1) || "--"}°F
            </div>
            <div className={styles.setpointValue} style={{ color: coolPalette.tertiary.hex }}>
              {coolingSetpoint?.historianUnitCurrentValue?.value?.toFixed(1) || "--"}°F
            </div>

            {/* Unoccupied label - spans both columns */}
            <div className={styles.rowLabel}>UNOCCUPIED</div>

            {/* Unoccupied values */}
            <div className={styles.setpointValue} style={{ color: warmPalette.primary.hex }}>
              {unoccupiedHeatingSetpoint?.historianUnitCurrentValue?.value?.toFixed(1) || "--"}°F
            </div>
            <div className={styles.setpointValue} style={{ color: coolPalette.primary.hex }}>
              {unoccupiedCoolingSetpoint?.historianUnitCurrentValue?.value?.toFixed(1) || "--"}°F
            </div>
          </div>
        </Card>
        <Card className={styles.gauge}>
          <h4>Occupancy Command</h4>
          <div style={{ position: "relative", height: "calc(100% - 1.25rem)" }}>
            <ECharts
              option={{
                backgroundColor: mode === "dark" ? Colors.DARK_GRAY2 : Colors.WHITE,
                grid: { top: 0, right: 0, bottom: 0, left: 0 },
                xAxis: { type: "time", show: false, min: sparklineStartTime, max: endTime },
                yAxis: { type: "value", show: false, min: 0, max: 3 },
                tooltip: { show: false },
                series: [
                  {
                    type: "line",
                    step: "end",
                    data:
                      occupancyCommandSeries?.historianUnitTimeSeries?.data?.map((p: any) => [p.timestamp, p.value]) ||
                      [],
                    color: tertiaryPalette.primary.hex,
                    showSymbol: false,
                  },
                ],
              }}
              style={{ height: "100%", width: "100%", position: "absolute", top: 0, left: 0 }}
              theme={mode}
            />
            <div
              className={styles.value}
              style={{
                position: "relative",
                zIndex: 1,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {occupancyCommandValue === null
                ? "N/A"
                : occupancyCommandValue === 1
                  ? "LOCAL CONTROL"
                  : occupancyCommandValue === 2
                    ? "OCCUPIED"
                    : occupancyCommandValue === 3
                      ? "UNOCCUPIED"
                      : "--"}
            </div>
          </div>
        </Card>
        <Card className={styles.gauge}>
          <h4>Heating Command</h4>
          <div style={{ position: "relative", height: "calc(100% - 1.25rem)" }}>
            <ECharts
              option={{
                backgroundColor: mode === "dark" ? Colors.DARK_GRAY2 : Colors.WHITE,
                grid: { top: 0, right: 0, bottom: 0, left: 0 },
                xAxis: { type: "time", show: false, min: sparklineStartTime, max: endTime },
                yAxis: { type: "value", show: false, min: 0, max: 1 },
                tooltip: { show: false },
                series: [
                  {
                    type: "line",
                    step: "end",
                    data:
                      firstStageHeatingSeries?.historianUnitTimeSeries?.data?.map((p: any) => [p.timestamp, p.value]) ||
                      [],
                    color: secondaryPalette.quaternary.hex,
                    showSymbol: false,
                  },
                ],
              }}
              style={{ height: "100%", width: "100%", position: "absolute", top: 0, left: 0 }}
              theme={mode}
            />
            <div
              className={styles.value}
              style={{
                position: "relative",
                zIndex: 1,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {heatingCommandValue === null ? "N/A" : heatingCommandValue ? "ON" : "OFF"}
            </div>
          </div>
        </Card>
        <Card className={styles.gauge}>
          <h4>Supply Fan</h4>
          <div style={{ position: "relative", height: "calc(100% - 1.25rem)" }}>
            <ECharts
              option={{
                backgroundColor: mode === "dark" ? Colors.DARK_GRAY2 : Colors.WHITE,
                grid: { top: 0, right: 0, bottom: 0, left: 0 },
                xAxis: { type: "time", show: false, min: sparklineStartTime, max: endTime },
                yAxis: { type: "value", show: false, min: 0, max: 1 },
                tooltip: { show: false },
                series: [
                  {
                    type: "line",
                    step: "end",
                    data: fanStatusSeries?.historianUnitTimeSeries?.data?.map((p: any) => [p.timestamp, p.value]) || [],
                    color: tertiaryPalette.secondary.hex,
                    showSymbol: false,
                  },
                ],
              }}
              style={{ height: "100%", width: "100%", position: "absolute", top: 0, left: 0 }}
              theme={mode}
            />
            <div
              className={styles.value}
              style={{
                position: "relative",
                zIndex: 1,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {supplyFanValue === null ? "N/A" : supplyFanValue ? "ON" : "OFF"}
            </div>
          </div>
        </Card>
        <Card className={styles.gauge}>
          <h4>Cooling Stage</h4>
          <div style={{ position: "relative", height: "calc(100% - 1.25rem)" }}>
            <ECharts
              option={{
                backgroundColor: mode === "dark" ? Colors.DARK_GRAY2 : Colors.WHITE,
                grid: { top: 0, right: 0, bottom: 0, left: 0 },
                xAxis: { type: "time", show: false, min: sparklineStartTime, max: endTime },
                yAxis: { type: "value", show: false, min: 0, max: 2 },
                tooltip: { show: false },
                series: [
                  {
                    type: "line",
                    step: "end",
                    data: coolingStageSeriesData,
                    color: secondaryPalette.secondary.hex,
                    showSymbol: false,
                  },
                ],
              }}
              style={{ height: "100%", width: "100%", position: "absolute", top: 0, left: 0 }}
              theme={mode}
            />
            <div
              className={styles.value}
              style={{
                position: "relative",
                zIndex: 1,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {coolingStageValue === null
                ? "N/A"
                : coolingStageValue === 0
                  ? "OFF"
                  : coolingStageValue === 1
                    ? "1 Stage Cooling"
                    : coolingStageValue === 2
                      ? "2 Stage Cooling"
                      : "--"}
            </div>
          </div>
        </Card>
      </div>

      <div className={styles.grid}>
        <Card className={styles.chartCard}>
          {timeSeriesLoading ? (
            <div className={styles.chartLoading}>
              <Spinner />
            </div>
          ) : (
            <ECharts
              option={{
                title: { text: unit.system || unit.name || "" },
                backgroundColor: mode === "dark" ? Colors.DARK_GRAY2 : Colors.WHITE,
                tooltip: { trigger: "axis" },
                legend: { bottom: 0, show: true },
                grid: { top: 60, right: 60, bottom: 80, left: 60 },
                xAxis: { type: "time", min: startTime, max: endTime },
                yAxis: [
                  {
                    type: "value",
                    name: "Status",
                    position: "left",
                    max: 3,
                  },
                  {
                    type: "value",
                    name: "Temperature (°F) / Humidity (%)",
                    position: "right",
                  },
                ],
                series: [
                  // Left axis - Status values (tertiary palette for status/states)
                  {
                    name: "OccupancyCommand",
                    type: "line",
                    yAxisIndex: 0,
                    step: "end",
                    data:
                      occupancyCommandSeries?.historianUnitTimeSeries?.data?.map((p: any) => [p.timestamp, p.value]) ||
                      [],
                    color: tertiaryPalette.primary.hex,
                  },
                  {
                    name: "SupplyFanStatus",
                    type: "line",
                    yAxisIndex: 0,
                    step: "end",
                    data: fanStatusSeries?.historianUnitTimeSeries?.data?.map((p: any) => [p.timestamp, p.value]) || [],
                    color: tertiaryPalette.secondary.hex,
                  },
                  {
                    name: "FirstStageHeating",
                    type: "line",
                    yAxisIndex: 0,
                    step: "end",
                    data:
                      firstStageHeatingSeries?.historianUnitTimeSeries?.data?.map((p: any) => [p.timestamp, p.value]) ||
                      [],
                    color: secondaryPalette.quaternary.hex,
                  },
                  {
                    name: "CoolingStage",
                    type: "line",
                    yAxisIndex: 0,
                    step: "end",
                    data: coolingStageSeriesData,
                    color: secondaryPalette.secondary.hex,
                  },
                  // Right axis - Temperature and humidity values (primary palette for temps)
                  {
                    name: "ZoneTemperature",
                    type: "line",
                    yAxisIndex: 1,
                    data: zoneTempSeries?.historianUnitTimeSeries?.data?.map((p: any) => [p.timestamp, p.value]) || [],
                    lineStyle: { width: 3 },
                    color: primaryPalette.tertiary.hex, // Main zone temp - prominent
                  },
                  {
                    name: "OutdoorAirTemperature",
                    type: "line",
                    yAxisIndex: 1,
                    data:
                      outdoorTempSeries?.historianWeatherTimeSeries?.data?.map((p: any) => [p.timestamp, p.value]) ||
                      [],
                    color: primaryPalette.quinary.hex,
                  },
                  {
                    name: "OccupiedHeatingSetPoint",
                    type: "line",
                    yAxisIndex: 1,
                    data:
                      heatingSetpointSeries?.historianUnitTimeSeries?.data?.map((p: any) => [p.timestamp, p.value]) ||
                      [],
                    color: secondaryPalette.quinary.hex, // Heating setpoint - warm end
                  },
                  {
                    name: "OccupiedCoolingSetPoint",
                    type: "line",
                    yAxisIndex: 1,
                    data:
                      coolingSetpointSeries?.historianUnitTimeSeries?.data?.map((p: any) => [p.timestamp, p.value]) ||
                      [],
                    color: secondaryPalette.primary.hex, // Cooling setpoint - cool end
                  },
                  {
                    name: "UnoccupiedHeatingSetPoint",
                    type: "line",
                    yAxisIndex: 1,
                    data:
                      unoccupiedHeatingSetpointSeries?.historianUnitTimeSeries?.data?.map((p: any) => [
                        p.timestamp,
                        p.value,
                      ]) || [],
                    lineStyle: { type: "dashed" },
                    color: secondaryPalette.quaternary.hex,
                  },
                  {
                    name: "UnoccupiedCoolingSetPoint",
                    type: "line",
                    yAxisIndex: 1,
                    data:
                      unoccupiedCoolingSetpointSeries?.historianUnitTimeSeries?.data?.map((p: any) => [
                        p.timestamp,
                        p.value,
                      ]) || [],
                    lineStyle: { type: "dashed" },
                    color: secondaryPalette.secondary.hex,
                  },
                  {
                    name: "ZoneHumidity",
                    type: "line",
                    yAxisIndex: 1,
                    data:
                      zoneHumiditySeries?.historianUnitTimeSeries?.data?.map((p: any) => [p.timestamp, p.value]) || [],
                    color: primaryPalette.secondary.hex,
                  },
                ],
              }}
              style={{ height: "500px" }}
              theme={mode}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
