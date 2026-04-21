"use client";

import { Suspense, useContext, useEffect } from "react";
import { RouteContext } from "@/app/components/providers";
import { useLazyQuery } from "@apollo/client";
import { ReadUnitsInfoDocument, StringFilterMode } from "@/graphql-codegen/graphql";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { resolvers, addResolver } = useContext(RouteContext);

  const [readUnits] = useLazyQuery(ReadUnitsInfoDocument);

  useEffect(() => {
    if (!("dashboard-building" in resolvers) && addResolver !== undefined) {
      addResolver("dashboard-building", async (building, ...[campus]) => {
        console.log("Resolving building ID:", { building, campus });
        return await readUnits({
          variables: {
            where: {
              campus: { equals: campus, mode: StringFilterMode.Insensitive },
              building: { equals: building, mode: StringFilterMode.Insensitive },
            },
          },
        }).then((results) => results.data?.readUnits?.[0]?.building ?? building);
      });
    }
  }, [resolvers, addResolver, readUnits]);

  return <Suspense>{children}</Suspense>;
}
