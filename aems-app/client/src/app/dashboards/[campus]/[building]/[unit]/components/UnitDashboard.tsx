"use client";

import { Card, Spinner } from "@blueprintjs/core";
import { useQuery } from "@apollo/client";
import {
  HistorianUnitTimeSeriesDocument,
  HistorianUnitCurrentValueDocument,
  HistorianWeatherCurrentValueDocument,
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

  // Current value for weather metric
  const { data: outdoorTemp } = useQuery(HistorianWeatherCurrentValueDocument, {
    variables: { campus: unitCampus, building: unitBuilding, metric: WeatherMetric.AirTemperature },
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
                title: { text: "Zone Temperature, Setpoints, and Supply Fan Status" },
                backgroundColor: mode === "dark" ? Colors.DARK_GRAY2 : Colors.WHITE,
                tooltip: { trigger: "axis" },
                legend: { bottom: 0 },
                grid: { top: 40, right: 60, bottom: 60, left: 60 },
                xAxis: { type: "time" },
                yAxis: [
                  { type: "value", name: "Temperature (°F)" },
                  { type: "value", name: "Status", max: 3 },
                ],
                series: [
                  {
                    name: "Zone Temperature",
                    type: "line",
                    smooth: true,
                    yAxisIndex: 0,
                    data: zoneTempSeries?.historianUnitTimeSeries?.data?.map((p: any) => [p.timestamp, p.value]) || [],
                    lineStyle: { width: 3 },
                  },
                  {
                    name: "Heating Setpoint",
                    type: "line",
                    yAxisIndex: 0,
                    data:
                      heatingSetpointSeries?.historianUnitTimeSeries?.data?.map((p: any) => [p.timestamp, p.value]) ||
                      [],
                    lineStyle: { type: "dashed" },
                  },
                  {
                    name: "Cooling Setpoint",
                    type: "line",
                    yAxisIndex: 0,
                    data:
                      coolingSetpointSeries?.historianUnitTimeSeries?.data?.map((p: any) => [p.timestamp, p.value]) ||
                      [],
                    lineStyle: { type: "dashed" },
                  },
                  {
                    name: "Supply Fan",
                    type: "line",
                    step: "end",
                    yAxisIndex: 1,
                    data: fanStatusSeries?.historianUnitTimeSeries?.data?.map((p: any) => [p.timestamp, p.value]) || [],
                  },
                ],
              }}
              style={{ height: "400px" }}
              theme={mode}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
