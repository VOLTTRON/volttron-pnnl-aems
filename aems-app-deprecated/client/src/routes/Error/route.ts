import { RouteType } from "routes/types";
import { lazy } from "react";

const Element = lazy(() => import("./index"));

const route: RouteType = {
  id: 100,
  parentId: undefined,
  name: "Error",
  label: "Error",
  path: "error",
  icon: "error",
  element: Element,
  hidden: true,
};

export default route;
