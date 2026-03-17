"use client";

import { Card, Spinner } from "@blueprintjs/core";
import { useQuery } from "@apollo/client";
import { HistorianTimeSeriesDocument } from "@/graphql-codegen/graphql";
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
  // This will show aggregated data for all units in the building
  const unitNames = units.map((u) => u.name).filter(Boolean);
  
  // Use the first unit's stored campus/building values, or fall back to props
  const siteCampus = units[0]?.campus || campus;
  const siteBuilding = units[0]?.building || building;

  const { data: weatherData, loading: weatherLoading } = useQuery(HistorianTimeSeriesDocument, {
    variables: {
      campus: siteCampus,
      building: siteBuilding,
      startTime,
      endTime,
      topicPatterns: [`${siteCampus}/${siteBuilding}/%/OutdoorAirTemperature`, "%/%/air_temperature"],
    },
    skip: unitNames.length === 0,
  });

  const { data: powerData, loading: powerLoading } = useQuery(HistorianTimeSeriesDocument, {
    variables: {
      campus: siteCampus,
      building: siteBuilding,
      startTime,
      endTime,
      topicPatterns: [`${siteCampus}/${siteBuilding}/meter/Watts`],
    },
    skip: unitNames.length === 0,
  });

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
