"use client";

import { useContext, useState, useMemo } from "react";
import { Spinner } from "@blueprintjs/core";
import { useQuery } from "@apollo/client";
import { ReadUnitsDocument } from "@/graphql-codegen/graphql";
import { CurrentContext, PreferencesContext, compilePreferences } from "@/app/components/providers";
import { Role } from "@local/common";
import { SiteDashboard } from "./components/SiteDashboard";
import { UnitDashboard } from "./components/UnitDashboard";
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
    fetchPolicy: 'network-only', // Ensure we get fresh data including campus, building, system
  });

  // Calculate time range - memoized to prevent unnecessary re-renders
  const [startTime, endTime] = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getTime() - parseTimeRange(timeRange));
    return [start.toISOString(), now.toISOString()];
  }, [timeRange]);

  if (!Role.User.granted(...(current?.role?.split(" ") ?? []))) {
    return <div>You do not have permission to view this page.</div>;
  }

  if (isSite) {
    return (
      <SiteDashboard
        campus={decodedCampus}
        building={decodedBuilding}
        units={unitsData?.readUnits ?? []}
        startTime={startTime}
        endTime={endTime}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        mode={mode}
      />
    );
  }

  if (!unitsData?.readUnits?.[0]) {
    return (
      <div className={styles.loading}>
        <Spinner /> Loading unit data...
      </div>
    );
  }

  return (
    <UnitDashboard
      campus={decodedCampus}
      building={decodedBuilding}
      unit={unitsData?.readUnits?.[0]}
      startTime={startTime}
      endTime={endTime}
      timeRange={timeRange}
      setTimeRange={setTimeRange}
      mode={mode}
    />
  );
}

function parseTimeRange(range: string): number {
  const value = parseInt(range);
  const unit = range.replace(/\d+/, "");

  switch (unit) {
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return 3 * 60 * 60 * 1000; // Default 3 hours
  }
}
