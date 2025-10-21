"use client";

import { useContext } from "react";
import { CurrentContext, RouteContext } from "./components/providers";
import { notFound, redirect, RedirectType } from "next/navigation";
import { findPath, findRedirect } from "./components/providers/routing";

export default function RootPage() {
  const { routes } = useContext(RouteContext);
  const { current } = useContext(CurrentContext);
  const route = findRedirect(routes, current ?? {});
  if (route === undefined) {
    notFound();
  }
  redirect(findPath(route), RedirectType.push);
}
