"use client";

import { useContext, useEffect, useState } from "react";
import { Card, HTMLSelect, Spinner } from "@blueprintjs/core";
import { useQuery } from "@apollo/client";
import { ReadUnitsDocument, HistorianTimeSeriesDocument, HistorianCurrentValuesDocument } from "@/graphql-codegen/graphql";
import { CurrentContext, PreferencesContext, compilePreferences, RouteContext } from "@/app/components/providers";
import { Role } from "@local/common";
import { ECharts } from "@/app/components/common/echarts";
import { Colors } from "@blueprintjs/core";
import styles from "./page.module.scss";

interface PageProps {
  params: { campus: string; building: string; unit: string };
}

export default function DashboardPage({ params }: PageProps) {
  const { campus, building, unit } = params;
  const decodedCampus = decodeURIComponent(campus);
  const decodedBuilding = decodeURIComponent(building);
  const decodedUnit = decodeURIComponent(unit);

  const { current } = useContext(CurrentContext);
  const { preferences } = useContext(PreferencesContext);
  const { mode } = compilePreferences(preferences, current?.preferences);
  const { addResolver, removeResolver } = useContext(RouteContext);

  const [timeRange, setTimeRange] = useState("3h");

  // Check if this is a site dashboard
  const isSite = decodedUnit === "site";

  const { data: unitsData } = useQuery(ReadUnitsDocument, {
    variables: {
      where: {
        campus: { equals: decodedCampus },
        building: { equals: decodedBuilding },
        ...(isSite ? {} : { name: { equals: decodedUnit } }),
      },
    },
  });

  const unitsList = unitsData?.readUnits || [];
  const currentUnit = isSite ? null : unitsList[0];

  // Register route resolvers for breadcrumbs
  useEffect(() => {
    if (addResolver && removeResolver) {
      // Campus resolver - just return the decoded campus name
      addResolver("dashboard-campus", (id: string) => {
        return decodeURIComponent(id);
      });

      // Building resolver - just return the decoded building name
      addResolver("dashboard-building", (id: string) => {
        return decodeURIComponent(id);
      });

      // Unit resolver - return "Site Overview" for site, or unit label if available
      addResolver("dashboard-unit", (id: string) => {
        const decodedId = decodeURIComponent(id);
        if (decodedId === "site") {
          return "Site Overview";
        }
        // Find the unit in the data to get its label
        const unit = unitsList.find((u) => u.name === decodedId);
        return unit?.label || decodedId;
      });

      return () => {
        removeResolver("dashboard-campus");
        removeResolver("dashboard-building");
        removeResolver("dashboard-unit");
      };
    }
  }, [addResolver, removeResolver, unitsList]);

  // Calculate time range
  const now = new Date();
  const startTime = new Date(now.getTime() - parseTimeRange(timeRange));

  if (!Role.User.granted(...(current?.role?.split(" ") ?? []))) {
    return <div>You do not have permission to view this page.</div>;
  }

  if (isSite) {
    return <SiteDashboard 
      campus={decodedCampus} 
      building={decodedBuilding} 
      units={unitsList}
      startTime={startTime}
      endTime={now}
      timeRange={timeRange}
      setTimeRange={setTimeRange}
      mode={mode}
    />;
  }

  if (!currentUnit) {
    return <div className={styles.loading}><Spinner /> Loading unit data...</div>;
  }

  return <UnitDashboard 
    campus={decodedCampus} 
    building={decodedBuilding} 
    unit={currentUnit}
    startTime={startTime}
    endTime={now}
    timeRange={timeRange}
    setTimeRange={setTimeRange}
    mode={mode}
  />;
}

function parseTimeRange(range: string): number {
  const value = parseInt(range);
  const unit = range.replace(/\d+/, "");
  
  switch (unit) {
    case "m": return value * 60 * 1000;
    case "h": return value * 60 * 60 * 1000;
    case "d": return value * 24 * 60 * 60 * 1000;
    default: return 3 * 60 * 60 * 1000; // Default 3 hours
  }
}

function SiteDashboard({ campus, building, units, startTime, endTime, timeRange, setTimeRange, mode }: any) {
  // This will show aggregated data for all units in the building
  const unitNames = units.map((u: any) => u.name).filter(Boolean);

  const { data: weatherData, loading: weatherLoading } = useQuery(HistorianTimeSeriesDocument, {
    variables: {
      campus,
      building,
      startTime,
      endTime,
      topicPatterns: [
        `${campus}/${building}/%/OutdoorAirTemperature`,
        "%/%/air_temperature",
      ],
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
            <div className={styles.chartLoading}><Spinner /></div>
          ) : (
            <ECharts
              option={{
                backgroundColor: mode === "dark" ? Colors.DARK_GRAY5 : Colors.WHITE,
                tooltip: { trigger: "axis" },
                legend: { bottom: 0 },
                grid: { top: 40, right: 60, bottom: 60, left: 60 },
                xAxis: { type: "time" },
                yAxis: { type: "value", name: "Temperature (°F)" },
                series: weatherData?.historianTimeSeries?.map((series: any) => ({
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
            <div className={styles.chartLoading}><Spinner /></div>
          ) : (
            <ECharts
              option={{
                backgroundColor: mode === "dark" ? Colors.DARK_GRAY5 : Colors.WHITE,
                tooltip: { trigger: "axis" },
                legend: { bottom: 0 },
                grid: { top: 40, right: 60, bottom: 60, left: 60 },
                xAxis: { type: "time" },
                yAxis: { type: "value", name: "Power (W)" },
                series: powerData?.historianTimeSeries?.map((series: any) => ({
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

function UnitDashboard({ campus, building, unit, startTime, endTime, timeRange, setTimeRange, mode }: any) {
  const { data: currentValues, loading: currentLoading } = useQuery(HistorianCurrentValuesDocument, {
    variables: {
      campus,
      building,
      unit: unit.name,
      topicPatterns: [
        `${campus}/${building}/%/OutdoorAirTemperature`,
        `${campus}/${building}/${unit.name}/ZoneHumidity`,
        `${campus}/${building}/${unit.name}/ZoneTemperature`,
        `${campus}/${building}/${unit.name}/OccupiedHeatingSetPoint`,
        `${campus}/${building}/${unit.name}/OccupiedCoolingSetPoint`,
        `${campus}/${building}/${unit.name}/OccupancyCommand`,
        `${campus}/${building}/${unit.name}/SupplyFanStatus`,
        `${campus}/${building}/${unit.name}/FirstStageHeating`,
      ],
    },
  });

  const { data: timeSeriesData, loading: timeSeriesLoading } = useQuery(HistorianTimeSeriesDocument, {
    variables: {
      campus,
      building,
      unit: unit.name,
      startTime,
      endTime,
      topicPatterns: [
        `${campus}/${building}/${unit.name}/ZoneTemperature`,
        `${campus}/${building}/${unit.name}/OccupiedCoolingSetPoint`,
        `${campus}/${building}/${unit.name}/OccupiedHeatingSetPoint`,
        `${campus}/${building}/${unit.name}/ZoneHumidity`,
        `${campus}/${building}/%/OutdoorAirTemperature`,
        `${campus}/${building}/${unit.name}/SupplyFanStatus`,
        `${campus}/${building}/${unit.name}/FirstStageHeating`,
        `${campus}/${building}/${unit.name}/OccupancyCommand`,
      ],
    },
  });

  const getValue = (pattern: string) => {
    return currentValues?.historianCurrentValues?.find((v: any) => 
      v.topic?.includes(pattern)
    )?.value;
  };

  const getSeries = (pattern: string) => {
    return timeSeriesData?.historianTimeSeries?.find((s: any) =>
      s.topic?.includes(pattern)
    );
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h1>{unit.label || unit.name}</h1>
          <p className={styles.subtitle}>{campus} / {building}</p>
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
            <div className={styles.chartLoading}><Spinner /></div>
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
