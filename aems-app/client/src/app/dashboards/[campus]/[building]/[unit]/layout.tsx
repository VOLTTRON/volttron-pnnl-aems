"use client";

import { Suspense, useContext, useEffect } from "react";
import { RouteContext } from "@/app/components/providers";
import { useLazyQuery } from "@apollo/client";
import { ReadUnitDocument } from "@/graphql-codegen/graphql";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { resolvers, addResolver } = useContext(RouteContext);

  const [readUnit] = useLazyQuery(ReadUnitDocument);

  useEffect(() => {
    if (!("dashboard-unit" in resolvers) && addResolver !== undefined) {
      addResolver("dashboard-unit", async (id) => {
        console.log("Resolving unit ID:", id);
        if (id?.toLocaleLowerCase() === "site") {
          return "Site Overview";
        }
        return readUnit({
          variables: {
            where: {
              id: id ?? "",
            },
          },
        }).then((result) => result.data?.readUnit?.label ?? id);
      });
    }
  }, [resolvers, addResolver, readUnit]);

  return <Suspense>{children}</Suspense>;
}
