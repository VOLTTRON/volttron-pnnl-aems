"use client";

import { Card, HTMLSelect, Spinner } from "@blueprintjs/core";
import { useQuery } from "@apollo/client";
import {
  HistorianTimeSeriesDocument,
  HistorianCurrentValuesDocument,
} from "@/graphql-codegen/graphql";
import { ECharts } from "@/app/components/common/echarts";
import { Colors } from "@blueprintjs/core";
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
  timeRange: string;
  setTimeRange: (value: string) => void;
  mode: "light" | "dark";
}

export function UnitDashboard({
  campus,
  building,
  unit,
  startTime,
  endTime,
  timeRange,
  setTimeRange,
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
    return currentValues?.historianCurrentValues?.find((v: any) => v.topic?.includes(pattern))?.value;
  };

  const getSeries = (pattern: string) => {
    return timeSeriesData?.historianTimeSeries?.find((s: any) => s.topic?.includes(pattern));
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h1>{unit.label || unit.name}</h1>
          <p className={styles.subtitle}>
            {unitCampus} / {unitBuilding}
          </p>
        </div>
        <HTMLSelect value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
          <option value="1h">Last Hour</option>
          <option value="3h">Last 3 Hours</option>
          <option value="6h">Last 6 Hours</option>
          <option value="12h">Last 12 Hours</option>
          <option value="24h">Last 24 Hours</option>
        </HTMLSelect>
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
                    data: getSeries("ZoneTemperature")?.data?.map((p: any) => [p.time, p.value]) || [],
                    lineStyle: { width: 3 },
                  },
                  {
                    name: "Heating Setpoint",
                    type: "line",
                    yAxisIndex: 0,
                    data: getSeries("OccupiedHeatingSetPoint")?.data?.map((p: any) => [p.time, p.value]) || [],
                    lineStyle: { type: "dashed" },
                  },
                  {
                    name: "Cooling Setpoint",
                    type: "line",
                    yAxisIndex: 0,
                    data: getSeries("OccupiedCoolingSetPoint")?.data?.map((p: any) => [p.time, p.value]) || [],
                    lineStyle: { type: "dashed" },
                  },
                  {
                    name: "Supply Fan",
                    type: "line",
                    step: "end",
                    yAxisIndex: 1,
                    data: getSeries("SupplyFanStatus")?.data?.map((p: any) => [p.time, p.value]) || [],
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
