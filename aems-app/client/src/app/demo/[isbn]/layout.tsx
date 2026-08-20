"use client";

import { Suspense, useContext, useEffect } from "react";
import { RouteContext } from "@/app/components/providers";
import { LocalLoading } from "@/app/components/common";
import { findBook } from "../books";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { resolvers, addResolver } = useContext(RouteContext);

  useEffect(() => {
    if (!("book" in resolvers) && addResolver !== undefined) {
      addResolver("book", async (id) => {
        return (await findBook(id))?.title ?? id;
      });
    }
  }, [resolvers, addResolver]);

  return <Suspense fallback={<LocalLoading />}>{children}</Suspense>;
}
