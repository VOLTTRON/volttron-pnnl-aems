import { RoleType } from "@/common";
import { Node, buildTree } from "@/utils/tree";
import { deepFreeze } from "@/utils/util";
import { User } from "@prisma/client";

const hiddenRoutes = (process.env.NEXT_PUBLIC_HIDDEN_ROUTES ?? "").split(/[|:;, ]/);

export const routes: Route[] = deepFreeze(
  [
    {
      id: "home",
      parentId: undefined,
      path: "/",
      name: "home",
      index: true,
    },
    {
      id: "logs",
      parentId: "home",
      path: `logs`,
      name: "System Logs",
      scope: "admin",
      display: true,
    },
    {
      id: "login",
      parentId: undefined,
      path: `/auth/login`,
      name: "Login",
      display: true,
      index: true,
    },
  ].map((v) => {
    v.display = hiddenRoutes.includes(v.id) ? false : v.display;
    return v;
  })
);

export enum RouteComponent {
  NAVBAR_LEFT = "navbar-left",
  NAVBAR_RIGHT = "navbar-right",
}

export interface Route {
  id: string;
  parentId: string | undefined;
  path: string;
  name: string;
  index?: boolean;
  scope?: string;
  icon?: string;
  display?: boolean;
  components?: Record<RouteComponent, React.ComponentType>;
}

export const isGranted = (user?: Partial<User>) => {
  const grants = user?.role?.split(" ") ?? [];
  return (route: Node<Route>) => route.data?.scope === undefined || RoleType.granted(route.data.scope, ...grants);
};

export const findRedirect = (user?: Partial<User>) => {
  const granted = isGranted(user);
  const route = user ? Object.values(home.children ?? {}).find((v) => v && granted(v)) : undefined;
  return route ?? home.children.find((v) => v.data?.index) ?? home;
};

export const findRoute = (path: string) => {
  let route: Node<Route> | undefined = home;
  for (const p of path.split("/")) {
    route = Object.values(route?.children ?? {}).find((v) => v.data?.path === p);
  }
  return route;
};

export const findPath = (route: Node<Route>) => {
  return route
    .getAncestors()
    .reverse()
    .map((v) => v.data?.path)
    .join("/")
    .replace(/\/+/, "/");
};

export const tree = buildTree(routes);

function throwIfNotDefined(node: Node<Route> | undefined) {
  if (node === undefined) {
    throw new Error("Argument is not defined.");
  }
  return node;
}

export const home = throwIfNotDefined(tree.findNode("home"));
