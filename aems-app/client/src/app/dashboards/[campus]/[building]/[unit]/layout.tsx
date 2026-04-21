"use client";

import { Suspense, useContext, useEffect } from "react";
import { RouteContext } from "@/app/components/providers";
import { useLazyQuery } from "@apollo/client";
import { ReadUnitsInfoDocument, StringFilterMode } from "@/graphql-codegen/graphql";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { resolvers, addResolver } = useContext(RouteContext);

  const [readUnits] = useLazyQuery(ReadUnitsInfoDocument);

  useEffect(() => {
    if (!("dashboard-unit" in resolvers) && addResolver !== undefined) {
      addResolver("dashboard-unit", async (system, ...[building, campus]) => {
        console.log("Resolving system ID:", { system, campus, building });
        if (system?.toLocaleLowerCase() === "site") {
          return "Site Overview";
        }
        return await readUnits({
          variables: {
            where: {
              campus: { equals: campus, mode: StringFilterMode.Insensitive },
              building: { equals: building, mode: StringFilterMode.Insensitive },
              system: { equals: system, mode: StringFilterMode.Insensitive },
            },
          },
        }).then((results) => results.data?.readUnits?.[0]?.label || results.data?.readUnits?.[0]?.system || system);
      });
    }
  }, [resolvers, addResolver, readUnits]);

  return <Suspense>{children}</Suspense>;
}
