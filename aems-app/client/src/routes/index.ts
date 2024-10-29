import { Node, Tree, buildTree } from "utils/tree";
import { get, has, isUndefined } from "lodash";

import { IUser } from "controllers/users/action";
import { RouteType } from "./types";
import controlRoute from "./Control/route";
import errorRoute from "./Error/route";
import homeRoute from "./Home/route";
import infoRoute from "./Info/route";
import layoutRoute from "./Layout/route";
import logRoute from "./Log/route";
import notfoundRoute from "./NotFound/route";
import unitsRoute from "./Units/route";
import configurationRoute from "./Configuration/route";
import accountRoute from "./Account/route";

export { default as Layout } from "./Layout/index";
export { default as Error } from "./Error/index";
export { default as Home } from "./Home/index";
export { default as Info } from "./Info/index";
export { default as NotFound } from "./NotFound/index";

export interface RouteProps {
  node: Node<RouteType>;
  page: RouteType;
  routes: Tree<RouteType>;
}

export interface RootProps extends RouteProps {
  notice?: any;
  user?: IUser;
  currentRoute?: RouteType;
  previousRoute?: RouteType;
  setCurrentRoute?: (route: RouteType) => void;
  setPreviousRoute?: (route: RouteType) => void;
}

/**
 * Node tree of all of the routes for this app.
 */
export const routes = buildTree(
  [
    layoutRoute,
    homeRoute,
    infoRoute,
    errorRoute,
    notfoundRoute,
    unitsRoute,
    controlRoute,
    logRoute,
    configurationRoute,
    accountRoute,
  ].sort((a, b) => a.id - b.id)
);

/**
 * Builds a relative link path given a route node.
 * @param node the route node
 * @returns the relative path
 * Check if path is undefined
 */
export const constructPath = (node: Node<RouteType> | undefined): string => {
  return node && has(node, ["parent", "data", "path"]) && !isUndefined(node?.data?.path)
    ? `${constructPath(node.parent)}${node.data ? `/${node.data.path}` : ""}`.replace("//", "/")
    : !isUndefined(node?.data?.path)
    ? `${get(node, ["data", "path"], "")}`
    : "";
};

/**
 * Find a route node given an id, name, or label.
 * @param query the id, name, or label
 * @returns the route node if found
 */
export const findRoute = (root: Tree<RouteType>, query: string | number): Node<RouteType> | undefined =>
  root.findNode(query) || Object.values(root.map).find((r) => [r.data?.name, r.data?.label].includes(query));
