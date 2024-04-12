import { RouteType } from "routes/types";
import { lazy } from "react";

const Element = lazy(() => import("./index"));

const route: RouteType = {
  id: 5000,
  parentId: 0,
  name: "configuration",
  label: "Configuration",
  path: "configuration",
  element: Element,
  footer: false,
  user: true,
  admin: true,
  hidden: false,
};

export default route;
