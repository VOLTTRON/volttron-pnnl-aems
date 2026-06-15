"use client";

import { Suspense, useContext, useEffect } from "react";
import { RouteContext } from "@/app/components/providers";
import { ReadUnitsInfoDocument, StringFilterMode } from "@/graphql-codegen/graphql";
import { useLazyQuery } from "@apollo/client/react/hooks/useLazyQuery";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { resolvers, addResolver } = useContext(RouteContext);

  const [readUnits] = useLazyQuery(ReadUnitsInfoDocument);

  useEffect(() => {
    if (!("dashboard-campus" in resolvers) && addResolver !== undefined) {
      addResolver("dashboard-campus", async (campus) => {
        return await readUnits({
          variables: {
            where: {
              campus: { equals: campus, mode: StringFilterMode.Insensitive },
            },
          },
        }).then((results) => results.data?.readUnits?.[0]?.campus ?? campus);
      });
    }
  }, [resolvers, addResolver, readUnits]);

  return <Suspense>{children}</Suspense>;
}
