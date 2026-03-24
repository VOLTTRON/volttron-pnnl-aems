"use client";

import React from "react";
import { Card, Spinner } from "@blueprintjs/core";
import { useQuery } from "@apollo/client";
import {
  HistorianUnitTimeSeriesDocument,
  HistorianUnitCurrentValueDocument,
  HistorianWeatherCurrentValueDocument,
  HistorianWeatherTimeSeriesDocument,
  UnitMetric,
  WeatherMetric,
} from "@/graphql-codegen/graphql";
import { ECharts } from "@/app/components/common/echarts";
import { Colors } from "@blueprintjs/core";
import { TimeRangeSelector } from "./TimeRangeSelector";
import styles from "./UnitDashboard.module.scss";

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
  fromDate: Date;
  toDate: Date | null;
  useCurrentTime: boolean;
  selectedPreset: string;
  onApplyTimeRange: (fromDate: Date, toDate: Date | null, useCurrentTime: boolean) => void;
  onPresetChange: (preset: string) => void;
  mode: "light" | "dark";
}

export function UnitDashboard({
  campus,
  building,
  unit,
  startTime,
  endTime,
  fromDate,
  toDate,
  useCurrentTime,
  selectedPreset,
  onApplyTimeRange,
  onPresetChange,
  mode,
}: UnitDashboardProps) {
  // Use unit's stored campus, building, and system for historian queries
  const unitCampus = unit.campus || campus;
  const unitBuilding = unit.building || building;
  const unitSystem = unit.system || unit.name || "";

  // Current values for unit metrics
  const { data: zoneTemp } = useQuery(HistorianUnitCurrentValueDocument, {
    variables: { campus: unitCampus, building: unitBuilding, system: unitSystem, metric: UnitMetric.ZoneTemperature },
  });
  const { data: zoneHumidity } = useQuery(HistorianUnitCurrentValueDocument, {
    variables: { campus: unitCampus, building: unitBuilding, system: unitSystem, metric: UnitMetric.ZoneHumidity },
  });
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
  const { data: occupancyCommand } = useQuery(HistorianUnitCurrentValueDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      system: unitSystem,
      metric: UnitMetric.OccupancyCommand,
    },
  });
  const { data: heatingCommand } = useQuery(HistorianUnitCurrentValueDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      system: unitSystem,
      metric: UnitMetric.FirstStageHeating,
    },
  });
  const { data: supplyFan } = useQuery(HistorianUnitCurrentValueDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      system: unitSystem,
      metric: UnitMetric.SupplyFanStatus,
    },
  });
  const { data: firstStageCooling } = useQuery(HistorianUnitCurrentValueDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      system: unitSystem,
      metric: UnitMetric.FirstStageCooling,
    },
  });
  const { data: secondStageCooling } = useQuery(HistorianUnitCurrentValueDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      system: unitSystem,
      metric: UnitMetric.SecondStageCooling,
    },
  });

  // Current value for weather metric
  const { data: outdoorTemp } = useQuery(HistorianWeatherCurrentValueDocument, {
    variables: { campus: unitCampus, building: unitBuilding, metric: WeatherMetric.AirTemperature },
  });

  // Calculate cooling stage from first and second stage
  const coolingStage = 
    (firstStageCooling?.historianUnitCurrentValue?.value || 0) + 
    (secondStageCooling?.historianUnitCurrentValue?.value || 0);

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
      stageMap.set(point.timestamp, (point.value || 0));
    });
    
    second.forEach((point: any) => {
      const existing = stageMap.get(point.timestamp) || 0;
      stageMap.set(point.timestamp, existing + (point.value || 0));
    });
    
    return Array.from(stageMap.entries())
      .map(([timestamp, value]) => [timestamp, value])
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
  }, [firstStageCoolingSeries, secondStageCoolingSeries]);

  const currentLoading = false; // All queries are separate now
  const timeSeriesLoading = zoneTempLoading; // Use one as indicator

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>{unit.label || unit.name}</h1>
        <TimeRangeSelector
          fromDate={fromDate}
          toDate={toDate}
          useCurrentTime={useCurrentTime}
          selectedPreset={selectedPreset}
          onApply={onApplyTimeRange}
          onPresetChange={onPresetChange}
        />
      </div>

      <div className={styles.gauges}>
        <Card className={styles.gauge}>
          <h4>Outdoor Air Temperature</h4>
          <div className={styles.value}>{outdoorTemp?.historianWeatherCurrentValue?.value?.toFixed(1) || "--"}°F</div>
        </Card>
        <Card className={styles.gauge}>
          <h4>Zone Humidity</h4>
          <div className={styles.value}>{zoneHumidity?.historianUnitCurrentValue?.value?.toFixed(0) || "--"}%</div>
        </Card>
        <Card className={styles.gauge}>
          <h4>Zone Temperature</h4>
          <div className={styles.value}>{zoneTemp?.historianUnitCurrentValue?.value?.toFixed(1) || "--"}°F</div>
        </Card>
        <Card className={styles.gauge}>
          <h4>Setpoints</h4>
          <div className={styles.setpoints}>
            <span>Heat: {heatingSetpoint?.historianUnitCurrentValue?.value?.toFixed(1) || "--"}°F</span>
            <span>Cool: {coolingSetpoint?.historianUnitCurrentValue?.value?.toFixed(1) || "--"}°F</span>
            <span>Unocc Heat: {unoccupiedHeatingSetpoint?.historianUnitCurrentValue?.value?.toFixed(1) || "--"}°F</span>
            <span>Unocc Cool: {unoccupiedCoolingSetpoint?.historianUnitCurrentValue?.value?.toFixed(1) || "--"}°F</span>
          </div>
        </Card>
        <Card className={styles.gauge}>
          <h4>Occupancy Command</h4>
          <div className={styles.value}>
            {occupancyCommand?.historianUnitCurrentValue?.value === 1 ? "LOCAL CONTROL" :
             occupancyCommand?.historianUnitCurrentValue?.value === 2 ? "OCCUPIED" :
             occupancyCommand?.historianUnitCurrentValue?.value === 3 ? "UNOCCUPIED" : "--"}
          </div>
        </Card>
        <Card className={styles.gauge}>
          <h4>Heating Command</h4>
          <div className={styles.value}>
            {heatingCommand?.historianUnitCurrentValue?.value ? "ON" : "OFF"}
          </div>
        </Card>
        <Card className={styles.gauge}>
          <h4>Supply Fan</h4>
          <div className={styles.value}>
            {supplyFan?.historianUnitCurrentValue?.value ? "ON" : "OFF"}
          </div>
        </Card>
        <Card className={styles.gauge}>
          <h4>Cooling Stage</h4>
          <div className={styles.value}>
            {coolingStage === 0 ? "OFF" :
             coolingStage === 1 ? "1 Stage Cooling" :
             coolingStage === 2 ? "2 Stage Cooling" : "--"}
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
                legend: { bottom: 0 },
                grid: { top: 60, right: 60, bottom: 60, left: 60 },
                xAxis: { type: "time" },
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
                  // Left axis - Status values
                  {
                    name: "OccupancyCommand",
                    type: "line",
                    yAxisIndex: 0,
                    step: "end",
                    data: occupancyCommandSeries?.historianUnitTimeSeries?.data?.map((p: any) => [p.timestamp, p.value]) || [],
                    color: Colors.RED3,
                  },
                  {
                    name: "SupplyFanStatus",
                    type: "line",
                    yAxisIndex: 0,
                    step: "end",
                    data: fanStatusSeries?.historianUnitTimeSeries?.data?.map((p: any) => [p.timestamp, p.value]) || [],
                    color: Colors.GOLD3,
                  },
                  {
                    name: "FirstStageHeating",
                    type: "line",
                    yAxisIndex: 0,
                    step: "end",
                    data: firstStageHeatingSeries?.historianUnitTimeSeries?.data?.map((p: any) => [p.timestamp, p.value]) || [],
                    color: Colors.GREEN3,
                  },
                  {
                    name: "CoolingStage",
                    type: "line",
                    yAxisIndex: 0,
                    step: "end",
                    data: coolingStageSeriesData,
                    color: Colors.BLUE5,
                  },
                  // Right axis - Temperature and humidity values
                  {
                    name: "ZoneTemperature",
                    type: "line",
                    yAxisIndex: 1,
                    data: zoneTempSeries?.historianUnitTimeSeries?.data?.map((p: any) => [p.timestamp, p.value]) || [],
                    lineStyle: { width: 3 },
                    color: Colors.GREEN3,
                  },
                  {
                    name: "OutdoorAirTemperature",
                    type: "line",
                    yAxisIndex: 1,
                    data: outdoorTempSeries?.historianWeatherTimeSeries?.data?.map((p: any) => [p.timestamp, p.value]) || [],
                    color: Colors.VIOLET3,
                  },
                  {
                    name: "OccupiedHeatingSetPoint",
                    type: "line",
                    yAxisIndex: 1,
                    data: heatingSetpointSeries?.historianUnitTimeSeries?.data?.map((p: any) => [p.timestamp, p.value]) || [],
                    color: "#8B008B",
                  },
                  {
                    name: "OccupiedCoolingSetPoint",
                    type: "line",
                    yAxisIndex: 1,
                    data: coolingSetpointSeries?.historianUnitTimeSeries?.data?.map((p: any) => [p.timestamp, p.value]) || [],
                    color: Colors.BLUE3,
                  },
                  {
                    name: "UnoccupiedHeatingSetPoint",
                    type: "line",
                    yAxisIndex: 1,
                    data: unoccupiedHeatingSetpointSeries?.historianUnitTimeSeries?.data?.map((p: any) => [p.timestamp, p.value]) || [],
                    lineStyle: { type: "dashed" },
                    color: "#DDA0DD",
                  },
                  {
                    name: "UnoccupiedCoolingSetPoint",
                    type: "line",
                    yAxisIndex: 1,
                    data: unoccupiedCoolingSetpointSeries?.historianUnitTimeSeries?.data?.map((p: any) => [p.timestamp, p.value]) || [],
                    lineStyle: { type: "dashed" },
                    color: Colors.BLUE1,
                  },
                  {
                    name: "ZoneHumidity",
                    type: "line",
                    yAxisIndex: 1,
                    data: zoneHumiditySeries?.historianUnitTimeSeries?.data?.map((p: any) => [p.timestamp, p.value]) || [],
                    color: Colors.ORANGE3,
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
