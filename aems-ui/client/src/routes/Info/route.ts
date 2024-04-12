import { RouteType } from "routes/types";
import { lazy } from "react";

const Element = lazy(() => import("./index"));

const route: RouteType = {
  id: 9000,
  parentId: 0,
  name: "Info",
  label: "Info",
  path: "info",
  element: Element,
  footer: false,
  user: false,
  admin: false,
  hidden: false,
};

export default route;
