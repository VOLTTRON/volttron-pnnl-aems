"use client";

import { Suspense, useContext, useEffect } from "react";
import { RouteContext } from "@/app/components/providers";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { resolvers, addResolver } = useContext(RouteContext);

  useEffect(() => {
    if (!("dashboard-campus" in resolvers) && addResolver !== undefined) {
      addResolver("dashboard-campus", async (id) => {
        return id ?? "Unknown";
      });
    }
  }, [resolvers, addResolver]);

  return <Suspense>{children}</Suspense>;
}
