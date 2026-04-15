"use client";

import { useContext } from "react";
import { Card } from "@blueprintjs/core";
import { CurrentContext } from "../components/providers";
import { Role } from "@local/common";
import { useQuery } from "@apollo/client";
import { ReadUnitsDocument } from "@/graphql-codegen/graphql";
import Link from "next/link";
import styles from "./page.module.scss";

export default function DashboardsPage() {
  const { current } = useContext(CurrentContext);
  const { data, loading } = useQuery(ReadUnitsDocument);

  if (loading) {
    return <div className={styles.loading}>Loading Dashboards...</div>;
  }

  if (!Role.User.granted(...(current?.role?.split(" ") ?? []))) {
    return <div>You do not have permission to view this page.</div>;
  }

  // Group units by campus and building
  const grouped = (data?.readUnits ?? []).reduce(
    (acc, unit) => {
      const campus = unit.campus || "Unknown Campus";
      const building = unit.building || "Unknown Building";

      if (!acc[campus]) acc[campus] = {};
      if (!acc[campus][building]) acc[campus][building] = [];
      acc[campus][building].push(unit);

      return acc;
    },
    {} as Record<string, Record<string, NonNullable<typeof data>["readUnits"]>>,
  );

  return (
    <div className={styles.dashboards}>
      <h1>Dashboards</h1>
      <p>Select a site or unit to view its dashboard</p>

      {Object.entries(grouped).map(([campus, buildings]) => (
        <div key={campus} className={styles.campus}>
          <h2>{campus}</h2>
          {Object.entries(buildings).map(([building, units]) => (
            <div key={`${campus}-${building}`} className={styles.building}>
              <h3>{building}</h3>

              <div className={styles.cards}>
                <Link
                  href={`/dashboards/${encodeURIComponent(campus).toLocaleLowerCase()}/${encodeURIComponent(building).toLocaleLowerCase()}/site`}
                >
                  <Card interactive className={styles.card}>
                    <h4>Site Overview</h4>
                    <p>View aggregated data for all units in {building}</p>
                  </Card>
                </Link>

                {(units || []).map((unit) => (
                  <Link
                    key={unit.id}
                    href={`/dashboards/${encodeURIComponent(campus).toLocaleLowerCase()}/${encodeURIComponent(building).toLocaleLowerCase()}/${encodeURIComponent(unit.system || unit.name || unit.id || "").toLocaleLowerCase()}`}
                  >
                    <Card interactive className={styles.card}>
                      <h4>{unit.label || unit.name}</h4>
                      <p>View detailed unit metrics and controls</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
