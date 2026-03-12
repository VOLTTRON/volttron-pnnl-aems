"use client";

import { Card, HTMLSelect, Spinner } from "@blueprintjs/core";
import { useQuery } from "@apollo/client";
import { HistorianTimeSeriesDocument } from "@/graphql-codegen/graphql";
import { ECharts } from "@/app/components/common/echarts";
import { Colors } from "@blueprintjs/core";
import styles from "./SiteDashboard.module.scss";

interface Unit {
  name?: string | null;
  label?: string | null;
}

interface SiteDashboardProps {
  campus: string;
  building: string;
  units: Unit[];
  startTime: string;
  endTime: string;
  timeRange: string;
  setTimeRange: (value: string) => void;
  mode: "light" | "dark";
}

export function SiteDashboard({
  campus,
  building,
  units,
  startTime,
  endTime,
  timeRange,
  setTimeRange,
  mode,
}: SiteDashboardProps) {
  // This will show aggregated data for all units in the building
  const unitNames = units.map((u) => u.name).filter(Boolean);

  const { data: weatherData, loading: weatherLoading } = useQuery(HistorianTimeSeriesDocument, {
    variables: {
      campus,
      building,
      startTime,
      endTime,
      topicPatterns: [`${campus}/${building}/%/OutdoorAirTemperature`, "%/%/air_temperature"],
    },
    skip: unitNames.length === 0,
  });

  const { data: powerData, loading: powerLoading } = useQuery(HistorianTimeSeriesDocument, {
    variables: {
      campus,
      building,
      startTime,
      endTime,
      topicPatterns: [`${campus}/${building}/meter/Watts`],
    },
    skip: unitNames.length === 0,
  });

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h1>{building} - Site Overview</h1>
          <p className={styles.subtitle}>{campus} Campus</p>
        </div>
        <HTMLSelect value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
          <option value="1h">Last Hour</option>
          <option value="3h">Last 3 Hours</option>
          <option value="6h">Last 6 Hours</option>
          <option value="12h">Last 12 Hours</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
        </HTMLSelect>
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
                  weatherData?.historianTimeSeries?.map((series: any) => ({
                    name: series.label,
                    type: "line",
                    smooth: true,
                    data: series.data?.map((point: any) => [point.time, point.value]) || [],
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
                  powerData?.historianTimeSeries?.map((series: any) => ({
                    name: series.label,
                    type: "line",
                    smooth: true,
                    data: series.data?.map((point: any) => [point.time, point.value]) || [],
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
