"use client";

import { createContext, useCallback, useEffect } from "react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { max } from "lodash";
import { RoleType, DefaultNode, DefaultTree, DefaultType, Node, typeofNonNullable } from "@local/common";
import { Dynamic, Route, RouteResolver, RouteResolvers } from "@/app/types";
import { staticRoutes } from "@/app/routes";

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

const matchPath = (route: DefaultNode<Route>, part: string) => {
  const { path, dynamic } = route.data ?? {};
  if (dynamic) {
    return /^.+$/.test(part);
  } else {
    return path === part;
  }
};

/**
 * Find a route object for the specified path.
 *
 * @param routes
 * @param path
 * @param items
 * @returns the associated route object
 */
export function findRoute(routes: DefaultTree<Route>, path: string): Node<DefaultType & Route>;
export function findRoute(
  routes: DefaultTree<Route>,
  path: string,
  items: true,
): { route: Node<DefaultType & Route>; items: Route[] };
export function findRoute(routes: DefaultTree<Route>, path: string, items?: boolean) {
  let route = routes.root;
  const parts = path.split("/");
  for (const p of parts) {
    if (p) {
      route = Object.values(route?.children ?? {}).find((v) => matchPath(v, p)) ?? route;
    }
  }
  if (items) {
    const items: Route[] = route
      .getAncestors()
      .reverse()
      .map((v) => v.data)
      .filter(typeofNonNullable)
      .map((v, i) => ({
        ...v,
        path: (v.dynamic ? parts[i] : v.path) as string | typeof Dynamic,
      }));
    return { route, items };
  } else {
    return route;
  }
}

const isRouteNode = (node: DefaultNode<Route> | Route): node is DefaultNode<Route> => "data" in node;

const toPath = (route: DefaultNode<Route> | Route) => {
  const { path } = isRouteNode(route) ? route.data ?? {} : route;
  if (path === Dynamic) {
    return "[id]";
  } else {
    return path;
  }
};

/**
 * Creates a path string from a route object.
 *
 * @param route
 * @returns the path string
 */
export function findPath(route: DefaultNode<Route>): string;
export function findPath(items: Route[]): string;
export function findPath(arg: DefaultNode<Route> | Route[]): string {
  if (Array.isArray(arg)) {
    return arg.map(toPath).join("/").replace(/\/+/, "/");
  } else {
    return arg.getAncestors().reverse().map(toPath).join("/").replace(/\/+/, "/");
  }
}

if (process.env.NODE_ENV === "development") {
  const values = [...staticRoutes]
    .filter((v) => v.data && !v.data.index)
    .map((v) => [v.data?.id, v.data?.name, v.data?.display ?? false, v.data?.scope ?? "", findPath(v)] as const);
  const pads = values[0].map(
    (_v, i) => (max(values.map((v) => (typeof v[i] === "string" ? v[i].length : 10))) ?? 10) + 4,
  );
  console.log(
    "Client Static Routes:\n" +
      [["[ID]", "[Name]", "[Display]", "[Scope]", "[Path]"], ...values]
        .map((v) => v.map((w, i) => `${w?.toString()}`.padEnd(pads[i])).join(" "))
        .join("\n"),
  );
}

export const RouteContext = createContext<{
  routes: DefaultTree<Route>;
  route?: DefaultNode<Route>;
  items: Route[];
  resolvers: Readonly<RouteResolvers>;
  addResolver?: (id: string, resolver: RouteResolver) => void;
  removeResolver?: (id: string) => void;
}>({ routes: staticRoutes, items: [], resolvers: {} });

/**
 * Provider for the current route.
 */
export function RouteProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = useState(undefined as DefaultNode<Route> | undefined);
  const [items, setItems] = useState([] as Route[]);
  const [resolvers, setResolvers] = useState({} as RouteResolvers);
  const pathname = usePathname();

  useEffect(() => {
    const { route, items } = findRoute(staticRoutes, pathname ?? "", true);
    setRoute(route);
    setItems(items);
    let cancelled = false;
    const resolve = async () => {
      let update = false;
      let paths: string[] = [];
      for (const v of items) {
        if (cancelled) {
          return;
        } else if (v.id in resolvers) {
          const result = await resolvers[v.id](String(v.path), ...paths);
          if (result !== v.path) {
            v.name = result;
            update = true;
          }
        }
        paths = [String(v.path), ...paths];
      }
      if (!cancelled && update) {
        setItems([...items]);
      }
    };
    resolve();
    return () => (cancelled = true) && undefined;
  }, [resolvers, pathname]);

  const addResolver = useCallback(
    (id: string, resolver: RouteResolver) => {
      setResolvers({ ...resolvers, [id]: resolver });
    },
    [resolvers, setResolvers],
  );

  const removeResolver = useCallback(
    (id: string) => {
      const { [id]: _removed, ...rest } = resolvers;
      setResolvers(rest);
    },
    [resolvers, setResolvers],
  );

  return (
    <RouteContext.Provider value={{ routes: staticRoutes, route, items, resolvers, addResolver, removeResolver }}>
      {children}
    </RouteContext.Provider>
  );
}
