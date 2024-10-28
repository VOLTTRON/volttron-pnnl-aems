"use client";

import { createContext, useEffect } from "react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Route } from "../../types";
import { staticRoutes } from "../../routes";
import { max } from "lodash";
import { RoleType } from "@/common";
import { DefaultNode, DefaultTree } from "@/utils/tree";

/**
 * Check whether a user is allowed to see a route.
 *
 * @param route
 * @param user
 * @returns checks whether a user is allowed to see a route
 */
export const isDisplay = (route: DefaultNode<Route>, user?: { role?: string | null }) => {
  if (!route.data?.display) {
    return false;
  }
  const grants = user?.role?.split(" ") ?? [];
  return route.data.display === true || RoleType.granted(route.data.display, ...grants);
};

/**
 * Check whether a user is granted access to a route.
 *
 * @param route
 * @param user
 * @returns checks whether a user is granted access to a route
 */
export const isGranted = (route: DefaultNode<Route>, user?: { role?: string | null }) => {
  const grants = user?.role?.split(" ") ?? [];
  return route.data?.scope === undefined || RoleType.granted(route.data.scope, ...grants);
};

/**
 * Finds a suitable route to redirect to based on the user's role.
 *
 * @param routes
 * @param user
 * @returns a route to redirect to
 */
export const findRedirect = (routes: DefaultTree<Route>, user?: { role?: string | null }) => {
  return [...routes].find((v) => !v.data?.index && v.data?.display && isGranted(v, user)) ?? routes.findNode("login");
};

/**
 * Find a route object for the specified path.
 *
 * @param routes
 * @param path
 * @returns the associated route object
 */
export const findRoute = (routes: DefaultTree<Route>, path: string) => {
  let route = routes.root;
  for (const p of path.split("/")) {
    if (p) {
      route = Object.values(route?.children ?? {}).find((v) => v.data?.path === p) ?? route;
    }
  }
  return route;
};

/**
 * Creates a path string from a route object.
 *
 * @param route
 * @returns the path string
 */
export const findPath = (route: DefaultNode<Route>) => {
  return route
    .getAncestors()
    .reverse()
    .map((v) => v.data?.path)
    .join("/")
    .replace(/\/+/, "/");
};

if (process.env.NODE_ENV === "development") {
  const values = [...staticRoutes]
    .filter((v) => v.data && !v.data.index)
    .map((v) => [v.data?.id, v.data?.name, v.data?.display ?? false, v.data?.scope ?? "", findPath(v)] as const);
  const pads = values[0].map(
    (_v, i) => (max(values.map((v) => (typeof v[i] === "string" ? v[i].length : 10))) ?? 10) + 4
  );
  console.log(
    "Client Static Routes:\n" +
      [["[ID]", "[Name]", "[Display]", "[Scope]", "[Path]"], ...values]
        .map((v) => v.map((w, i) => `${w}`.padEnd(pads[i])).join(" "))
        .join("\n")
  );
}

export const RouteContext = createContext<{
  routes: DefaultTree<Route>;
  route?: DefaultNode<Route>;
}>({ routes: staticRoutes });

/**
 * Provider for the current route.
 */
export function RouteProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = useState(undefined as DefaultNode<Route> | undefined);
  const pathname = usePathname();

  useEffect(() => {
    setRoute(findRoute(staticRoutes, pathname ?? ""));
  }, [pathname]);

  return <RouteContext.Provider value={{ routes: staticRoutes, route }}>{children}</RouteContext.Provider>;
}
