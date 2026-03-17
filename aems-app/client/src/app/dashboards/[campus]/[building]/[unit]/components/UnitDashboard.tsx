"use client";

import { Card, Spinner } from "@blueprintjs/core";
import { useQuery } from "@apollo/client";
import { HistorianTimeSeriesDocument, HistorianCurrentValuesDocument } from "@/graphql-codegen/graphql";
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

  const { data: currentValues, loading: currentLoading } = useQuery(HistorianCurrentValuesDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      unit: unitSystem,
      topicPatterns: [
        `${unitCampus}/${unitBuilding}/%/OutdoorAirTemperature`,
        `${unitCampus}/${unitBuilding}/${unitSystem}/ZoneHumidity`,
        `${unitCampus}/${unitBuilding}/${unitSystem}/ZoneTemperature`,
        `${unitCampus}/${unitBuilding}/${unitSystem}/OccupiedHeatingSetPoint`,
        `${unitCampus}/${unitBuilding}/${unitSystem}/OccupiedCoolingSetPoint`,
        `${unitCampus}/${unitBuilding}/${unitSystem}/OccupancyCommand`,
        `${unitCampus}/${unitBuilding}/${unitSystem}/SupplyFanStatus`,
        `${unitCampus}/${unitBuilding}/${unitSystem}/FirstStageHeating`,
      ],
    },
  });

  const { data: timeSeriesData, loading: timeSeriesLoading } = useQuery(HistorianTimeSeriesDocument, {
    variables: {
      campus: unitCampus,
      building: unitBuilding,
      unit: unitSystem,
      startTime,
      endTime,
      topicPatterns: [
        `${unitCampus}/${unitBuilding}/${unitSystem}/ZoneTemperature`,
        `${unitCampus}/${unitBuilding}/${unitSystem}/OccupiedCoolingSetPoint`,
        `${unitCampus}/${unitBuilding}/${unitSystem}/OccupiedHeatingSetPoint`,
        `${unitCampus}/${unitBuilding}/${unitSystem}/ZoneHumidity`,
        `${unitCampus}/${unitBuilding}/%/OutdoorAirTemperature`,
        `${unitCampus}/${unitBuilding}/${unitSystem}/SupplyFanStatus`,
        `${unitCampus}/${unitBuilding}/${unitSystem}/FirstStageHeating`,
        `${unitCampus}/${unitBuilding}/${unitSystem}/OccupancyCommand`,
      ],
    },
  });

  const getValue = (pattern: string) => {
    return currentValues?.historianCurrentValues?.find((v) => v.topic?.includes(pattern))?.value;
  };

  const getSeries = (pattern: string) => {
    return timeSeriesData?.historianTimeSeries?.find((s) => s.topic?.includes(pattern));
  };

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
          <div className={styles.value}>{getValue("OutdoorAirTemperature")?.toFixed(1) || "--"}°F</div>
        </Card>
        <Card className={styles.gauge}>
          <h4>Zone Humidity</h4>
          <div className={styles.value}>{getValue("ZoneHumidity")?.toFixed(0) || "--"}%</div>
        </Card>
        <Card className={styles.gauge}>
          <h4>Zone Temperature</h4>
          <div className={styles.value}>{getValue("ZoneTemperature")?.toFixed(1) || "--"}°F</div>
        </Card>
        <Card className={styles.gauge}>
          <h4>Setpoints</h4>
          <div className={styles.setpoints}>
            <span>Heat: {getValue("OccupiedHeatingSetPoint")?.toFixed(1) || "--"}°F</span>
            <span>Cool: {getValue("OccupiedCoolingSetPoint")?.toFixed(1) || "--"}°F</span>
          </div>
        </Card>
      </div>

      <div className={styles.grid}>
        <Card className={styles.chartCard}>
          <h3>Temperature & Controls</h3>
          {timeSeriesLoading ? (
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
                    data: getSeries("ZoneTemperature")?.data?.map((p) => [p.timestamp, p.value]) || [],
                    lineStyle: { width: 3 },
                  },
                  {
                    name: "Heating Setpoint",
                    type: "line",
                    yAxisIndex: 0,
                    data: getSeries("OccupiedHeatingSetPoint")?.data?.map((p) => [p.timestamp, p.value]) || [],
                    lineStyle: { type: "dashed" },
                  },
                  {
                    name: "Cooling Setpoint",
                    type: "line",
                    yAxisIndex: 0,
                    data: getSeries("OccupiedCoolingSetPoint")?.data?.map((p) => [p.timestamp, p.value]) || [],
                    lineStyle: { type: "dashed" },
                  },
                  {
                    name: "Supply Fan",
                    type: "line",
                    step: "end",
                    yAxisIndex: 1,
                    data: getSeries("SupplyFanStatus")?.data?.map((p) => [p.timestamp, p.value]) || [],
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
