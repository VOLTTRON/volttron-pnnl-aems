"use client";

import { Suspense, useContext, useEffect } from "react";
import { RouteContext } from "@/app/components/providers";
import { findBook } from "../../books";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { resolvers, addResolver } = useContext(RouteContext);

  useEffect(() => {
    if (!("chapter" in resolvers) && addResolver !== undefined) {
      addResolver("chapter", async (id, isbn) => {
        return (await findBook(isbn))?.chapters[parseInt(id)]?.title ?? id;
      });
    }
  }, [resolvers, addResolver]);

  return <Suspense>{children}</Suspense>;
}
