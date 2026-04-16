"use client";

import { useContext, useState, useMemo } from "react";
import { Spinner } from "@blueprintjs/core";
import { useQuery } from "@apollo/client";
import { ReadUnitsDocument, StringFilterMode } from "@/graphql-codegen/graphql";
import { CurrentContext, PreferencesContext, compilePreferences } from "@/app/components/providers";
import { Role } from "@local/common";
import { SiteDashboard } from "@/app/dashboards/components/SiteDashboard";
import { UnitDashboard } from "@/app/dashboards/components/UnitDashboard";
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

  // Time range state - only ISO strings needed for GraphQL queries
  const [startTime, setStartTime] = useState<string>(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return weekAgo.toISOString();
  });
  const [endTime, setEndTime] = useState<string>(() => new Date().toISOString());

  // Check if this is a site dashboard
  const isSite = decodedUnit === "site";

  const { data: unitsData } = useQuery(ReadUnitsDocument, {
    variables: {
      where: {
        campus: { equals: decodedCampus, mode: StringFilterMode.Insensitive },
        building: { equals: decodedBuilding, mode: StringFilterMode.Insensitive },
        ...(isSite
          ? {}
          : {
              OR: [
                { name: { equals: decodedUnit, mode: StringFilterMode.Insensitive } },
                { system: { equals: decodedUnit, mode: StringFilterMode.Insensitive } },
                { id: { equals: decodedUnit, mode: StringFilterMode.Insensitive } },
              ],
            }),
      },
    },
    fetchPolicy: "network-only", // Ensure we get fresh data including campus, building, system
  });

  const { foundCampus, foundBuilding, foundSystem } = useMemo(() => {
    const foundCampus = unitsData?.readUnits?.[0]?.campus ?? decodedCampus;
    const foundBuilding = unitsData?.readUnits?.[0]?.building ?? decodedBuilding;
    const foundSystem = isSite ? "Site" : (unitsData?.readUnits?.[0]?.system ?? decodedUnit);
    return { foundCampus, foundBuilding, foundSystem };
  }, [unitsData, decodedCampus, decodedBuilding, isSite, decodedUnit]);

  if (!Role.User.granted(...(current?.role?.split(" ") ?? []))) {
    return <div>You do not have permission to view this page.</div>;
  }

  // Handler for time range selector
  const handleApplyTimeRange = (newStartTime: string, newEndTime: string) => {
    setStartTime(newStartTime);
    setEndTime(newEndTime);
  };

  if (isSite) {
    return (
      <SiteDashboard
        campus={foundCampus}
        building={foundBuilding}
        system={foundSystem}
        units={unitsData?.readUnits ?? []}
        startTime={startTime}
        endTime={endTime}
        onApplyTimeRange={handleApplyTimeRange}
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
      system={foundSystem}
      unit={unitsData?.readUnits?.[0]}
      startTime={startTime}
      endTime={endTime}
      onApplyTimeRange={handleApplyTimeRange}
      mode={mode}
    />
  );
}
