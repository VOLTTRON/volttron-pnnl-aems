"use client";

import { useContext, useState, useMemo } from "react";
import { Spinner } from "@blueprintjs/core";
import { useQuery } from "@apollo/client";
import { ReadUnitsDocument } from "@/graphql-codegen/graphql";
import { CurrentContext, PreferencesContext, compilePreferences } from "@/app/components/providers";
import { Role } from "@local/common";
import { SiteDashboard } from "@/app/dashboards/components/SiteDashboard";
import { UnitDashboard } from "@/app/dashboards/components/UnitDashboard";
import { calculateTimeRange, calculateFromDateForPreset } from "@/app/dashboards/utils/timeRange";
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

  // Date-based time range state
  const [fromDate, setFromDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Default: 7 days ago
  });
  const [toDate, setToDate] = useState<Date | null>(null);
  const [useCurrentTime, setUseCurrentTime] = useState<boolean>(true);
  const [selectedPreset, setSelectedPreset] = useState<string>("7d");

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
    fetchPolicy: "network-only", // Ensure we get fresh data including campus, building, system
  });

  // Calculate time range - memoized to prevent unnecessary re-renders
  const { startTime, endTime } = useMemo(() => {
    return calculateTimeRange(fromDate, toDate, useCurrentTime);
  }, [fromDate, toDate, useCurrentTime]);

  if (!Role.User.granted(...(current?.role?.split(" ") ?? []))) {
    return <div>You do not have permission to view this page.</div>;
  }

  // Handlers for time range selector
  const handleApplyTimeRange = (newFromDate: Date, newToDate: Date | null, newUseCurrentTime: boolean) => {
    setFromDate(newFromDate);
    setToDate(newToDate);
    setUseCurrentTime(newUseCurrentTime);
    setSelectedPreset("custom");
  };

  const handlePresetChange = (preset: string) => {
    const newFromDate = calculateFromDateForPreset(preset);
    setFromDate(newFromDate);
    setToDate(null);
    setUseCurrentTime(true);
    setSelectedPreset(preset);
  };

  if (isSite) {
    return (
      <SiteDashboard
        campus={decodedCampus}
        building={decodedBuilding}
        units={unitsData?.readUnits ?? []}
        startTime={startTime}
        endTime={endTime}
        fromDate={fromDate}
        toDate={toDate}
        useCurrentTime={useCurrentTime}
        selectedPreset={selectedPreset}
        onApplyTimeRange={handleApplyTimeRange}
        onPresetChange={handlePresetChange}
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
      fromDate={fromDate}
      toDate={toDate}
      useCurrentTime={useCurrentTime}
      selectedPreset={selectedPreset}
      onApplyTimeRange={handleApplyTimeRange}
      onPresetChange={handlePresetChange}
      mode={mode}
    />
  );
}
